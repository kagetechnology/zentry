// plugins/infogroup.js

let handler = async (m, { conn }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Hanya bisa digunakan di dalam grup!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal ambil data grup.') }

  const { subject, desc, participants, creation, owner } = groupMeta

  const total     = participants.length
  const admins    = participants.filter(p => p.admin)
  const members   = total - admins.length
  const createdAt = creation
    ? new Date(creation * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    : 'Tidak diketahui'

  const adminList = admins
    .map(p => `  • @${p.id.split('@')[0]}`)
    .join('\n')

  let text =
    `*📊 Info Grup*\n\n` +
    `🏷️ Nama: *${subject}*\n` +
    `🆔 ID: \`${jid}\`\n` +
    `📅 Dibuat: ${createdAt}\n` +
    `👥 Total member: *${total}*\n` +
    `  └ Admin: ${admins.length} | Member: ${members}\n\n`

  if (desc) text += `📝 *Deskripsi:*\n${desc}\n\n`

  text += `👑 *Admin:*\n${adminList}`

  await conn.sendMessage(jid, {
    text,
    mentions: admins.map(p => p.id),
  })
}

handler.command = /^(infogroup|groupinfo|info)$/i
handler.help    = ['infogroup']
handler.tags    = ['group']

module.exports = handler
