// plugins/translate.js
const { translate } = require('@vitalets/google-translate-api')

let handler = async (m, { conn, args, text, prefix, command }) => {
  let targetLang = 'id'
  let pesan = ''

  if (args.length >= 2 && args[0].length === 2) {
    targetLang = args[0]
    pesan = args.slice(1).join(' ')
  } else if (args.length === 1 && args[0].length === 2 && m.quoted) {
    targetLang = args[0]
    pesan = m.quoted.text || m.quoted.caption || ''
  } else {
    targetLang = 'id'
    pesan = text || (m.quoted && (m.quoted.text || m.quoted.caption)) || ''
  }

  if (!pesan) return m.reply(
    `❌ Teks kosong!\n\n` +
    `*Contoh:*\n` +
    `▸ ${prefix}${command} en selamat pagi\n` +
    `▸ ${prefix}${command} jp aku cinta kamu\n` +
    `▸ reply pesan → ${prefix}${command} id`
  )

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const res = await translate(pesan, { to: targetLang })
    await m.reply(`🌐 *${res.raw.src} → ${targetLang}*\n└─ ${res.text}`)
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ ${e.message}`)
  }
}

handler.command = /^(tr|translate)$/i
handler.help = ['tr']
handler.tags = ['tools']

module.exports = handler