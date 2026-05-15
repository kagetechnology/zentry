const { dbSet } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (!user.pet.type) {
    return m.reply('❌ Kamu belum punya hewan peliharaan untuk diberi makan!\nBeli dulu menggunakan perintah *.pet*')
  }

  if (user.inventory.daging_monster < 1) {
    return m.reply('❌ Kamu tidak punya *Daging Monster* untuk memberi makan peliharaanmu!\nBerburulah menggunakan perintah *.hunt* untuk mendapatkan daging.')
  }

  // Cooldown 4 jam
  let lastFeed = user.pet.lastFeed || 0
  let now = Date.now()
  let cooldown = 14400000 // 4 Jam
  
  if (now - lastFeed < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastFeed)
    return m.reply(`⏳ Peliharaanmu masih kenyang.\nTunggu *${formatUptime(sisa)}* lagi sebelum memberi makan lagi.`)
  }

  // Beri makan
  user.inventory.daging_monster -= 1
  user.pet.lastFeed = now
  
  let expGain = Math.floor(Math.random() * 30) + 20 // 20 - 50 EXP
  user.pet.exp += expGain
  
  let levelUpMsg = ''
  let maxExp = user.pet.level * 100
  
  if (user.pet.exp >= maxExp) {
    user.pet.level += 1
    user.pet.exp -= maxExp
    levelUpMsg = `\n🌟 *LEVEL UP!* 🌟\nPeliharaanmu kini mencapai Level ${user.pet.level}!`
  }

  dbSet(`users.${userKey}`, user)
  
  m.reply(`🍖 *Nyam nyam nyam...*\n\nKamu memberikan 1 Daging Monster kepada *${user.pet.type}* milikmu.\nDia terlihat sangat senang!\n\n✨ +${expGain} Pet EXP${levelUpMsg}\n\n${getRandomTip()}`)
}

handler.help = ['feed']
handler.tags = ['rpg']
handler.command = /^(feed|kasihmakan)$/i

module.exports = handler
