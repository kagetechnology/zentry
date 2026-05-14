module.exports = {
  name: 'ping',
  description: 'Cek apakah bot aktif dan ukur latensinya',
  category: 'general',
  usage: '{prefix}ping',

  async execute(sock, msg, args) {
    const start = Date.now()
    const jid = msg.key.remoteJid

    await sock.sendMessage(jid, { text: '🏓 Mengukur...' }, { quoted: msg })

    const latency = Date.now() - start
    await sock.sendMessage(jid, {
      text: `🏓 *Pong!*\n📶 Latensi: *${latency}ms*`,
    }, { quoted: msg })
  },
}
