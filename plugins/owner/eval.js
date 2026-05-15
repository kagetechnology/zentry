const util = require('util')

let handler = async (m, ctx) => {
  let { conn, text, command, prefix, args } = ctx
  if (!text) return m.reply(`Masukkan kode JavaScript!\nContoh: \`${prefix}${command} return 1+1\``)

  let evalCmd = text
  if (!evalCmd.includes('return')) {
    evalCmd = `return (async () => { ${text} })()`
  } else {
    evalCmd = `return (async () => { ${text} })()`
  }
  
  try {
    let evaled = await eval(evalCmd)
    if (typeof evaled !== 'string') evaled = util.inspect(evaled)
    await m.reply(evaled)
  } catch (err) {
    m.reply(`❌ *ERROR:*\n\`\`\`${err.message}\`\`\``)
  }
}

handler.help = ['eval <code js>']
handler.tags = ['owner']
handler.command = /^(>|eval|=>)$/i
handler.owner = true

module.exports = handler
