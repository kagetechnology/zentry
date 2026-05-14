// plugins/pinterest.js
const { pinterest } = require('btch-downloader')

let handler = async (m, { conn, text, prefix, command }) => {
  if (!text) return m.reply(`❌ Masukkan query!\n└─ *${prefix}${command} <query>*`)

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const data = await pinterest(text)
    const images = data?.result?.result
    if (!images?.length) throw new Error('Tidak ditemukan.')

    const randomImage = images[Math.floor(Math.random() * images.length)]

    await conn.sendMessage(m.chat, {
      image: { url: randomImage },
      caption: `📌 *${text}*`,
    }, { quoted: m })

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ ${e.message}`)
  }
}

handler.command = /^(pinterest|pin|pt)$/i
handler.help = ['pinterest']
handler.tags = ['search']

module.exports = handler