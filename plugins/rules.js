// plugins/rules.js
const { dbGet, dbSet } = require('../lib/functions')
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, args, rawText }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Hanya bisa digunakan di dalam grup!')

  const subCmd = args[0]?.toLowerCase()

  // ── Tampilkan rules ────────────────────────────────────────
  if (!subCmd || subCmd === 'show') {
    const rules = dbGet(`groups.${jid}.rules`, null)
    if (!rules) return m.reply('❌ Belum ada rules yang diset.\n\nAdmin bisa set rules dengan:\n`.rules set <aturan>`')

    let groupMeta
    try { groupMeta = await conn.groupMetadata(jid) } catch { groupMeta = null }
    const groupName = groupMeta?.subject || 'Grup ini'

    return m.reply(`📋 *Rules ${groupName}*\n\n${rules}`)
  }

  // ── Set rules (admin only) ─────────────────────────────────
  if (subCmd === 'set') {
    let groupMeta
    try { groupMeta = await conn.groupMetadata(jid) }
    catch { return m.reply('❌ Gagal ambil data grup.') }

    if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Hanya admin yang bisa set rules!')

    const newRules = rawText.replace(/^set\s*/i, '').trim()
    if (!newRules) return m.reply('❌ Rules tidak boleh kosong!\n\nContoh:\n`.rules set 1. Dilarang spam\n2. Dilarang SARA`')

    dbSet(`groups.${jid}.rules`, newRules)
    return m.reply(`✅ Rules berhasil disimpan!\n\n📋 *Rules baru:*\n${newRules}`)
  }

  // ── Delete rules (admin only) ──────────────────────────────
  if (subCmd === 'del' || subCmd === 'delete' || subCmd === 'reset') {
    let groupMeta
    try { groupMeta = await conn.groupMetadata(jid) }
    catch { return m.reply('❌ Gagal ambil data grup.') }

    if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Hanya admin yang bisa hapus rules!')

    dbSet(`groups.${jid}.rules`, null)
    return m.reply('🗑️ Rules berhasil dihapus.')
  }

  return m.reply(
    `*📋 Rules Manager*\n\n` +
    `▸ \`.rules\` — Tampilkan rules\n` +
    `▸ \`.rules set <isi>\` — Set rules (admin)\n` +
    `▸ \`.rules del\` — Hapus rules (admin)\n\n` +
    `_Gunakan Shift+Enter untuk baris baru_`
  )
}

handler.command = /^rules$/i
handler.help    = ['rules | rules set <teks> | rules del']
handler.tags    = ['group']

module.exports = handler
