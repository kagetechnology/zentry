const { dbSet } = require('../../lib/functions')
const { initRPG } = require('../../lib/rpg')

let handler = async (m, { args, prefix, command }) => {
  if (args.length === 0) {
    return m.reply(`🎰 *KASINO ZENTRY* 🎰\n\nPertaruhkan uangmu!\n\nFormat: *${prefix}${command} <jumlah>*\nContoh: *${prefix}${command} 1000*\n\nJika menang, uang kembali 2-3x lipat!\nJika kalah, uang hangus!`)
  }

  let amount = parseInt(args[0])
  if (args[0] && args[0].toLowerCase() === 'all') amount = 'all'

  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (amount === 'all') {
    amount = user.money
  } else if (isNaN(amount) || amount < 100) {
    return m.reply('❌ Taruhan minimal adalah Rp 100!')
  }

  if (user.money < amount) {
    return m.reply(`❌ Uangmu tidak cukup! Kamu hanya memiliki Rp ${user.money.toLocaleString('id-ID')}`)
  }

  // Animasi sebentar
  m.reply('🎰 Mesin slot sedang diputar...\n*[_] [_] [_]*')

  setTimeout(() => {
    // Logika menang/kalah
    // Win rate: 30%
    let isWin = Math.random() < 0.30
    
    // Simbol
    let emojis = ['🍎', '🍒', '🍋', '🔔', '💎', '🍉']
    let res = []
    if (isWin) {
      let winEmoji = emojis[Math.floor(Math.random() * emojis.length)]
      res = [winEmoji, winEmoji, winEmoji]
      
      // Hitung hadiah
      let multiplier = winEmoji === '💎' ? 3 : 2
      let reward = amount * multiplier
      
      user.money += (reward - amount) // Tambahkan profit
      dbSet(`users.${userKey}`, user)
      
      let msg = `🎰 *JACKPOT!* 🎰\n\n*[ ${res[0]} ] [ ${res[1]} ] [ ${res[2]} ]*\n\nSelamat! Kamu MENANG dan mendapatkan Rp ${reward.toLocaleString('id-ID')}!\nSaldo sekarang: Rp ${user.money.toLocaleString('id-ID')}`
      m.reply(msg)
    } else {
      // Kalah, buat kombinasi gagal
      res = [
        emojis[Math.floor(Math.random() * emojis.length)],
        emojis[Math.floor(Math.random() * emojis.length)],
        emojis[Math.floor(Math.random() * emojis.length)]
      ]
      // Pastikan tidak sama semua
      if (res[0] === res[1] && res[1] === res[2]) res[2] = '💀'
      
      user.money -= amount
      dbSet(`users.${userKey}`, user)
      
      let msg = `🎰 *ZONK!* 🎰\n\n*[ ${res[0]} ] [ ${res[1]} ] [ ${res[2]} ]*\n\nKamu KALAH! Rp ${amount.toLocaleString('id-ID')} hangus dimakan mesin.\nSaldo sekarang: Rp ${user.money.toLocaleString('id-ID')}`
      m.reply(msg)
    }
  }, 2000)
}

handler.help = ['judi <jumlah>', 'slot <jumlah>']
handler.tags = ['rpg']
handler.command = /^(judi|slot)$/i

module.exports = handler
