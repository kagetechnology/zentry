const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const { addExif } = require('../../lib/exif')

let handler = async (m, { conn, args }) => {
  const isQuotedSticker = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage
  
  if (!isQuotedSticker) {
    return m.reply('❌ Reply stiker yang ingin diubah watermark-nya dengan perintah *.take nama|author*')
  }

  let packname = args.join(' ').split('|')[0] || 'Zentry'
  let author = args.join(' ').split('|')[1] || 'Bot'

  try {
    const targetMsg = { message: m.message.extendedTextMessage.contextInfo.quotedMessage, key: m.key }
    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {})
    
    // Tambahkan Exif
    const exifBuffer = await addExif(buffer, packname.trim(), author.trim())
    
    await conn.sendMessage(m.chat, { sticker: exifBuffer }, { quoted: m })
  } catch (err) {
    console.error(err)
    m.reply(`❌ Gagal mengubah watermark: ${err.message}`)
  }
}

handler.help = ['take <nama>|<author>', 'wm']
handler.tags = ['tools']
handler.command = /^(take|wm)$/i

module.exports = handler
