const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const { smsg }       = require('./lib/simple')
const { findPlugin }  = require('./handler')
const { parseText, isAdmin, checkBotAdmin, containsURL } = require('./lib/myfunc')
const { dbGet, dbSet } = require('./lib/functions')
const { generateCard } = require('./lib/cardGenerator')
const { prefix }      = require('./config')
const logger          = require('./lib/print')
const fs              = require('fs')

const BOT_START_TIME = Date.now()

// ─── In-memory spam tracker ───────────────────────────────────
const spamTracker = new Map()

// ─── Antilink middleware ──────────────────────────────────────
async function handleAntilink(conn, m) {
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

// ─── Antispam middleware ──────────────────────────────────────
async function handleAntispam(conn, m) {
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

// ─── Default teks welcome & goodbye ──────────────────────────
const DEFAULT_WELCOME = '👋 Halo @tag!\nSelamat datang di *@grub*! Senang kamu bergabung 🎉'
const DEFAULT_GOODBYE = '👋 Sampai jumpa @username!\nTerima kasih sudah bersama kami di *@grub* 🙏'

/**
 * Handle pesan masuk (messages.upsert)
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {{ messages: object[], type: string }} upsert
 */
async function messageHandler(conn, { messages, type }) {
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
      if (!m) continue

      // ── Middleware: antilink & antispam (semua pesan di grup) ─
      if (m.isGroup && m.text) {
        await handleAntilink(conn, m).catch(() => {})
      }
      if (m.isGroup) {
        await handleAntispam(conn, m).catch(() => {})
      }

      if (!m?.text) continue

      // ── Game Logic: Tebak Kata ────────────────────────────────
      conn.tebakkata = conn.tebakkata || {}
      if (m.isGroup && m.chat in conn.tebakkata) {
        let game = conn.tebakkata[m.chat]
        // Pastikan pesannya me-reply soal, atau membalas secara langsung
        if (m.text.toLowerCase() === game.jawaban) {
          clearTimeout(game.timeout)
          await conn.sendMessage(m.chat, {
            text: `🎉 *BENAR!* 🎉\n\nSelamat @${m.sender.split('@')[0]}, jawaban kamu benar!\nJawaban: *${game.jawaban.toUpperCase()}*\nHadiah: +${game.poin} XP`,
            mentions: [m.sender]
          }, { quoted: m })
          delete conn.tebakkata[m.chat]
        }
      }

      // Cek prefix terlebih dahulu
      const prefixList = Array.isArray(prefix) ? prefix : [prefix]
      const usedPrefix = prefixList.find(p => m.text.startsWith(p))
      if (!usedPrefix) continue

      // Parse command — pisah hanya word pertama, rawText sisanya (newline terjaga)
      const body    = m.text.slice(usedPrefix.length)
      const spaceIdx = body.search(/\s/)
      const command  = (spaceIdx === -1 ? body : body.slice(0, spaceIdx)).toLowerCase().trim()
      const rawText  = spaceIdx === -1 ? '' : body.slice(spaceIdx + 1)  // teks asli, newline utuh
      const args     = rawText.split(/\s+/).filter(Boolean)             // kata-kata untuk subcommand
      const text     = args.join(' ')

      // ── Mute check: abaikan command jika bot di-mute (kecuali command unmute) ─────────
      if (m.isGroup) {
        const isMuted = dbGet(`groups.${m.chat}.settings.muted`, false)
        // Jika sedang di-mute dan command BUKAN unmute, maka skip
        if (isMuted && command !== 'unmute') continue
      }

      // Cari plugin yang cocok
      const plugin = findPlugin(command)
      if (!plugin) continue

      // Context object yang dikirim ke plugin
      const ctx = {
        conn,
        args,
        text,
        rawText,   // ← teks lengkap setelah command, newline terjaga
        command,
        prefix: usedPrefix,
        isGroup: m.isGroup,
        sender: m.sender,
        downloadMediaMessage,
      }

      logger.info(`Command: ${prefix}${command} dari ${m.sender}`)
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

/**
 * Handle event join/leave grup (group-participants.update)
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {{ id: string, participants: string[], action: string }} update
 */
async function groupHandler(conn, update) {
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
    const number = participantJid.split('@')[0]
    const userName =
      conn.contacts?.[participantJid]?.notify ||
      conn.contacts?.[participantJid]?.name ||
      number

    const textData = { groupName, userName, number, jid: participantJid }

    // ── JOIN ────────────────────────────────────────────────
    if (action === 'add') {
      const enabled = dbGet(`groups.${groupJid}.welcome.enabled`, false)
      if (!enabled) continue

      const rawText    = dbGet(`groups.${groupJid}.welcome.text`, DEFAULT_WELCOME)
      const finalText  = parseText(rawText, textData)
      const hasMention = rawText.includes('@tag')
      const mode       = dbGet(`groups.${groupJid}.welcome.mode`, 'card')

      try {
        if (mode === 'image') {
          // ─ Mode gambar statis ───────────────────────────────────
          const imgPath = dbGet(`groups.${groupJid}.welcome.image`, null)
          const hasImg  = !!(imgPath && fs.existsSync(imgPath))

          if (hasImg) {
            await conn.sendMessage(groupJid, {
              image: { url: imgPath },
              caption: finalText,
              ...(hasMention ? { mentions: [participantJid] } : {}),
            })
          } else {
            // Fallback ke card jika gambar hilang
            const cardBuffer = await generateCard({ type: 'welcome', username: userName, groupName })
            await conn.sendMessage(groupJid, {
              image: cardBuffer, caption: finalText,
              ...(hasMention ? { mentions: [participantJid] } : {}),
            })
          }
        } else {
          // ─ Mode card (default gradient atau custom bg) ────────────
          const bgPath     = dbGet(`groups.${groupJid}.welcome.background`, null)
          const cardBuffer = await generateCard({
            type: 'welcome',
            username: userName,
            groupName,
            bgImagePath: bgPath,
          })
          await conn.sendMessage(groupJid, {
            image: cardBuffer,
            caption: finalText,
            ...(hasMention ? { mentions: [participantJid] } : {}),
          })
        }
        logger.info(`Welcome dikirim untuk ${number} di grup [mode: ${mode}]`)
      } catch (err) {
        logger.error(`Gagal kirim welcome: ${err.message}`)
      }
    }

    // ── LEAVE ───────────────────────────────────────────────
    if (action === 'remove') {
      const enabled = dbGet(`groups.${groupJid}.goodbye.enabled`, false)
      if (!enabled) continue

      const rawText    = dbGet(`groups.${groupJid}.goodbye.text`, DEFAULT_GOODBYE)
      const finalText  = parseText(rawText, textData)
      const hasMention = rawText.includes('@tag')
      const mode       = dbGet(`groups.${groupJid}.goodbye.mode`, 'card')

      try {
        if (mode === 'image') {
          // ─ Mode gambar statis ───────────────────────────────────
          const imgPath = dbGet(`groups.${groupJid}.goodbye.image`, null)
          const hasImg  = !!(imgPath && fs.existsSync(imgPath))

          if (hasImg) {
            await conn.sendMessage(groupJid, {
              image: { url: imgPath },
              caption: finalText,
              ...(hasMention ? { mentions: [participantJid] } : {}),
            })
          } else {
            // Fallback ke card jika gambar hilang
            const cardBuffer = await generateCard({ type: 'goodbye', username: userName, groupName })
            await conn.sendMessage(groupJid, {
              image: cardBuffer, caption: finalText,
              ...(hasMention ? { mentions: [participantJid] } : {}),
            })
          }
        } else {
          // ─ Mode card (default gradient atau custom bg) ────────────
          const bgPath     = dbGet(`groups.${groupJid}.goodbye.background`, null)
          const cardBuffer = await generateCard({
            type: 'goodbye',
            username: userName,
            groupName,
            bgImagePath: bgPath,
          })
          await conn.sendMessage(groupJid, {
            image: cardBuffer,
            caption: finalText,
            ...(hasMention ? { mentions: [participantJid] } : {}),
          })
        }
        logger.info(`Goodbye dikirim untuk ${number} di grup [mode: ${mode}]`)
      } catch (err) {
        logger.error(`Gagal kirim goodbye: ${err.message}`)
      }
    }
  }
}

module.exports = { messageHandler, groupHandler }
