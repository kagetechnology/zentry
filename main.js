const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const { smsg }      = require('./lib/simple')
const { findPlugin } = require('./handler')
const { parseText }  = require('./lib/myfunc')
const { dbGet }      = require('./lib/functions')
const { generateCard } = require('./lib/cardGenerator')
const { prefix }     = require('./config')
const logger         = require('./lib/print')
const fs             = require('fs')

const BOT_START_TIME = Date.now()

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
      if (!m?.text) continue

      // Cek prefix
      if (!m.text.startsWith(prefix)) continue

      // Parse command — pisah hanya word pertama, rawText sisanya (newline terjaga)
      const body    = m.text.slice(prefix.length)
      const spaceIdx = body.search(/\s/)
      const command  = (spaceIdx === -1 ? body : body.slice(0, spaceIdx)).toLowerCase().trim()
      const rawText  = spaceIdx === -1 ? '' : body.slice(spaceIdx + 1)  // teks asli, newline utuh
      const args     = rawText.split(/\s+/).filter(Boolean)             // kata-kata untuk subcommand
      const text     = args.join(' ')

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
        prefix,
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
