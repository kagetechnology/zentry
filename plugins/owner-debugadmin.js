// plugins/debugadmin.js
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('❌ Grup only!')

  try {
    const groupMeta = await conn.groupMetadata(m.chat)
    const botId = conn.user?.id || ''
    const botNum = botId.split(':')[0].split('@')[0]

    const admins = groupMeta.participants.filter(p => p.admin)
    const isBotAdmin = isAdmin(groupMeta, botId)

    let txt = `┌───⊷ *DEBUG ADMIN*\n`
    txt += `│ 🆔 Bot : ${botId}\n`
    txt += `│ 🔢 #   : ${botNum}\n`
    txt += `│ 👑 Adm : ${admins.length}\n`
    txt += `│ ✅ isAdmin : ${isBotAdmin}\n`
    txt += `├───────────\n`
    for (const p of admins) {
      const match = p.id.startsWith(botNum + '@')
      txt += `│ ${match ? '✅' : '•'} @${p.id.split('@')[0]}\n`
    }
    txt += `└───────────`

    return conn.sendMessage(m.chat, { text: txt, mentions: admins.map(p => p.id) })
  } catch (e) {
    return m.reply(`❌ ${e.message}`)
  }
}

handler.command = /^debugadmin$/i
handler.tags = ['owner']

module.exports = handler