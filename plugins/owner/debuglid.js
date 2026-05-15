// plugins/debuglid.js
let handler = async (m) => {
  if (!m.isGroup) return m.reply('❌ Grup only!')

  const raw = JSON.stringify(m, null, 2)
  return m.reply(raw.slice(0, 1500))
}

handler.command = /^debuglid$/i
handler.tags = ['owner']

module.exports = handler