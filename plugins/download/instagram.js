// plugins/ig.js
const axios = require('axios')
const { sleep } = require('../lib/functions')

let handler = async (m, { conn, args, prefix, command }) => {
  const url = args[0]
  if (!url) return m.reply(`❌ Masukkan URL!\n└─ *${prefix}${command} <url>*`)
  if (!url.match(/(instagram\.com)/i)) return m.reply('❌ Link IG tidak valid!')

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const { data } = await axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`)
    if (!data?.success || !data?.data?.length) throw new Error('Media tidak ditemukan/akun private.')

    const mediaList = data.data
    await m.reply(`⏳ ${mediaList.length} media`)

    for (let i = 0; i < mediaList.length; i++) {
      const media = mediaList[i]
      const isVideo = media.url.includes('.mp4') || media.type === 'video'

      await conn.sendMessage(m.chat, {
        [isVideo ? 'video' : 'image']: { url: media.url },
      }, { quoted: m })

      if (i < mediaList.length - 1) await sleep(2000)
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ ${err.message}`)
  }
}

handler.command = /^(ig|igdl|instagram)$/i
handler.help = ['ig']
handler.tags = ['download']

module.exports = handler