const { jidNormalizedUser } = require('@whiskeysockets/baileys')

/**
 * Ganti custom tag dalam teks
 */
function parseText(text, { groupName, userName, number }) {
  return text
    .replace(/\\n/g, '\n')
    .replace(/@grub/g, groupName)
    .replace(/@username/g, userName)
    .replace(/@number/g, number)
    .replace(/@tag/g, `@${number}`)
}

/**
 * Cek apakah JID adalah admin di grup
 */
function isAdmin(groupMeta, jid) {
  if (!jid) return false
  const number = jid.split(':')[0].split('@')[0]
  return groupMeta.participants
    .filter(p => p.admin)
    .some(p => {
      const matchId = (p.id || '').startsWith(number + '@')
      const matchLid = (p.lid || '').startsWith(number + '@')
      const matchJid = (p.jid || '').startsWith(number + '@')
      return matchId || matchLid || matchJid
    })
}

/**
 * Cek apakah JID adalah superadmin (owner) grup
 */
function isSuperAdmin(groupMeta, jid) {
  if (!jid) return false
  const number = jid.split(':')[0].split('@')[0]
  return groupMeta.participants
    .filter(p => p.admin === 'superadmin')
    .some(p => {
      const matchId = (p.id || '').startsWith(number + '@')
      const matchLid = (p.lid || '').startsWith(number + '@')
      const matchJid = (p.jid || '').startsWith(number + '@')
      return matchId || matchLid || matchJid
    })
}

/**
 * Cek apakah bot saat ini adalah admin di grup
 */
async function checkBotAdmin(conn, groupJid) {
  try {
    const meta = await conn.groupMetadata(groupJid)
    const botId = conn.user?.id || ''
    return isAdmin(meta, botId)
  } catch {
    return false
  }
}

/**
 * Ambil JID yang di-mention dalam pesan
 */
function getMentions(m) {
  return m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
}

/**
 * Ambil JID peserta dari pesan yang di-reply
 */
function getQuotedParticipant(m) {
  return m.message?.extendedTextMessage?.contextInfo?.participant || null
}

/**
 * Deteksi URL dalam teks
 */
function containsURL(text) {
  if (!text) return false
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i
  return urlRegex.test(text)
}

module.exports = {
  parseText, isAdmin, isSuperAdmin, checkBotAdmin,
  getMentions, getQuotedParticipant, containsURL,
}
