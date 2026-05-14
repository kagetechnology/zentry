// plugins/warn.js
const { dbGet, dbSet } = require('../lib/functions')
const { isAdmin, checkBotAdmin, getMentions, getQuotedParticipant } = require('../lib/myfunc')
const { jidNormalizedUser } = require('@whiskeysockets/baileys')

const MAX_WARNS = 3

let handler = async (m, { conn, args }) => {
  const jid = m.chat
  if (!m.isGroup) return m.reply('❌ Hanya bisa digunakan di dalam grup!')

  let groupMeta
  try { groupMeta = await conn.groupMetadata(jid) }
  catch { return m.reply('❌ Gagal ambil data grup.') }

  const subCmd = args[0]?.toLowerCase()

  // ── Warn List ──────────────────────────────────────────────
  if (subCmd === 'list') {
    const warns = dbGet(`groups.${jid}.warns`, {})
    const entries = Object.entries(warns)
    if (entries.length === 0) return m.reply('✅ Tidak ada member yang memiliki warn.')

    const maxWarns = dbGet(`groups.${jid}.settings.maxWarns`, MAX_WARNS)
    let text = `*⚠️ Warn List*\nMax warn: ${maxWarns}\n\n`
    for (const [uid, count] of entries) {
      text += `@${uid.split('@')[0]} — *${count}/${maxWarns}* warn\n`
    }

    const mentions = entries.map(([uid]) => uid)
    return conn.sendMessage(jid, { text: text.trim(), mentions })
  }

  // ── Reset ──────────────────────────────────────────────────
  if (subCmd === 'reset') {
    if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Hanya admin yang bisa reset warn!')

    let targets = getMentions(m)
    if (targets.length === 0) {
      const quoted = getQuotedParticipant(m)
      if (quoted) targets = [quoted]
    }

    if (targets.length === 0) return m.reply('❌ Mention atau reply member yang ingin di-reset warnnya!')

    for (const t of targets) {
      dbSet(`groups.${jid}.warns.${jidNormalizedUser(t).replace(/\./g, '_')}`, 0)
    }
    const names = targets.map(t => `@${t.split('@')[0]}`).join(', ')
    return conn.sendMessage(jid, {
      text: `✅ Warn di-reset untuk: ${names}`,
      mentions: targets,
    })
  }

  // ── Add Warn ───────────────────────────────────────────────
  if (!isAdmin(groupMeta, m.sender)) return m.reply('❌ Hanya admin yang bisa warn member!')

  const botAdmin = await checkBotAdmin(conn, jid)

  let targets = getMentions(m)
  if (targets.length === 0) {
    const quoted = getQuotedParticipant(m)
    if (quoted) targets = [quoted]
  }

  if (targets.length === 0) {
    return m.reply(
      `*⚠️ Warn System*\n\n` +
      `▸ \`.warn @user\` — Beri peringatan\n` +
      `▸ \`.warn reset @user\` — Reset warn\n` +
      `▸ \`.warn list\` — Lihat semua warn\n\n` +
      `Max warn: ${dbGet(`groups.${jid}.settings.maxWarns`, MAX_WARNS)} (otomatis kick)`
    )
  }

  const maxWarns = dbGet(`groups.${jid}.settings.maxWarns`, MAX_WARNS)

  for (const target of targets) {
    const safeKey = jidNormalizedUser(target).replace(/\./g, '_')
    const current = dbGet(`groups.${jid}.warns.${safeKey}`, 0) + 1
    dbSet(`groups.${jid}.warns.${safeKey}`, current)

    if (current >= maxWarns) {
      // Auto kick
      dbSet(`groups.${jid}.warns.${safeKey}`, 0)
      if (botAdmin) {
        await conn.groupParticipantsUpdate(jid, [target], 'remove')
        await conn.sendMessage(jid, {
          text: `🚫 @${target.split('@')[0]} telah di-kick!\nMencapai batas maximum warn (${maxWarns}/${maxWarns}).`,
          mentions: [target],
        })
      } else {
        await conn.sendMessage(jid, {
          text: `⚠️ @${target.split('@')[0]} mencapai batas warn (${current}/${maxWarns})!\n_(Bot bukan admin, tidak bisa auto-kick)_`,
          mentions: [target],
        })
      }
    } else {
      await conn.sendMessage(jid, {
        text: `⚠️ *Peringatan!*\n@${target.split('@')[0]} mendapat warn *${current}/${maxWarns}*.\nJika mencapai ${maxWarns} warn, akan otomatis di-kick!`,
        mentions: [target],
      })
    }
  }
}

handler.command = /^warn$/i
handler.help    = ['warn @user | warn reset @user | warn list']
handler.tags    = ['group']

module.exports = handler
