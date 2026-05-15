const { dbSet } = require('../../lib/functions')
const { initRPG } = require('../../lib/rpg')

const sellPrices = {
  kayu: 10,
  batu: 20,
  besi: 100,
  emas: 1000,
  berlian: 10000,
  lele: 50,
  nila: 150,
  koi: 800,
  hiu: 5000,
  daging_monster: 500
}

let handler = async (m, { args, prefix, command }) => {
  if (args.length === 0) {
    return m.reply(`Gunakan format: *${prefix}${command} <item> <jumlah>*\nContoh: *${prefix}${command} batu 50*\n\nLihat daftar barang di *.shop*`)
  }

  let item = args[0].toLowerCase()
  let amount = parseInt(args[1])
  
  if (args[1] && args[1].toLowerCase() === 'all') amount = 'all'
  else if (!amount || amount < 1) amount = 1

  if (!sellPrices[item]) {
    return m.reply(`❌ Barang *${item}* tidak bisa dijual ke toko! Cek *.shop*`)
  }

  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)
  
  if (amount === 'all') {
    amount = user.inventory[item]
  }

  if (amount < 1) return m.reply(`❌ Kamu tidak memiliki *${item}* satupun di dalam tas!`)
  
  if (user.inventory[item] < amount) {
    return m.reply(`❌ Jumlah *${item}* di tasmu tidak mencukupi! Kamu hanya memiliki ${user.inventory[item]}x.`)
  }

  // Proses penjualan
  let totalIncome = sellPrices[item] * amount
  user.inventory[item] -= amount
  user.money += totalIncome
  
  dbSet(`users.${userKey}`, user)
  
  m.reply(`💸 *PENJUALAN BERHASIL*\n\nKamu menjual *${amount}x ${item}*\nPendapatan: 💰 Rp ${totalIncome.toLocaleString('id-ID')}\nSaldo sekarang: Rp ${user.money.toLocaleString('id-ID')}`)
}

handler.help = ['sell <item> <jumlah|all>']
handler.tags = ['rpg']
handler.command = /^(sell|jual)$/i

module.exports = handler
