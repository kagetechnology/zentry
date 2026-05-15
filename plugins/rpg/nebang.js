const { dbSet } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  // Tidak butuh alat, cuma butuh fisik
  if (user.health < 10) {
    return m.reply('❌ Darah (Health) kamu terlalu rendah untuk menebang pohon! Minum Potion dulu dengan *.heal*.')
  }

  if (user.stamina < 15) {
    return m.reply('❌ Stamina kamu tidak cukup! Tunggu beberapa saat atau istirahat.')
  }

  // Cooldown 3 menit
  let lastNebang = user.lastNebang || 0
  let now = Date.now()
  let cooldown = 180000 // 3 Menit
  
  if (now - lastNebang < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastNebang)
    return m.reply(`⏳ Hutan ini sedang ditebang habis, tunggu pohonnya tumbuh kembali.\nTunggu *${formatUptime(sisa)}* lagi.`)
  }
  
  // Hasil
  let amount = Math.floor(Math.random() * 20) + 10 // 10 - 30 kayu
  
  // Mengurangi status
  user.health -= 5
  user.stamina -= 15
  user.lastNebang = now
  user.inventory.kayu += amount

  dbSet(`users.${userKey}`, user)
  
  m.reply(`🪓 *HASIL PENEBANGAN*\n\nKamu menebang pohon di hutan menggunakan tangan kosong seperti di Minecraft dan mendapatkan:\n*${amount}x Kayu 🪵*\n\nBarang telah dimasukkan ke dalam Tas (Inventory).\n\n❤️ -5 Health\n⚡ -15 Stamina\n\n${getRandomTip()}`)
}

handler.help = ['nebang', 'tebang']
handler.tags = ['rpg']
handler.command = /^(nebang|tebang|kayu)$/i

module.exports = handler
