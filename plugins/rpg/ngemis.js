const { dbSet } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (user.stamina < 5) {
    return m.reply('❌ Kamu terlalu lemah bahkan untuk sekadar berdiri dan menadahkan tangan. Istirahat dulu.')
  }

  // Cooldown 10 menit
  let lastNgemis = user.lastNgemis || 0
  let now = Date.now()
  let cooldown = 600000 // 10 Menit
  
  if (now - lastNgemis < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastNgemis)
    return m.reply(`⏳ Warga sekitar sudah muak melihat wajahmu.\nTunggu *${formatUptime(sisa)}* lagi untuk pindah ke lampu merah berikutnya.`)
  }

  // Risiko diusir Satpol PP (30%)
  if (Math.random() < 0.30) {
    user.health -= 10
    user.stamina -= 15
    user.lastNgemis = now
    dbSet(`users.${userKey}`, user)
    return m.reply(`🚔 *TENG TENG TENG! RAZIA!*\n\nSatpol PP datang dan menggusur tempat nongkrongmu! Kamu dipukuli dan lari terbirit-birit.\n\n❤️ -10 Health\n⚡ -15 Stamina\n\n${getRandomTip()}`)
  }
  
  let uang = Math.floor(Math.random() * 90) + 10 // 10 - 100
  
  // Mengurangi status
  user.stamina -= 5
  user.lastNgemis = now
  user.money += uang

  dbSet(`users.${userKey}`, user)
  
  m.reply(`🤲 *ALHAMDULILLAH*\n\nKamu menadahkan tangan di lampu merah seharian. Ada orang baik hati memberimu recehan sejumlah 💰 Rp ${uang.toLocaleString('id-ID')}!\n\n⚡ -5 Stamina\nSaldo sekarang: Rp ${user.money.toLocaleString('id-ID')}\n\n${getRandomTip()}`)
}

handler.help = ['ngemis']
handler.tags = ['rpg']
handler.command = /^(ngemis|minta)$/i

module.exports = handler
