const { dbRead } = require('../../lib/functions')

let handler = async (m, { args, prefix, command }) => {
  let db = dbRead()
  let users = db.users || {}

  // Filter valid users
  let players = Object.entries(users).map(([key, data]) => {
    let money = typeof data.money === 'number' ? data.money : 0
    let bank = typeof data.bank === 'number' ? data.bank : 0
    let level = typeof data.level === 'number' ? data.level : 0
    return {
      jid: key.replace(/_/g, '.'),
      money: money,
      bank: bank,
      totalWealth: money + bank,
      level: level
    }
  })

  if (players.length === 0) {
    return m.reply('❌ Belum ada pemain yang terdaftar dalam sistem RPG.')
  }

  let type = (args[0] || '').toLowerCase()

  if (type === 'level') {
    // Sort by level
    players.sort((a, b) => b.level - a.level)
    let top = players.slice(0, 10)
    let txt = `🏆 *TOP 10 LEVEL TERTINGGI* 🏆\n\n`
    top.forEach((p, i) => {
      let isMe = p.jid === m.sender ? ' *(Kamu)*' : ''
      txt += `${i + 1}. @${p.jid.split('@')[0]}${isMe}\n   📊 Level: ${p.level}\n`
    })
    return m.reply(txt.trim(), null, { mentions: top.map(p => p.jid) })
  }

  // Default sort by wealth
  players.sort((a, b) => b.totalWealth - a.totalWealth)
  let top = players.slice(0, 10)
  let txt = `🏆 *TOP 10 SULTAN TERKAYA* 🏆\n\n`
  top.forEach((p, i) => {
    let isMe = p.jid === m.sender ? ' *(Kamu)*' : ''
    txt += `${i + 1}. @${p.jid.split('@')[0]}${isMe}\n   💰 Total Kekayaan: Rp ${p.totalWealth.toLocaleString('id-ID')}\n`
  })
  
  txt += `\n*Ketik ${prefix}${command} level* untuk melihat peringkat level tertinggi.`
  
  m.reply(txt.trim(), null, { mentions: top.map(p => p.jid) })
}

handler.help = ['top', 'leaderboard']
handler.tags = ['rpg']
handler.command = /^(top|leaderboard|lb)$/i

module.exports = handler
