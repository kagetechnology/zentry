const { dbSet } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  // Cooldown 12 jam (43200000 ms)
  let lastSleep = user.lastSleep || 0
  let now = Date.now()
  let cooldown = 43200000 // 12 Jam
  
  if (now - lastSleep < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastSleep)
    return m.reply(`⏳ Kamu belum mengantuk.\nTunggu *${formatUptime(sisa)}* lagi untuk bisa tidur panjang.`)
  }

  // Jika HP sudah penuh, tidak usah tidur
  if (user.health >= 100 && user.stamina >= 100) {
    return m.reply('❌ Kamu masih segar bugar! Tidak perlu tidur.\nPergi kerja atau berburu monster sana!')
  }

  // Pemulihan
  user.health = 100
  user.stamina = 100
  user.lastSleep = now

  dbSet(`users.${userKey}`, user)
  
  m.reply(`🛌 *TIDUR NYENYAK* 🛌\n\nKamu tidur lelap selama berjam-jam dan bermimpi indah. Saat terbangun, tubuhmu terasa sangat segar kembali!\n\n❤️ Health: Penuh (100/100)\n⚡ Stamina: Penuh (100/100)\n\n${getRandomTip()}`)
}

handler.help = ['sleep', 'tidur']
handler.tags = ['rpg']
handler.command = /^(sleep|tidur|istirahat)$/i

module.exports = handler
