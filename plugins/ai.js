// plugins/ai.js
const axios = require('axios')
const { dbGet } = require('../lib/functions')

let handler = async (m, { conn, text, prefix, command }) => {
  if (!text) return m.reply(`❌ Harap masukkan pertanyaan!\n\nContoh:\n\`${prefix}${command} Siapa presiden pertama Indonesia?\``)

  const openRouterKey = require('../config').openrouter
  if (!openRouterKey || openRouterKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
    return m.reply('❌ *API Key belum diset!*\nAdmin perlu mengubah `openrouter` di file `config.js`.')
  }

  // Kasih react proses
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/free', // Otomatis memilih model gratis terbaik yang tersedia
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah Zentry, asisten bot WhatsApp yang dibuat oleh Kage Technology. Kamu sangat pintar, asik, ramah, dan membalas dengan bahasa Indonesia yang santai tapi sopan.'
          },
          {
            role: 'user',
            content: text
          }
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

    const result = response.data?.choices?.[0]?.message?.content
    if (!result) throw new Error('Balasan kosong dari API.')

    // Kasih react selesai
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    return m.reply(result)

  } catch (err) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    const errMessage = err.response?.data?.error?.message || err.message
    return m.reply(`❌ Gagal merespon:\n${errMessage}`)
  }
}

handler.command = /^(ai|zentry)$/i
handler.help    = ['ai <pertanyaan>']
handler.tags    = ['ai']

module.exports = handler
