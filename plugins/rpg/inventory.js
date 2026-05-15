const { initRPG } = require('../../lib/rpg')

let handler = async (m, { conn, args }) => {
  let target = m.sender
  
  let mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  if (mentioned.length > 0) target = mentioned[0]
  
  let targetKey = target.replace(/\./g, '_')
  
  // Inisialisasi/Ambil data
  let user = initRPG(targetKey)
  
  let money = user.money
  let exp = user.exp
  let level = Math.floor(Math.sqrt(exp / 100)) + 1
  let health = user.health
  let stamina = user.stamina
  
  let tag = `@${target.split('@')[0]}`
  
  // Visualisasi Bar
  const renderBar = (val, max = 100, icon = '❤️', empty = '🖤') => {
    let fill = Math.round((val / max) * 10)
    if (fill < 0) fill = 0
    if (fill > 10) fill = 10
    return icon.repeat(fill) + empty.repeat(10 - fill)
  }

  let hpBar = renderBar(health, 100, '❤️', '🖤')
  let spBar = renderBar(stamina, 100, '⚡', '☁️')

  // Tools status
  const toolStatus = (val) => val > 0 ? `${val}%` : '❌ Rusak/Tidak Punya'

  let bank = user.bank || 0
  let petStr = user?.pet?.type ? `${user.pet.type} (Lv.${user.pet.level})` : 'Tidak Punya'
  let guildStr = user?.guild ? user.guild : 'Tidak Bergabung'
  
  let caption = `
💼 *PROFIL & INVENTORI* 💼
👤 Nama: ${tag}
📊 Level: ${level}
✨ EXP: ${exp} / ${(level * level) * 100}
💰 Uang (Tangan): Rp ${money.toLocaleString('id-ID')}
🏦 Uang (Bank): Rp ${bank.toLocaleString('id-ID')}

🏰 Guild: ${guildStr}
🐾 Pet: ${petStr}

❤️ *Health:* ${health}/100
${hpBar}
⚡ *Stamina:* ${stamina}/100
${spBar}

🛠️ *ALAT (TOOLS)*
⛏️ Pickaxe: ${toolStatus(user.tools.pickaxe)}
🎣 Fishing Rod: ${toolStatus(user.tools.fishingrod)}
🗡️ Sword: ${toolStatus(user.tools.sword)}

🎒 *ISI TAS (INVENTORY)*
*Konsumsi:* 🧪 Potion: ${user.inventory.potion} | 🥩 Daging: ${user.inventory.daging_monster} | 🐛 Cacing: ${user.inventory.cacing}
*Material:* 🪵 Kayu: ${user.inventory.kayu} | 🪨 Batu: ${user.inventory.batu} | ⛓️ Besi: ${user.inventory.besi}
*Berharga:* 🪙 Emas: ${user.inventory.emas} | 💎 Berlian: ${user.inventory.berlian}
*Hasil Pancing:* 🐟 Lele: ${user.inventory.lele} | 🐠 Nila: ${user.inventory.nila} | 🎏 Koi: ${user.inventory.koi} | 🦈 Hiu: ${user.inventory.hiu}

🗑️ *BARANG RONGSOKAN*
📦 Kardus: ${user.inventory.kardus} | 🥫 Kaleng: ${user.inventory.kaleng} | 🍾 Botol: ${user.inventory.botol}
`.trim()
  
  m.reply(caption, null, { mentions: [target] })
}

handler.help = ['dompet', 'inventory', 'uang', 'inv']
handler.tags = ['rpg']
handler.command = /^(dompet|inventory|uang|inv|bal|balance)$/i

module.exports = handler
