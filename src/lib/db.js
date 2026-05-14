const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../../data/db.json')

// ─── Pastikan folder data/ ada ───────────────────────────────
function ensureDir() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ─── Baca seluruh database ───────────────────────────────────
function read() {
  ensureDir()
  if (!fs.existsSync(DB_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

// ─── Tulis seluruh database ──────────────────────────────────
function write(data) {
  ensureDir()
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * Ambil nilai dari database menggunakan dot-notation
 * @example get('groups.120363xxx.welcome.enabled', false)
 */
function get(key, defaultValue = null) {
  const db = read()
  const result = key.split('.').reduce((obj, k) => obj?.[k], db)
  return result !== undefined ? result : defaultValue
}

/**
 * Set nilai ke database menggunakan dot-notation
 * @example set('groups.120363xxx.welcome.enabled', true)
 */
function set(key, value) {
  const db = read()
  const keys = key.split('.')
  let obj = db

  for (let i = 0; i < keys.length - 1; i++) {
    if (obj[keys[i]] === undefined || typeof obj[keys[i]] !== 'object') {
      obj[keys[i]] = {}
    }
    obj = obj[keys[i]]
  }

  obj[keys[keys.length - 1]] = value
  write(db)
}

module.exports = { get, set, read, write }
