// plugins/rules.js
const { dbGet, dbSet } = require('../lib/functions')
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, args, rawText }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Grup only!')

  const subCmd = args[0]?.toLowerCase()
  const key = `groups.${jid}.rules`
  const rules = dbGet(key, null)

  let groupMeta
  const getGroup = async () => {
    if (!groupMeta) {
      try { groupMeta = await conn.groupMetadata(jid) } catch {}
    }
    return groupMeta
  }

  // Menu
  const menu = () => {
    let txt = `┌───⊷ *RULES*\n`
    txt += `│ ${rules ? '📋 Tersimpan' : '⚫ Kosong'}\n`
    txt += `└───────────\n\n`
    txt += `▸ *rules* — lihat\n`
    txt += `▸ *rules set* <teks> — admin\n`
    txt += `▸ *rules del* — admin`
    return m.reply(txt)
  }

  if (!subCmd || subCmd === 'show') {
    if (!rules) return menu()
    const meta = await getGroup()
    const name = meta?.subject || 'Grup'
    return m.reply(`┌───⊷ *RULES ${name}*\n│ ${rules.replace(/\n/g, '\n│ ')}\n└───────────`)
  }

  if (subCmd === 'set') {
    const meta = await getGroup()
    if (!meta || !isAdmin(meta, m.sender)) return m.reply('❌ Admin only!')

    const newRules = rawText.replace(/^set\s*/i, '').trim()
    if (!newRules) return m.reply('❌ Rules kosong!')

    dbSet(key, newRules)
    return m.reply(`✅ Rules disimpan.\n\n┌───⊷ *PREVIEW*\n│ ${newRules.replace(/\n/g, '\n│ ')}\n└───────────`)
  }

  if (['del', 'delete', 'reset'].includes(subCmd)) {
    const meta = await getGroup()
    if (!meta || !isAdmin(meta, m.sender)) return m.reply('❌ Admin only!')

    dbSet(key, null)
    return m.reply('🗑️ Rules dihapus.')
  }

  return menu()
}

handler.command = /^rules$/i
handler.help = ['rules']
handler.tags = ['group']

module.exports = handler