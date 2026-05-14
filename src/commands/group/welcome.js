const db = require('../../lib/db')
const { DEFAULT_WELCOME } = require('../../handlers/groupHandler')

// ─── Daftar tag yang tersedia ─────────────────────────────────
const TAG_LIST =
  `*Tag yang tersedia:*\n` +
  `▸ \`@tag\` — Mention member (contoh: @628xxx)\n` +
  `▸ \`@username\` — Nama member\n` +
  `▸ \`@number\` — Nomor HP member\n` +
  `▸ \`@grub\` — Nama grup`

module.exports = {
  name: 'welcome',
  description: 'Kelola pesan sambutan anggota baru grup',
  category: 'group',
  usage: '{prefix}welcome <on|off|set|setimg|delimg|show>',

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
    const groupKey = `groups.${jid}.welcome`
    const validCmds = ['on', 'off', 'set', 'setimg', 'delimg', 'show']

    // ── Tampilkan bantuan jika tidak ada subcommand ───────────
    if (!subCmd || !validCmds.includes(subCmd)) {
      const enabled = db.get(`${groupKey}.enabled`, false)
      const hasImage = !!db.get(`${groupKey}.image`, null)
      return sock.sendMessage(jid, {
        text:
          `*🎉 Welcome Message*\n` +
          `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n` +
          `Gambar: ${hasImage ? '🖼️ Ada' : '❌ Tidak ada'}\n\n` +
          `*Cara penggunaan:*\n` +
          `▸ \`.welcome on\` — Aktifkan\n` +
          `▸ \`.welcome off\` — Nonaktifkan\n` +
          `▸ \`.welcome set <teks>\` — Ubah teks\n` +
          `▸ \`.welcome setimg\` — Set gambar (kirim + caption)\n` +
          `▸ \`.welcome delimg\` — Hapus gambar\n` +
          `▸ \`.welcome show\` — Lihat konfigurasi saat ini\n\n` +
          TAG_LIST,
      }, { quoted: msg })
    }

    // ── ON ────────────────────────────────────────────────────
    if (subCmd === 'on') {
      db.set(`${groupKey}.enabled`, true)
      return sock.sendMessage(jid, {
        text: '✅ Welcome message *diaktifkan*!',
      }, { quoted: msg })
    }

    // ── OFF ───────────────────────────────────────────────────
    if (subCmd === 'off') {
      db.set(`${groupKey}.enabled`, false)
      return sock.sendMessage(jid, {
        text: '🔕 Welcome message *dinonaktifkan*.',
      }, { quoted: msg })
    }

    // ── SET ───────────────────────────────────────────────────
    if (subCmd === 'set') {
      const newText = args.slice(1).join(' ').trim()

      if (!newText) {
        return sock.sendMessage(jid, {
          text: `❌ Teks tidak boleh kosong!\n\nContoh:\n\`.welcome set Halo @tag! Selamat datang di @grub 🎉\``,
        }, { quoted: msg })
      }

      db.set(`${groupKey}.text`, newText)
      return sock.sendMessage(jid, {
        text:
          `✅ Teks welcome berhasil diubah!\n\n` +
          `*Preview teks:*\n${newText}\n\n` +
          TAG_LIST,
      }, { quoted: msg })
    }

    // ── SETIMG ────────────────────────────────────────────────
    if (subCmd === 'setimg') {
      const { downloadMediaMessage } = require('@whiskeysockets/baileys')
      const fs = require('fs')
      const path = require('path')

      // Cek apakah pesan mengandung gambar (langsung atau reply)
      const isDirectImage = !!msg.message?.imageMessage
      const quotedImageMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
        ? { message: msg.message.extendedTextMessage.contextInfo.quotedMessage, key: msg.key }
        : null

      const targetMsg = isDirectImage ? msg : quotedImageMsg

      if (!targetMsg) {
        return sock.sendMessage(jid, {
          text:
            `❌ Tidak ada gambar ditemukan!\n\n` +
            `*Cara set gambar:*\n` +
            `• Kirim gambar dengan caption \`.welcome setimg\`\n` +
            `• Atau reply gambar lalu ketik \`.welcome setimg\``,
        }, { quoted: msg })
      }

      try {
        // Download gambar ke buffer
        const buffer = await downloadMediaMessage(targetMsg, 'buffer', {})

        // Simpan ke data/images/
        const imgDir = path.join(__dirname, '../../../data/images')
        if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true })

        // Nama file unik per grup
        const safeJid = jid.replace(/[^a-zA-Z0-9]/g, '_')
        const imgPath = path.join(imgDir, `welcome_${safeJid}.jpg`)
        fs.writeFileSync(imgPath, buffer)

        db.set(`${groupKey}.image`, imgPath)

        return sock.sendMessage(jid, {
          text: '✅ Gambar welcome berhasil disimpan! Welcome message sekarang akan dikirim dengan gambar.',
        }, { quoted: msg })
      } catch (err) {
        return sock.sendMessage(jid, {
          text: `❌ Gagal menyimpan gambar: ${err.message}`,
        }, { quoted: msg })
      }
    }

    // ── DELIMG ────────────────────────────────────────────────
    if (subCmd === 'delimg') {
      const fs = require('fs')
      const imgPath = db.get(`${groupKey}.image`, null)

      if (!imgPath) {
        return sock.sendMessage(jid, {
          text: '❌ Tidak ada gambar yang tersimpan.',
        }, { quoted: msg })
      }

      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
      db.set(`${groupKey}.image`, null)

      return sock.sendMessage(jid, {
        text: '🗑️ Gambar welcome berhasil dihapus. Welcome message kembali menggunakan teks saja.',
      }, { quoted: msg })
    }

    // ── SHOW ──────────────────────────────────────────────────
    if (subCmd === 'show') {
      const fs = require('fs')
      const text = db.get(`${groupKey}.text`, DEFAULT_WELCOME)
      const enabled = db.get(`${groupKey}.enabled`, false)
      const imgPath = db.get(`${groupKey}.image`, null)
      const hasImage = !!(imgPath && fs.existsSync(imgPath))

      const info =
        `*🎉 Welcome Message*\n` +
        `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n` +
        `Gambar: ${hasImage ? '🖼️ Ada' : '❌ Tidak ada'}\n\n` +
        `*Teks saat ini:*\n${text}\n\n` +
        TAG_LIST

      // Preview dengan gambar jika ada
      if (hasImage) {
        return sock.sendMessage(jid, {
          image: { url: imgPath },
          caption: info,
        }, { quoted: msg })
      }

      return sock.sendMessage(jid, { text: info }, { quoted: msg })
    }
  },
}
