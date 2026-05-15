const { twitter } = require('btch-downloader')

let handler = async (m, { conn, args, prefix, command }) => {
  if (args.length === 0) return m.reply(`❌ Link Twitter/X tidak ditemukan!\n\nContoh: *${prefix}${command} https://x.com/Twitter/status/...*`)
  
  let url = args[0]
  if (!url.includes('twitter.com') && !url.includes('x.com')) return m.reply('❌ Link tidak valid!')

  m.reply('⏳ Sedang mengunduh media dari Twitter/X...')
  
  try {
    let res = await twitter(url)
    if (!res.status) throw new Error('Gagal mengunduh.')
    
    // res.url array of objects, containing { url: ... }
    if (!res.url || res.url.length === 0) throw new Error('Tidak ada media yang ditemukan.')
    
    // Kita ambil resolusi terbaik atau video utama (biasanya index pertama)
    let mediaUrl = res.url[0].url
    if (!mediaUrl) mediaUrl = res.url[0] // fallback if it's string
    
    let caption = `🐦 *TWITTER / X DOWNLOADER* 🐦\n\n${res.title ? '📌 ' + res.title : ''}`
    
    await conn.sendMessage(m.chat, {
      video: { url: mediaUrl },
      caption: caption
    }, { quoted: m })
    
  } catch (err) {
    console.error(err)
    m.reply(`❌ Terjadi kesalahan: ${err.message}`)
  }
}

handler.help = ['twitter <link>', 'x <link>']
handler.tags = ['download']
handler.command = /^(twitter|tw|x)$/i

module.exports = handler
