// plugins/ping.js

let handler = async (m, { args }) => {
  const start = Date.now()
  await m.reply('🏓 Mengukur...')
  const latency = Date.now() - start
  await m.reply(`🏓 *Pong!*\n📶 Latensi: *${latency}ms*`)
}

handler.command  = /^ping$/i
handler.help     = ['ping']
handler.tags     = ['general']

module.exports = handler
