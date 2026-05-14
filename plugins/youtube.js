// plugins/youtube.js
const { youtube } = require('btch-downloader')
const axios = require('axios')

let handler = async (m, { conn, args, prefix, command }) => {
  const url = args[0]
  if (!url) {
    return m.reply(`❌ Harap masukkan URL YouTube!\n\nContoh:\n\`${prefix}${command} https://youtu.be/dQw4w9WgXcQ\``)
  }

  if (!url.match(/(youtube\.com|youtu\.be)/i)) {
    return m.reply('❌ URL tidak valid. Pastikan itu adalah link YouTube!')
  }

  const isAudio = command === 'ytmp3'
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    // 1. Coba pakai btch-downloader
    let title = ''
    let mediaUrl = ''

    try {
      const data = await youtube(url)
      title = data.title || 'YouTube Downloader'
      if (isAudio) {
        mediaUrl = data.audio?.[0]?.url || data.mp3
      } else {
        mediaUrl = data.video?.[0]?.url || data.mp4
      }
    } catch (e) {
      // Fallback API jika btch-downloader gagal
      const apiUrl = isAudio
        ? `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(url)}`
        : `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`
      const response = await axios.get(apiUrl)
      if (response.data && response.data.url) {
        mediaUrl = response.data.url
        title = response.data.title || 'YouTube Downloader'
      } else {
        throw new Error('API down')
      }
    }

    if (!mediaUrl) throw new Error('Tidak bisa mendapatkan link media.')

    await m.reply(`⏳ Sedang mengirim media... (Title: *${title}*)`)

    if (isAudio) {
      await conn.sendMessage(m.chat, {
        audio: { url: mediaUrl },
        mimetype: 'audio/mpeg',
        ptt: false, // false agar dikirim sebagai file audio biasa, bukan voice note langsung
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, {
        video: { url: mediaUrl },
        caption: `🎥 *${title}*`,
      }, { quoted: m })
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ Gagal mengunduh YouTube:\n${err.message || 'Server API sedang sibuk.'}`)
  }
}

handler.command = /^(ytmp3|ytmp4|yt|youtube)$/i
handler.help    = ['ytmp3 <url>', 'ytmp4 <url>']
handler.tags    = ['downloader']

module.exports = handler
