const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const qrcode = require('qrcode-terminal')
const readline = require('readline')
const { messageHandler, loadCommands } = require('../handlers/messageHandler')
const { groupHandler } = require('../handlers/groupHandler')
const { sessionDir, botName } = require('../../config')
const logger = require('../lib/logger')

// ─── Waktu bot mulai jalan (untuk filter pesan lama) ─────────
const BOT_START_TIME = Date.now()

// ─── Guard agar loadCommands() hanya dijalankan sekali ───────
let commandsLoaded = false

// ─── Tanya user: pakai QR atau Pairing Code ──────────────────
function askAuthMethod() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

    console.log('\n┌─────────────────────────────────────┐')
    console.log('│        Pilih Metode Login           │')
    console.log('│  [1] QR Code  (scan lewat HP)       │')
    console.log('│  [2] Pairing Code (tanpa scan)      │')
    console.log('└─────────────────────────────────────┘')

    rl.question('\nPilihan (1/2): ', (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function askPhoneNumber() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question('Masukkan nomor HP (contoh: 628xxxxxxxxxx): ', (number) => {
      rl.close()
      resolve(number.trim().replace(/\D/g, '')) // hapus karakter selain angka
    })
  })
}

async function startClient() {
  // Load command hanya sekali, bukan setiap reconnect
  if (!commandsLoaded) {
    loadCommands()
    commandsLoaded = true
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const { version } = await fetchLatestBaileysVersion()

  logger.info(`Menggunakan Baileys v${version.join('.')}`)

  // ─── Cek apakah sudah ada sesi ──────────────────────────────
  // Cek state.creds.me: sudah diisi saat pertama kali connect.
  // Tidak pakai state.creds.registered karena bisa masih false saat reconnect 503.
  const isNewSession = !state.creds.me

  // Pilih metode auth hanya jika sesi baru
  let usePairingCode = false
  let phoneNumber = null

  if (isNewSession) {
    const choice = await askAuthMethod()
    usePairingCode = choice === '2'

    if (usePairingCode) {
      phoneNumber = await askPhoneNumber()
    }
  }

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
  })

  // ─── Simpan credentials saat update ─────────────────────────
  sock.ev.on('creds.update', saveCreds)

  // ─── Handle status koneksi ───────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // Tampilkan QR code jika metode QR dipilih
    if (qr && !usePairingCode) {
      console.log('\n') // beri jarak
      qrcode.generate(qr, { small: true })
      logger.info('Scan QR code di atas dengan WhatsApp kamu!')
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = reason !== DisconnectReason.loggedOut

      logger.warn(`Koneksi terputus. Alasan: ${reason}`)

      if (shouldReconnect) {
        logger.info('Mencoba reconnect...')
        startClient()
      } else {
        logger.error('Sesi logout. Hapus folder sessions/ lalu jalankan ulang.')
      }
    }

    if (connection === 'open') {
      logger.info(`✅ ${botName} berhasil terhubung ke WhatsApp!`)
    }
  })

  // ─── Request Pairing Code jika dipilih ──────────────────────
  if (isNewSession && usePairingCode && phoneNumber) {
    // Tunggu sebentar agar socket siap
    await new Promise((r) => setTimeout(r, 3000))

    try {
      const code = await sock.requestPairingCode(phoneNumber)
      const formatted = code.match(/.{1,4}/g)?.join('-') ?? code

      console.log('\n┌─────────────────────────────────────┐')
      console.log(`│  Pairing Code: ${formatted.padEnd(21)}│`)
      console.log('└─────────────────────────────────────┘')
      logger.info('Masukkan kode di atas ke WhatsApp: Perangkat Tertaut > Tautkan Perangkat')
    } catch (err) {
      logger.error(`Gagal mendapatkan pairing code: ${err.message}`)
    }
  }

  // ─── Handle pesan masuk ──────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      // Lewati pesan lama yang masuk sebelum bot nyala (hindari Bad MAC)
      const msgTimestamp = (msg.messageTimestamp ?? 0) * 1000
      if (msgTimestamp && msgTimestamp < BOT_START_TIME) continue

      try {
        await messageHandler(sock, msg)
      } catch (err) {
        // Bad MAC / decrypt error — pesan tidak bisa dibaca, skip
        if (err.message?.includes('Bad MAC') || err.message?.includes('decrypt')) {
          logger.warn('Pesan tidak bisa didekripsi (Bad MAC), dilewati.')
        } else {
          logger.error(`Error di message handler: ${err.message}`)
        }
      }
    }
  })

  // ─── Handle member join/leave grup ───────────────────────────
  sock.ev.on('group-participants.update', async (update) => {
    try {
      await groupHandler(sock, update)
    } catch (err) {
      logger.error(`Error di group handler: ${err.message}`)
    }
  })

  return sock
}

module.exports = { startClient }
