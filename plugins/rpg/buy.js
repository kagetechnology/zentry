const { dbSet } = require('../../lib/functions')
const { initRPG } = require('../../lib/rpg')

const priceList = {
  potion: 100,
  pickaxe: 2000,
  fishingrod: 1500,
  sword: 5000
}

let handler = async (m, { args, prefix, command }) => {
  if (args.length === 0) {
    return m.reply(`Gunakan format: *${prefix}${command} <item> <jumlah>*\nContoh: *${prefix}${command} potion 5*\n\nLihat daftar barang di *.shop*`)
  }

  let item = args[0].toLowerCase()
  let amount = parseInt(args[1]) || 1

  if (!priceList[item]) {
    return m.reply(`❌ Barang *${item}* tidak dijual di toko! Cek *.shop*`)
  }
  
  if (amount < 1) return m.reply('❌ Jumlah tidak valid!')

  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)
  
  let totalCost = priceList[item] * amount

  if (user.money < totalCost) {
    return m.reply(`❌ Uangmu tidak cukup! Harga ${amount}x ${item} adalah Rp ${totalCost.toLocaleString('id-ID')}.\nUangmu: Rp ${user.money.toLocaleString('id-ID')}`)
  }

  // Proses pembelian
  user.money -= totalCost
  
  if (['pickaxe', 'fishingrod', 'sword'].includes(item)) {
    // Alat langsung mengisi durability jadi 100
    // Asumsi hanya bisa beli 1 kali jika rusak, tapi kalau beli banyak, durability max 100
    user.tools[item] = 100
    dbSet(`users.${userKey}`, user)
    return m.reply(`✅ Berhasil membeli *${item}* seharga Rp ${totalCost.toLocaleString('id-ID')}!\nDurability sekarang: 100%`)
  } else {
    // Item tumpuk
    user.inventory[item] += amount
    dbSet(`users.${userKey}`, user)
    return m.reply(`✅ Berhasil membeli *${amount}x ${item}* seharga Rp ${totalCost.toLocaleString('id-ID')}!`)
  }
}

handler.help = ['buy <item> <jumlah>']
handler.tags = ['rpg']
handler.command = /^(buy|beli)$/i

module.exports = handler
