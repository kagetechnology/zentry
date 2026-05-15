const { dbGet, dbSet, pickRandom } = require('../../lib/functions')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  
  // Cooldown 1 jam (3600000 ms)
  let lastTambang = dbGet(`users.${userKey}.lastTambang`, 0)
  let now = Date.now()
  let cooldown = 3600000
  
  if (now - lastTambang < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastTambang)
    return m.reply(`⏳ Kamu masih kelelahan sehabis menambang.\nTunggu *${formatUptime(sisa)}* lagi untuk pergi menambang.`)
  }
  
  let rewards = [
    { name: 'Batu 🪨', min: 10, max: 50 },
    { name: 'Besi ⛓️', min: 5, max: 20 },
    { name: 'Emas 🪙', min: 1, max: 5 },
    { name: 'Berlian 💎', min: 0, max: 2 },
    { name: 'Sampah 🗑️', min: 1, max: 5 } // Zonk
  ]
  
  let result = pickRandom(rewards)
  let amount = Math.floor(Math.random() * (result.max - result.min + 1)) + result.min
  
  if (amount === 0) {
    dbSet(`users.${userKey}.lastTambang`, now)
    return m.reply('⛏️ Kamu pergi menambang seharian, tapi zonk! Tidak dapat apa-apa.')
  }
  
  // Kasih uang tambahan sedikit
  let money = amount * (result.name.includes('Emas') ? 1000 : result.name.includes('Berlian') ? 5000 : 50)
  let currentMoney = dbGet(`users.${userKey}.money`, 0)
  
  dbSet(`users.${userKey}.money`, currentMoney + money)
  dbSet(`users.${userKey}.lastTambang`, now)
  
  m.reply(`⛏️ *HASIL TAMBANG*\n\nKamu menggali dengan keras dan menemukan:\n*${amount}x ${result.name}*\n\nBarang tersebut langsung dijual seharga 💰 ${money}!`)
}

handler.help = ['tambang', 'mining']
handler.tags = ['game']
handler.command = /^(tambang|mining)$/i

module.exports = handler
