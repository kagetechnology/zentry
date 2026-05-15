// plugins/mute.js
const { dbGet, dbSet } = require('../lib/functions')
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, args }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Grup only!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal akses grup.') }

  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Admin only!')

  const isMuted = dbGet(`groups.${jid}.settings.muted`, false)
  const subCmd = args[0]?.toLowerCase() || 'toggle'

  if (subCmd === 'on' || subCmd === 'mute' || (!isMuted && subCmd === 'toggle')) {
    dbSet(`groups.${jid}.settings.muted`, true)
    return m.reply('🔇 Bot *muted*')
  }

  dbSet(`groups.${jid}.settings.muted`, false)
  return m.reply('🔊 Bot *unmuted*')
}

handler.command = /^(mute|unmute)$/i
handler.help = ['mute', 'unmute']
handler.tags = ['group']

module.exports = handler