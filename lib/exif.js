const fs = require('fs')
const crypto = require('crypto')
const webpmux = require('node-webpmux')

async function addExif(buffer, packname, author) {
  const img = new webpmux.Image()
  await img.load(buffer)

  const json = {
    'sticker-pack-id': `com.snowcorp.stickerly.android.stickercontentprovider ${crypto.randomBytes(8).toString('hex')}`,
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    'emojis': ['😊']
  }

  const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
  const jsonBuf = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuf])
  exif.writeUIntLE(jsonBuf.length, 14, 4)

  img.exif = exif
  return await img.save(null)
}

module.exports = { addExif }
