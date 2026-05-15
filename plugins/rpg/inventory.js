const { dbGet } = require('../../lib/functions')

let handler = async (m, { conn, args }) => {
  let target = m.sender
  
  // Jika user ngetag orang lain (contoh: .dompet @628xxx)
  let mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  if (mentioned.length > 0) target = mentioned[0]
  
  let targetKey = target.replace(/\./g, '_')
  
  let money = dbGet(`users.${targetKey}.money`, 0)
  let exp = dbGet(`users.${targetKey}.exp`, 0)
  let level = Math.floor(Math.sqrt(exp / 100)) + 1 // Rumus simple level
  
  let tag = `@${target.split('@')[0]}`
  
  let caption = `💼 *DOMPET & STATUS* 💼\n\n👤 Nama: ${tag}\n📊 Level: ${level}\n✨ EXP: ${exp} / ${(level * level) * 100}\n💰 Uang: Rp ${money.toLocaleString('id-ID')}`
  
  m.reply(caption)
}

handler.help = ['dompet', 'inventory', 'uang']
handler.tags = ['rpg']
handler.command = /^(dompet|inventory|uang|inv|bal|balance)$/i

module.exports = handler
