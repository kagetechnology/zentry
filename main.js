/**
 * main.js — Connect ke WhatsApp (Baileys socket + events)
 * Hanya bertugas membuat koneksi, me-relay event ke handler,
 * dan menangani reconnect otomatis.
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys')

const pino   = require('pino')
const qrcode = require('qrcode-terminal')

const { extendConn }    = require('./lib/simple')
const { sessionDir, botName, botVersion } = require('./config')
const logger            = require('./lib/print')
const { loadPlugins, handleMessage, handleGroupUpdate } = require('./handler')

// ─── Guard: plugin hanya di-load sekali ──────────────────────
let pluginsLoaded = false

/**
 * startBot — Membuat socket WA dan mendaftarkan semua event.
 * Dipanggil dari index.js setelah user memilih metode login.
 *
 * @param {{ authMethod: string|null, phoneNumber: string|null }} opts
 */
async function startBot({ authMethod = null, phoneNumber = null } = {}) {
  // Load plugin hanya sekali
  if (!pluginsLoaded) {
    loadPlugins()
    pluginsLoaded = true
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const { version }          = await fetchLatestBaileysVersion()

  logger.info(`Menggunakan Baileys v${version.join('.')}`)

  const usePairingCode = authMethod === '2'
  const isNewSession   = !state.creds.me

  // ─── Buat socket WA ──────────────────────────────────────
  let conn = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
  })

  // Tambah helper methods (sendImg, sendText, dll)
  conn = extendConn(conn)

  // ─── Event: simpan credentials ───────────────────────────
  conn.ev.on('creds.update', saveCreds)

  // ─── Event: status koneksi ───────────────────────────────
  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // Tampilkan QR code jika metode QR
    if (qr && !usePairingCode) {
      console.log('\n')
      qrcode.generate(qr, { small: true })
      logger.info('Scan QR code di atas dengan WhatsApp!')
    }

    if (connection === 'close') {
      const reason          = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = reason !== DisconnectReason.loggedOut
      logger.warn(`Koneksi terputus. Alasan: ${reason}`)
      if (shouldReconnect) {
        logger.info('Mencoba reconnect...')
        startBot({ authMethod, phoneNumber })
      } else {
        logger.error('Sesi logout. Hapus folder sessions/ lalu jalankan ulang.')
      }
    }

    if (connection === 'open') {
      logger.info(`✅ ${botName} v${botVersion} berhasil terhubung!`)
    }
  })

  // ─── Event: pesan masuk ──────────────────────────────────
  conn.ev.on('messages.upsert', (upsert) => handleMessage(conn, upsert))

  // ─── Event: member join/leave grup ───────────────────────
  conn.ev.on('group-participants.update', async (update) => {
    try { await handleGroupUpdate(conn, update) }
    catch (err) { logger.error(`Error group handler: ${err.message}`) }
  })

  // ─── Request pairing code jika dipilih ───────────────────
  if (isNewSession && usePairingCode && phoneNumber) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const code      = await conn.requestPairingCode(phoneNumber)
      const formatted = code.match(/.{1,4}/g)?.join('-') ?? code
      console.log('\n┌─────────────────────────────────────┐')
      console.log(`│  Pairing Code: ${formatted.padEnd(21)}│`)
      console.log('└─────────────────────────────────────┘')
      logger.info('Masukkan kode ke WhatsApp: Perangkat Tertaut > Tautkan Perangkat')
    } catch (err) {
      logger.error(`Gagal mendapatkan pairing code: ${err.message}`)
    }
  }

  return conn
}

module.exports = { startBot }
