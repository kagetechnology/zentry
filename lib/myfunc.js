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
  const normalized = jidNormalizedUser(jid)
  return groupMeta.participants
    .filter(p => p.admin)
    .some(p => jidNormalizedUser(p.id) === normalized)
}

/**
 * Cek apakah JID adalah superadmin (owner) grup
 */
function isSuperAdmin(groupMeta, jid) {
  const normalized = jidNormalizedUser(jid)
  return groupMeta.participants
    .filter(p => p.admin === 'superadmin')
    .some(p => jidNormalizedUser(p.id) === normalized)
}

/**
 * Cek apakah bot saat ini adalah admin di grup
 */
async function checkBotAdmin(conn, groupJid) {
  try {
    const meta = await conn.groupMetadata(groupJid)
    const botId = jidNormalizedUser(conn.user?.id || '')
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
