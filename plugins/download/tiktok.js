// plugins/tiktok.js
const axios = require('axios')

let handler = async (m, { conn, args, prefix, command }) => {
  const url = args[0]
  if (!url) return m.reply(`❌ Masukkan URL!\n└─ *${prefix}${command} <url>*`)
  if (!url.match(/(tiktok\.com|vt\.tiktok\.com)/i)) return m.reply('❌ Link TikTok tidak valid!')

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const { data } = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`)
    if (!data?.video?.noWatermark) throw new Error('Video tidak ditemukan.')

    const cap = `🎵 *${data.author?.name || 'Unknown'}*\n` +
                `📝 ${data.title || '-'}\n` +
                `❤️ ${data.stats?.likeCount || '-'} ・ 🔁 ${data.stats?.shareCount || '-'}`

    await conn.sendMessage(m.chat, {
      video: { url: data.video.noWatermark },
      caption: cap,
    }, { quoted: m })

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ ${err.message || 'Server sibuk.'}`)
  }
}

handler.command = /^(tiktok|tt|ttdl)$/i
handler.help = ['tiktok']
handler.tags = ['download']

module.exports = handler