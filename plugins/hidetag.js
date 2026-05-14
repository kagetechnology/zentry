// plugins/hidetag.js
const { checkBotAdmin } = require('../lib/myfunc')

let handler = async (m, { conn, text, isGroup }) => {
  if (!isGroup) return m.reply('❌ Perintah ini hanya bisa digunakan di grup!')

  // Pastikan pengirim adalah admin (sudah ada di middleware/plugin handler jika diperlukan, tapi kita cek manual)
  const groupMeta = await conn.groupMetadata(m.chat)
  const participants = groupMeta.participants
  const isSenderAdmin = participants.filter(p => p.admin).some(p => p.id === m.sender || m.sender.includes(p.id.split('@')[0]))
  
  if (!isSenderAdmin && !m.fromMe) {
    return m.reply('❌ Hanya admin grup yang bisa menggunakan hidetag!')
  }

  // Mengambil teks dari argumen atau dari pesan yang di-reply
  let q = m.quoted ? m.quoted : m
  let c = m.quoted ? m.quoted.message : m.message
  let pesan = text || (m.quoted && (m.quoted.text || m.quoted.caption)) || ''

  if (!pesan) return m.reply('❌ Teksnya mana yang mau di hidetag?')

  // Mengumpulkan semua JID peserta
  const mems = participants.map(a => a.id)

  await conn.sendMessage(m.chat, {
    text: pesan,
    mentions: mems
  }, { quoted: m })
}

handler.command = /^(hidetag|ht|pengumuman)$/i
handler.help = ['hidetag <teks>', 'ht (reply pesan)']
handler.tags = ['group', 'admin']

module.exports = handler
