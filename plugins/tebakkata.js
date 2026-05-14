// plugins/tebakkata.js
const fs = require('fs')

// Inisialisasi object game di conn jika belum ada
// (Di-handle juga di main.js nanti, tapi untuk amannya kita pastikan di sini)

let handler = async (m, { conn, prefix, command }) => {
  conn.tebakkata = conn.tebakkata ? conn.tebakkata : {}

  if (m.chat in conn.tebakkata) {
    return m.reply('❌ Masih ada soal tebak kata yang belum terjawab di grup ini!')
  }

  // Baca database soal
  let data = JSON.parse(fs.readFileSync('./lib/tebakkata.json'))
  let soal = data[Math.floor(Math.random() * data.length)]

  let caption = `🎮 *TEBAK KATA* 🎮\n\n`
  caption += `Clue: *${soal.soal}*\n\n`
  caption += `Waktu: 60 detik\n`
  caption += `Balas (reply) pesan ini untuk menjawab!`

  // Kirim soal dan simpan id pesan serta jawabannya ke session
  let msg = await conn.sendMessage(m.chat, { text: caption }, { quoted: m })

  conn.tebakkata[m.chat] = {
    chat: m.chat,
    msgId: msg.key.id,
    soal: soal.soal,
    jawaban: soal.jawaban.toLowerCase(),
    poin: 100, // Reward jika berhasil jawab
    timeout: setTimeout(() => {
      if (conn.tebakkata[m.chat]) {
        conn.sendMessage(m.chat, { text: `⏳ Waktu habis!\n\nJawabannya adalah: *${soal.jawaban}*` }, { quoted: msg })
        delete conn.tebakkata[m.chat]
      }
    }, 60000) // 60 detik
  }
}

handler.command = /^(tebakkata|tk)$/i
handler.help = ['tebakkata']
handler.tags = ['game']

module.exports = handler
