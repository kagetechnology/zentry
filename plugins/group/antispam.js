// plugins/antispam.js
const { dbGet, dbSet } = require('../lib/functions')
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, args }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Grup only!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal akses grup.') }

  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Admin only!')

  const subCmd = args[0]?.toLowerCase()
  const key = `groups.${jid}.antispam`
  const enabled = dbGet(`${key}.enabled`, false)
  const action = dbGet(`${key}.action`, 'warn')
  const limit = dbGet(`${key}.limit`, 5)

  const menu = () => {
    let txt = `┌───⊷ *ANTI SPAM*\n`
    txt += `│ Status : ${enabled ? '🟢 on' : '⚫ off'}\n`
    txt += `│ Aksi   : ${action}\n`
    txt += `│ Limit  : ${limit} msg/5s\n`
    txt += `└───────────\n\n`
    txt += `*Command:*\n`
    txt += `▸ on / off\n`
    txt += `▸ action <warn|kick>\n`
    txt += `▸ show`
    return m.reply(txt)
  }

  if (!subCmd || !['on', 'off', 'action', 'show'].includes(subCmd)) return menu()

  switch (subCmd) {
    case 'on':
      dbSet(`${key}.enabled`, true)
      return m.reply(`🟢 Antispam *on*`)
    case 'off':
      dbSet(`${key}.enabled`, false)
      return m.reply(`⚫ Antispam *off*`)
    case 'action':
      const act = args[1]?.toLowerCase()
      if (!['warn', 'kick'].includes(act)) 
        return m.reply('❌ Pilih: warn | kick')
      dbSet(`${key}.action`, act)
      return m.reply(`✅ Aksi → *${act}*`)
    case 'show':
      return m.reply(
        `┌───⊷ *STATUS*\n` +
        `│ Antispam : ${enabled ? '🟢 on' : '⚫ off'}\n` +
        `│ Aksi     : *${action}*\n` +
        `│ Limit    : ${limit} msg/5s\n` +
        `└───────────`
      )
  }
}

handler.command = /^antispam$/i
handler.help = ['antispam']
handler.tags = ['group']

module.exports = handler