// plugins/promote.js
const { isAdmin, checkBotAdmin, getMentions, getQuotedParticipant } = require('../lib/myfunc')

let handler = async (m, { conn }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Hanya bisa digunakan di dalam grup!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal ambil data grup.') }

  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Hanya admin yang bisa promote!')

  const botAdmin = await checkBotAdmin(conn, jid)
  if (!botAdmin) return m.reply('❌ Bot harus jadi admin grup dulu!')

  let targets = getMentions(m)
  if (targets.length === 0) {
    const quoted = getQuotedParticipant(m)
    if (quoted) targets = [quoted]
  }

  if (targets.length === 0) {
    return m.reply('❌ Mention atau reply pesan member yang ingin di-promote!')
  }

  await conn.groupParticipantsUpdate(jid, targets, 'promote')
  const names = targets.map(t => `@${t.split('@')[0]}`).join(', ')
  return conn.sendMessage(jid, {
    text: `⬆️ Berhasil promote *${targets.length}* member menjadi admin!\n${names}`,
    mentions: targets,
  })
}

handler.command = /^promote$/i
handler.help    = ['promote @user']
handler.tags    = ['group']

module.exports = handler
