// plugins/ig.js
const axios = require('axios')
const { sleep } = require('../lib/functions')

let handler = async (m, { conn, args, prefix, command }) => {
  const url = args[0]
  if (!url) {
    return m.reply(`❌ Harap masukkan URL Instagram!\n\nContoh:\n\`${prefix}${command} https://www.instagram.com/p/C9Xy10_S_lZ/\``)
  }

  if (!url.match(/(instagram\.com)/i)) {
    return m.reply('❌ URL tidak valid. Pastikan itu adalah link Instagram!')
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    // Menggunakan free API Ryzendesu untuk IG
    const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`)
    const data = response.data

    if (!data || !data.success || !data.data || data.data.length === 0) {
      throw new Error('Media tidak ditemukan. Pastikan akun tidak diprivate!')
    }

    const mediaList = data.data

    await m.reply(`⏳ Mengirim ${mediaList.length} media...`)

    for (let i = 0; i < mediaList.length; i++) {
      const media = mediaList[i]
      const isVideo = media.url.includes('.mp4') || media.type === 'video'

      if (isVideo) {
        await conn.sendMessage(m.chat, { video: { url: media.url } }, { quoted: m })
      } else {
        await conn.sendMessage(m.chat, { image: { url: media.url } }, { quoted: m })
      }
      
      // Jeda agar tidak spam/rate limit
      if (i < mediaList.length - 1) await sleep(2000)
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ Gagal mengunduh Instagram:\n${err.message || 'Server sedang sibuk atau URL diprivate.'}`)
  }
}

handler.command = /^(ig|igdl|instagram)$/i
handler.help    = ['ig <url>']
handler.tags    = ['downloader']

module.exports = handler
