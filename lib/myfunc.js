/**
 * Ganti custom tag dalam teks dengan nilai yang sesuai
 *
 * Tag yang didukung:
 *   @tag      → Mention WhatsApp (@62xxx)
 *   @username → Push name member
 *   @number   → Nomor HP member
 *   @grub     → Nama grup
 *
 * @param {string} text
 * @param {{ groupName: string, userName: string, number: string, jid: string }} data
 * @returns {string}
 */
function parseText(text, { groupName, userName, number }) {
  return text
    .replace(/@grub/g, groupName)
    .replace(/@username/g, userName)
    .replace(/@number/g, number)
    .replace(/@tag/g, `@${number}`)
}

/**
 * Cek apakah JID adalah admin di grup
 * @param {object} groupMeta - Hasil dari conn.groupMetadata()
 * @param {string} jid - JID yang dicek
 * @returns {boolean}
 */
function isAdmin(groupMeta, jid) {
  return groupMeta.participants
    .filter(p => p.admin)
    .some(p => p.id === jid)
}

/**
 * Cek apakah JID adalah super admin (owner) grup
 * @param {object} groupMeta
 * @param {string} jid
 * @returns {boolean}
 */
function isSuperAdmin(groupMeta, jid) {
  return groupMeta.participants
    .filter(p => p.admin === 'superadmin')
    .some(p => p.id === jid)
}

module.exports = { parseText, isAdmin, isSuperAdmin }
