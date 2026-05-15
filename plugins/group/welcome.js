// plugins/welcome.js
const { dbGet, dbSet } = require('../lib/functions')
const fs = require('fs')
const path = require('path')

const DEFAULT_WELCOME = '👋 Halo @tag!\nSelamat datang di *@grub*! Senang kamu bergabung 🎉'

const TAGS = `@tag ・ @username ・ @number ・ @grub`

let handler = async (m, { conn, args, rawText, downloadMediaMessage }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Grup only!')

  const subCmd = args[0]?.toLowerCase()
  const key = `groups.${jid}.welcome`
  const enabled = dbGet(`${key}.enabled`, false)
  const mode = dbGet(`${key}.mode`, 'card')
  const hasBg = !!dbGet(`${key}.background`, null)
  const hasImg = !!dbGet(`${key}.image`, null)

  // Helper
  const saveImage = async (targetMsg, prefix) => {
    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {})
    const dir = path.join(__dirname, '../data/images')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const safeJid = jid.replace(/[^a-zA-Z0-9]/g, '_')
    const filePath = path.join(dir, `welcome_${prefix}_${safeJid}.jpg`)
    fs.writeFileSync(filePath, buffer)
    return filePath
  }

  const getImageTarget = () => {
    if (m.message?.imageMessage) return m
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
    return quoted ? { message: m.message.extendedTextMessage.contextInfo.quotedMessage, key: m.key } : null
  }

  // Menu
  const menu = () => {
    let txt = `┌───⊷ *WELCOME*\n`
    txt += `│ Status : ${enabled ? '🟢 on' : '⚫ off'}\n`
    txt += `│ Mode   : ${mode === 'image' ? '🖼️ image' : `🃏 card${hasBg ? ' (custom)' : ''}`}\n`
    txt += `└───────────\n\n`
    txt += `*Command:*\n`
    txt += `▸ on / off\n`
    txt += `▸ set <teks>\n`
    txt += `▸ card\n`
    txt += `▸ setbg / delbg\n`
    txt += `▸ setimg / delimg\n`
    txt += `▸ show\n\n`
    txt += `*Tags:* ${TAGS}`
    return m.reply(txt)
  }

  if (!subCmd || !['on', 'off', 'set', 'card', 'setbg', 'delbg', 'setimg', 'delimg', 'show'].includes(subCmd)) {
    return menu()
  }

  switch (subCmd) {
    case 'on':
      dbSet(`${key}.enabled`, true)
      return m.reply('🟢 Welcome *on*')

    case 'off':
      dbSet(`${key}.enabled`, false)
      return m.reply('⚫ Welcome *off*')

    case 'set':
      const newText = rawText.replace(/^set\s*/i, '').trim()
      if (!newText) return m.reply('❌ Teks kosong!')
      dbSet(`${key}.text`, newText)
      return m.reply(`✅ Teks diubah.\n\n*Preview:*\n${newText}\n\n${TAGS}`)

    case 'card':
      dbSet(`${key}.mode`, 'card')
      return m.reply(`🃏 Mode → *Card*`)

    case 'setbg': {
      const target = getImageTarget()
      if (!target) return m.reply('❌ Kirim/reply gambar dengan caption *.welcome setbg*')
      try {
        const bgPath = await saveImage(target, 'bg')
        dbSet(`${key}.background`, bgPath)
        dbSet(`${key}.mode`, 'card')
        return m.reply('✅ Background card tersimpan!')
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }

    case 'delbg': {
      const bgPath = dbGet(`${key}.background`, null)
      if (!bgPath) return m.reply('❌ Tidak ada background.')
      if (fs.existsSync(bgPath)) fs.unlinkSync(bgPath)
      dbSet(`${key}.background`, null)
      return m.reply('🗑️ Background dihapus.')
    }

    case 'setimg': {
      const target = getImageTarget()
      if (!target) return m.reply('❌ Kirim/reply gambar dengan caption *.welcome setimg*')
      try {
        const imgPath = await saveImage(target, 'img')
        dbSet(`${key}.image`, imgPath)
        dbSet(`${key}.mode`, 'image')
        return m.reply('✅ Gambar statis tersimpan!')
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }

    case 'delimg': {
      const imgPath = dbGet(`${key}.image`, null)
      if (!imgPath) return m.reply('❌ Tidak ada gambar statis.')
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
      dbSet(`${key}.image`, null)
      dbSet(`${key}.mode`, 'card')
      return m.reply('🗑️ Gambar statis dihapus.')
    }

    case 'show': {
      const text = (dbGet(`${key}.text`, DEFAULT_WELCOME) || '').replace(/\\n/g, '\n')
      const bgPath = dbGet(`${key}.background`, null)
      const imgPath = dbGet(`${key}.image`, null)
      const previewPath = mode === 'image' && imgPath && fs.existsSync(imgPath) 
        ? imgPath 
        : (bgPath && fs.existsSync(bgPath) ? bgPath : null)

      const info = `┌───⊷ *WELCOME*\n│ Status : ${enabled ? '🟢 on' : '⚫ off'}\n│ Mode   : ${mode === 'image' ? '🖼️ image' : `🃏 card${bgPath && fs.existsSync(bgPath) ? ' (custom)' : ''}`}\n└───\n\n${text}\n\n*Tags:* ${TAGS}`

      if (previewPath) {
        return conn.sendMessage(jid, { image: { url: previewPath }, caption: info }, { quoted: m })
      }
      return m.reply(info)
    }
  }
}

handler.command = /^welcome$/i
handler.help = ['welcome']
handler.tags = ['group']

module.exports = handler