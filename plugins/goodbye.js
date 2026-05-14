// plugins/goodbye.js

const { dbGet, dbSet } = require('../lib/functions')

const DEFAULT_GOODBYE = '👋 Sampai jumpa @username!\nTerima kasih sudah bersama kami di *@grub* 🙏'

const TAG_LIST =
  `*Tag yang tersedia:*\n` +
  `▸ \`@tag\` — Mention member (contoh: @628xxx)\n` +
  `▸ \`@username\` — Nama member\n` +
  `▸ \`@number\` — Nomor HP member\n` +
  `▸ \`@grub\` — Nama grup`

let handler = async (m, { args }) => {
  const jid = m.chat

  if (!m.isGroup) {
    return m.reply('❌ Command ini hanya bisa digunakan di dalam grup!')
  }

  const subCmd   = args[0]?.toLowerCase()
  const groupKey = `groups.${jid}.goodbye`
  const validCmds = ['on', 'off', 'set', 'show']

  // ── Help ──────────────────────────────────────────────────
  if (!subCmd || !validCmds.includes(subCmd)) {
    const enabled = dbGet(`${groupKey}.enabled`, false)
    return m.reply(
      `*👋 Goodbye Message*\n` +
      `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n\n` +
      `*Cara penggunaan:*\n` +
      `▸ \`.goodbye on\` — Aktifkan\n` +
      `▸ \`.goodbye off\` — Nonaktifkan\n` +
      `▸ \`.goodbye set <teks>\` — Ubah teks\n` +
      `▸ \`.goodbye show\` — Lihat konfigurasi saat ini\n\n` +
      TAG_LIST
    )
  }

  // ── ON ────────────────────────────────────────────────────
  if (subCmd === 'on') {
    dbSet(`${groupKey}.enabled`, true)
    return m.reply('✅ Goodbye message *diaktifkan*!')
  }

  // ── OFF ───────────────────────────────────────────────────
  if (subCmd === 'off') {
    dbSet(`${groupKey}.enabled`, false)
    return m.reply('🔕 Goodbye message *dinonaktifkan*.')
  }

  // ── SET ───────────────────────────────────────────────────
  if (subCmd === 'set') {
    const newText = args.slice(1).join(' ').trim()
    if (!newText) {
      return m.reply('❌ Teks tidak boleh kosong!\n\nContoh:\n`.goodbye set Sampai jumpa @username dari @grub 🙏`')
    }
    dbSet(`${groupKey}.text`, newText)
    return m.reply(`✅ Teks goodbye berhasil diubah!\n\n*Preview:*\n${newText}\n\n${TAG_LIST}`)
  }

  // ── SHOW ──────────────────────────────────────────────────
  if (subCmd === 'show') {
    const text    = dbGet(`${groupKey}.text`, DEFAULT_GOODBYE)
    const enabled = dbGet(`${groupKey}.enabled`, false)
    return m.reply(
      `*👋 Goodbye Message*\n` +
      `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n\n` +
      `*Teks saat ini:*\n${text}\n\n` +
      TAG_LIST
    )
  }
}

handler.command = /^goodbye$/i
handler.help    = ['goodbye on/off/set/show']
handler.tags    = ['group']

module.exports = handler
