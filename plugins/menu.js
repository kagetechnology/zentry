// plugins/menu.js

const { plugins }   = require('../handler')
const { botName, botVersion, prefix } = require('../config')
const { formatUptime } = require('../lib/functions')

let handler = async (m, { conn }) => {
  // Kelompokan command berdasarkan tags
  const tagMap = {}
  for (const [, plugin] of plugins) {
    const tag = plugin.tags?.[0] || 'general'
    if (!tagMap[tag]) tagMap[tag] = []
    const helps = plugin.help || []
    for (const h of helps) {
      tagMap[tag].push(`${prefix}${h}`)
    }
  }

  const uptime = formatUptime(process.uptime() * 1000)

  let text = `╔══════════════════╗\n`
  text    += `║   *${botName}*   ║\n`
  text    += `║   v${botVersion}         ║\n`
  text    += `╚══════════════════╝\n\n`
  text    += `⏱️ Uptime: ${uptime}\n\n`

  for (const [tag, cmds] of Object.entries(tagMap)) {
    text += `*[ ${tag.toUpperCase()} ]*\n`
    text += cmds.map(c => `  ▸ ${c}`).join('\n')
    text += '\n\n'
  }

  text += `_Prefix: ${prefix}_`

  await m.reply(text.trim())
}

handler.command = /^(menu|help)$/i
handler.help    = ['menu', 'help']
handler.tags    = ['general']

module.exports = handler
