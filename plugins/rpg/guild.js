const { dbGet, dbSet, dbRead } = require('../../lib/functions')
const { initRPG, getRandomTip } = require('../../lib/rpg')

let handler = async (m, { args, prefix, command }) => {
  let userKey = m.sender.replace(/\./g, '_')
  let user = initRPG(userKey)

  if (args.length === 0) {
    let caption = `🏰 *GUILD SYSTEM* 🏰\n\n`
    if (user.guild) {
      let g = dbGet(`guilds.${user.guild}`)
      if (g) {
        caption += `Kamu bergabung di Guild: *${g.name}*\n\nKetik *${prefix}guild info* untuk melihat detail.\nKetik *${prefix}guild donate <jumlah>* untuk nyumbang kas Guild.\nKetik *${prefix}guild leave* untuk keluar.`
      } else {
        user.guild = null
        dbSet(`users.${userKey}`, user)
        caption += `Kamu tidak tergabung dalam Guild manapun.\n\nKetik *${prefix}guild create <nama>* (Biaya: Rp 50.000)\nKetik *${prefix}guild join <nama>*`
      }
    } else {
      caption += `Kamu tidak tergabung dalam Guild manapun.\n\nKetik *${prefix}guild create <nama>* (Biaya: Rp 50.000)\nKetik *${prefix}guild join <nama>*`
    }
    return m.reply(caption)
  }

  let action = args[0].toLowerCase()
  let guildName = args.slice(1).join(' ').trim()
  let guildKey = guildName ? guildName.toLowerCase().replace(/\s+/g, '_') : ''

  // Create Guild
  if (action === 'create') {
    if (!guildName) return m.reply(`❌ Masukkan nama Guild yang ingin dibuat!\nContoh: *${prefix}guild create Akatsuki*`)
    if (user.guild) return m.reply(`❌ Kamu sudah bergabung dengan Guild *${user.guild}*. Keluar dulu jika ingin membuat yang baru.`)
    if (user.money < 50000) return m.reply(`❌ Modal pembuatan Guild adalah Rp 50.000!\nUangmu hanya Rp ${user.money.toLocaleString('id-ID')}`)
    
    let existing = dbGet(`guilds.${guildKey}`)
    if (existing) return m.reply(`❌ Guild dengan nama *${guildName}* sudah ada! Pilih nama lain.`)

    // Potong uang
    user.money -= 50000
    user.guild = guildKey
    dbSet(`users.${userKey}`, user)

    // Buat guild baru
    dbSet(`guilds.${guildKey}`, {
      name: guildName,
      owner: m.sender,
      members: [m.sender],
      bank: 0,
      level: 1
    })

    return m.reply(`🏰 *GUILD BERHASIL DIBUAT* 🏰\n\nSelamat! Kamu telah mendirikan organisasi *${guildName}*.\nAjak teman-temanmu bergabung menggunakan perintah *${prefix}guild join ${guildName}*!`)
  }

  // Join Guild
  if (action === 'join') {
    if (!guildName) return m.reply(`❌ Masukkan nama Guild yang ingin kamu masuki!\nContoh: *${prefix}guild join Akatsuki*`)
    if (user.guild) return m.reply(`❌ Kamu sudah tergabung di dalam sebuah Guild!`)

    let guild = dbGet(`guilds.${guildKey}`)
    if (!guild) return m.reply(`❌ Guild *${guildName}* tidak ditemukan!`)

    if (guild.members.includes(m.sender)) return m.reply(`❌ Kamu sudah menjadi member di Guild ini.`)
    
    // Max member: level * 5
    let maxMembers = guild.level * 5
    if (guild.members.length >= maxMembers) return m.reply(`❌ Guild *${guild.name}* sudah penuh! (Kapasitas: ${maxMembers})`)

    guild.members.push(m.sender)
    dbSet(`guilds.${guildKey}`, guild)
    
    user.guild = guildKey
    dbSet(`users.${userKey}`, user)

    return m.reply(`🏰 *JOIN GUILD BERHASIL*\n\nKamu telah resmi menjadi anggota dari Guild *${guild.name}*!`)
  }

  // Guild Info
  if (action === 'info') {
    if (!user.guild) return m.reply(`❌ Kamu tidak tergabung dalam Guild manapun.`)
    let guild = dbGet(`guilds.${user.guild}`)
    if (!guild) {
      user.guild = null
      dbSet(`users.${userKey}`, user)
      return m.reply(`❌ Guild tidak ditemukan. Sepertinya Guild ini sudah dibubarkan.`)
    }

    let ownerJid = guild.owner
    let ownerName = `@${ownerJid.split('@')[0]}`

    let memberList = guild.members.map((j, i) => `${i + 1}. @${j.split('@')[0]}`).join('\n')

    let caption = `🏰 *INFO GUILD: ${guild.name}* 🏰\n\n👑 *Ketua:* ${ownerName}\n📊 *Level:* ${guild.level}\n🏦 *Kas Guild:* Rp ${guild.bank.toLocaleString('id-ID')}\n👥 *Anggota:* (${guild.members.length} / ${guild.level * 5})\n\n${memberList}`
    
    return m.reply(caption, null, { mentions: guild.members })
  }

  // Donate Kas Guild
  if (action === 'donate' || action === 'donasi') {
    if (!user.guild) return m.reply(`❌ Kamu tidak tergabung dalam Guild manapun.`)
    let amount = parseInt(args[1])
    if (isNaN(amount) || amount <= 0) return m.reply(`❌ Jumlah donasi tidak valid!\nContoh: *${prefix}guild donate 5000*`)

    if (user.money < amount) return m.reply(`❌ Uangmu tidak cukup!`)

    let guild = dbGet(`guilds.${user.guild}`)
    if (!guild) return m.reply(`❌ Guild tidak ditemukan.`)

    // Potong uang, tambah kas guild
    user.money -= amount
    guild.bank += amount

    // Cek level up guild (Setiap kelipatan 50.000 kas, naik 1 level)
    let expectedLevel = Math.floor(guild.bank / 50000) + 1
    let levelUpMsg = ''
    if (expectedLevel > guild.level) {
      guild.level = expectedLevel
      levelUpMsg = `\n\n🌟 *GUILD LEVEL UP!* 🌟\nLevel Guild naik menjadi Level ${guild.level}! Kapasitas member bertambah!`
    }

    dbSet(`users.${userKey}`, user)
    dbSet(`guilds.${user.guild}`, guild)

    return m.reply(`💸 *DONASI GUILD BERHASIL*\n\nKamu menyumbang Rp ${amount.toLocaleString('id-ID')} ke kas Guild *${guild.name}*. Terimakasih atas kontribusimu!${levelUpMsg}`)
  }

  // Leave Guild
  if (action === 'leave' || action === 'keluar') {
    if (!user.guild) return m.reply(`❌ Kamu tidak tergabung dalam Guild manapun.`)
    let guild = dbGet(`guilds.${user.guild}`)
    if (!guild) {
      user.guild = null
      dbSet(`users.${userKey}`, user)
      return m.reply(`❌ Kamu sudah keluar.`)
    }

    if (guild.owner === m.sender) {
      return m.reply(`❌ Kamu adalah Ketua Guild! Jika ingin keluar, bubarkan guild ini atau ini fitur yang belum tersedia.`)
    }

    guild.members = guild.members.filter(j => j !== m.sender)
    dbSet(`guilds.${user.guild}`, guild)
    
    user.guild = null
    dbSet(`users.${userKey}`, user)

    return m.reply(`🚶‍♂️ Kamu telah keluar dari Guild *${guild.name}*.`)
  }

  return m.reply(`❌ Perintah Guild tidak dikenali.`)
}

handler.help = ['guild']
handler.tags = ['rpg']
handler.command = /^(guild|clan)$/i

module.exports = handler
