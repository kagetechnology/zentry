// plugins/tts.js
const tts = require('google-tts-api')

let handler = async (m, { conn, text, prefix, command }) => {
  if (!text) {
    return m.reply(`❌ Harap masukkan teks!\n\nContoh:\n\`${prefix}${command} id Halo semuanya\`\n\`${prefix}${command} en Hello world\`\n\n*(Argumen pertama adalah kode bahasa, contoh: id, en, jp)*`)
  }

  // Pisahkan kode bahasa dan teks
  let lang = 'id'
  let pesan = text

  const args = text.split(' ')
  if (args[0].length === 2) {
    lang = args[0].toLowerCase()
    pesan = args.slice(1).join(' ')
  }

  if (!pesan) return m.reply('❌ Teksnya mana yang mau dibaca?')

  await conn.sendMessage(m.chat, { react: { text: '🗣️', key: m.key } })

  try {
    const url = tts.getAudioUrl(pesan, {
      lang: lang,
      slow: false,
      host: 'https://translate.google.com',
    })

    // Kirim sebagai Voice Note (ptt: true)
    await conn.sendMessage(m.chat, {
      audio: { url },
      mimetype: 'audio/mp4',
      ptt: true 
    }, { quoted: m })

  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ Gagal mengubah teks ke suara: ${e.message}`)
  }
}

handler.command = /^(tts|gtts|suara)$/i
handler.help = ['tts <lang> <teks>']
handler.tags = ['utility']

module.exports = handler
