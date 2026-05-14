// plugins/tagall.js
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, text }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Hanya bisa digunakan di dalam grup!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal ambil data grup.') }

  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Hanya admin yang bisa menggunakan tagall!')

  const participants = groupMeta.participants.map(p => p.id)
  const tagText = participants.map(p => `@${p.split('@')[0]}`).join(' ')
  const msg = text || '📢 Perhatian semua member!'

  await conn.sendMessage(jid, {
    text: `${msg}\n\n${tagText}`,
    mentions: participants,
  })
}

handler.command = /^tagall$/i
handler.help    = ['tagall <pesan>']
handler.tags    = ['group']

module.exports = handler
