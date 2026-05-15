const { dbSet } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m, { args, prefix, command }) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (args.length === 0 || args.length < 1) {
    return m.reply(`🏦 *BANK ZENTRY* 🏦\n\nSelamat datang di Bank Zentry. Uang yang disimpan di sini aman dari pencuri (.rob)!\n\n*Saldo Bank:* Rp ${user.bank.toLocaleString('id-ID')}\n*Uang Tunai:* Rp ${user.money.toLocaleString('id-ID')}\n\n*Perintah yang tersedia:*\n- *${prefix}${command} deposit <jumlah>* (Menabung)\n- *${prefix}${command} withdraw <jumlah>* (Menarik tunai)\n\nCatatan: Bisa gunakan 'all' untuk jumlah.`)
  }

  let action = args[0].toLowerCase()
  let amountStr = args[1] ? args[1].toLowerCase() : ''
  let amount = parseInt(amountStr)

  if (!['deposit', 'withdraw', 'tarik', 'simpan', 'depo', 'wd'].includes(action)) {
    return m.reply(`❌ Perintah tidak valid. Gunakan *deposit* atau *withdraw*.`)
  }

  if (amountStr === 'all') {
    if (['deposit', 'simpan', 'depo'].includes(action)) {
      amount = user.money
    } else {
      amount = user.bank
    }
  }

  if (isNaN(amount) || amount <= 0) {
    return m.reply(`❌ Jumlah uang tidak valid!`)
  }

  // Aksi Deposit / Menabung
  if (['deposit', 'simpan', 'depo'].includes(action)) {
    if (user.money < amount) {
      return m.reply(`❌ Uang tunaimu tidak cukup! Kamu hanya punya Rp ${user.money.toLocaleString('id-ID')}`)
    }
    user.money -= amount
    user.bank += amount
    dbSet(`users.${userKey}`, user)
    return m.reply(`🏦 *DEPOSIT BERHASIL* 🏦\n\nKamu menyetorkan 💰 Rp ${amount.toLocaleString('id-ID')} ke dalam Bank.\n\n*Saldo Bank:* Rp ${user.bank.toLocaleString('id-ID')}\n*Sisa Uang Tunai:* Rp ${user.money.toLocaleString('id-ID')}\n\n${getRandomTip()}`)
  }

  // Aksi Withdraw / Menarik
  if (['withdraw', 'tarik', 'wd'].includes(action)) {
    if (user.bank < amount) {
      return m.reply(`❌ Saldo Bank tidak cukup! Tabunganmu hanya Rp ${user.bank.toLocaleString('id-ID')}`)
    }
    user.bank -= amount
    user.money += amount
    dbSet(`users.${userKey}`, user)
    return m.reply(`🏦 *WITHDRAW BERHASIL* 🏦\n\nKamu menarik 💰 Rp ${amount.toLocaleString('id-ID')} dari Bank.\n\n*Sisa Saldo Bank:* Rp ${user.bank.toLocaleString('id-ID')}\n*Uang Tunai Sekarang:* Rp ${user.money.toLocaleString('id-ID')}\n\n${getRandomTip()}`)
  }
}

handler.help = ['bank', 'deposit <jml>', 'withdraw <jml>']
handler.tags = ['rpg']
handler.command = /^(bank|atm|deposit|depo|withdraw|wd)$/i

module.exports = handler
