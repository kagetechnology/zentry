const { dbSet, pickRandom } = require('../../lib/functions')
const { initRPG } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)
  
  if (user.tools.pickaxe <= 0) {
    return m.reply('❌ Kamu tidak punya Beliung (*Pickaxe*) atau Beliungmu sudah hancur!\nSilakan buat dengan perintah *.craft pickaxe* atau beli di *.shop*.')
  }

  if (user.health < 20) {
    return m.reply('❌ Darah (Health) kamu terlalu rendah untuk menambang! Minum Potion dulu dengan *.heal*.')
  }

  if (user.stamina < 15) {
    return m.reply('❌ Stamina kamu tidak cukup! Tunggu beberapa saat atau istirahat.')
  }

  // Cooldown 1 jam (3600000 ms) - sekarang saya ubah jadi 5 menit aja biar seru
  let lastTambang = user.lastTambang || 0
  let now = Date.now()
  let cooldown = 300000 // 5 Menit
  
  if (now - lastTambang < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastTambang)
    return m.reply(`⏳ Kamu masih kelelahan sehabis menambang.\nTunggu *${formatUptime(sisa)}* lagi.`)
  }
  
  let rewards = [
    { name: 'batu', label: 'Batu 🪨', min: 10, max: 30 },
    { name: 'besi', label: 'Besi ⛓️', min: 5, max: 15 },
    { name: 'emas', label: 'Emas 🪙', min: 1, max: 5 },
    { name: 'berlian', label: 'Berlian 💎', min: 0, max: 1 },
    { name: 'zonk', label: 'Zonk', min: 0, max: 0 } 
  ]
  
  let result = pickRandom(rewards)
  let amount = Math.floor(Math.random() * (result.max - result.min + 1)) + result.min
  
  // Mengurangi status
  user.health -= 10
  user.stamina -= 15
  user.tools.pickaxe -= 5 // Durability berkurang 5%
  user.lastTambang = now

  if (result.name === 'zonk' || amount === 0) {
    dbSet(`users.${userKey}`, user)
    return m.reply(`⛏️ Kamu menambang seharian, tapi tidak dapat apa-apa!\n\n❤️ -10 Health\n⚡ -15 Stamina\n🛠️ Pickaxe Durability: ${user.tools.pickaxe}%`)
  }
  
  // Masukkan ke inventory
  user.inventory[result.name] += amount
  
  dbSet(`users.${userKey}`, user)
  
  let durStatus = user.tools.pickaxe <= 0 ? '\n⚠️ *Pickaxe kamu hancur!*' : `\n🛠️ Pickaxe Durability: ${user.tools.pickaxe}%`

  m.reply(`⛏️ *HASIL TAMBANG*\n\nKamu menggali dengan keras dan berhasil mengumpulkan:\n*${amount}x ${result.label}*\n\nBarang telah dimasukkan ke dalam Tas (Inventory).\n\n❤️ -10 Health\n⚡ -15 Stamina${durStatus}`)
}

handler.help = ['tambang', 'mining']
handler.tags = ['rpg']
handler.command = /^(tambang|mining)$/i

module.exports = handler
