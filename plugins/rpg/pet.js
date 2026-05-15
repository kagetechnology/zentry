const { dbSet } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m, { args, prefix, command }) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (args.length === 0) {
    let petStatus = user?.pet?.type 
      ? `🐾 *Peliharaanmu:* ${user.pet.type} (Lv. ${user.pet.level})\n✨ *EXP:* ${user.pet.exp} / ${(user.pet.level * 100)}\n\nGunakan *${prefix}feed* untuk memberi makan Daging Monster.`
      : `❌ Kamu belum punya hewan peliharaan.\n\n*Beli Telur Pet:*\n🐈 Kucing : Rp 50.000\n🦊 Rubah : Rp 100.000\n🐉 Naga : Rp 500.000\n\nKetik *${prefix}${command} <jenis>* untuk membeli.`
    
    return m.reply(`🐾 *PET SYSTEM* 🐾\n\n${petStatus}`)
  }

  let action = args[0].toLowerCase()

  // Beli Pet
  if (['kucing', 'rubah', 'naga'].includes(action)) {
    if (user.pet.type) {
      return m.reply(`❌ Kamu sudah punya peliharaan *${user.pet.type}*!\nSatu orang hanya boleh punya satu peliharaan.`)
    }

    let harga = action === 'naga' ? 500000 : action === 'rubah' ? 100000 : 50000
    
    if (user.money < harga) {
      return m.reply(`❌ Uang tunaimu tidak cukup untuk membeli telur *${action}* (Rp ${harga.toLocaleString('id-ID')}).`)
    }

    user.money -= harga
    user.pet = {
      type: action.charAt(0).toUpperCase() + action.slice(1),
      level: 1,
      exp: 0,
      lastFeed: 0
    }
    
    dbSet(`users.${userKey}`, user)
    return m.reply(`🎉 *SELAMAT!* 🎉\n\nTelur peliharaanmu menetas menjadi **${user.pet.type}** yang lucu!\nBerikan dia Daging Monster secara rutin dengan perintah *${prefix}feed* agar dia tumbuh besar.\n\nSaldo sekarang: Rp ${user.money.toLocaleString('id-ID')}`)
  }

  return m.reply(`❌ Jenis pet tidak ditemukan! Pilih antara: Kucing, Rubah, atau Naga.`)
}

handler.help = ['pet', 'buypet']
handler.tags = ['rpg']
handler.command = /^(pet|buypet)$/i

module.exports = handler
