// plugins/tts.js
const tts = require('google-tts-api')

let handler = async (m, { conn, text, prefix, command }) => {
  if (!text) return m.reply(
    `❌ Teks kosong!\n\n` +
    `*Contoh:*\n` +
    `▸ ${prefix}${command} id Halo semuanya\n` +
    `▸ ${prefix}${command} en Hello world`
  )

  const args = text.split(' ')
  const lang = args[0].length === 2 ? args.shift().toLowerCase() : 'id'
  const pesan = args.join(' ')

  if (!pesan) return m.reply('❌ Teks yang dibaca kosong!')

  await conn.sendMessage(m.chat, { react: { text: '🗣️', key: m.key } })

  try {
    const url = tts.getAudioUrl(pesan, {
      lang,
      slow: false,
      host: 'https://translate.google.com',
    })

    await conn.sendMessage(m.chat, {
      audio: { url },
      mimetype: 'audio/mp4',
      ptt: true,
    }, { quoted: m })

  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ ${e.message}`)
  }
}

handler.command = /^(tts|gtts|suara)$/i
handler.help = ['tts']
handler.tags = ['tools']

module.exports = handler