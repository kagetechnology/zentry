const TicTacToe = require('../../lib/tictactoe')

let handler = async (m, { conn, text, prefix, command, isGroup }) => {
  if (!isGroup) return m.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!')
  
  conn.tictactoe = conn.tictactoe || {}
  
  // Nyerah
  if (text.toLowerCase() === 'nyerah') {
    if (!conn.tictactoe[m.chat]) return m.reply('Tidak ada game tictactoe yang sedang berjalan di grup ini.')
    let game = conn.tictactoe[m.chat]
    if (m.sender !== game.playerX && m.sender !== game.playerO) return m.reply('Kamu tidak sedang bermain dalam game ini!')
    
    let winner = m.sender === game.playerX ? game.playerO : game.playerX
    delete conn.tictactoe[m.chat]
    return m.reply(`🏳️ @${m.sender.split('@')[0]} menyerah!\nPemenang: @${winner.split('@')[0]}`, null, { mentions: [m.sender, winner] })
  }

  // Cek apakah ada game berjalan
  if (conn.tictactoe[m.chat]) {
    let game = conn.tictactoe[m.chat]
    if (game.status === 'WAITING') {
      if (game.playerX === m.sender) return m.reply('Kamu sudah membuat room, tunggu penantang lain!')
      // Join game
      game.playerO = m.sender
      game.status = 'PLAYING'
      
      let str = `🎮 *TIC-TAC-TOE* 🎮\n\nGame dimulai!\n❌ @${game.playerX.split('@')[0]}\n⭕ @${game.playerO.split('@')[0]}\n\nGiliran: @${game.turn.split('@')[0]}\n\nKetik posisi (1-9) untuk membalas, atau ketik *nyerah*\n\n${game.render()}`
      return conn.sendMessage(m.chat, { text: str, mentions: [game.playerX, game.playerO] }, { quoted: m })
    } else {
      return m.reply('Masih ada game yang sedang berjalan di grup ini!')
    }
  }

  // Buat game baru
  conn.tictactoe[m.chat] = new TicTacToe(m.sender)
  m.reply(`Menunggu penantang!\n\nKetik \`${prefix}${command}\` untuk bergabung ke dalam game.\nKetik *nyerah* untuk membatalkan room.`)
}

handler.help = ['tictactoe', 'ttt']
handler.tags = ['game']
handler.command = /^(tictactoe|ttt)$/i

module.exports = handler
