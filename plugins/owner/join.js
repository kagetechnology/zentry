let handler = async (m, { conn, text, command, prefix }) => {
  if (!text) return m.reply(`Masukkan link grup WhatsApp!\nContoh: \`${prefix}${command} https://chat.whatsapp.com/xxx\``)

  let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i
  let match = text.match(linkRegex)

  if (!match) return m.reply('❌ Link grup tidak valid!')

  let code = match[1]

  try {
    m.reply('⏳ Sedang mencoba bergabung...')
    let res = await conn.groupAcceptInvite(code)
    m.reply('✅ Berhasil bergabung ke grup!')
  } catch (err) {
    m.reply(`❌ Gagal bergabung ke grup.\nKemungkinan link sudah di-reset atau bot telah di-kick sebelumnya.`)
  }
}

handler.help = ['join <link>']
handler.tags = ['owner']
handler.command = /^(join)$/i
handler.owner = true

module.exports = handler
