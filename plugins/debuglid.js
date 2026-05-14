// plugins/debuglid.js
let handler = async (m, { conn }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('Hanya di grup')

  const raw = JSON.stringify(m, null, 2)
  return m.reply(`*RAW MESSAGE:*\n${raw.slice(0, 1500)}`)
}

handler.command = /^debuglid$/i
handler.tags = ['owner']

module.exports = handler
