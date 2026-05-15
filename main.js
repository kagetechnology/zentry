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
 * Baca semua file secara rekursif dari folder
 */
function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const dirFile = path.join(dir, file)
    const dirent = fs.statSync(dirFile)
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist)
    } else {
      if (file.endsWith('.js')) {
        filelist.push(dirFile)
      }
    }
  }
  return filelist
}

/**
 * Load semua plugin dari folder plugins/ saat startup.
 */
function loadAllPlugins() {
  const files = walkSync(PLUGINS_DIR)
  for (const filePath of files) {
    const result = loadPlugin(filePath)
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
 * Pantau folder plugins/ dan reload otomatis saat ada perubahan (menggunakan chokidar).
 */
function watchPlugins() {
  const chokidar = require('chokidar')
  
  // Initialize watcher
  const watcher = chokidar.watch(PLUGINS_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true // Jangan trigger add pada startup karena sudah diload
  })

  let notifyTimer = null
  let pendingAdds = new Set()
  let pendingUpdates = new Set()
  let pendingDeletes = new Set()

  const scheduleNotification = () => {
    clearTimeout(notifyTimer)
    notifyTimer = setTimeout(async () => {
      let msg = `🔥 *Hot Reload Selesai*\n\n`
      if (pendingAdds.size > 0) msg += `✅ *Ditambahkan (${pendingAdds.size}):*\n- ${Array.from(pendingAdds).join('\n- ')}\n\n`
      if (pendingUpdates.size > 0) msg += `🔄 *Diperbarui (${pendingUpdates.size}):*\n- ${Array.from(pendingUpdates).join('\n- ')}\n\n`
      if (pendingDeletes.size > 0) msg += `🗑️ *Dihapus (${pendingDeletes.size}):*\n- ${Array.from(pendingDeletes).join('\n- ')}\n\n`
      msg += `Total plugin aktif: ${plugins.size}`

      await notifyOwner(msg.trim())

      pendingAdds.clear()
      pendingUpdates.clear()
      pendingDeletes.clear()
    }, 3000) // 3 detik debounce
  }

  // Event handler
  const handleChange = async (filePath) => {
    if (!filePath.endsWith('.js')) return
    const filename = path.basename(filePath)
    const fileExists = fs.existsSync(filePath)
    const wasLoaded = plugins.has(filename)

    // ── File dihapus ─────────────────────────────────────
    if (!fileExists && wasLoaded) {
      plugins.delete(filename)
      logger.warn(`[PLUGIN] Dihapus: ${filename} | Total: ${plugins.size}`)
      pendingDeletes.add(filename)
      scheduleNotification()
      return
    }

    if (!fileExists) return

    // ── File baru atau diupdate ───────────────────────────
    const result = loadPlugin(filePath)
    if (!result) return

    if (!wasLoaded) {
      // Plugin baru ditambahkan
      logger.info(`[PLUGIN] Ditambahkan: .${result.cmdName} [${result.tag}] | Total: ${plugins.size}`)
      pendingAdds.add(filename)
    } else {
      // Plugin diupdate/disave ulang
      logger.info(`[PLUGIN] Diperbarui: .${result.cmdName} | Total: ${plugins.size}`)
      pendingUpdates.add(filename)
    }
    
    scheduleNotification()
  }

  watcher
    .on('add', handleChange)
    .on('change', handleChange)
    .on('unlink', (filePath) => {
      const filename = path.basename(filePath)
      if (plugins.has(filename)) handleChange(filePath)
    })

  logger.info(`[PLUGIN] Hot reload (chokidar) aktif — memantau folder plugins/ dan isinya`)
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
