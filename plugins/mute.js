// plugins/mute.js
const { dbGet, dbSet } = require('../lib/functions')
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, args }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Hanya bisa digunakan di dalam grup!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal ambil data grup.') }

  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Hanya admin yang bisa mute/unmute bot!')

  const subCmd = args[0]?.toLowerCase() || 'toggle'
  const isMuted = dbGet(`groups.${jid}.settings.muted`, false)

  if (subCmd === 'on' || subCmd === 'mute' || (!isMuted && subCmd === 'toggle')) {
    dbSet(`groups.${jid}.settings.muted`, true)
    return m.reply('🔇 Bot di-*mute*! Semua command tidak akan diproses di grup ini.\n\nKetik `.unmute` untuk mengaktifkan kembali.')
  }

  dbSet(`groups.${jid}.settings.muted`, false)
  return m.reply('🔊 Bot di-*unmute*! Bot kembali aktif di grup ini.')
}

handler.command = /^(mute|unmute)$/i
handler.help    = ['mute', 'unmute']
handler.tags    = ['group']

module.exports = handler
