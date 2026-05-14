const pino = require('pino')
const pretty = require('pino-pretty')

const stream = pretty({
  colorize: true,
  translateTime: 'SYS:HH:MM:ss',
  ignore: 'pid,hostname',
  messageFormat: '[Zentry] {msg}',
})

const logger = pino({ level: 'info' }, stream)

module.exports = logger
