// plugins/ai.js
const axios = require('axios')

let handler = async (m, { conn, text, prefix, command }) => {
  if (!text) return m.reply(`❌ Masukkan pertanyaan!\n└─ *${prefix}${command} <teks>*`)

  const openRouterKey = require('../config').openrouter
  if (!openRouterKey || openRouterKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
    return m.reply('❌ API Key belum diset!')
  }

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const { data } = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/free',
        messages: [
          {
            role: 'system',
            content: 'Kamu asisten WhatsApp. Balas pakai bahasa Indonesia santai, singkat, tanpa format markdown (no *, _, #). Plain text only.'
          },
          { role: 'user', content: text }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://github.com/kagetechnology/zentry',
          'X-Title': 'Zentry WhatsApp Bot',
          'Content-Type': 'application/json'
        }
      }
    )

    let result = data?.choices?.[0]?.message?.content
    if (!result) throw new Error('Balasan kosong.')

    result = result.replace(/[\*\_#]/g, '').trim()

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    return m.reply(result)

  } catch (err) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply(`❌ ${err.response?.data?.error?.message || err.message}`)
  }
}

handler.command = /^(ai|zentry)$/i
handler.help = ['ai']
handler.tags = ['ai']

module.exports = handler