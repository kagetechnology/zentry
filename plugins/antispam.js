// plugins/antispam.js
const { dbGet, dbSet } = require('../lib/functions')
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, args }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Hanya bisa digunakan di dalam grup!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal ambil data grup.') }

  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Hanya admin yang bisa mengatur antispam!')

  const subCmd = args[0]?.toLowerCase()
  const groupKey = `groups.${jid}.antispam`

  if (!subCmd || !['on', 'off', 'action', 'show'].includes(subCmd)) {
    const enabled = dbGet(`${groupKey}.enabled`, false)
    const action  = dbGet(`${groupKey}.action`, 'warn')
    const limit   = dbGet(`${groupKey}.limit`, 5)
    return m.reply(
      `*🛡️ Anti-Spam*\n` +
      `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n` +
      `Aksi: ${action}\n` +
      `Batas: ${limit} pesan/5 detik\n\n` +
      `*Pengaturan:*\n` +
      `▸ \`.antispam on\` — Aktifkan\n` +
      `▸ \`.antispam off\` — Nonaktifkan\n` +
      `▸ \`.antispam action warn\` — Beri peringatan\n` +
      `▸ \`.antispam action kick\` — Langsung kick\n` +
      `▸ \`.antispam show\` — Lihat status\n\n` +
      `_Admin tidak terkena antispam_`
    )
  }

  if (subCmd === 'on') {
    dbSet(`${groupKey}.enabled`, true)
    return m.reply('✅ Anti-spam *diaktifkan*!')
  }

  if (subCmd === 'off') {
    dbSet(`${groupKey}.enabled`, false)
    return m.reply('🔕 Anti-spam *dinonaktifkan*.')
  }

  if (subCmd === 'action') {
    const act = args[1]?.toLowerCase()
    if (!['warn', 'kick'].includes(act)) {
      return m.reply('❌ Aksi tidak valid! Pilih: `warn` atau `kick`')
    }
    dbSet(`${groupKey}.action`, act)
    return m.reply(`✅ Aksi antispam diubah ke: *${act}*`)
  }

  if (subCmd === 'show') {
    const enabled = dbGet(`${groupKey}.enabled`, false)
    const action  = dbGet(`${groupKey}.action`, 'warn')
    const limit   = dbGet(`${groupKey}.limit`, 5)
    return m.reply(
      `*🛡️ Anti-Spam Status*\n` +
      `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n` +
      `Aksi: *${action}*\n` +
      `Batas: ${limit} pesan/5 detik`
    )
  }
}

handler.command = /^antispam$/i
handler.help    = ['antispam on/off/action/show']
handler.tags    = ['group']

module.exports = handler
