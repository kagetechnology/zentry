const { plugins } = require('../../handler')
const { botName, botVersion, prefix } = require('../../config')
const fs = require('fs')
const path = require('path')

const arrayMenu = [
  'main',
  'group',
  'download',
  'tools',
  'search',
  'ai',
  'game',
  'rpg',
  'utility',
  'media',
  'admin',
  'owner'
]

const allTags = {
  'main': '🏠 Main',
  'group': '👥 Group',
  'download': '📥 Download',
  'tools': '🔧 Tools',
  'search': '🔍 Search',
  'ai': '🤖 AI & ChatGPT',
  'game': '🎮 Games',
  'rpg': '⚔️ RPG & Economy',
  'utility': '🛠️ Utility',
  'media': '🎞️ Media',
  'admin': '🛡️ Admin',
  'owner': '👑 Owner'
}

const defaultMenu = {
  before: `
👋 Halo %name!
Saya adalah *Zentry*, asisten otomatis yang siap membantumu di WhatsApp.

┌  ◦ *Library:* Baileys
│  ◦ *Versi:* ${botVersion}
│  ◦ *Uptime:* %uptime
└  ◦ *Prefix:* [ %p ]
`.trimStart(),
  header: '┌  ◦ *%category*',
  body: '│  ◦ %cmd',
  footer: '└  ',
  after: `\n*Note:* Ketik \`%pmenu <kategori>\` untuk melihat menu spesifik\nContoh: \`%pmenu group\``
}

let handler = async (m, { conn, prefix: _p, args = [], command }) => {
  try {
    let name = `@${m.sender.split('@')[0]}`
    let teks = args[0] ? args[0].toLowerCase() : ''
    
    // Auto detect category from command alias (e.g. .groupmenu -> group)
    if (!teks && command.endsWith('menu') && command !== 'menu') {
      teks = command.replace('menu', '')
    }
    
    let _uptime = process.uptime() * 1000
    let uptime = clockString(_uptime)
    
    // Convert Map values to array
    let helpArray = Array.from(plugins.values()).map(plugin => {
      return {
        help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
      }
    })

    // Jika tidak ada argumen, tampilkan daftar kategori
    if (!teks) {
      let menuList = `${defaultMenu.before}\n\n┌  ◦ *DAFTAR MENU*\n`
      for (let tag of arrayMenu) {
        if (allTags[tag]) {
          menuList += `│  ◦ ${_p}menu ${tag}\n`
        }
      }
      menuList += `└  \n\n${defaultMenu.after}`

      let text = menuList
        .replace(/%name/g, name)
        .replace(/%uptime/g, uptime)
        .replace(/%p/g, _p)
      
      await conn.sendMessage(m.chat, {
        image: { url: "https://telegra.ph/file/3a34bfa58714bdef500d9.jpg" },
        caption: text,
        mentions: [m.sender]
      }, { quoted: m })
      return
    }

    // Tampilkan menu berdasarkan kategori (atau all)
    let isAll = teks === 'all'
    if (!allTags[teks] && !isAll) {
      return m.reply(`❌ Kategori "${teks}" tidak tersedia.\nKetik \`${_p}menu\` untuk melihat daftar kategori.`)
    }

    let menuCategory = defaultMenu.before + '\n\n'
    let tagsToLoop = isAll ? arrayMenu : [teks]

    for (let tag of tagsToLoop) {
      if (!allTags[tag]) continue
      
      let categoryCommands = helpArray.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help)
      if (categoryCommands.length === 0) continue

      menuCategory += defaultMenu.header.replace(/%category/g, allTags[tag]) + '\n'
      for (let menu of categoryCommands) {
        for (let helpCmd of menu.help) {
          if (!helpCmd) continue
          menuCategory += defaultMenu.body.replace(/%cmd/g, _p + helpCmd) + '\n'
        }
      }
      menuCategory += defaultMenu.footer + '\n\n'
    }

    menuCategory += defaultMenu.after

    let text = menuCategory
      .replace(/%name/g, name)
      .replace(/%uptime/g, uptime)
      .replace(/%p/g, _p)

    await conn.sendMessage(m.chat, {
      image: { url: "https://telegra.ph/file/3a34bfa58714bdef500d9.jpg" },
      caption: text.trim(),
      mentions: [m.sender]
    }, { quoted: m })

  } catch (e) {
    m.reply(`❌ Maaf, menu sedang error: ${e.message}`)
    console.error(e)
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = /^(menu|help|allmenu|mainmenu|groupmenu|downloadmenu|toolsmenu|searchmenu|aimenu|gamemenu|rpgmenu|utilitymenu|mediamenu|adminmenu|ownermenu)$/i

module.exports = handler

function clockString(ms) {
  if (isNaN(ms)) return '--'
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}