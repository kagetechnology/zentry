/**
 * index.js — Tampilan awal & pilihan cara connect
 * Hanya bertugas menampilkan banner dan meminta input dari user,
 * lalu meneruskan ke main.js untuk proses koneksi.
 */

const readline = require('readline')
const logger   = require('./lib/print')
const { botName, botVersion } = require('./config')

// ─── Banner ───────────────────────────────────────────────────
function showBanner() {
  console.clear()
  console.log('╔══════════════════════════════════════════╗')
  console.log(`║       ${botName} v${botVersion} — WhatsApp Bot         ║`)
  console.log('╠══════════════════════════════════════════╣')
  console.log('║  Dibuat dengan ❤  menggunakan Baileys    ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log()
}

// ─── Pilihan metode login ─────────────────────────────────────
function askAuthMethod() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    console.log('┌─────────────────────────────────────┐')
    console.log('│        Pilih Metode Login           │')
    console.log('│  [1] QR Code     (scan lewat HP)    │')
    console.log('│  [2] Pairing Code (tanpa scan)      │')
    console.log('└─────────────────────────────────────┘')
    rl.question('\nPilihan (1/2): ', (a) => { rl.close(); resolve(a.trim()) })
  })
}

// ─── Input nomor HP (hanya untuk pairing code) ───────────────
function askPhoneNumber() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question('Masukkan nomor HP (contoh: 628xxxxxxxxxx): ', (n) => {
      rl.close(); resolve(n.trim().replace(/\D/g, ''))
    })
  })
}

// ─── Entry point ─────────────────────────────────────────────
async function main() {
  showBanner()
  logger.info(`Starting ${botName} v${botVersion}...`)

  // Cek apakah sesi sudah ada — lewati pertanyaan jika sudah pernah login
  const fs = require('fs')
  const { sessionDir } = require('./config')
  const sessionExists = fs.existsSync(sessionDir) &&
    fs.readdirSync(sessionDir).some(f => f.startsWith('creds'))

  let authMethod = null
  let phoneNumber = null

  if (!sessionExists) {
    authMethod = await askAuthMethod()
    if (authMethod === '2') {
      phoneNumber = await askPhoneNumber()
    }
  } else {
    logger.info('Sesi ditemukan, langsung connect...')
  }

  // Serahkan ke main.js untuk proses koneksi
  const { startBot } = require('./main')
  await startBot({ authMethod, phoneNumber })
}

main().catch((err) => {
  logger.error(`Fatal error: ${err.message}`)
  process.exit(1)
})
