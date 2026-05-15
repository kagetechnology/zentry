const { dbGet, dbSet } = require('../../lib/functions')
const { getRandomTip } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  
  // Cooldown 24 jam (86400000 ms)
  let lastDaily = dbGet(`users.${userKey}.lastDaily`, 0)
  let now = Date.now()
  let cooldown = 86400000
  
  if (now - lastDaily < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastDaily)
    return m.reply(`⏳ Kamu sudah mengambil hadiah harianmu!\nTunggu *${formatUptime(sisa)}* lagi untuk klaim berikutnya.`)
  }
  
  let rewardMoney = Math.floor(Math.random() * 5000) + 1000 // 1000 - 6000
  let rewardExp = Math.floor(Math.random() * 500) + 100     // 100 - 600
  
  let currentMoney = dbGet(`users.${userKey}.money`, 0)
  let currentExp = dbGet(`users.${userKey}.exp`, 0)
  
  dbSet(`users.${userKey}.money`, currentMoney + rewardMoney)
  dbSet(`users.${userKey}.exp`, currentExp + rewardExp)
  dbSet(`users.${userKey}.lastDaily`, now)
  
  m.reply(`🎉 *KLAIM HARIAN BERHASIL*\n\nKamu mendapatkan:\n💰 Uang: ${rewardMoney}\n✨ EXP: ${rewardExp}\n\nKlaim lagi besok ya!\n\n${getRandomTip()}`)
}

handler.help = ['daily', 'claim']
handler.tags = ['rpg']
handler.command = /^(daily|claim)$/i

module.exports = handler
