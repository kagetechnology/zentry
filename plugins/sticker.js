// plugins/sticker.js
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const sharp = require('sharp')

let handler = async (m, { conn }) => {
  const jid = m.chat

  // Cek apakah ada gambar — dari pesan langsung atau quoted
  const isDirectImage  = !!m.message?.imageMessage
  const isQuotedImage  = !!m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
  const quotedMsg = isQuotedImage
    ? { message: m.message.extendedTextMessage.contextInfo.quotedMessage, key: m.key }
    : null

  const targetMsg = isDirectImage ? m : quotedMsg

  if (!targetMsg) {
    return m.reply(
      '❌ Tidak ada gambar!\n\n' +
      '*Cara buat sticker:*\n' +
      '• Kirim gambar dengan caption `.sticker`\n' +
      '• Atau reply gambar lalu ketik `.sticker`'
    )
  }

  try {
    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {})

    // Convert ke WebP 512x512 (format sticker WA)
    const webp = await sharp(buffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp()
      .toBuffer()

    // Kirim sebagai sticker
    await conn.sendMessage(jid, {
      sticker: webp,
    }, { quoted: m })

  } catch (err) {
    return m.reply(`❌ Gagal buat sticker: ${err.message}\n\n_Pastikan file adalah gambar (JPG/PNG/GIF)_`)
  }
}

handler.command  = /^sticker$/i
handler.help     = ['sticker']
handler.tags     = ['utility']

module.exports = handler
