// plugins/warn.js
const { dbGet, dbSet } = require('../lib/functions')
const { isAdmin, checkBotAdmin, getMentions, getQuotedParticipant } = require('../lib/myfunc')
const { jidNormalizedUser } = require('@whiskeysockets/baileys')

const MAX_WARNS = 3

let handler = async (m, { conn, args }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Grup only!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal akses grup.') }

  const subCmd = args[0]?.toLowerCase()
  const key = `groups.${jid}.warns`
  const maxWarns = dbGet(`groups.${jid}.settings.maxWarns`, MAX_WARNS)

  // Helper: ambil target dari mention atau reply
  const getTargets = () => {
    let targets = getMentions(m)
    if (targets.length === 0) {
      const quoted = getQuotedParticipant(m)
      if (quoted) targets = [quoted]
    }
    return targets
  }

  // Helper: safe key untuk db
  const safe = (uid) => jidNormalizedUser(uid).replace(/\./g, '_')

  // Menu
  const menu = () => {
    let txt = `┌───⊷ *WARN*\n`
    txt += `│ Max : ${maxWarns}\n`
    txt += `└───────────\n\n`
    txt += `▸ *warn @user* — beri peringatan\n`
    txt += `▸ *warn reset @user*\n`
    txt += `▸ *warn list*`
    return m.reply(txt)
  }

  // ── LIST ────────────────────────────────────────────────
  if (subCmd === 'list') {
    const warns = dbGet(key, {})
    const entries = Object.entries(warns)
    if (entries.length === 0) return m.reply('✅ Tidak ada warn.')

    let txt = `┌───⊷ *WARN LIST*\n`
    for (const [uid, count] of entries) {
      txt += `│ @${uid.split('@')[0]} : *${count}/${maxWarns}*\n`
    }
    txt += `└───────────`
    return conn.sendMessage(jid, { text: txt, mentions: entries.map(([uid]) => uid) })
  }

  // ── RESET ───────────────────────────────────────────────
  if (subCmd === 'reset') {
    if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Admin only!')
    const targets = getTargets()
    if (targets.length === 0) return m.reply('❌ Mention/reply target!')

    for (const t of targets) dbSet(`${key}.${safe(t)}`, 0)
    const names = targets.map(t => `@${t.split('@')[0]}`).join(', ')
    return conn.sendMessage(jid, { text: `✅ Reset: ${names}`, mentions: targets })
  }

  // ── ADD WARN ────────────────────────────────────────────
  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Admin only!')

  const targets = getTargets()
  if (targets.length === 0) return menu()

  const botAdmin = await checkBotAdmin(conn, jid)

  for (const target of targets) {
    const current = dbGet(`${key}.${safe(target)}`, 0) + 1
    dbSet(`${key}.${safe(target)}`, current)

    if (current >= maxWarns) {
      dbSet(`${key}.${safe(target)}`, 0)
      if (botAdmin) {
        await conn.groupParticipantsUpdate(jid, [target], 'remove')
        await conn.sendMessage(jid, {
          text: `🚫 @${target.split('@')[0]} di-kick (${maxWarns}/${maxWarns})`,
          mentions: [target],
        })
      } else {
        await conn.sendMessage(jid, {
          text: `⚠️ @${target.split('@')[0]} ${current}/${maxWarns}\nBot bukan admin!`,
          mentions: [target],
        })
      }
    } else {
      await conn.sendMessage(jid, {
        text: `⚠️ @${target.split('@')[0]} *${current}/${maxWarns}*`,
        mentions: [target],
      })
    }
  }
}

handler.command = /^warn$/i
handler.help = ['warn']
handler.tags = ['group']

module.exports = handler