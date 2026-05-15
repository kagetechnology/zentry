const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const sharp = require('sharp')

let handler = async (m, { conn }) => {
  const isQuotedSticker = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage
  
  if (!isQuotedSticker) {
    return m.reply('❌ Reply stiker yang ingin diubah menjadi gambar dengan perintah *.toimg*')
  }

  try {
    const targetMsg = { message: m.message.extendedTextMessage.contextInfo.quotedMessage, key: m.key }
    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {})
    
    // Konversi WebP ke JPEG
    const jpegBuffer = await sharp(buffer).jpeg().toBuffer()
    
    await conn.sendMessage(m.chat, { image: jpegBuffer, caption: '✅ Berhasil diubah menjadi gambar!' }, { quoted: m })
  } catch (err) {
    console.error(err)
    m.reply(`❌ Gagal mengubah stiker: ${err.message}`)
  }
}

handler.help = ['toimg', 'toimage']
handler.tags = ['tools']
handler.command = /^(toimg|toimage)$/i

module.exports = handler
