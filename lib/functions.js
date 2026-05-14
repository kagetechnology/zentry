const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../data/db.json')

// ─── Database (JSON file-based) ───────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function dbRead() {
  ensureDir(path.dirname(DB_PATH))
  if (!fs.existsSync(DB_PATH)) return {}
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) }
  catch { return {} }
}

function dbWrite(data) {
  ensureDir(path.dirname(DB_PATH))
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * Sanitize JID untuk digunakan sebagai key DB
 * Mengganti '.' dengan '_' agar tidak bentrok dengan dot-notation
 * @example jidKey('120363@g.us') → '120363@g_us'
 */
function jidKey(jid) {
  return jid.replace(/\./g, '_')
}

/**
 * Split key string menjadi array path,
 * menangani JID yang mengandung titik (contoh: 120363@g.us)
 */
function splitKey(key) {
  // Pecah berdasarkan titik, tapi gabungkan kembali segmen JID (yang mengandung @)
  const parts = key.split('.')
  const result = []
  let i = 0
  while (i < parts.length) {
    const part = parts[i]
    // Jika bagian ini mengandung '@' dan bagian berikutnya tidak mengandung '@',
    // kemungkinan ini bagian JID yang terpotong (misal: '120363@g' + 'us')
    if (part.includes('@') && i + 1 < parts.length && !parts[i + 1].includes('@') && !['welcome','goodbye','enabled','text','image','groups','us'].includes(parts[i + 1])) {
      result.push(part + '.' + parts[i + 1])
      i += 2
    } else {
      result.push(part)
      i++
    }
  }
  return result
}

/**
 * Ambil nilai dari DB dengan dot-notation
 * Support JID dengan titik (120363@g.us)
 */
function dbGet(key, defaultValue = null) {
  const db = dbRead()
  const result = splitKey(key).reduce((o, k) => o?.[k], db)
  return result !== undefined ? result : defaultValue
}

/**
 * Set nilai ke DB dengan dot-notation
 * Support JID dengan titik (120363@g.us)
 */
function dbSet(key, value) {
  const db = dbRead()
  const keys = splitKey(key)
  let obj = db
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') obj[keys[i]] = {}
    obj = obj[keys[i]]
  }
  obj[keys[keys.length - 1]] = value
  dbWrite(db)
}

// ─── General Utilities ────────────────────────────────────────

/** Delay async */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

/** Pilih item random dari array */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Format bytes ke string yang readable */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/** Format tanggal ke string lokal */
function formatDate(date = new Date()) {
  return date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
}

/** Runtime uptime dalam format readable */
function formatUptime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h ${m % 60}m ${s % 60}s`
}

module.exports = {
  dbGet, dbSet, dbRead, dbWrite, jidKey,
  sleep, pickRandom, formatBytes, formatDate, formatUptime,
}
