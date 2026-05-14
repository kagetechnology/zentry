const db = require('../../lib/db')
const { DEFAULT_GOODBYE } = require('../../handlers/groupHandler')

// ─── Daftar tag yang tersedia ─────────────────────────────────
const TAG_LIST =
  `*Tag yang tersedia:*\n` +
  `▸ \`@tag\` — Mention member (contoh: @628xxx)\n` +
  `▸ \`@username\` — Nama member\n` +
  `▸ \`@number\` — Nomor HP member\n` +
  `▸ \`@grub\` — Nama grup`

module.exports = {
  name: 'goodbye',
  description: 'Kelola pesan perpisahan anggota yang keluar grup',
  category: 'group',
  usage: '{prefix}goodbye <on|off|set|show>',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid
    const isGroup = jid.endsWith('@g.us')

    // Command ini hanya untuk grup
    if (!isGroup) {
      return sock.sendMessage(jid, {
        text: '❌ Command ini hanya bisa digunakan di dalam grup!',
      }, { quoted: msg })
    }

    const subCmd = args[0]?.toLowerCase()
    const groupKey = `groups.${jid}.goodbye`

    // ── Tampilkan bantuan jika tidak ada subcommand ───────────
    if (!subCmd || !['on', 'off', 'set', 'show'].includes(subCmd)) {
      const enabled = db.get(`${groupKey}.enabled`, false)
      return sock.sendMessage(jid, {
        text:
          `*👋 Goodbye Message*\n` +
          `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n\n` +
          `*Cara penggunaan:*\n` +
          `▸ \`.goodbye on\` — Aktifkan\n` +
          `▸ \`.goodbye off\` — Nonaktifkan\n` +
          `▸ \`.goodbye set <teks>\` — Ubah teks\n` +
          `▸ \`.goodbye show\` — Lihat teks saat ini\n\n` +
          TAG_LIST,
      }, { quoted: msg })
    }

    // ── ON ────────────────────────────────────────────────────
    if (subCmd === 'on') {
      db.set(`${groupKey}.enabled`, true)
      return sock.sendMessage(jid, {
        text: '✅ Goodbye message *diaktifkan*!',
      }, { quoted: msg })
    }

    // ── OFF ───────────────────────────────────────────────────
    if (subCmd === 'off') {
      db.set(`${groupKey}.enabled`, false)
      return sock.sendMessage(jid, {
        text: '🔕 Goodbye message *dinonaktifkan*.',
      }, { quoted: msg })
    }

    // ── SET ───────────────────────────────────────────────────
    if (subCmd === 'set') {
      const newText = args.slice(1).join(' ').trim()

      if (!newText) {
        return sock.sendMessage(jid, {
          text: `❌ Teks tidak boleh kosong!\n\nContoh:\n\`.goodbye set Sampai jumpa @username! Terima kasih sudah bergabung di @grub 🙏\``,
        }, { quoted: msg })
      }

      db.set(`${groupKey}.text`, newText)
      return sock.sendMessage(jid, {
        text:
          `✅ Teks goodbye berhasil diubah!\n\n` +
          `*Preview teks:*\n${newText}\n\n` +
          TAG_LIST,
      }, { quoted: msg })
    }

    // ── SHOW ──────────────────────────────────────────────────
    if (subCmd === 'show') {
      const text = db.get(`${groupKey}.text`, DEFAULT_GOODBYE)
      const enabled = db.get(`${groupKey}.enabled`, false)

      return sock.sendMessage(jid, {
        text:
          `*👋 Goodbye Message*\n` +
          `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n\n` +
          `*Teks saat ini:*\n${text}\n\n` +
          TAG_LIST,
      }, { quoted: msg })
    }
  },
}
