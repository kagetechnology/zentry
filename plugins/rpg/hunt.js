const { dbSet, pickRandom } = require('../../lib/functions')
const { initRPG } = require('../../lib/rpg')

let handler = async (m) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (user.tools.sword <= 0) {
    return m.reply('❌ Kamu tidak punya Pedang (*Sword*) atau pedangmu sudah patah!\nSilakan buat dengan perintah *.craft sword* atau beli di *.shop*.')
  }

  if (user.health < 40) {
    return m.reply('❌ Darahmu (Health) terlalu kritis untuk berburu monster! Minimal butuh 40 HP. Minum Potion dulu dengan *.heal*.')
  }

  // Cooldown 10 menit
  let lastHunt = user.lastHunt || 0
  let now = Date.now()
  let cooldown = 600000 // 10 Menit
  
  if (now - lastHunt < cooldown) {
    const { formatUptime } = require('../../lib/functions')
    let sisa = cooldown - (now - lastHunt)
    return m.reply(`⏳ Kamu masih memulihkan luka dari pertarungan terakhir.\nTunggu *${formatUptime(sisa)}* lagi.`)
  }

  const monsters = [
    { name: 'Slime', hpDamage: 5, rewardMoney: 100, rewardExp: 50, rewardItem: { item: 'daging_monster', amount: 1 }, prob: 50 },
    { name: 'Goblin', hpDamage: 15, rewardMoney: 500, rewardExp: 150, rewardItem: { item: 'daging_monster', amount: 2 }, prob: 30 },
    { name: 'Orc', hpDamage: 30, rewardMoney: 2000, rewardExp: 500, rewardItem: { item: 'besi', amount: 5 }, prob: 15 },
    { name: 'Naga Kegelapan', hpDamage: 80, rewardMoney: 20000, rewardExp: 5000, rewardItem: { item: 'berlian', amount: 1 }, prob: 5 }
  ]

  // Pick monster based on probability
  let rand = Math.random() * 100
  let sum = 0
  let monster = monsters[0]
  for (let m of monsters) {
    sum += m.prob
    if (rand <= sum) {
      monster = m
      break
    }
  }

  // Pengurangan status
  user.health -= monster.hpDamage
  user.tools.sword -= 10 // Pakai pedang kurangi durability 10%
  user.lastHunt = now

  if (user.health <= 0) {
    // Mati!
    user.health = 10 // Dihidupkan kembali dengan 10 HP
    user.money = Math.floor(user.money * 0.8) // Hilang 20% uang
    dbSet(`users.${userKey}`, user)
    return m.reply(`☠️ *KAMU TERBUNUH!* ☠️\n\nKamu berhadapan dengan *${monster.name}* dan serangan fatalnya membunuhmu!\n\nSeorang penduduk desa menemukanmu pingsan dan merawatmu.\nAkibatnya:\n💸 Uangmu hilang 20% (Sisa: Rp ${user.money.toLocaleString('id-ID')})\n❤️ Health sekarat (10/100)\n🗡️ Sword Durability: ${user.tools.sword}%`)
  }

  // Berhasil menang
  user.money += monster.rewardMoney
  user.exp += monster.rewardExp
  user.inventory[monster.rewardItem.item] += monster.rewardItem.amount

  dbSet(`users.${userKey}`, user)
  
  let durStatus = user.tools.sword <= 0 ? '\n⚠️ *Pedangmu patah!*' : `\n🗡️ Sword Durability: ${user.tools.sword}%`

  m.reply(`⚔️ *PERTARUNGAN SELESAI* ⚔️\n\nKamu berhasil membantai *${monster.name}*!\n\n*Loot:* 💰 Rp ${monster.rewardMoney.toLocaleString('id-ID')} | ✨ ${monster.rewardExp} EXP | 📦 ${monster.rewardItem.amount}x ${monster.rewardItem.item}\n\n*Kondisimu:*\n❤️ Health: -${monster.hpDamage} (Sisa: ${user.health}/100)${durStatus}`)
}

handler.help = ['hunt', 'berburu']
handler.tags = ['rpg']
handler.command = /^(hunt|berburu)$/i

module.exports = handler
