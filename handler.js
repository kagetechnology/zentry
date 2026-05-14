const fs = require('fs')
const path = require('path')
const logger = require('./lib/print')

const PLUGINS_DIR = path.join(__dirname, 'plugins')

// Registry semua plugin yang sudah di-load
const plugins = new Map()

/**
 * Load semua plugin dari folder plugins/
 * Hanya dijalankan sekali saat startup
 */
function loadPlugins() {
  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))

  for (const file of files) {
    try {
      const pluginPath = path.join(PLUGINS_DIR, file)

      // Clear cache agar perubahan file terdeteksi saat hot reload
      delete require.cache[require.resolve(pluginPath)]

      const plugin = require(pluginPath)

      if (typeof plugin !== 'function') {
        logger.warn(`Plugin ${file} tidak mengekspor fungsi, dilewati.`)
        continue
      }

      if (!plugin.command) {
        logger.warn(`Plugin ${file} tidak punya .command, dilewati.`)
        continue
      }

      plugins.set(file, plugin)

      const cmdName = plugin.help?.[0] || file.replace('.js', '')
      const tag = plugin.tags?.[0] || 'general'
      logger.info(`Plugin dimuat: .${cmdName} [${tag}]`)

    } catch (err) {
      logger.error(`Gagal load plugin ${file}: ${err.message}`)
    }
  }

  logger.info(`Total plugin: ${plugins.size}`)
  return plugins
}

/**
 * Cari plugin yang cocok dengan command string
 * @param {string} command
 * @returns {Function|null}
 */
function findPlugin(command) {
  for (const [, plugin] of plugins) {
    if (plugin.command instanceof RegExp && plugin.command.test(command)) {
      return plugin
    }
    if (typeof plugin.command === 'string' && plugin.command === command) {
      return plugin
    }
  }
  return null
}

module.exports = { loadPlugins, findPlugin, plugins }
