// plugins/tagall.js
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, text }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Grup only!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal akses grup.') }

  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Admin only!')

  const participants = groupMeta.participants.map(p => p.id)
  const tagText = participants.map(p => `@${p.split('@')[0]}`).join(' ')
  const msg = text?.trim() || '📢 Attention!'

  await conn.sendMessage(jid, {
    text: `┌───⊷ *TAG ALL*\n│ ${msg}\n└───${tagText ? `\n\n${tagText}` : ''}`,
    mentions: participants,
  })
}

handler.command = /^tagall$/i
handler.help = ['tagall']
handler.tags = ['group']

module.exports = handler