// plugins/genimage.js
let handler = async (m, { conn, text, prefix, command }) => {
  if (!text) return m.reply(`❌ Harap masukkan deskripsi gambar yang ingin dibuat!\n\nContoh:\n\`${prefix}${command} kucing oren memakai kacamata hitam di pantai\``)

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    // Gunakan Pollinations AI API (gratis, tanpa API key, stabil, dan bisa bahasa Indonesia)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=1024&height=1024&nologo=true`
    
    await conn.sendMessage(m.chat, {
      image: { url },
      caption: `🎨 *Generate Image*\n\n📝 *Prompt:* ${text}`
    }, { quoted: m })

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply('❌ Gagal membuat gambar. Server mungkin sedang sibuk.')
  }
}

handler.command = /^(genimage|image|aiimage|txt2img)$/i
handler.help = ['genimage <deskripsi>']
handler.tags = ['ai']

module.exports = handler
