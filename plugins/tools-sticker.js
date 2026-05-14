// plugins/sticker.js
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const sharp = require('sharp')

let handler = async (m, { conn }) => {
  const isDirectImage = !!m.message?.imageMessage
  const isQuotedImage = !!m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
  const targetMsg = isDirectImage
    ? m
    : isQuotedImage
      ? { message: m.message.extendedTextMessage.contextInfo.quotedMessage, key: m.key }
      : null

  if (!targetMsg) return m.reply(
    '❌ Tidak ada gambar!\n\n' +
    '▸ kirim gambar + caption *.sticker*\n' +
    '▸ reply gambar → *.sticker*'
  )

  try {
    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {})
    const webp = await sharp(buffer)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp()
      .toBuffer()

    await conn.sendMessage(m.chat, { sticker: webp }, { quoted: m })
  } catch (err) {
    return m.reply(`❌ ${err.message}`)
  }
}

handler.command = /^sticker$/i
handler.help = ['sticker']
handler.tags = ['tools']

module.exports = handler