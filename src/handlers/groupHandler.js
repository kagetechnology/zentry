const db = require('../lib/db')
const logger = require('../lib/logger')

// ─── Default teks sambutan & perpisahan ──────────────────────
const DEFAULT_WELCOME = '👋 Halo @tag!\nSelamat datang di *@grub*! Senang kamu bergabung 🎉'
const DEFAULT_GOODBYE = '👋 Sampai jumpa @username!\nTerima kasih sudah bersama kami di *@grub* 🙏'

/**
 * Ganti semua custom tag dengan nilai yang sesuai
 * @param {string} text - Teks template
 * @param {object} data - Data member & grup
 */
function parseText(text, { groupName, userName, number, jid }) {
  return text
    .replace(/@grub/g, groupName)
    .replace(/@username/g, userName)
    .replace(/@number/g, number)
    .replace(/@tag/g, `@${number}`) // placeholder, akan di-replace oleh mention WA
}

/**
 * Handler untuk event group-participants.update
 * Dipanggil saat ada member join atau leave grup
 */
async function groupHandler(sock, update) {
  const { id: groupJid, participants, action } = update

  // Hanya proses join (add) dan leave (remove)
  if (!['add', 'remove'].includes(action)) return

  // Ambil metadata grup (nama, dll)
  let groupMeta
  try {
    groupMeta = await sock.groupMetadata(groupJid)
  } catch (err) {
    logger.error(`Gagal ambil metadata grup ${groupJid}: ${err.message}`)
    return
  }

  const groupName = groupMeta.subject

  for (const participantJid of participants) {
    const number = participantJid.split('@')[0]

    // Coba ambil push name dari contacts store, fallback ke nomor
    const userName =
      sock.contacts?.[participantJid]?.notify ||
      sock.contacts?.[participantJid]?.name ||
      number

    const textData = { groupName, userName, number, jid: participantJid }

    // ── JOIN ──────────────────────────────────────────────────
    if (action === 'add') {
      const welcomeEnabled = db.get(`groups.${groupJid}.welcome.enabled`, false)
      if (!welcomeEnabled) continue

      const rawText = db.get(`groups.${groupJid}.welcome.text`, DEFAULT_WELCOME)
      const finalText = parseText(rawText, textData)
      const hasMention = rawText.includes('@tag')
      const imgPath = db.get(`groups.${groupJid}.welcome.image`, null)

      const fs = require('fs')
      const hasImage = !!(imgPath && fs.existsSync(imgPath))

      try {
        if (hasImage) {
          // Kirim dengan gambar sebagai caption
          await sock.sendMessage(groupJid, {
            image: { url: imgPath },
            caption: finalText,
            ...(hasMention ? { mentions: [participantJid] } : {}),
          })
        } else {
          // Kirim teks saja
          await sock.sendMessage(groupJid, {
            text: finalText,
            ...(hasMention ? { mentions: [participantJid] } : {}),
          })
        }
        logger.info(`Welcome dikirim untuk ${number} di ${groupJid}`)
      } catch (err) {
        logger.error(`Gagal kirim welcome: ${err.message}`)
      }
    }


    // ── LEAVE ─────────────────────────────────────────────────
    if (action === 'remove') {
      const goodbyeEnabled = db.get(`groups.${groupJid}.goodbye.enabled`, false)
      if (!goodbyeEnabled) continue

      const rawText = db.get(`groups.${groupJid}.goodbye.text`, DEFAULT_GOODBYE)
      const finalText = parseText(rawText, textData)
      const hasMention = rawText.includes('@tag')

      try {
        await sock.sendMessage(groupJid, {
          text: finalText,
          ...(hasMention ? { mentions: [participantJid] } : {}),
        })
        logger.info(`Goodbye dikirim untuk ${number} di ${groupJid}`)
      } catch (err) {
        logger.error(`Gagal kirim goodbye: ${err.message}`)
      }
    }
  }
}

module.exports = { groupHandler, DEFAULT_WELCOME, DEFAULT_GOODBYE }
