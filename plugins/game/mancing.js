const { dbGet, dbSet, pickRandom } = require('../../lib/functions')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  
  // Cooldown 30 menit (1800000 ms)
  let lastMancing = dbGet(`users.${userKey}.lastMancing`, 0)
  let now = Date.now()
  let cooldown = 1800000
  
  if (now - lastMancing < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastMancing)
    return m.reply(`⏳ Jangan serakah! Kolam ikannya butuh waktu buat *spawn* lagi.\nTunggu *${formatUptime(sisa)}* lagi untuk memancing.`)
  }
  
  let fishes = [
    { name: 'Ikan Lele 🐟', min: 1, max: 10, price: 100 },
    { name: 'Ikan Nila 🐠', min: 1, max: 8, price: 200 },
    { name: 'Ikan Koi 🎏', min: 0, max: 3, price: 1500 },
    { name: 'Hiu Putih 🦈', min: 0, max: 1, price: 10000 },
    { name: 'Sepatu Bekas 👞', min: 1, max: 2, price: 5 } // Zonk
  ]
  
  let result = pickRandom(fishes)
  let amount = Math.floor(Math.random() * (result.max - result.min + 1)) + result.min
  
  if (amount === 0) {
    dbSet(`users.${userKey}.lastMancing`, now)
    return m.reply('🎣 Tarik... yah lepas! Kamu tidak dapat ikan satupun hari ini.')
  }
  
  let money = amount * result.price
  let currentMoney = dbGet(`users.${userKey}.money`, 0)
  
  dbSet(`users.${userKey}.money`, currentMoney + money)
  dbSet(`users.${userKey}.lastMancing`, now)
  
  m.reply(`🎣 *HASIL MEMANCING*\n\nKamu melempar kail dan berhasil mendapatkan:\n*${amount}x ${result.name}*\n\nKamu langsung menjualnya ke pasar seharga 💰 ${money}!`)
}

handler.help = ['mancing', 'fishing']
handler.tags = ['game']
handler.command = /^(mancing|fishing)$/i

module.exports = handler
