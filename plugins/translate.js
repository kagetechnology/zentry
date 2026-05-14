// plugins/translate.js
const { translate } = require('@vitalets/google-translate-api')

let handler = async (m, { conn, args, text, prefix, command }) => {
  // Ambil teks dari argumen atau dari pesan yang di-reply
  let targetLang = 'id'
  let pesan = ''

  if (args.length >= 2 && args[0].length === 2) {
    targetLang = args[0]
    pesan = args.slice(1).join(' ')
  } else if (args.length === 1 && args[0].length === 2 && m.quoted) {
    targetLang = args[0]
    pesan = m.quoted.text || m.quoted.caption || ''
  } else {
    // Default translate to ID
    targetLang = 'id'
    pesan = text || (m.quoted && (m.quoted.text || m.quoted.caption)) || ''
  }

  if (!pesan) {
    return m.reply(`❌ Harap masukkan teks yang ingin diterjemahkan atau reply pesan!\n\nContoh:\n\`${prefix}${command} en selamat pagi\`\n\`${prefix}${command} jp aku cinta kamu\`\n\nAtau reply pesan dengan \`${prefix}${command} id\``)
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const res = await translate(pesan, { to: targetLang })
    
    let replyText = `🌐 *Translate (${res.raw.src} ➡️ ${targetLang})*\n\n`
    replyText += `${res.text}`

    await m.reply(replyText)
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ Gagal menerjemahkan: ${e.message}`)
  }
}

handler.command = /^(tr|translate)$/i
handler.help = ['tr <lang> <teks>']
handler.tags = ['utility']

module.exports = handler
