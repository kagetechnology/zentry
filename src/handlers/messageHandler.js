const fs = require('fs')
const path = require('path')
const { prefix } = require('../../config')
const logger = require('../lib/logger')

// ─── Auto-load semua command dari src/commands/**/*.js ───────
const commands = new Map()

function loadCommands() {
  const commandsDir = path.join(__dirname, '../commands')

  const categories = fs.readdirSync(commandsDir)

  for (const category of categories) {
    const categoryPath = path.join(commandsDir, category)

    // Pastikan itu folder, bukan file
    if (!fs.statSync(categoryPath).isDirectory()) continue

    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'))

    for (const file of files) {
      const command = require(path.join(categoryPath, file))

      if (!command.name) {
        logger.warn(`Command di ${file} tidak punya properti 'name', dilewati.`)
        continue
      }

      commands.set(command.name, command)
      logger.info(`Command dimuat: ${prefix}${command.name} [${category}]`)
    }
  }

  logger.info(`Total command: ${commands.size}`)
}

// ─── Handle pesan masuk ──────────────────────────────────────
async function messageHandler(sock, msg) {
  // Abaikan pesan dari diri sendiri atau status
  if (!msg.message) return
  if (msg.key.remoteJid === 'status@broadcast') return

  // Ambil teks pesan
  const body =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ''

  // Cek apakah pesan dimulai dengan prefix
  if (!body.startsWith(prefix)) return

  // Parse command dan argumen
  const args = body.slice(prefix.length).trim().split(/\s+/)
  const commandName = args.shift().toLowerCase()

  // Cari command
  const command = commands.get(commandName)
  if (!command) return

  // Jalankan command
  try {
    logger.info(`Menjalankan command: ${prefix}${commandName} dari ${msg.key.remoteJid}`)
    await command.execute(sock, msg, args)
  } catch (err) {
    logger.error(`Error saat menjalankan command ${commandName}: ${err.message}`)
    await sock.sendMessage(msg.key.remoteJid, {
      text: `❌ Terjadi error saat menjalankan command ini.\n\`${err.message}\``,
    })
  }
}

module.exports = { messageHandler, loadCommands }
