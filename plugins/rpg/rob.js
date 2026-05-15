const { dbSet } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m, { args, prefix, command }) => {
  let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
  
  if (!target) {
    return m.reply(`❌ Tag target yang ingin kamu curi!\nContoh: *${prefix}${command} @628xxx*`)
  }

  if (target === m.sender) {
    return m.reply('❌ Masa mencuri uang sendiri?')
  }

  let userKey = m.sender.replace(/\./g, '_')
  let targetKey = target.replace(/\./g, '_')

  let user = initRPG(userKey)
  let targetUser = initRPG(targetKey)

  if (user.stamina < 20) {
    return m.reply('❌ Stamina kamu tidak cukup untuk lari dari kejaran warga! Butuh minimal 20 Stamina.')
  }

  if (user.money < 1000) {
    return m.reply('❌ Modalmu terlalu kecil! Butuh minimal Rp 1.000 untuk bayar denda kalau ketahuan warga.')
  }

  if (targetUser.money < 500) {
    return m.reply(`❌ Target terlalu miskin (Hanya punya Rp ${targetUser.money}). Cari mangsa lain yang lebih kaya!`)
  }

  // Cooldown 30 menit
  let lastRob = user.lastRob || 0
  let now = Date.now()
  let cooldown = 1800000 // 30 Menit
  
  if (now - lastRob < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastRob)
    return m.reply(`⏳ Kamu sedang dalam radar polisi!\nSembunyi dulu selama *${formatUptime(sisa)}* sebelum mencuri lagi.`)
  }

  // Pengurangan stamina
  user.stamina -= 20
  user.lastRob = now

  // Probabilitas menang 40%
  let isSuccess = Math.random() < 0.40

  if (isSuccess) {
    // Berhasil mencuri 10% - 20% uang target
    let percentage = (Math.floor(Math.random() * 10) + 10) / 100 // 0.1 - 0.2
    let stolenAmount = Math.floor(targetUser.money * percentage)
    
    if (stolenAmount < 1) stolenAmount = 1

    user.money += stolenAmount
    targetUser.money -= stolenAmount

    dbSet(`users.${userKey}`, user)
    dbSet(`users.${targetKey}`, targetUser)

    m.reply(`🥷 *PENCIKUT BERHASIL* 🥷\n\nKamu mengendap-endap dan berhasil merogoh saku @${target.split('@')[0]}!\nKamu mendapatkan 💰 Rp ${stolenAmount.toLocaleString('id-ID')}!\n\n⚡ -20 Stamina\nSaldo sekarang: Rp ${user.money.toLocaleString('id-ID')}\n\n${getRandomTip()}`, null, { mentions: [target] })
  } else {
    // Gagal, denda 10% - 20% uang robber
    let percentage = (Math.floor(Math.random() * 10) + 10) / 100
    let fineAmount = Math.floor(user.money * percentage)
    
    if (fineAmount < 1) fineAmount = 1

    user.money -= fineAmount
    // Uang denda diberikan ke target sebagai kompensasi
    targetUser.money += fineAmount

    user.health -= 10 // Dipukuli warga

    dbSet(`users.${userKey}`, user)
    dbSet(`users.${targetKey}`, targetUser)

    m.reply(`🚨 *TERTANGKAP BASAH!* 🚨\n\nKamu ketahuan saat mencoba mencuri dari @${target.split('@')[0]}!\nWarga memukulimu dan polisi menyita uangmu sebagai denda.\n\n💸 Denda: Rp ${fineAmount.toLocaleString('id-ID')}\n❤️ -10 Health\n⚡ -20 Stamina\n\nUang denda telah diberikan kepada korban sebagai kompensasi.`, null, { mentions: [target] })
  }
}

handler.help = ['rob @user', 'curi @user']
handler.tags = ['rpg']
handler.command = /^(rob|curi|mencuri)$/i

module.exports = handler
