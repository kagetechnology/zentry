const { dbSet, pickRandom } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (user.stamina < 10) {
    return m.reply('❌ Stamina kamu tidak cukup untuk memulung! Istirahat dulu.')
  }

  // Cooldown 5 menit
  let lastMulung = user.lastMulung || 0
  let now = Date.now()
  let cooldown = 300000 // 5 Menit
  
  if (now - lastMulung < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastMulung)
    return m.reply(`⏳ Tong sampahnya sudah kosong.\nTunggu *${formatUptime(sisa)}* lagi untuk memulung.`)
  }

  // Risiko digigit anjing (20%)
  if (Math.random() < 0.20) {
    user.health -= 5
    user.stamina -= 10
    user.lastMulung = now
    dbSet(`users.${userKey}`, user)
    return m.reply(`🐕 *GUK GUK GUK!*\n\nKamu ketahuan sedang mengobrak-abrik tong sampah dan digigit anjing penjaga!\nKamu lari terbirit-birit tanpa membawa hasil.\n\n❤️ -5 Health\n⚡ -10 Stamina\n\n${getRandomTip()}`)
  }
  
  let rongsok = [
    { name: 'kardus', label: 'Kardus 📦', min: 2, max: 10 },
    { name: 'kaleng', label: 'Kaleng 🥫', min: 1, max: 5 },
    { name: 'botol', label: 'Botol 🍾', min: 1, max: 8 }
  ]
  
  let result = pickRandom(rongsok)
  let amount = Math.floor(Math.random() * (result.max - result.min + 1)) + result.min
  
  // Mengurangi status
  user.stamina -= 10
  user.lastMulung = now
  user.inventory[result.name] += amount

  dbSet(`users.${userKey}`, user)
  
  m.reply(`🗑️ *HASIL MEMULUNG*\n\nKamu mengorek-ngorek tong sampah dan menemukan:\n*${amount}x ${result.label}*\n\nBarang rongsokan dimasukkan ke dalam Tas (Inventory). Jual ke pengepul dengan *.sell ${result.name} all*.\n\n⚡ -10 Stamina\n\n${getRandomTip()}`)
}

handler.help = ['mulung']
handler.tags = ['rpg']
handler.command = /^(mulung)$/i

module.exports = handler
