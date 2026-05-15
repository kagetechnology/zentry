const { dbGet, dbSet } = require('../../lib/functions')

let handler = async (m, { args, text, prefix, command, isGroup }) => {
  if (!isGroup) return m.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!')

  let type = args[0]?.toLowerCase()
  let days = parseInt(args[1])

  if (type === 'add') {
    if (isNaN(days) || days <= 0) return m.reply('❌ Masukkan jumlah hari yang valid!\nContoh: `.sewa add 30`')
    
    let now = Date.now()
    let currentExpired = dbGet(`groups.${m.chat}.expired`, 0)
    let newExpired = (currentExpired > now ? currentExpired : now) + (days * 24 * 60 * 60 * 1000)
    
    dbSet(`groups.${m.chat}.expired`, newExpired)
    
    let date = new Date(newExpired).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    m.reply(`✅ *Sewa Grup Ditambahkan!*\n\nDurasi: +${days} hari\nBerakhir pada: ${date}\n\nTerima kasih telah menyewa bot!`)
  
  } else if (type === 'del' || type === 'delete') {
    dbSet(`groups.${m.chat}.expired`, 0)
    m.reply('✅ *Sewa Dihapus!*\nBot sekarang permanen di grup ini (tidak ada expired).')
  
  } else if (type === 'cek' || type === 'check') {
    let expired = dbGet(`groups.${m.chat}.expired`, 0)
    if (expired === 0) return m.reply('ℹ️ Grup ini tidak memiliki masa sewa (Permanen).')
    
    let now = Date.now()
    if (now > expired) return m.reply('❌ Masa sewa grup ini sudah habis!')
    
    let sisaMs = expired - now
    let sisaHari = Math.floor(sisaMs / (24 * 60 * 60 * 1000))
    let sisaJam = Math.floor((sisaMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    let date = new Date(expired).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    
    m.reply(`⏳ *Sisa Masa Sewa:*\n${sisaHari} Hari, ${sisaJam} Jam\n\nBerakhir pada: ${date}`)
  
  } else {
    m.reply(`*Fitur Sewa Grup*\n\nPenggunaan:\n◦ \`${prefix}${command} add <hari>\` (Tambah durasi sewa)\n◦ \`${prefix}${command} del\` (Hapus sewa/permanen)\n◦ \`${prefix}${command} cek\` (Cek sisa durasi)\n\nContoh: \`.sewa add 30\``)
  }
}

handler.help = ['sewa <add/del/cek>']
handler.tags = ['owner']
handler.command = /^(sewa|rent)$/i
handler.owner = true

module.exports = handler
