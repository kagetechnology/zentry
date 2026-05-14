// plugins/welcome.js

const { dbGet, dbSet } = require('../lib/functions')

const DEFAULT_WELCOME = '👋 Halo @tag!\nSelamat datang di *@grub*! Senang kamu bergabung 🎉'

const TAG_LIST =
  `*Tag yang tersedia:*\n` +
  `▸ \`@tag\` — Mention member (contoh: @628xxx)\n` +
  `▸ \`@username\` — Nama member\n` +
  `▸ \`@number\` — Nomor HP member\n` +
  `▸ \`@grub\` — Nama grup`

let handler = async (m, { conn, args, downloadMediaMessage }) => {
  const jid = m.chat

  if (!m.isGroup) {
    return m.reply('❌ Command ini hanya bisa digunakan di dalam grup!')
  }

  const subCmd   = args[0]?.toLowerCase()
  const groupKey = `groups.${jid}.welcome`
  const validCmds = ['on', 'off', 'set', 'setimg', 'delimg', 'show']

  // ── Help ──────────────────────────────────────────────────
  if (!subCmd || !validCmds.includes(subCmd)) {
    const enabled  = dbGet(`${groupKey}.enabled`, false)
    const hasImage = !!dbGet(`${groupKey}.image`, null)
    return m.reply(
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
      TAG_LIST
    )
  }

  // ── ON ────────────────────────────────────────────────────
  if (subCmd === 'on') {
    dbSet(`${groupKey}.enabled`, true)
    return m.reply('✅ Welcome message *diaktifkan*!')
  }

  // ── OFF ───────────────────────────────────────────────────
  if (subCmd === 'off') {
    dbSet(`${groupKey}.enabled`, false)
    return m.reply('🔕 Welcome message *dinonaktifkan*.')
  }

  // ── SET ───────────────────────────────────────────────────
  if (subCmd === 'set') {
    const newText = args.slice(1).join(' ').trim()
    if (!newText) {
      return m.reply('❌ Teks tidak boleh kosong!\n\nContoh:\n`.welcome set Halo @tag! Selamat datang di @grub 🎉`')
    }
    dbSet(`${groupKey}.text`, newText)
    return m.reply(`✅ Teks welcome berhasil diubah!\n\n*Preview:*\n${newText}\n\n${TAG_LIST}`)
  }

  // ── SETIMG ────────────────────────────────────────────────
  if (subCmd === 'setimg') {
    const fs   = require('fs')
    const path = require('path')

    // Cek gambar dari pesan langsung atau quoted
    const isDirectImage = !!m.message?.imageMessage
    const quotedImageMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
      ? { message: m.message.extendedTextMessage.contextInfo.quotedMessage, key: m.key }
      : null
    const targetMsg = isDirectImage ? m : quotedImageMsg

    if (!targetMsg) {
      return m.reply(
        `❌ Tidak ada gambar ditemukan!\n\n` +
        `*Cara set gambar:*\n` +
        `• Kirim gambar dengan caption \`.welcome setimg\`\n` +
        `• Atau reply gambar lalu ketik \`.welcome setimg\``
      )
    }

    try {
      const buffer = await downloadMediaMessage(targetMsg, 'buffer', {})
      const imgDir = path.join(__dirname, '../data/images')
      if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true })

      const safeJid = jid.replace(/[^a-zA-Z0-9]/g, '_')
      const imgPath = path.join(imgDir, `welcome_${safeJid}.jpg`)
      fs.writeFileSync(imgPath, buffer)

      dbSet(`${groupKey}.image`, imgPath)
      return m.reply('✅ Gambar welcome berhasil disimpan! Welcome message akan dikirim dengan gambar.')
    } catch (err) {
      return m.reply(`❌ Gagal menyimpan gambar: ${err.message}`)
    }
  }

  // ── DELIMG ────────────────────────────────────────────────
  if (subCmd === 'delimg') {
    const fs = require('fs')
    const imgPath = dbGet(`${groupKey}.image`, null)
    if (!imgPath) return m.reply('❌ Tidak ada gambar yang tersimpan.')

    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
    dbSet(`${groupKey}.image`, null)
    return m.reply('🗑️ Gambar welcome berhasil dihapus.')
  }

  // ── SHOW ──────────────────────────────────────────────────
  if (subCmd === 'show') {
    const fs = require('fs')
    const text     = dbGet(`${groupKey}.text`, DEFAULT_WELCOME)
    const enabled  = dbGet(`${groupKey}.enabled`, false)
    const imgPath  = dbGet(`${groupKey}.image`, null)
    const hasImage = !!(imgPath && fs.existsSync(imgPath))

    const info =
      `*🎉 Welcome Message*\n` +
      `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n` +
      `Gambar: ${hasImage ? '🖼️ Ada' : '❌ Tidak ada'}\n\n` +
      `*Teks saat ini:*\n${text}\n\n` +
      TAG_LIST

    if (hasImage) {
      return conn.sendMessage(jid, { image: { url: imgPath }, caption: info }, { quoted: m })
    }
    return m.reply(info)
  }
}

handler.command = /^welcome$/i
handler.help    = ['welcome on/off/set/setimg/delimg/show']
handler.tags    = ['group']

module.exports = handler
