const { spotify } = require('btch-downloader')

let handler = async (m, { conn, args, prefix, command }) => {
  if (args.length === 0) return m.reply(`❌ Link Spotify tidak ditemukan!\n\nContoh: *${prefix}${command} https://open.spotify.com/track/...*`)
  
  let url = args[0]
  if (!url.includes('spotify.com')) return m.reply('❌ Link tidak valid!')

  m.reply('⏳ Sedang mengunduh lagu dari Spotify...')
  
  try {
    let res = await spotify(url)
    if (!res.status) throw new Error('Gagal mengunduh.')
    
    let { title, thumbnail, duration, url: audioUrl } = res.result || res
    
    // Kadang format response berbeda, ini penyesuaian jika url ada di array formats
    if (!audioUrl && res.result?.formats && res.result.formats.length > 0) {
      audioUrl = res.result.formats[0].url
    }
    
    let caption = `🎧 *SPOTIFY DOWNLOADER* 🎧\n\n📌 *Judul:* ${title || 'Tidak diketahui'}\n⏱️ *Durasi:* ${duration ? duration + ' detik' : '-'}\n\n_Sedang mengirim audio..._`
    
    await conn.sendMessage(m.chat, {
      image: { url: thumbnail || 'https://i.scdn.co/image/ab67616d0000b27309fc2936525fc269032451c9' },
      caption: caption
    }, { quoted: m })
    
    if (audioUrl) {
      await conn.sendMessage(m.chat, { 
        audio: { url: audioUrl }, 
        mimetype: 'audio/mpeg',
        ptt: false
      }, { quoted: m })
    } else {
      m.reply('❌ Gagal mendapatkan link audio.')
    }
    
  } catch (err) {
    console.error(err)
    m.reply(`❌ Terjadi kesalahan: ${err.message}`)
  }
}

handler.help = ['spotify <link>']
handler.tags = ['download']
handler.command = /^(spotify|sp)$/i

module.exports = handler
