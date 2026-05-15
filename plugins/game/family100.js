const fs = require('fs')
const { pickRandom } = require('../../lib/functions')

let handler = async (m, { conn, isGroup }) => {
  if (!isGroup) return m.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!')
  
  conn.family100 = conn.family100 || {}
  
  if (m.chat in conn.family100) return m.reply('Masih ada kuis Family 100 yang belum diselesaikan di grup ini!')
  
  let db = JSON.parse(fs.readFileSync('./lib/family100.json'))
  let soal = pickRandom(db)
  
  let id = m.chat
  conn.family100[id] = {
    creator: m.sender,
    soal: soal.soal,
    jawaban: soal.jawaban.map(v => v.toLowerCase()),
    terjawab: [],
    poin: 500,
    waktu: setTimeout(() => {
      if (conn.family100[id]) {
        m.reply(`⏳ Waktu habis!\n\nJawaban yang belum tertebak:\n${conn.family100[id].jawaban.filter(v => !conn.family100[id].terjawab.includes(v)).join('\n')}`)
        delete conn.family100[id]
      }
    }, 120000) // 2 menit
  }
  
  let caption = `👨‍👩‍👧‍👦 *KUIS FAMILY 100* 👨‍👩‍👧‍👦\n\n*Soal:* ${soal.soal}\n\nTerdapat *${soal.jawaban.length}* jawaban.\nKetikkan tebakanmu di chat ini!\nSetiap jawaban benar mendapat +500 XP.\n\nWaktu: 2 Menit`
  m.reply(caption)
}

handler.help = ['family100', 'f100']
handler.tags = ['game']
handler.command = /^(family100|f100)$/i

module.exports = handler
