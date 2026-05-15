const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

let handler = async (m, { conn }) => {
  const isQuotedSticker = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage
  
  if (!isQuotedSticker) {
    return m.reply('❌ Reply stiker animasi yang ingin diubah menjadi video dengan perintah *.tovideo*')
  }
  
  if (!isQuotedSticker.isAnimated) {
    return m.reply('❌ Stiker ini tidak bergerak (bukan animasi). Gunakan *.toimg* untuk stiker biasa.')
  }

  try {
    const targetMsg = { message: m.message.extendedTextMessage.contextInfo.quotedMessage, key: m.key }
    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {})
    
    const tmpDir = path.join(__dirname, '../../tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
    
    const webpPath = path.join(tmpDir, `${Date.now()}.webp`)
    const mp4Path = path.join(tmpDir, `${Date.now()}.mp4`)
    
    fs.writeFileSync(webpPath, buffer)
    
    // Konversi WebP (Animasi) ke MP4
    m.reply('⏳ Sedang memproses...')
    exec(`ffmpeg -i ${webpPath} -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ${mp4Path}`, async (err) => {
      fs.unlinkSync(webpPath)
      
      if (err) {
        if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path)
        return m.reply('❌ Gagal mengonversi stiker ke video.')
      }
      
      const videoBuffer = fs.readFileSync(mp4Path)
      await conn.sendMessage(m.chat, { video: videoBuffer, caption: '✅ Berhasil diubah menjadi video!', mimetype: 'video/mp4' }, { quoted: m })
      fs.unlinkSync(mp4Path)
    })
    
  } catch (err) {
    console.error(err)
    m.reply(`❌ Gagal: ${err.message}`)
  }
}

handler.help = ['tovideo', 'tomp4']
handler.tags = ['tools']
handler.command = /^(tovideo|tomp4)$/i

module.exports = handler
