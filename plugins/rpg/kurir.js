const { dbSet } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (user.stamina < 30) {
    return m.reply('❌ Stamina kamu tidak cukup untuk keliling kota mengantar paket. Butuh minimal 30 Stamina. Istirahat dulu.')
  }

  // Cooldown 20 menit
  let lastKurir = user.lastKurir || 0
  let now = Date.now()
  let cooldown = 1200000 // 20 Menit
  
  if (now - lastKurir < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastKurir)
    return m.reply(`⏳ Kamu baru saja selesai ngojek.\nTunggu *${formatUptime(sisa)}* lagi untuk menerima orderan baru.`)
  }

  // Risiko dibegal (10%)
  if (user.money > 200 && Math.random() < 0.10) {
    let rugi = Math.floor(user.money * 0.1) // Hilang 10% uang
    user.health -= 15
    user.stamina -= 30
    user.money -= rugi
    user.lastKurir = now
    dbSet(`users.${userKey}`, user)
    return m.reply(`🏍️ 💥 *AWAS BEGAL!*\n\nSaat melewati jalan sepi, kamu diadang komplotan begal! Kamu dipukuli dan uang hasil setoran ojolmu dirampas.\n\n💸 Kehilangan: Rp ${rugi.toLocaleString('id-ID')}\n❤️ -15 Health\n⚡ -30 Stamina\n\n${getRandomTip()}`)
  }
  
  let gaji = Math.floor(Math.random() * 500) + 300 // 300 - 800
  
  // Mengurangi status
  user.stamina -= 30
  user.lastKurir = now
  user.money += gaji

  dbSet(`users.${userKey}`, user)
  
  m.reply(`🛵 *ORDERAN SELESAI*\n\nKamu berhasil mengantar paket ke pelanggan tepat waktu. Pelanggan puas dan memberimu bayaran sebesar 💰 Rp ${gaji.toLocaleString('id-ID')}!\n\n⚡ -30 Stamina\nSaldo sekarang: Rp ${user.money.toLocaleString('id-ID')}\n\n${getRandomTip()}`)
}

handler.help = ['kurir', 'ojol']
handler.tags = ['rpg']
handler.command = /^(kurir|ojol)$/i

module.exports = handler
