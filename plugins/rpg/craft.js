const { dbSet } = require('../../lib/functions')
const { initRPG } = require('../../lib/rpg')

const recipes = {
  pickaxe: { kayu: 50, batu: 20, besi: 5 },
  fishingrod: { kayu: 20, besi: 10 },
  sword: { kayu: 10, besi: 20, emas: 2 }
}

let handler = async (m, { args, prefix, command }) => {
  if (args.length === 0) {
    let caption = `🔨 *SISTEM PERAKITAN (CRAFTING)* 🔨

Rakitan yang tersedia:
⛏️ *Pickaxe* (Beliung)
   Bahan: 50 Kayu, 20 Batu, 5 Besi

🎣 *Fishing Rod* (Alat Pancing)
   Bahan: 20 Kayu, 10 Besi

🗡️ *Sword* (Pedang)
   Bahan: 10 Kayu, 20 Besi, 2 Emas

Gunakan perintah: *${prefix}${command} <nama_alat>*
Contoh: *${prefix}${command} sword*`
    return m.reply(caption)
  }

  let item = args[0].toLowerCase()
  if (!recipes[item]) return m.reply(`❌ Alat *${item}* tidak dapat dirakit!\nLihat daftar rakitan dengan *${prefix}${command}*`)

  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  let req = recipes[item]
  
  // Cek bahan
  let missing = []
  for (let material in req) {
    if (user.inventory[material] < req[material]) {
      missing.push(`${req[material] - user.inventory[material]}x ${material}`)
    }
  }

  if (missing.length > 0) {
    return m.reply(`❌ Bahan tidak cukup untuk membuat *${item}*!\n\nKekurangan:\n- ${missing.join('\n- ')}`)
  }

  // Kurangi bahan
  for (let material in req) {
    user.inventory[material] -= req[material]
  }

  // Tambahkan alat
  user.tools[item] = 100 // Durability penuh
  
  dbSet(`users.${userKey}`, user)
  
  m.reply(`🎉 *CRAFTING BERHASIL!* 🎉\n\nKamu mengayunkan palu dan berhasil merakit *${item}* baru dengan durabilitas 100%!\nBarang sudah dimasukkan ke dalam profilmu.`)
}

handler.help = ['craft <alat>']
handler.tags = ['rpg']
handler.command = /^(craft|rakit)$/i

module.exports = handler
