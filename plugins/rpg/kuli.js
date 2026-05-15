const { dbSet } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (user.health < 20) {
    return m.reply('❌ Darah (Health) kamu terlalu rendah untuk kerja kasar! Minum Potion dulu dengan *.heal*.')
  }

  if (user.stamina < 20) {
    return m.reply('❌ Stamina kamu tidak cukup! Istirahat dulu.')
  }

  // Cooldown 15 menit
  let lastKuli = user.lastKuli || 0
  let now = Date.now()
  let cooldown = 900000 // 15 Menit
  
  if (now - lastKuli < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastKuli)
    return m.reply(`⏳ Kamu masih pegal-pegal habis angkat semen.\nTunggu *${formatUptime(sisa)}* lagi untuk kerja kuli.`)
  }

  let upah = Math.floor(Math.random() * 1000) + 500 // 500 - 1500

  // Pengurangan status
  user.health -= 15
  user.stamina -= 20
  user.money += upah
  user.lastKuli = now

  dbSet(`users.${userKey}`, user)

  m.reply(`🧱 *KERJA KULI SELESAI* 🧱\n\nKamu mengangkut batu bata dan semen seharian. Mandor memberimu upah sebesar 💰 Rp ${upah.toLocaleString('id-ID')}!\n\n❤️ -15 Health\n⚡ -20 Stamina\nSaldo sekarang: Rp ${user.money.toLocaleString('id-ID')}\n\n${getRandomTip()}`)
}

handler.help = ['kuli', 'kerja']
handler.tags = ['rpg']
handler.command = /^(kuli|kerja)$/i

module.exports = handler
