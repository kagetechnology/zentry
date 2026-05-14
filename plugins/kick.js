// plugins/kick.js
const { isAdmin, checkBotAdmin, getMentions, getQuotedParticipant } = require('../lib/myfunc')
const { jidNormalizedUser } = require('@whiskeysockets/baileys')

let handler = async (m, { conn }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Hanya bisa digunakan di dalam grup!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal ambil data grup.') }

  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Hanya admin yang bisa kick!')

  const botAdmin = await checkBotAdmin(conn, jid)
  if (!botAdmin) return m.reply('❌ Bot harus jadi admin grup dulu!')

  // Target dari mention atau quoted message
  let targets = getMentions(m)
  if (targets.length === 0) {
    const quoted = getQuotedParticipant(m)
    if (quoted) targets = [quoted]
  }

  if (targets.length === 0) {
    return m.reply(
      '❌ Mention atau reply pesan member yang ingin di-kick!\n\n' +
      'Contoh: `.kick @nama` atau reply pesan seseorang'
    )
  }

  // Tidak bisa kick admin
  const adminsList = groupMeta.participants
    .filter(p => p.admin)
    .map(p => jidNormalizedUser(p.id))

  const valid   = targets.filter(t => !adminsList.includes(jidNormalizedUser(t)))
  const skipped = targets.length - valid.length

  if (valid.length === 0) {
    return m.reply('❌ Tidak bisa kick admin!')
  }

  await conn.groupParticipantsUpdate(jid, valid, 'remove')

  let reply = `✅ Berhasil kick *${valid.length}* member!`
  if (skipped > 0) reply += `\n⚠️ ${skipped} admin dilewati.`
  return m.reply(reply)
}

handler.command = /^kick$/i
handler.help    = ['kick @user']
handler.tags    = ['group']

module.exports = handler
