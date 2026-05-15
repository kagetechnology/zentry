// plugins/hidetag.js
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, text }) => {
  if (!m.isGroup) return m.reply('❌ Grup only!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(m.chat) }
  catch { return m.reply('❌ Gagal akses grup.') }

  if (!isAdmin(groupMeta, m.sender) && !m.fromMe) return m.reply('❌ Admin only!')

  const pesan = text || m.quoted?.text || m.quoted?.caption || ''
  if (!pesan) return m.reply('❌ Teks kosong!')

  await conn.sendMessage(m.chat, {
    text: pesan,
    mentions: groupMeta.participants.map(p => p.id),
  }, { quoted: m })
}

handler.command = /^(hidetag|ht|pengumuman)$/i
handler.help = ['hidetag']
handler.tags = ['group']

module.exports = handler