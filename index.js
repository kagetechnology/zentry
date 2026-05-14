const { startClient } = require('./src/core/client')
const logger = require('./src/lib/logger')
const { botName, botVersion } = require('./config')

async function main() {
  logger.info(`Starting ${botName} v${botVersion}...`)
  await startClient()
}

main().catch((err) => {
  logger.error(`Fatal error: ${err.message}`)
  process.exit(1)
})
