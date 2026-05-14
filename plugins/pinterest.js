// plugins/pinterest.js
const { pinterest } = require('btch-downloader')

let handler = async (m, { conn, text, prefix, command }) => {
  if (!text) {
    return m.reply(`❌ Harap masukkan apa yang ingin dicari!\n\nContoh:\n\`${prefix}${command} wallpaper neon aesthetic\``)
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const data = await pinterest(text)
    
    if (!data || !data.result || !data.result.result || data.result.result.length === 0) {
      throw new Error('Gambar tidak ditemukan!')
    }

    // Ambil 1 gambar acak dari hasil pencarian (agar tidak spam)
    const images = data.result.result
    const randomImage = images[Math.floor(Math.random() * images.length)]

    await conn.sendMessage(m.chat, {
      image: { url: randomImage },
      caption: `📌 *Pinterest Search*\n\n🔎 *Query:* ${text}`
    }, { quoted: m })

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ Gagal mencari gambar: ${e.message}`)
  }
}

handler.command = /^(pinterest|pin|pt)$/i
handler.help = ['pinterest <query>']
handler.tags = ['media']

module.exports = handler
