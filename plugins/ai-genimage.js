// plugins/genimage.js
let handler = async (m, { conn, text, prefix, command }) => {
  if (!text) return m.reply(`❌ Masukkan prompt!\n└─ *${prefix}${command} <prompt>*`)

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=1024&height=1024&nologo=true`

    await conn.sendMessage(m.chat, {
      image: { url },
      caption: `🎨 *${text}*`,
    }, { quoted: m })

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply('❌ Server sibuk.')
  }
}

handler.command = /^(genimage|image|aiimage|txt2img)$/i
handler.help = ['genimage']
handler.tags = ['ai']

module.exports = handler