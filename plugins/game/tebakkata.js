// plugins/tebakkata.js
const fs = require('fs')

let handler = async (m, { conn, prefix, command }) => {
  conn.tebakkata = conn.tebakkata || {}

  if (m.chat in conn.tebakkata) return m.reply('❌ Masih ada soal belum terjawab!')

  let data = JSON.parse(fs.readFileSync('./lib/tebakkata.json'))
  let soal = data[Math.floor(Math.random() * data.length)]

  let caption = `🎮 *TEBAK KATA*\n` +
                `│ Clue : *${soal.soal}*\n` +
                `│ Waktu: 60 detik\n` +
                `└───────────\n\n` +
                `_Reply pesan ini untuk menjawab_`

  let msg = await conn.sendMessage(m.chat, { text: caption }, { quoted: m })

  conn.tebakkata[m.chat] = {
    chat: m.chat,
    msgId: msg.key.id,
    soal: soal.soal,
    jawaban: soal.jawaban.toLowerCase(),
    poin: 100,
    timeout: setTimeout(() => {
      if (conn.tebakkata[m.chat]) {
        conn.sendMessage(m.chat, {
          text: `⏳ Waktu habis!\n└─ *${soal.jawaban}*`
        }, { quoted: msg })
        delete conn.tebakkata[m.chat]
      }
    }, 60000),
  }
}

handler.command = /^(tebakkata|tk)$/i
handler.help = ['tebakkata']
handler.tags = ['game']

module.exports = handler