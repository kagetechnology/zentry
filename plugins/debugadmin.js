// plugins/debugadmin.js
const { isAdmin } = require('../lib/myfunc')

let handler = async (m, { conn }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('Hanya di grup')

  try {
    const groupMeta = await conn.groupMetadata(jid)
    const botId = conn.user?.id || ''
    const botNumber = botId.split(':')[0].split('@')[0]

    let text = `Bot User ID: ${botId}\n`
    text += `Parsed Number: ${botNumber}\n\n`

    const admins = groupMeta.participants.filter(p => p.admin)
    text += `Admins List (${admins.length}):\n`
    for (const p of admins) {
      text += `- ${p.id} (admin: ${p.admin})\n`
      text += `  Matches bot? ${p.id.startsWith(botNumber + '@')}\n`
    }

    const isAdmResult = isAdmin(groupMeta, botId)
    text += `\nisAdmin Result: ${isAdmResult}`

    return m.reply(text)
  } catch (e) {
    return m.reply('Error: ' + e.message)
  }
}

handler.command = /^debugadmin$/i
handler.tags = ['owner']

module.exports = handler
