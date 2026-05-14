// plugins/antilink.js
const { dbGet, dbSet } = require('../lib/functions')
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, args }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Hanya bisa digunakan di dalam grup!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal ambil data grup.') }

  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Hanya admin yang bisa mengatur antilink!')

  const subCmd = args[0]?.toLowerCase()
  const groupKey = `groups.${jid}.antilink`

  // ── Help ──────────────────────────────────────────────────
  if (!subCmd || !['on', 'off', 'action', 'show'].includes(subCmd)) {
    const enabled = dbGet(`${groupKey}.enabled`, false)
    const action  = dbGet(`${groupKey}.action`, 'delete')
    return m.reply(
      `*🔗 Anti-Link*\n` +
      `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n` +
      `Aksi: ${action}\n\n` +
      `*Pengaturan:*\n` +
      `▸ \`.antilink on\` — Aktifkan\n` +
      `▸ \`.antilink off\` — Nonaktifkan\n` +
      `▸ \`.antilink action delete\` — Hanya hapus pesan\n` +
      `▸ \`.antilink action warn\` — Hapus + beri warn\n` +
      `▸ \`.antilink action kick\` — Hapus + langsung kick\n` +
      `▸ \`.antilink show\` — Lihat status\n\n` +
      `_Admin grup tidak terkena antilink_`
    )
  }

  if (subCmd === 'on') {
    dbSet(`${groupKey}.enabled`, true)
    return m.reply('✅ Anti-link *diaktifkan*!')
  }

  if (subCmd === 'off') {
    dbSet(`${groupKey}.enabled`, false)
    return m.reply('🔕 Anti-link *dinonaktifkan*.')
  }

  if (subCmd === 'action') {
    const act = args[1]?.toLowerCase()
    if (!['delete', 'warn', 'kick'].includes(act)) {
      return m.reply('❌ Aksi tidak valid! Pilih: `delete`, `warn`, atau `kick`')
    }
    dbSet(`${groupKey}.action`, act)
    return m.reply(`✅ Aksi antilink diubah ke: *${act}*`)
  }

  if (subCmd === 'show') {
    const enabled = dbGet(`${groupKey}.enabled`, false)
    const action  = dbGet(`${groupKey}.action`, 'delete')
    return m.reply(
      `*🔗 Anti-Link Status*\n` +
      `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n` +
      `Aksi: *${action}*`
    )
  }
}

handler.command = /^antilink$/i
handler.help    = ['antilink on/off/action/show']
handler.tags    = ['group']

module.exports = handler
