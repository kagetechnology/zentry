const { dbSet, pickRandom } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)
  
  if (user.tools.fishingrod <= 0) {
    return m.reply('❌ Kamu tidak punya Pancingan (*Fishing Rod*) atau pancinganmu rusak!\nSilakan buat dengan perintah *.craft fishingrod* atau beli di *.shop*.')
  }

  if (user.health < 10) {
    return m.reply('❌ Darah (Health) kamu terlalu rendah untuk memancing! Minum Potion dulu dengan *.heal*.')
  }

  if (user.stamina < 10) {
    return m.reply('❌ Stamina kamu tidak cukup! Tunggu beberapa saat atau istirahat.')
  }

  // Cooldown 3 menit
  let lastMancing = user.lastMancing || 0
  let now = Date.now()
  let cooldown = 180000 // 3 Menit
  
  if (now - lastMancing < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastMancing)
    return m.reply(`⏳ Kolam ikannya butuh waktu buat *spawn* lagi.\nTunggu *${formatUptime(sisa)}* lagi.`)
  }
  
  let fishes = [
    { name: 'lele', label: 'Ikan Lele 🐟', min: 1, max: 10 },
    { name: 'nila', label: 'Ikan Nila 🐠', min: 1, max: 5 },
    { name: 'koi', label: 'Ikan Koi 🎏', min: 0, max: 2 },
    { name: 'hiu', label: 'Hiu Putih 🦈', min: 0, max: 1 },
    { name: 'zonk', label: 'Sepatu Bekas 👞', min: 1, max: 1 } // Zonk
  ]
  
  let result = pickRandom(fishes)
  let amount = Math.floor(Math.random() * (result.max - result.min + 1)) + result.min
  
  // Mengurangi status
  user.health -= 5
  user.stamina -= 10
  user.tools.fishingrod -= 3 // Durability berkurang 3%
  user.lastMancing = now

  if (result.name === 'zonk' || amount === 0) {
    dbSet(`users.${userKey}`, user)
    return m.reply(`🎣 Tarik... yah lepas! Kamu cuma dapat ${result.label}.\n\n❤️ -5 Health\n⚡ -10 Stamina\n🎣 Fishing Rod Durability: ${user.tools.fishingrod}%\n\n${getRandomTip()}`)
  }
  
  // Masukkan ke inventory
  user.inventory[result.name] += amount
  
  dbSet(`users.${userKey}`, user)
  
  let durStatus = user.tools.fishingrod <= 0 ? '\n⚠️ *Pancingan kamu rusak!*' : `\n🎣 Fishing Rod Durability: ${user.tools.fishingrod}%`

  m.reply(`🎣 *HASIL MEMANCING*\n\nKamu melempar kail dan berhasil mendapatkan:\n*${amount}x ${result.label}*\n\nIkan dimasukkan ke dalam Tas (Inventory).\n\n❤️ -5 Health\n⚡ -10 Stamina${durStatus}\n\n${getRandomTip()}`)
}

handler.help = ['mancing', 'fishing']
handler.tags = ['rpg']
handler.command = /^(mancing|fishing)$/i

module.exports = handler
