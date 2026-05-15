const { dbSet } = require('../../lib/functions')

let handler = async (m, { text }) => {
  let userKey = m.sender.replace(/\./g, '_')
  let reason = text || 'Tanpa alasan'
  
  dbSet(`users.${userKey}.afk.time`, Date.now())
  dbSet(`users.${userKey}.afk.reason`, reason)
  
  m.reply(`💤 *Kamu sekarang AFK!*\n\nAlasan: ${reason}`)
}

handler.help = ['afk <alasan>']
handler.tags = ['main']
handler.command = /^afk$/i

module.exports = handler
