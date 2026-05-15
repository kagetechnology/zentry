const { dbSet } = require('../../lib/functions')
const { initRPG } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (user.health >= 100) {
    return m.reply('❌ Darahmu (Health) sudah penuh (100)! Tidak perlu minum Potion.')
  }

  if (user.inventory.potion < 1) {
    return m.reply('❌ Kamu tidak punya Potion di tasmu!\nBeli Potion di toko dengan perintah *.buy potion 1*')
  }

  // Konsumsi potion
  user.inventory.potion -= 1
  user.health += 30
  
  if (user.health > 100) user.health = 100
  
  // Kasih bonus stamina sedikit
  user.stamina += 10
  if (user.stamina > 100) user.stamina = 100

  dbSet(`users.${userKey}`, user)
  
  m.reply(`🧪 *GLUP GLUP GLUP...*\n\nKamu meminum sebuah Potion ajaib!\n\n❤️ Health: +30 (Sekarang: ${user.health}/100)\n⚡ Stamina: +10 (Sekarang: ${user.stamina}/100)\n\nSisa Potion di tas: ${user.inventory.potion}x`)
}

handler.help = ['heal']
handler.tags = ['rpg']
handler.command = /^(heal)$/i

module.exports = handler
