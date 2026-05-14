const { plugins } = require('../handler');
const { botName, botVersion, prefix } = require('../config');
const { formatUptime } = require('../lib/functions');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const arrayMenu = [
  'main',
  'group',
  'download',
  'tools'
];

const allTags = {
  'main': '🏠 Main',
  'group': '👥 Group',
  'download': '📥 Download',
  'tools': '🔧 Tools'
};

const defaultMenu = {
  before: `
Hi %name
Saya adalah sistem otomatis yang dapat membantu melakukan sesuatu, mencari dan mendapatkan data / informasi hanya melalui WhatsApp.

◦ *Library:* Baileys
◦ *Fungsi:* Asisten

┌  ◦ Uptime : %uptime
│  ◦ Tanggal : %date
│  ◦ Waktu : %time
└  ◦ Prefix : *[ %p ]*
`.trimStart(),
  header: '┌  ◦ *%category*',
  body: '│  ◦ %cmd %islimit %isPremium',
  footer: '└  ',
  after: `\n*Note:* Ketik .menu <category> untuk melihat menu spesifik\nContoh: .menu general`
};

let handler = async (m, { conn, usedPrefix: _p, args = [], command }) => {
  try {
    let package = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../package.json')).catch(_ => '{}'));
    let { exp, limit, level, role } = global.db.data.users[m.sender];
    let { min, xp, max } = levelling.xpRange(level, global.multiplier);
    let name = `@${m.sender.split`@`[0]}`;
    let teks = args[0] || '';
    
    let d = new Date(new Date() + 3600000);
    let locale = 'id';
    let date = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    let time = d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });

    let _uptime = process.uptime() * 1000;
    let uptime = clockString(_uptime);
    
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
        limit: plugin.limit,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      };
    });

    // Jika tidak ada argumen, tampilkan daftar kategori
    if (!teks) {
      let menuList = `${defaultMenu.before}\n\n┌  ◦ *DAFTAR MENU*\n`;
      for (let tag of arrayMenu) {
        if (tag && allTags[tag]) {
          menuList += `│  ◦ ${_p}menu ${tag}\n`;
        }
      }
      menuList += `└  \n\n${defaultMenu.after}`;

      let replace = {
        '%': '%',
        p: _p,
        uptime,
        name,
        date,
        time
      };

      let text = menuList.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'),
        (_, name) => '' + replace[name]);
      
      await conn.sendMessage(
        m.chat,
        {
          image: {
            url: "https://telegra.ph/file/3a34bfa58714bdef500d9.jpg",
          },
          caption: text,
          mentions: [m.sender],
        },
        { quoted: m },
      );
      return;
    }

    // Cek apakah kategori tersedia
    if (!allTags[teks]) {
      return m.reply(`Menu "${teks}" tidak tersedia.\nSilakan ketik ${_p}menu untuk melihat daftar menu.`);
    }

    let menuCategory = defaultMenu.before + '\n\n';
    
    // Tampilkan menu berdasarkan kategori yang dipilih
    if (teks === 'general' || teks === 'group' || teks === 'utility') {
      menuCategory += defaultMenu.header.replace(/%category/g, allTags[teks]) + '\n';
      
      let categoryCommands = help.filter(menu => menu.tags && menu.tags.includes(teks) && menu.help);
      for (let menu of categoryCommands) {
        for (let helpCmd of menu.help) {
          menuCategory += defaultMenu.body
            .replace(/%cmd/g, menu.prefix ? helpCmd : _p + helpCmd)
            .replace(/%islimit/g, menu.limit ? '(Ⓛ)' : '')
            .replace(/%isPremium/g, menu.premium ? '(Ⓟ)' : '') + '\n';
        }
      }
      menuCategory += defaultMenu.footer + '\n';
    } else if (teks === 'all') {
      // Untuk all, tampilkan semua kategori
      for (let tag of arrayMenu) {
        if (allTags[tag]) {
          menuCategory += defaultMenu.header.replace(/%category/g, allTags[tag]) + '\n';
          
          let categoryCommands = help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help);
          for (let menu of categoryCommands) {
            for (let helpCmd of menu.help) {
              menuCategory += defaultMenu.body
                .replace(/%cmd/g, menu.prefix ? helpCmd : _p + helpCmd)
                .replace(/%islimit/g, menu.limit ? '(Ⓛ)' : '')
                .replace(/%isPremium/g, menu.premium ? '(Ⓟ)' : '') + '\n';
            }
          }
          menuCategory += defaultMenu.footer + '\n';
        }
      }
    }

    menuCategory += '\n' + defaultMenu.after;
    
    let replace = {
      '%': '%',
      p: _p,
      uptime,
      name,
      date,
      time
    };

    let text = menuCategory.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'),
      (_, name) => '' + replace[name]);

    await conn.sendMessage(
      m.chat,
      {
        image: { url: "https://telegra.ph/file/3a34bfa58714bdef500d9.jpg" },
        caption: text,
        mentions: [m.sender],
      },
      { quoted: m },
    );
  } catch (e) {
    conn.reply(m.chat, 'Maaf, menu sedang error', m);
    console.error(e);
  }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = /^(menu|help)$/i;
handler.exp = 3;

module.exports = handler;

function clockString(ms) {
  if (isNaN(ms)) return '--';
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}