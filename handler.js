/**
 * handler.js — Plugin loader + Feature on/off handler
 *
 * Tanggung jawab:
 *  1. loadPlugins()       — memuat semua file dari folder plugins/
 *  2. findPlugin()        — mencari plugin berdasarkan command string
 *  3. handleMessage()     — memproses pesan masuk & menjalankan plugin
 *  4. handleGroupUpdate() — menangani join/leave member (welcome/goodbye)
 *
 * Fitur on/off yang dikelola di sini:
 *  • antilink   → dbGet(`groups.${jid}.antilink.enabled`)
 *  • antispam   → dbGet(`groups.${jid}.antispam.enabled`)
 *  • mute       → dbGet(`groups.${jid}.settings.muted`)
 *  • welcome    → dbGet(`groups.${jid}.welcome.enabled`)
 *  • goodbye    → dbGet(`groups.${jid}.goodbye.enabled`)
 */

const fs = require('fs')

const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const { smsg }                 = require('./lib/simple')
const { parseText, isAdmin, checkBotAdmin, containsURL } = require('./lib/myfunc')
const { dbGet, dbSet }         = require('./lib/functions')
const { generateCard }         = require('./lib/cardGenerator')
const { prefix }               = require('./config')
const logger                   = require('./lib/print')

// ─── Resolve LID → phone number ─────────────────────────────
/**
 * WhatsApp kadang mengirim sender dalam format LID (@lid) bukan nomor HP.
 * Fungsi ini mencoba memetakan LID kembali ke nomor HP lewat conn.contacts.
 */
function resolveSenderPhone(sender, conn) {
  const numPart = sender.split('@')[0]
  // Sudah berupa nomor HP biasa
  if (/^\d{10,15}$/.test(numPart)) return numPart
  // Coba resolve via contacts
  try {
    const contacts = conn.contacts || {}
    if (contacts[sender]?.id) return contacts[sender].id.split('@')[0]
    // Cari di semua kontak berdasarkan LID
    for (const key of Object.keys(contacts)) {
      const c = contacts[key]
      if (c.lid === sender && c.id) return c.id.split('@')[0]
    }
  } catch {}
  return numPart
}


// ─── Plugin registry ─────────────────────────────────────────
const plugins = new Map()

// ─── In-memory spam tracker ───────────────────────────────────
const spamTracker = new Map()

// ─── Waktu bot start (untuk skip pesan lama) ─────────────────
const BOT_START_TIME = Date.now()

// ═══════════════════════════════════════════════════════════════
//  SECTION 1 — Plugin registry (loading dikelola oleh main.js)
// ═══════════════════════════════════════════════════════════════
//
//  plugins Map diisi oleh main.js melalui loadPlugin() + watchPlugins().
//  handler.js hanya membaca registry ini saat pesan masuk.

/**
 * Cari plugin yang cocok dengan command string.
 * @param {string} command
 * @returns {Function|null}
 */
function findPlugin(command) {
  for (const [, plugin] of plugins) {
    if (plugin.command instanceof RegExp && plugin.command.test(command)) return plugin
    if (typeof plugin.command === 'string' && plugin.command === command) return plugin
  }
  return null
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 2 — Fitur on/off middleware
// ═══════════════════════════════════════════════════════════════

/**
 * [FITUR: ANTILINK]
 * Hapus pesan yang mengandung URL di grup yang aktif antilink.
 * Aksi: delete | warn | kick — sesuai setting tiap grup.
 */
async function runAntilink(conn, m) {
  const enabled = dbGet(`groups.${m.chat}.antilink.enabled`, false)
  if (!enabled || m.fromMe) return

  if (!containsURL(m.text)) return

  let groupMeta
  try { groupMeta = await conn.groupMetadata(m.chat) } catch { return }
  if (isAdmin(groupMeta, m.sender)) return  // admin bypass

  // Hapus pesan
  try { await conn.sendMessage(m.chat, { delete: m.key }) } catch { /* ignore */ }

  const action   = dbGet(`groups.${m.chat}.antilink.action`, 'delete')
  const maxWarns = dbGet(`groups.${m.chat}.antilink.maxWarns`, 3)

  if (action === 'warn' || action === 'kick') {
    const safeKey = m.sender.replace(/\./g, '_')
    const warns   = dbGet(`groups.${m.chat}.antilink.warns.${safeKey}`, 0) + 1
    dbSet(`groups.${m.chat}.antilink.warns.${safeKey}`, warns)

    const botIsAdmin = await checkBotAdmin(conn, m.chat)

    if (action === 'kick' || warns >= maxWarns) {
      if (botIsAdmin) {
        dbSet(`groups.${m.chat}.antilink.warns.${safeKey}`, 0)
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
        await conn.sendMessage(m.chat, {
          text: `🚫 @${m.sender.split('@')[0]} di-kick karena mengirim link!`,
          mentions: [m.sender],
        })
      }
    } else {
      await conn.sendMessage(m.chat, {
        text: `⚠️ @${m.sender.split('@')[0]} dilarang kirim link! Peringatan: *${warns}/${maxWarns}*`,
        mentions: [m.sender],
      })
    }
  }
}

/**
 * [FITUR: ANTISPAM]
 * Tandai & tindak member yang kirim pesan terlalu cepat.
 * Batas default: 5 pesan dalam 5 detik.
 */
async function runAntispam(conn, m) {
  const enabled = dbGet(`groups.${m.chat}.antispam.enabled`, false)
  if (!enabled || m.fromMe) return

  let groupMeta
  try { groupMeta = await conn.groupMetadata(m.chat) } catch { return }
  if (isAdmin(groupMeta, m.sender)) return  // admin bypass

  const key      = `${m.chat}:${m.sender}`
  const now      = Date.now()
  const limit    = dbGet(`groups.${m.chat}.antispam.limit`, 5)
  const interval = 5000

  const times = (spamTracker.get(key) || []).filter(t => now - t < interval)
  times.push(now)
  spamTracker.set(key, times)

  if (times.length >= limit) {
    spamTracker.delete(key)
    const action     = dbGet(`groups.${m.chat}.antispam.action`, 'warn')
    const botIsAdmin = await checkBotAdmin(conn, m.chat)

    if (action === 'kick' && botIsAdmin) {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
      await conn.sendMessage(m.chat, {
        text: `🚫 @${m.sender.split('@')[0]} di-kick karena spam!`,
        mentions: [m.sender],
      })
    } else {
      await conn.sendMessage(m.chat, {
        text: `⚠️ @${m.sender.split('@')[0]} jangan spam!`,
        mentions: [m.sender],
      })
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 3 — Message handler (dipanggil dari main.js)
// ═══════════════════════════════════════════════════════════════

/**
 * Proses semua pesan masuk (messages.upsert).
 * Urutan: skip guard → middleware fitur → game → plugin command.
 */
async function handleMessage(conn, { messages, type }) {
  if (type !== 'notify') return

  for (const rawMsg of messages) {
    try {
      // Skip pesan lama (hindari Bad MAC saat pertama connect)
      const msgTime = (rawMsg.messageTimestamp ?? 0) * 1000
      if (msgTime && msgTime < BOT_START_TIME) continue

      // Skip status broadcast
      if (rawMsg.key.remoteJid === 'status@broadcast') continue

      // Wrap pesan dengan helper methods
      const m = smsg(conn, rawMsg)
      if (!m || !m.sender) continue

      // ── [FITUR: AFK] ──────────────────────────────────────────────────
      if (m.sender) {
        let userKey = m.sender.replace(/\./g, '_')
        let afkTime = dbGet(`users.${userKey}.afk.time`, -1)
        if (afkTime > -1 && m.text && !m.text.startsWith(prefix) && !m.text.includes('afk')) {
          const { formatUptime } = require('./lib/functions')
          dbSet(`users.${userKey}.afk.time`, -1)
          m.reply(`Kamu berhenti AFK setelah ${formatUptime(Date.now() - afkTime)}`)
        }
      }

      // Cek apakah mention orang yang AFK
      let mentions = rawMsg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      for (let jid of mentions) {
        let jidKey = jid.replace(/\./g, '_')
        let jidAfk = dbGet(`users.${jidKey}.afk.time`, -1)
        if (jidAfk > -1) {
          const { formatUptime } = require('./lib/functions')
          let reason = dbGet(`users.${jidKey}.afk.reason`, 'Tanpa alasan')
          m.reply(`Ssstt! Jangan tag dia, dia sedang AFK.\n\nAlasan: ${reason}\nSejak: ${formatUptime(Date.now() - jidAfk)} lalu.`)
        }
      }

      // ── [FITUR: ANTILINK & ANTISPAM] — jalankan di semua pesan grup ──
      if (m.isGroup && m.text) {
        await runAntilink(conn, m).catch(() => {})
      }
      if (m.isGroup) {
        await runAntispam(conn, m).catch(() => {})
      }

      if (!m?.text) continue

      // ── [FITUR: TEBAK KATA] — cek jawaban game aktif ─────────────────
      conn.tebakkata = conn.tebakkata || {}
      if (conn.tebakkata[m.chat]) {
        const game = conn.tebakkata[m.chat]
        const userAnswer = m.text.toLowerCase().trim()
        logger.info(`[TEBAKKATA] Chat: ${m.chat} | Jawaban User: "${userAnswer}" | Jawaban Benar: "${game.jawaban}"`)
        if (userAnswer === game.jawaban) {
          clearTimeout(game.timeout)
          
          // Tambahkan EXP ke database (pakai initRPG agar tidak di-overwrite plugin RPG lain)
          const { initRPG } = require('./lib/rpg')
          let userKey = m.sender.replace(/\./g, '_')
          let rpgUser = initRPG(userKey)
          rpgUser.exp = (rpgUser.exp || 0) + game.poin
          dbSet(`users.${userKey}`, rpgUser)
          logger.info(`[TEBAKKATA] EXP disimpan → ${m.sender}: ${rpgUser.exp}`)
          
          await conn.sendMessage(m.chat, {
            text: `🎉 *BENAR!* 🎉\n\nSelamat @${m.sender.split('@')[0]}, jawaban kamu benar!\nJawaban: *${game.jawaban.toUpperCase()}*\nHadiah: +${game.poin} XP`,
            mentions: [m.sender]
          }, { quoted: m })
          delete conn.tebakkata[m.chat]
        }
      }

      // ── [FITUR: TICTACTOE] ────────────────────────────────────────────
      conn.tictactoe = conn.tictactoe || {}
      if (m.isGroup && m.chat in conn.tictactoe) {
        const game = conn.tictactoe[m.chat]
        
        // Cek nyerah tanpa prefix
        if (m.text.toLowerCase() === 'nyerah') {
          if (m.sender === game.playerX || m.sender === game.playerO) {
            if (game.status === 'WAITING') {
              delete conn.tictactoe[m.chat]
              await m.reply(`🏳️ Room tictactoe dibatalkan oleh @${m.sender.split('@')[0]}`, null, { mentions: [m.sender] })
            } else {
              let winner = m.sender === game.playerX ? game.playerO : game.playerX
              delete conn.tictactoe[m.chat]
              await m.reply(`🏳️ @${m.sender.split('@')[0]} menyerah!\nPemenang: @${winner.split('@')[0]}`, null, { mentions: [m.sender, winner] })
            }
          }
        } else if (game.status === 'PLAYING') {
          // Cek jika pesan berupa angka 1-9
          if (/^[1-9]$/.test(m.text)) {
            let res = game.play(m.sender, m.text)
            if (res === -2) {
              await m.reply(`⏳ Tunggu giliranmu! Sekarang giliran @${game.turn.split('@')[0]}`, null, { mentions: [game.turn] })
            } else if (res === -3) {
              await m.reply('❌ Posisi tidak valid atau sudah terisi!')
            } else if (res === 0) {
              let str = `🎮 *TIC-TAC-TOE* 🎮\n\nGiliran: @${game.turn.split('@')[0]}\n\n${game.render()}`
              await conn.sendMessage(m.chat, { text: str, mentions: [game.turn] }, { quoted: m })
            } else if (res === 1) { // Menang
              let str = `🎉 *TIC-TAC-TOE SELESAI* 🎉\n\nPemenang: @${game.winner.split('@')[0]} 🏆\n\n${game.render()}`
              await conn.sendMessage(m.chat, { text: str, mentions: [game.winner] }, { quoted: m })
              delete conn.tictactoe[m.chat]
            } else if (res === 2) { // Seri
              let str = `🤝 *TIC-TAC-TOE SERI* 🤝\n\nPermainan berakhir seri!\n\n${game.render()}`
              await conn.sendMessage(m.chat, { text: str }, { quoted: m })
              delete conn.tictactoe[m.chat]
            }
          }
        }
      }

      // ── [FITUR: FAMILY 100] ───────────────────────────────────────────
      conn.family100 = conn.family100 || {}
      if (m.isGroup && m.chat in conn.family100) {
        const game = conn.family100[m.chat]
        let answer = m.text.toLowerCase().trim()
        
        // Cari apakah jawaban ada di list dan belum terjawab
        if (game.jawaban.includes(answer) && !game.terjawab.includes(answer)) {
          game.terjawab.push(answer)
          
          let userKey = m.sender.replace(/\./g, '_')
          const { initRPG } = require('./lib/rpg')
          let rpgUser = initRPG(userKey)
          rpgUser.exp = (rpgUser.exp || 0) + game.poin
          dbSet(`users.${userKey}`, rpgUser)
          
          if (game.terjawab.length >= game.jawaban.length) {
            clearTimeout(game.waktu)
            await conn.sendMessage(m.chat, {
              text: `🎉 *PERFECT!* 🎉\n\nSemua jawaban berhasil ditebak!\n@${m.sender.split('@')[0]} mendapat +${game.poin} XP\n\n*Jawaban:* \n- ${game.jawaban.join('\n- ')}`,
              mentions: [m.sender]
            }, { quoted: m })
            delete conn.family100[m.chat]
          } else {
            let sisa = game.jawaban.length - game.terjawab.length
            await conn.sendMessage(m.chat, {
              text: `✅ *BENAR!* (@${m.sender.split('@')[0]} mendapat +${game.poin} XP)\n\n*Jawaban Tertebak:*\n- ${game.terjawab.join('\n- ')}\n\nMasih ada *${sisa}* jawaban lagi!`,
              mentions: [m.sender]
            }, { quoted: m })
          }
        }
      }

      // ── Cek prefix ────────────────────────────────────────────────────
      const prefixList = Array.isArray(prefix) ? prefix : [prefix]
      const usedPrefix = prefixList.find(p => m.text.startsWith(p))
      if (!usedPrefix) continue

      // Parse command — pisah hanya kata pertama, rawText sisanya
      const body     = m.text.slice(usedPrefix.length)
      const spaceIdx = body.search(/\s/)
      const command  = (spaceIdx === -1 ? body : body.slice(0, spaceIdx)).toLowerCase().trim()
      const rawText  = spaceIdx === -1 ? '' : body.slice(spaceIdx + 1)
      const args     = rawText.split(/\s+/).filter(Boolean)
      const text     = args.join(' ')

      // ── [FITUR: MUTE] — abaikan command saat bot di-mute ─────────────
      if (m.isGroup) {
        const isMuted = dbGet(`groups.${m.chat}.settings.muted`, false)
        if (isMuted && command !== 'unmute') continue
      }

      // ── Jalankan plugin yang cocok ────────────────────────────────────
      const plugin = findPlugin(command)
      if (!plugin) continue

      // Cek apakah fitur khusus owner
      const { ownerNumber } = require('./config')
      if (plugin.owner) {
        // Resolve LID ke nomor HP sebelum dibandingkan
        const senderPhone = resolveSenderPhone(m.sender, conn)
        const isOwner = ownerNumber.some(num => senderPhone === num.replace(/\D/g, ''))
        if (!isOwner) return m.reply('❌ Perintah ini hanya dapat digunakan oleh Owner!')
      }

      const ctx = {
        conn,
        args,
        text,
        rawText,
        command,
        prefix: usedPrefix,
        isGroup: m.isGroup,
        sender: m.sender,
        downloadMediaMessage,
      }

      logger.info(`Command: ${usedPrefix}${command} dari ${m.sender}`)
      await plugin(m, ctx)

    } catch (err) {
      if (err.message?.includes('Bad MAC') || err.message?.includes('decrypt')) {
        logger.warn('Pesan tidak bisa didekripsi, dilewati.')
      } else {
        logger.error(`Error di message handler: ${err.message}`)
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 4 — Group join/leave handler (dipanggil dari main.js)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_WELCOME = '👋 Halo @tag!\nSelamat datang di *@grub*! Senang kamu bergabung 🎉'
const DEFAULT_GOODBYE = '👋 Sampai jumpa @username!\nTerima kasih sudah bersama kami di *@grub* 🙏'

/**
 * [FITUR: WELCOME & GOODBYE]
 * Handle event join/leave grup dan kirim pesan sesuai setting.
 */
async function handleGroupUpdate(conn, update) {
  const { id: groupJid, participants, action } = update
  if (!['add', 'remove'].includes(action)) return

  let groupMeta
  try {
    groupMeta = await conn.groupMetadata(groupJid)
  } catch (err) {
    logger.error(`Gagal ambil metadata grup: ${err.message}`)
    return
  }

  const groupName = groupMeta.subject

  for (const participantJid of participants) {
    const number   = participantJid.split('@')[0]
    const userName =
      conn.contacts?.[participantJid]?.notify ||
      conn.contacts?.[participantJid]?.name   ||
      number
    const textData = { groupName, userName, number, jid: participantJid }

    // ── [FITUR: WELCOME] — member join ─────────────────────
    if (action === 'add') {
      const enabled = dbGet(`groups.${groupJid}.welcome.enabled`, false)
      if (!enabled) continue

      const rawText   = dbGet(`groups.${groupJid}.welcome.text`, DEFAULT_WELCOME)
      const finalText = parseText(rawText, textData)
      const mention   = rawText.includes('@tag') ? [participantJid] : []
      const mode      = dbGet(`groups.${groupJid}.welcome.mode`, 'card')

      try {
        if (mode === 'image') {
          const imgPath = dbGet(`groups.${groupJid}.welcome.image`, null)
          const hasImg  = !!(imgPath && fs.existsSync(imgPath))

          if (hasImg) {
            await conn.sendMessage(groupJid, {
              image: { url: imgPath }, caption: finalText,
              ...(mention.length ? { mentions: mention } : {}),
            })
          } else {
            const cardBuffer = await generateCard({ type: 'welcome', username: userName, groupName })
            await conn.sendMessage(groupJid, {
              image: cardBuffer, caption: finalText,
              ...(mention.length ? { mentions: mention } : {}),
            })
          }
        } else {
          const bgPath     = dbGet(`groups.${groupJid}.welcome.background`, null)
          const cardBuffer = await generateCard({ type: 'welcome', username: userName, groupName, bgImagePath: bgPath })
          await conn.sendMessage(groupJid, {
            image: cardBuffer, caption: finalText,
            ...(mention.length ? { mentions: mention } : {}),
          })
        }
        logger.info(`Welcome dikirim untuk ${number} di grup [mode: ${mode}]`)
      } catch (err) {
        logger.error(`Gagal kirim welcome: ${err.message}`)
      }
    }

    // ── [FITUR: GOODBYE] — member leave ────────────────────
    if (action === 'remove') {
      const enabled = dbGet(`groups.${groupJid}.goodbye.enabled`, false)
      if (!enabled) continue

      const rawText   = dbGet(`groups.${groupJid}.goodbye.text`, DEFAULT_GOODBYE)
      const finalText = parseText(rawText, textData)
      const mention   = rawText.includes('@tag') ? [participantJid] : []
      const mode      = dbGet(`groups.${groupJid}.goodbye.mode`, 'card')

      try {
        if (mode === 'image') {
          const imgPath = dbGet(`groups.${groupJid}.goodbye.image`, null)
          const hasImg  = !!(imgPath && fs.existsSync(imgPath))

          if (hasImg) {
            await conn.sendMessage(groupJid, {
              image: { url: imgPath }, caption: finalText,
              ...(mention.length ? { mentions: mention } : {}),
            })
          } else {
            const cardBuffer = await generateCard({ type: 'goodbye', username: userName, groupName })
            await conn.sendMessage(groupJid, {
              image: cardBuffer, caption: finalText,
              ...(mention.length ? { mentions: mention } : {}),
            })
          }
        } else {
          const bgPath     = dbGet(`groups.${groupJid}.goodbye.background`, null)
          const cardBuffer = await generateCard({ type: 'goodbye', username: userName, groupName, bgImagePath: bgPath })
          await conn.sendMessage(groupJid, {
            image: cardBuffer, caption: finalText,
            ...(mention.length ? { mentions: mention } : {}),
          })
        }
        logger.info(`Goodbye dikirim untuk ${number} di grup [mode: ${mode}]`)
      } catch (err) {
        logger.error(`Gagal kirim goodbye: ${err.message}`)
      }
    }
  }
}

module.exports = { findPlugin, plugins, handleMessage, handleGroupUpdate }
