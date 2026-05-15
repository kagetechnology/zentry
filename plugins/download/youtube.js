// plugins/youtube.js
const { youtube } = require('btch-downloader')
const axios = require('axios')

let handler = async (m, { conn, args, prefix, command }) => {
  const url = args[0]
  const isAudio = command === 'ytmp3'

  if (!url) return m.reply(`❌ Masukkan URL!\n└─ *${prefix}${command} <url>*`)
  if (!url.match(/(youtube\.com|youtu\.be)/i)) return m.reply('❌ Link YouTube tidak valid!')

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    let title = ''
    let mediaUrl = ''

    try {
      const data = await youtube(url)
      title = data.title || 'YouTube'
      mediaUrl = isAudio ? data.audio?.[0]?.url || data.mp3 
                         : data.video?.[0]?.url || data.mp4
    } catch {
      const endpoint = isAudio ? 'ytmp3' : 'ytmp4'
      const { data } = await axios.get(
        `https://api.ryzendesu.vip/api/downloader/${endpoint}?url=${encodeURIComponent(url)}`
      )
      if (!data?.url) throw new Error('API down')
      mediaUrl = data.url
      title = data.title || 'YouTube'
    }

    if (!mediaUrl) throw new Error('Gagal mendapatkan media.')

    await m.reply(`⏳ *${title}*`)

    if (isAudio) {
      await conn.sendMessage(m.chat, {
        audio: { url: mediaUrl },
        mimetype: 'audio/mpeg',
        ptt: false,
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
    return m.reply(`❌ ${err.message || 'Server sibuk.'}`)
  }
}

handler.command = /^(ytmp3|ytmp4|yt|youtube)$/i
handler.help = ['ytmp3', 'ytmp4']
handler.tags = ['download']

module.exports = handler