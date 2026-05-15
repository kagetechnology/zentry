const { dbSet } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (user.stamina < 10) {
    return m.reply('❌ Stamina kamu tidak cukup untuk menggali tanah cari cacing. Istirahat dulu.')
  }

  // Cooldown 5 menit
  let lastNangkap = user.lastNangkap || 0
  let now = Date.now()
  let cooldown = 300000 // 5 Menit
  
  if (now - lastNangkap < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastNangkap)
    return m.reply(`⏳ Cacingnya pada sembunyi ke dalam tanah.\nTunggu *${formatUptime(sisa)}* lagi untuk mencari umpan baru.`)
  }

  let amount = Math.floor(Math.random() * 3) + 1 // 1 - 3 cacing
  
  // Mengurangi status
  user.stamina -= 10
  user.lastNangkap = now
  user.inventory.cacing += amount

  dbSet(`users.${userKey}`, user)
  
  m.reply(`🐛 *CARI UMPAN BERHASIL*\n\nKamu mengorek-ngorek tanah lumpur dan berhasil menangkap:\n*${amount}x Cacing 🐛*\n\nCacing ini sangat berguna sebagai umpan untuk perintah *.mancing*.\n\n⚡ -10 Stamina\n\n${getRandomTip()}`)
}

handler.help = ['nangkap', 'caricacing']
handler.tags = ['rpg']
handler.command = /^(nangkap|cacing|caricacing)$/i

module.exports = handler
