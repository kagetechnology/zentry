const { sleep } = require('../../lib/functions')

let handler = async (m, { conn, text, command, prefix }) => {
  if (!text) return m.reply(`Masukkan pesan broadcast!\nContoh: \`${prefix}${command} Bot sedang maintenance selama 1 jam.\``)
  
  // Ambil semua grup tempat bot berada
  let groups
  try {
    const chats = await conn.groupFetchAllParticipating()
    groups = Object.values(chats).map(v => v.id)
  } catch (err) {
    return m.reply('❌ Gagal mengambil daftar grup.')
  }

  if (groups.length === 0) return m.reply('❌ Bot belum masuk ke grup manapun.')

  m.reply(`⏳ Memulai broadcast ke *${groups.length}* grup... (estimasi ${groups.length * 3} detik)`)

  let success = 0
  let failed = 0

  for (let id of groups) {
    try {
      await conn.sendMessage(id, { text: `📢 *BROADCAST ZENTRY*\n\n${text}` })
      success++
    } catch (err) {
      failed++
    }
    // Delay 3 detik antar grup untuk mencegah ban
    await sleep(3000)
  }

  m.reply(`✅ *Broadcast Selesai!*\n\nBerhasil: ${success}\nGagal: ${failed}`)
}

handler.help = ['bc <teks>']
handler.tags = ['owner']
handler.command = /^(bc|broadcast)$/i
handler.owner = true

module.exports = handler
