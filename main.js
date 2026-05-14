/**
 * main.js — Connect ke WhatsApp + Plugin Loader dengan Hot Reload
 *
 * Tanggung jawab:
 *  1. Membuat koneksi Baileys (socket + events)
 *  2. Load semua plugin saat startup
 *  3. Watch folder plugins/ → reload otomatis tanpa restart
 *     Notifikasi ke terminal + ke owner WhatsApp saat ada perubahan
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
const fs     = require('fs')
const path   = require('path')

const { extendConn }    = require('./lib/simple')
const { sessionDir, botName, botVersion, ownerNumber } = require('./config')
const logger            = require('./lib/print')
const { plugins, handleMessage, handleGroupUpdate } = require('./handler')

const PLUGINS_DIR = path.join(__dirname, 'plugins')

// ─── Simpan referensi conn aktif untuk notifikasi WA ─────────
let activeConn = null

// ═══════════════════════════════════════════════════════════════
//  SECTION 1 — Plugin Loader
// ═══════════════════════════════════════════════════════════════

/**
 * Load satu plugin dari path tertentu ke registry plugins.
 * Return info plugin yang berhasil di-load, atau null jika gagal.
 */
function loadPlugin(filePath) {
  const file = path.basename(filePath)
  try {
    // Hapus cache lama agar file terbaru dibaca
    delete require.cache[require.resolve(filePath)]

    const plugin = require(filePath)

    if (typeof plugin !== 'function') {
      logger.warn(`[PLUGIN] ${file}: tidak mengekspor fungsi, dilewati.`)
      return null
    }
    if (!plugin.command) {
      logger.warn(`[PLUGIN] ${file}: tidak punya .command, dilewati.`)
      return null
    }

    plugins.set(file, plugin)

    const cmdName = plugin.help?.[0] || file.replace('.js', '')
    const tag     = plugin.tags?.[0] || 'general'
    return { file, cmdName, tag }
  } catch (err) {
    logger.error(`[PLUGIN] Gagal load ${file}: ${err.message}`)
    return null
  }
}

/**
 * Load semua plugin dari folder plugins/ saat startup.
 */
function loadAllPlugins() {
  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
  for (const file of files) {
    const result = loadPlugin(path.join(PLUGINS_DIR, file))
    if (result) logger.info(`[PLUGIN] Dimuat: .${result.cmdName} [${result.tag}]`)
  }
  logger.info(`[PLUGIN] Total plugin aktif: ${plugins.size}`)
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 2 — Hot Reload Watcher
// ═══════════════════════════════════════════════════════════════

/**
 * Kirim notifikasi WhatsApp ke owner.
 */
async function notifyOwner(text) {
  if (!activeConn || !ownerNumber?.length) return
  const jid = ownerNumber[0].replace(/\D/g, '') + '@s.whatsapp.net'
  try {
    await activeConn.sendMessage(jid, { text })
  } catch {
    // Gagal kirim WA — tidak apa-apa, log sudah cukup
  }
}

/**
 * Pantau folder plugins/ dan reload otomatis saat ada perubahan.
 * Debounce 500ms untuk hindari trigger ganda saat save editor.
 */
function watchPlugins() {
  const debounce = new Map()

  fs.watch(PLUGINS_DIR, (eventType, filename) => {
    if (!filename || !filename.endsWith('.js')) return

    // Debounce per file
    if (debounce.has(filename)) clearTimeout(debounce.get(filename))
    debounce.set(filename, setTimeout(async () => {
      debounce.delete(filename)

      const filePath    = path.join(PLUGINS_DIR, filename)
      const fileExists  = fs.existsSync(filePath)
      const wasLoaded   = plugins.has(filename)

      // ── File dihapus ─────────────────────────────────────
      if (!fileExists && wasLoaded) {
        plugins.delete(filename)
        const msg = `🗑️ *Plugin Dihapus*\n\`${filename}\` telah dihapus dari registry.\nTotal plugin aktif: ${plugins.size}`
        logger.warn(`[PLUGIN] Dihapus: ${filename} | Total: ${plugins.size}`)
        await notifyOwner(msg)
        return
      }

      if (!fileExists) return

      // ── File baru atau diupdate ───────────────────────────
      const result = loadPlugin(filePath)
      if (!result) return

      if (!wasLoaded) {
        // Plugin baru ditambahkan
        const msg = `✅ *Plugin Baru Ditambahkan*\n\`${result.file}\`\nCommand: \`.${result.cmdName}\`\nTag: \`[${result.tag}]\`\nTotal plugin aktif: ${plugins.size}`
        logger.info(`[PLUGIN] Ditambahkan: .${result.cmdName} [${result.tag}] | Total: ${plugins.size}`)
        await notifyOwner(msg)
      } else {
        // Plugin diupdate/disave ulang
        const msg = `🔄 *Plugin Diperbarui*\n\`${result.file}\`\nCommand: \`.${result.cmdName}\`\nTag: \`[${result.tag}]\`\nReload selesai tanpa restart.`
        logger.info(`[PLUGIN] Diperbarui: .${result.cmdName} | Total: ${plugins.size}`)
        await notifyOwner(msg)
      }
    }, 500))
  })

  logger.info(`[PLUGIN] Hot reload aktif — memantau folder plugins/`)
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 3 — Start Bot (Connect Baileys)
// ═══════════════════════════════════════════════════════════════

/**
 * startBot — Membuat socket WA dan mendaftarkan semua event.
 * Dipanggil dari index.js setelah user memilih metode login.
 *
 * @param {{ authMethod: string|null, phoneNumber: string|null }} opts
 */
async function startBot({ authMethod = null, phoneNumber = null } = {}) {
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

  conn = extendConn(conn)
  activeConn = conn  // simpan referensi untuk notifikasi hot reload

  // ─── Event: simpan credentials ───────────────────────────
  conn.ev.on('creds.update', saveCreds)

  // ─── Event: status koneksi ───────────────────────────────
  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

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
      activeConn = conn
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

module.exports = { startBot, loadAllPlugins, watchPlugins }
