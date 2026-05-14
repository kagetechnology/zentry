// plugins/goodbye.js

const { dbGet, dbSet } = require('../lib/functions')

const DEFAULT_GOODBYE = '👋 Sampai jumpa @username!\nTerima kasih sudah bersama kami di *@grub* 🙏'

const TAG_LIST =
  `*Tag yang tersedia:*\n` +
  `▸ \`@tag\` — Mention member\n` +
  `▸ \`@username\` — Nama member\n` +
  `▸ \`@number\` — Nomor HP member\n` +
  `▸ \`@grub\` — Nama grup`

let handler = async (m, { conn, args, rawText, downloadMediaMessage }) => {
  const jid = m.chat

  if (!m.isGroup) {
    return m.reply('❌ Command ini hanya bisa digunakan di dalam grup!')
  }

  const subCmd    = args[0]?.toLowerCase()
  const groupKey  = `groups.${jid}.goodbye`
  const validCmds = ['on', 'off', 'set', 'setimg', 'setbg', 'delbg', 'delimg', 'card', 'show']

  // ── Help ──────────────────────────────────────────────────
  if (!subCmd || !validCmds.includes(subCmd)) {
    const enabled  = dbGet(`${groupKey}.enabled`, false)
    const mode     = dbGet(`${groupKey}.mode`, 'card')
    const hasBg    = !!dbGet(`${groupKey}.background`, null)

    return m.reply(
      `*👋 Goodbye Message*\n` +
      `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n` +
      `Mode: ${mode === 'image' ? '🖼️ Gambar Statis' : `🃏 Card${hasBg ? ' (bg custom)' : ' (default)'}`}\n\n` +
      `*Pengaturan teks:*\n` +
      `▸ \`.goodbye on/off\` — Aktifkan/nonaktifkan\n` +
      `▸ \`.goodbye set <teks>\` — Ubah teks (Shift+Enter = baris baru)\n\n` +
      `*Pengaturan gambar:*\n` +
      `▸ \`.goodbye card\` — Pakai mode card (auto-generate)\n` +
      `▸ \`.goodbye setbg\` — Set background card (kirim/reply gambar)\n` +
      `▸ \`.goodbye delbg\` — Hapus background, kembali ke gradient\n` +
      `▸ \`.goodbye setimg\` — Mode gambar statis (kirim/reply gambar)\n` +
      `▸ \`.goodbye delimg\` — Hapus gambar statis, kembali ke card\n\n` +
      `▸ \`.goodbye show\` — Preview konfigurasi saat ini\n\n` +
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
    const newText = rawText.replace(/^set\s*/i, '').trim()
    if (!newText) {
      return m.reply('❌ Teks tidak boleh kosong!\n\nGunakan Shift+Enter untuk baris baru.')
    }
    dbSet(`${groupKey}.text`, newText)
    return m.reply(`✅ Teks goodbye berhasil diubah!\n\n*Preview:*\n${newText}\n\n${TAG_LIST}`)
  }

  // ── CARD ──────────────────────────────────────────────────
  if (subCmd === 'card') {
    dbSet(`${groupKey}.mode`, 'card')
    const hasBg = !!dbGet(`${groupKey}.background`, null)
    return m.reply(`🃏 Mode beralih ke *Card*.\n${hasBg ? '🖼️ Background custom masih aktif.' : '🎨 Menggunakan gradient default.'}`)
  }

  // ── SETBG (background untuk card) ────────────────────────
  if (subCmd === 'setbg') {
    const fs   = require('fs')
    const path = require('path')

    const isDirectImage  = !!m.message?.imageMessage
    const quotedImageMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
      ? { message: m.message.extendedTextMessage.contextInfo.quotedMessage, key: m.key }
      : null
    const targetMsg = isDirectImage ? m : quotedImageMsg

    if (!targetMsg) {
      return m.reply(
        `❌ Tidak ada gambar!\n\n` +
        `Cara set background card:\n` +
        `• Kirim gambar dengan caption \`.goodbye setbg\`\n` +
        `• Atau reply gambar → ketik \`.goodbye setbg\``
      )
    }

    try {
      const buffer = await downloadMediaMessage(targetMsg, 'buffer', {})
      const imgDir = path.join(__dirname, '../data/images')
      if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true })

      const safeJid = jid.replace(/[^a-zA-Z0-9]/g, '_')
      const bgPath  = path.join(imgDir, `goodbye_bg_${safeJid}.jpg`)
      fs.writeFileSync(bgPath, buffer)

      dbSet(`${groupKey}.background`, bgPath)
      dbSet(`${groupKey}.mode`, 'card')

      return m.reply('✅ Background card goodbye berhasil disimpan!\nSekarang card akan menggunakan gambar ini sebagai background.')
    } catch (err) {
      return m.reply(`❌ Gagal menyimpan background: ${err.message}`)
    }
  }

  // ── DELBG ─────────────────────────────────────────────────
  if (subCmd === 'delbg') {
    const fs = require('fs')
    const bgPath = dbGet(`${groupKey}.background`, null)
    if (!bgPath) return m.reply('❌ Tidak ada background yang tersimpan.')

    if (fs.existsSync(bgPath)) fs.unlinkSync(bgPath)
    dbSet(`${groupKey}.background`, null)
    return m.reply('🗑️ Background card dihapus. Kembali ke gradient default.')
  }

  // ── SETIMG (gambar statis, tanpa card) ───────────────────
  if (subCmd === 'setimg') {
    const fs   = require('fs')
    const path = require('path')

    const isDirectImage  = !!m.message?.imageMessage
    const quotedImageMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
      ? { message: m.message.extendedTextMessage.contextInfo.quotedMessage, key: m.key }
      : null
    const targetMsg = isDirectImage ? m : quotedImageMsg

    if (!targetMsg) {
      return m.reply(
        `❌ Tidak ada gambar!\n\n` +
        `Cara set gambar statis:\n` +
        `• Kirim gambar dengan caption \`.goodbye setimg\`\n` +
        `• Atau reply gambar → ketik \`.goodbye setimg\``
      )
    }

    try {
      const buffer = await downloadMediaMessage(targetMsg, 'buffer', {})
      const imgDir = path.join(__dirname, '../data/images')
      if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true })

      const safeJid = jid.replace(/[^a-zA-Z0-9]/g, '_')
      const imgPath = path.join(imgDir, `goodbye_img_${safeJid}.jpg`)
      fs.writeFileSync(imgPath, buffer)

      dbSet(`${groupKey}.image`, imgPath)
      dbSet(`${groupKey}.mode`, 'image')

      return m.reply('✅ Gambar statis goodbye tersimpan!\nMode beralih ke *Gambar Statis* — gambar ini langsung dikirim tanpa card.')
    } catch (err) {
      return m.reply(`❌ Gagal menyimpan gambar: ${err.message}`)
    }
  }

  // ── DELIMG ────────────────────────────────────────────────
  if (subCmd === 'delimg') {
    const fs = require('fs')
    const imgPath = dbGet(`${groupKey}.image`, null)
    if (!imgPath) return m.reply('❌ Tidak ada gambar statis yang tersimpan.')

    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
    dbSet(`${groupKey}.image`, null)
    dbSet(`${groupKey}.mode`, 'card')
    return m.reply('🗑️ Gambar statis dihapus. Mode kembali ke *Card*.')
  }

  // ── SHOW ──────────────────────────────────────────────────
  if (subCmd === 'show') {
    const fs      = require('fs')
    const text    = dbGet(`${groupKey}.text`, DEFAULT_GOODBYE).replace(/\\n/g, '\n')
    const enabled = dbGet(`${groupKey}.enabled`, false)
    const mode    = dbGet(`${groupKey}.mode`, 'card')
    const bgPath  = dbGet(`${groupKey}.background`, null)
    const imgPath = dbGet(`${groupKey}.image`, null)
    const hasBg   = !!(bgPath && fs.existsSync(bgPath))
    const hasImg  = !!(imgPath && fs.existsSync(imgPath))

    const modeLabel = mode === 'image'
      ? '🖼️ Gambar Statis'
      : `🃏 Card${hasBg ? ' (bg custom)' : ' (gradient)'}`

    const info =
      `*👋 Goodbye Message*\n` +
      `Status: ${enabled ? '✅ Aktif' : '🔕 Nonaktif'}\n` +
      `Mode: ${modeLabel}\n\n` +
      `*Teks:*\n${text}\n\n` +
      TAG_LIST

    const previewPath = mode === 'image' && hasImg ? imgPath : (hasBg ? bgPath : null)
    if (previewPath) {
      return conn.sendMessage(jid, { image: { url: previewPath }, caption: info }, { quoted: m })
    }
    return m.reply(info)
  }
}

handler.command = /^goodbye$/i
handler.help    = ['goodbye on/off/set/card/setbg/delbg/setimg/delimg/show']
handler.tags    = ['group']

module.exports = handler
