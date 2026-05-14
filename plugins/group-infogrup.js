// plugins/infogroup.js

let handler = async (m, { conn }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Grup only!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal akses grup.') }

  const { subject, desc, participants, creation } = groupMeta
  const total = participants.length
  const admins = participants.filter(p => p.admin)
  const members = total - admins.length
  const createdAt = creation
    ? new Date(creation * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    : '-'

  const adminList = admins.map(p => `│ @${p.id.split('@')[0]}`).join('\n')

  let txt = `┌───⊷ *INFO GRUP*\n`
  txt += `│ 🏷️ *${subject}*\n`
  txt += `│ 📅 ${createdAt}\n`
  txt += `│ 👥 ${total} (${admins.length} admin, ${members} member)\n`
  if (desc) txt += `│ 📝 ${desc.replace(/\n/g, ' ').substring(0, 80)}${desc.length > 80 ? '...' : ''}\n`
  txt += `├───────────\n`
  txt += `│ 👑 *Admin:*\n`
  txt += adminList + `\n`
  txt += `└───────────`

  await conn.sendMessage(jid, { text: txt, mentions: admins.map(p => p.id) })
}

handler.command = /^(infogroup|groupinfo|info)$/i
handler.help = ['infogroup']
handler.tags = ['group']

module.exports = handler