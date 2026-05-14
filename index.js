const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys')

const pino     = require('pino')
const qrcode   = require('qrcode-terminal')
const readline = require('readline')

const { loadPlugins }              = require('./handler')
const { messageHandler, groupHandler } = require('./main')
const { extendConn }               = require('./lib/simple')
const { sessionDir, botName, botVersion } = require('./config')
const logger   = require('./lib/print')

// ─── Guard: plugin hanya di-load sekali ──────────────────────
let pluginsLoaded = false

// ─── Prompt pilihan metode login ─────────────────────────────
function askAuthMethod() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    console.log('\n┌─────────────────────────────────────┐')
    console.log('│        Pilih Metode Login           │')
    console.log('│  [1] QR Code  (scan lewat HP)       │')
    console.log('│  [2] Pairing Code (tanpa scan)      │')
    console.log('└─────────────────────────────────────┘')
    rl.question('\nPilihan (1/2): ', (a) => { rl.close(); resolve(a.trim()) })
  })
}

function askPhoneNumber() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question('Masukkan nomor HP (contoh: 628xxxxxxxxxx): ', (n) => {
      rl.close(); resolve(n.trim().replace(/\D/g, ''))
    })
  })
}

// ─── Start bot ───────────────────────────────────────────────
async function start() {
  // Load plugins hanya sekali
  if (!pluginsLoaded) {
    loadPlugins()
    pluginsLoaded = true
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const { version }          = await fetchLatestBaileysVersion()

  logger.info(`Menggunakan Baileys v${version.join('.')}`)

  // Cek apakah sesi baru (belum pernah login)
  const isNewSession = !state.creds.me

  let usePairingCode = false
  let phoneNumber    = null

  if (isNewSession) {
    const choice   = await askAuthMethod()
    usePairingCode = choice === '2'
    if (usePairingCode) phoneNumber = await askPhoneNumber()
  }

  // Buat socket WA
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

  // Extend conn dengan helper methods (sendImg, sendText, dll)
  conn = extendConn(conn)

  // ─── Events ──────────────────────────────────────────────
  conn.ev.on('creds.update', saveCreds)

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // Tampilkan QR code jika metode QR
    if (qr && !usePairingCode) {
      console.log('\n')
      qrcode.generate(qr, { small: true })
      logger.info('Scan QR code di atas dengan WhatsApp!')
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = reason !== DisconnectReason.loggedOut
      logger.warn(`Koneksi terputus. Alasan: ${reason}`)
      if (shouldReconnect) {
        logger.info('Mencoba reconnect...')
        start()
      } else {
        logger.error('Sesi logout. Hapus folder sessions/ lalu jalankan ulang.')
      }
    }

    if (connection === 'open') {
      logger.info(`✅ ${botName} v${botVersion} berhasil terhubung!`)
    }
  })

  // Pesan masuk
  conn.ev.on('messages.upsert', (upsert) => messageHandler(conn, upsert))

  // Member join/leave grup
  conn.ev.on('group-participants.update', async (update) => {
    try { await groupHandler(conn, update) }
    catch (err) { logger.error(`Error group handler: ${err.message}`) }
  })

  // Request pairing code jika dipilih
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

// ─── Entry point ─────────────────────────────────────────────
const { botName: name, botVersion: version } = require('./config')
logger.info(`Starting ${name} v${version}...`)

start().catch((err) => {
  logger.error(`Fatal error: ${err.message}`)
  process.exit(1)
})
