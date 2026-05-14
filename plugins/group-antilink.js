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
  const key = `groups.${jid}.antilink`
  const enabled = dbGet(`${key}.enabled`, false)
  const action = dbGet(`${key}.action`, 'delete')

  const menu = () => {
    let txt = `┌───⊷ *ANTI LINK*\n`
    txt += `│ Status : ${enabled ? '🟢 on' : '⚫ off'}\n`
    txt += `│ Aksi   : ${action}\n`
    txt += `└───────────\n\n`
    txt += `*Command:*\n`
    txt += `▸ on / off\n`
    txt += `▸ action <delete|warn|kick>\n`
    txt += `▸ show`
    return m.reply(txt)
  }

  if (!subCmd || !['on', 'off', 'action', 'show'].includes(subCmd)) return menu()

  switch (subCmd) {
    case 'on':
      dbSet(`${key}.enabled`, true)
      return m.reply(`🟢 Antilink *on*`)
    case 'off':
      dbSet(`${key}.enabled`, false)
      return m.reply(`⚫ Antilink *off*`)
    case 'action':
      const act = args[1]?.toLowerCase()
      if (!['delete', 'warn', 'kick'].includes(act)) 
        return m.reply('❌ Pilih: delete | warn | kick')
      dbSet(`${key}.action`, act)
      return m.reply(`✅ Aksi → *${act}*`)
    case 'show':
      return m.reply(
        `┌───⊷ *STATUS*\n` +
        `│ Antilink : ${enabled ? '🟢 on' : '⚫ off'}\n` +
        `│ Aksi     : *${action}*\n` +
        `└───────────`
      )
  }
}

handler.command = /^antilink$/i
handler.help = ['antilink']
handler.tags = ['group']

module.exports = handler