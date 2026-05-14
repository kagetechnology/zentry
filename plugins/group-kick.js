// plugins/kick.js
const { isAdmin, checkBotAdmin, getMentions, getQuotedParticipant } = require('../lib/myfunc')
const { jidNormalizedUser } = require('@whiskeysockets/baileys')

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

  const admins = groupMeta.participants
    .filter(p => p.admin)
    .map(p => jidNormalizedUser(p.id))

  const valid = targets.filter(t => !admins.includes(jidNormalizedUser(t)))
  const skipped = targets.length - valid.length

  if (valid.length === 0) return m.reply('❌ Tidak bisa kick admin!')

  await conn.groupParticipantsUpdate(jid, valid, 'remove')

  let reply = `👢 Kick: ${valid.length} member`
  if (skipped > 0) reply += ` (${skipped} admin dilewati)`
  return m.reply(reply)
}

handler.command = /^kick$/i
handler.help = ['kick']
handler.tags = ['group']

module.exports = handler