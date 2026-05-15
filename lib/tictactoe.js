class TicTacToe {
  constructor(playerX, playerO) {
    this.playerX = playerX
    this.playerO = playerO || null
    this._currentTurn = false // false = X, true = O
    this.board = [
      '1', '2', '3',
      '4', '5', '6',
      '7', '8', '9'
    ]
    this.status = 'WAITING' // WAITING, PLAYING, END
    this.winner = null
  }

  get turn() {
    return this._currentTurn ? this.playerO : this.playerX
  }

  get turnMark() {
    return this._currentTurn ? '⭕' : '❌'
  }

  render() {
    return `
${this.board[0]}┃${this.board[1]}┃${this.board[2]}
${this.board[3]}┃${this.board[4]}┃${this.board[5]}
${this.board[6]}┃${this.board[7]}┃${this.board[8]}
    `.trim()
  }

  play(player, position) {
    if (this.status !== 'PLAYING') return -1 // Not playing
    if (this.turn !== player) return -2 // Not your turn
    
    let pos = parseInt(position) - 1
    if (pos < 0 || pos > 8 || this.board[pos] === '❌' || this.board[pos] === '⭕') {
      return -3 // Invalid move
    }

    this.board[pos] = this.turnMark
    
    if (this.checkWin()) {
      this.status = 'END'
      this.winner = player
      return 1 // Win
    }
    
    if (this.checkTie()) {
      this.status = 'END'
      return 2 // Tie
    }

    this._currentTurn = !this._currentTurn
    return 0 // Success, next turn
  }

  checkWin() {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ]
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i]
      if (this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return true
      }
    }
    return false
  }

  checkTie() {
    return this.board.every(cell => cell === '❌' || cell === '⭕')
  }
}

module.exports = TicTacToe
