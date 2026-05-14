// plugins/tiktok.js
const axios = require('axios')

let handler = async (m, { conn, args, prefix, command }) => {
  const url = args[0]
  if (!url) {
    return m.reply(`❌ Harap masukkan URL TikTok!\n\nContoh:\n\`${prefix}${command} https://vt.tiktok.com/ZSjRMYA3r/\``)
  }

  // Validasi URL basic
  if (!url.match(/(tiktok\.com|vt\.tiktok\.com)/i)) {
    return m.reply('❌ URL tidak valid. Pastikan itu adalah link TikTok!')
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    // Menggunakan free API TiklyDown yang stabil
    const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`)
    const data = response.data

    if (!data || !data.video || !data.video.noWatermark) {
      throw new Error('Video tidak ditemukan atau API sedang gangguan.')
    }

    const videoUrl = data.video.noWatermark
    const caption  = `🎵 *TikTok Downloader*\n\n` +
                     `👤 *Author:* ${data.author?.name || 'Unknown'}\n` +
                     `📝 *Title:* ${data.title || '-'}\n` +
                     `❤️ *Likes:* ${data.stats?.likeCount || '-'}\n` +
                     `🔁 *Shares:* ${data.stats?.shareCount || '-'}\n\n` +
                     `_Video diunduh tanpa watermark._`

    await conn.sendMessage(m.chat, {
      video: { url: videoUrl },
      caption: caption
    }, { quoted: m })

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ Gagal mengunduh video:\n${err.message || 'Server sedang sibuk.'}`)
  }
}

handler.command = /^(tiktok|tt|ttdl)$/i
handler.help    = ['tiktok <url>']
handler.tags    = ['downloader']

module.exports = handler
