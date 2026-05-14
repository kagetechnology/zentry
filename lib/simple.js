const { jidNormalizedUser } = require('@whiskeysockets/baileys')

/**
 * Wrap pesan mentah dari Baileys dengan helper methods
 * Mirip dengan smsg() di BETABOTZ-style bots
 *
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {object} m - Pesan mentah dari messages.upsert
 * @returns {object} Pesan yang sudah di-wrap
 */
function smsg(conn, m) {
  if (!m) return m

  let M = m.message
  if (!M) return m

  // Normalisasi ephemeral message
  if (M?.ephemeralMessage?.message) {
    m.message = M = M.ephemeralMessage.message
  }

  // Tipe konten utama pesan
  m.mtype = Object.keys(M).find(k =>
    k !== 'senderKeyDistributionMessage' &&
    k !== 'messageContextInfo'
  ) || ''

  // Sender JID (normalize)
  m.sender = m.key.fromMe
    ? (conn.user?.id || '')
    : (m.key.participant || m.key.remoteJid || '')
  m.sender = jidNormalizedUser(m.sender)

  // Info dasar
  m.isGroup = m.key.remoteJid?.endsWith('@g.us') ?? false
  m.chat    = m.key.remoteJid
  m.fromMe  = m.key.fromMe

  // Teks pesan (cover semua tipe)
  m.text =
    M?.conversation ||
    M?.extendedTextMessage?.text ||
    M?.imageMessage?.caption ||
    M?.videoMessage?.caption ||
    M?.documentMessage?.caption ||
    M?.buttonsResponseMessage?.selectedDisplayText ||
    M?.listResponseMessage?.title ||
    ''

  // Quoted message
  const ctx = M?.extendedTextMessage?.contextInfo
  if (ctx?.quotedMessage) {
    m.quoted = {
      key: {
        remoteJid: m.chat,
        fromMe: jidNormalizedUser(ctx.participant) === jidNormalizedUser(conn.user?.id),
        id: ctx.stanzaId,
        participant: ctx.participant,
      },
      message: ctx.quotedMessage,
    }
  } else {
    m.quoted = null
  }

  // ─── Helper methods ───────────────────────────────────────

  /** Balas pesan ini dengan teks */
  m.reply = (text) =>
    conn.sendMessage(m.chat, { text: String(text) }, { quoted: m })

  return m
}

/**
 * Tambahkan helper methods ke socket (conn)
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @returns conn
 */
function extendConn(conn) {
  /**
   * Kirim gambar ke JID
   * @param {string} jid
   * @param {string|Buffer} source - URL atau Buffer
   * @param {string} [caption]
   * @param {object} [quotedMsg]
   * @param {string[]} [mentions]
   */
  conn.sendImg = (jid, source, caption = '', quotedMsg = null, mentions = []) => {
    const content = typeof source === 'string'
      ? { image: { url: source }, caption }
      : { image: source, caption }
    return conn.sendMessage(
      jid,
      { ...content, ...(mentions.length ? { mentions } : {}) },
      quotedMsg ? { quoted: quotedMsg } : {}
    )
  }

  /**
   * Kirim teks ke JID
   * @param {string} jid
   * @param {string} text
   * @param {object} [quotedMsg]
   * @param {string[]} [mentions]
   */
  conn.sendText = (jid, text, quotedMsg = null, mentions = []) => {
    return conn.sendMessage(
      jid,
      { text: String(text), ...(mentions.length ? { mentions } : {}) },
      quotedMsg ? { quoted: quotedMsg } : {}
    )
  }

  return conn
}

module.exports = { smsg, extendConn }
