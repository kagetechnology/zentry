const { sleep } = require('../../lib/functions')

let handler = async (m, { conn, isGroup }) => {
  if (!isGroup) return m.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!')
  
  await m.reply('👋 Sampai jumpa! Bot akan keluar dari grup ini.')
  await sleep(1500)
  
  try {
    await conn.groupLeave(m.chat)
  } catch (err) {
    m.reply('❌ Gagal keluar dari grup.')
  }
}

handler.help = ['leave', 'out']
handler.tags = ['owner']
handler.command = /^(leave|out)$/i
handler.owner = true

module.exports = handler
