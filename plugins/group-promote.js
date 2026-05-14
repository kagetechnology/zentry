// plugins/promote.js
const { isAdmin, checkBotAdmin, getMentions, getQuotedParticipant } = require('../lib/myfunc')

let handler = async (m, { conn }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Grup only!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal akses grup.') }

  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Admin only!')
  if (!await checkBotAdmin(conn, jid)) return m.reply('❌ Bot bukan admin!')

  let targets = getMentions(m)
  if (targets.length === 0) {
    const quoted = getQuotedParticipant(m)
    if (quoted) targets = [quoted]
  }

  if (targets.length === 0) return m.reply('❌ Mention/reply target!')

  await conn.groupParticipantsUpdate(jid, targets, 'promote')
  const names = targets.map(t => `@${t.split('@')[0]}`).join(', ')
  return conn.sendMessage(jid, {
    text: `⬆️ Promote: ${names}`,
    mentions: targets,
  })
}

handler.command = /^promote$/i
handler.help = ['promote']
handler.tags = ['group']

module.exports = handler