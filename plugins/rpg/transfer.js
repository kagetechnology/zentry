const { dbGet, dbSet } = require('../../lib/functions')

let handler = async (m, { args, prefix, command }) => {
  let mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  if (mentioned.length === 0 || args.length < 2) {
    return m.reply(`Format salah!\n\nCara penggunaan:\n\`${prefix}${command} @user jumlah\`\n\nContoh:\n\`${prefix}${command} @628xxx 5000\``)
  }

  let target = mentioned[0]
  let amountStr = args.find(a => !a.startsWith('@'))
  let amount = parseInt(amountStr)

  if (isNaN(amount) || amount <= 0) {
    return m.reply('❌ Jumlah uang yang ditransfer harus berupa angka valid dan lebih dari 0!')
  }

  if (target === m.sender) {
    return m.reply('❌ Kamu tidak bisa transfer uang ke diri sendiri!')
  }

  let senderKey = m.sender.replace(/\./g, '_')
  let targetKey = target.replace(/\./g, '_')

  let senderMoney = dbGet(`users.${senderKey}.money`, 0)
  
  if (senderMoney < amount) {
    return m.reply(`❌ Uangmu tidak cukup untuk melakukan transfer ini.\nUangmu saat ini: Rp ${senderMoney.toLocaleString('id-ID')}`)
  }

  let targetMoney = dbGet(`users.${targetKey}.money`, 0)

  // Proses potong saldo sender & tambah saldo target
  dbSet(`users.${senderKey}.money`, senderMoney - amount)
  dbSet(`users.${targetKey}.money`, targetMoney + amount)

  m.reply(`💸 *TRANSFER BERHASIL*\n\nKamu berhasil mentransfer uang sebesar *Rp ${amount.toLocaleString('id-ID')}* ke @${target.split('@')[0]}!`)
}

handler.help = ['transfer @user <jumlah>']
handler.tags = ['rpg']
handler.command = /^(transfer|tf)$/i

module.exports = handler
