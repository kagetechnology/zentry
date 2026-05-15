const cp = require('child_process')
const { promisify } = require('util')
const exec = promisify(cp.exec)

let handler = async (m, { conn, text, command, prefix }) => {
  if (!text) return m.reply(`Masukkan perintah terminal!\nContoh: \`${prefix}${command} ls -la\``)
  
  try {
    m.reply('⏳ Mengeksekusi...')
    const { stdout, stderr } = await exec(text)
    if (stdout.trim()) await m.reply(`*STDOUT:*\n\`\`\`${stdout}\`\`\``)
    if (stderr.trim()) await m.reply(`*STDERR:*\n\`\`\`${stderr}\`\`\``)
    if (!stdout && !stderr) m.reply('✅ Perintah berhasil dieksekusi (Tidak ada output)')
  } catch (err) {
    m.reply(`❌ *ERROR:*\n\`\`\`${err.message}\`\`\``)
  }
}

handler.help = ['exec <command>']
handler.tags = ['owner']
handler.command = /^(\$|exec)$/i
handler.owner = true // Akan dicek di handler.js

module.exports = handler
