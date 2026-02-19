import fs from 'fs'

const WARN_FILE = './warns.json'
const MAX_WARN = 3 // cambia qui se vuoi 5 ecc.

// crea file se non esiste
if (!fs.existsSync(WARN_FILE)) fs.writeFileSync(WARN_FILE, '{}')

function loadWarns() {
  try {
    return JSON.parse(fs.readFileSync(WARN_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function saveWarns(data) {
  fs.writeFileSync(WARN_FILE, JSON.stringify(data, null, 2))
}

// prende il target da tag oppure da messaggio quotato (reply)
function getTargetJid(m) {
  if (m.mentionedJid && m.mentionedJid.length) return m.mentionedJid[0]
  if (m.quoted && (m.quoted.sender || m.quoted.participant)) return m.quoted.sender || m.quoted.participant
  const ctx = m.message?.extendedTextMessage?.contextInfo
  if (ctx?.participant) return ctx.participant
  return null
}

// verifica se un jid è owner (compatibile con global.owner in più formati)
function isTargetOwner(jid) {
  const num = String((jid || '').split('@')[0] || '').replace(/\D/g, '')
  if (!Array.isArray(global.owner)) return false

  return global.owner.some((o) => {
    const raw = Array.isArray(o) ? o[0] : o
    const on = String(raw || '').replace(/\D/g, '')
    return on && on === num
  })
}

let handler = async (m, { conn, command, args, isAdmin, isOwner }) => {
  if (!m.isGroup) return conn.reply(m.chat, '❌ Solo nei gruppi.', m)

  const cmd = (command || '').toLowerCase()

  // permessi: solo admin o owner
  const onlyStaff = () => (!isAdmin && !isOwner)

  // carica db
  let warns = loadWarns()
  if (!warns[m.chat]) warns[m.chat] = {}

  const botJid = conn.user?.jid

  // helper: blocca target protetti (owner + bot)
  const protectTarget = async (target) => {
    if (!target) return true

    if (botJid && target === botJid) {
      await conn.reply(m.chat, '🤖 Non puoi usare questo comando sul bot.', m)
      return true
    }

    if (isTargetOwner(target)) {
      await conn.reply(m.chat, '👑 Non puoi usare questo comando sugli owner del bot.', m, { mentions: [target] })
      return true
    }

    return false
  }

  // ======================
  // ⚠️ WARN
  // ======================
  if (cmd === 'warn') {
    if (onlyStaff()) return conn.reply(m.chat, '❌ Solo admin o owner.', m)

    const user = getTargetJid(m)
    if (!user) {
      return conn.reply(
        m.chat,
        'Tagga un utente o rispondi a un suo messaggio.\n\nEsempi:\n.warn @utente motivo\n(reply) .warn motivo',
        m
      )
    }

    if (await protectTarget(user)) return

    // motivo: se tag -> args[1..], se reply -> args[0..]
    const reason = (m.mentionedJid?.length ? args.slice(1) : args).join(' ').trim() || 'Nessun motivo'

    warns[m.chat][user] = (warns[m.chat][user] || 0) + 1
    const total = warns[m.chat][user]
    saveWarns(warns)

    await conn.reply(
      m.chat,
      `⚠️ *WARN assegnato!*\n\n👤 Utente: @${user.split('@')[0]}\n📌 Motivo: ${reason}\n📊 Totale: ${total}/${MAX_WARN}`,
      m,
      { mentions: [user] }
    )

    if (total >= MAX_WARN) {
      await conn.reply(m.chat, `🚫 ${MAX_WARN} warn raggiunti. Espulsione...`, m)
      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
      } catch (e) {
        await conn.reply(m.chat, '❌ Non riesco a rimuovere l’utente (sono admin?)', m)
        return
      }
      delete warns[m.chat][user]
      saveWarns(warns)
    }

    return
  }

  // ======================
  // ➖ DELWARN (toglie 1)
  // ======================
  if (cmd === 'delwarn') {
    if (onlyStaff()) return conn.reply(m.chat, '❌ Solo admin o owner.', m)

    const user = getTargetJid(m)
    if (!user) {
      return conn.reply(
        m.chat,
        'Tagga un utente o rispondi a un suo messaggio.\n\nEsempi:\n.delwarn @utente\n(reply) .delwarn',
        m
      )
    }

    if (await protectTarget(user)) return

    let current = warns[m.chat][user] || 0
    if (current <= 0) {
      return conn.reply(
        m.chat,
        `✅ @${user.split('@')[0]} non ha warn.`,
        m,
        { mentions: [user] }
      )
    }

    current -= 1

    if (current <= 0) {
      delete warns[m.chat][user]
      saveWarns(warns)
      return conn.reply(
        m.chat,
        `➖ Tolto 1 warn. Ora @${user.split('@')[0]} è a *0/${MAX_WARN}* ✅`,
        m,
        { mentions: [user] }
      )
    } else {
      warns[m.chat][user] = current
      saveWarns(warns)
      return conn.reply(
        m.chat,
        `➖ Tolto 1 warn a @${user.split('@')[0]}\n📊 Totale: *${current}/${MAX_WARN}*`,
        m,
        { mentions: [user] }
      )
    }
  }

  // ======================
  // 🎯 SETWARN (imposta numero)
  // ======================
  if (cmd === 'setwarn') {
    if (onlyStaff()) return conn.reply(m.chat, '❌ Solo admin o owner.', m)

    const user = getTargetJid(m)
    if (!user) {
      return conn.reply(
        m.chat,
        'Tagga un utente o rispondi a un suo messaggio.\n\nEsempi:\n.setwarn @utente 2\n(reply) .setwarn 2',
        m
      )
    }

    if (await protectTarget(user)) return

    // numero: se tag -> args[1], se reply -> args[0]
    let nStr = m.mentionedJid?.length ? args[1] : args[0]
    if (!nStr) {
      return conn.reply(
        m.chat,
        'Inserisci un numero.\nEsempi:\n.setwarn @utente 2\n(reply) .setwarn 2',
        m
      )
    }

    let n = Number(nStr)
    if (!Number.isFinite(n)) return conn.reply(m.chat, '❌ Numero non valido.', m)

    n = Math.floor(n)
    if (n < 0) n = 0
    if (n > MAX_WARN) n = MAX_WARN

    if (n === 0) {
      delete warns[m.chat][user]
      saveWarns(warns)
      return conn.reply(
        m.chat,
        `🎯 Impostato: @${user.split('@')[0]} → *0/${MAX_WARN}* ✅`,
        m,
        { mentions: [user] }
      )
    }

    warns[m.chat][user] = n
    saveWarns(warns)

    await conn.reply(
      m.chat,
      `🎯 Impostato: @${user.split('@')[0]} → *${n}/${MAX_WARN}*`,
      m,
      { mentions: [user] }
    )

    if (n >= MAX_WARN) {
      await conn.reply(m.chat, `🚫 ${MAX_WARN} warn raggiunti. Espulsione...`, m)
      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
      } catch {
        await conn.reply(m.chat, '❌ Non riesco a rimuovere l’utente (sono admin?)', m)
        return
      }
      delete warns[m.chat][user]
      saveWarns(warns)
    }

    return
  }

  // ======================
  // 🧹 CLEARWARN (reset totale)
  // ======================
  if (cmd === 'clearwarn') {
    if (onlyStaff()) return conn.reply(m.chat, '❌ Solo admin o owner.', m)

    const user = getTargetJid(m)
    if (!user) {
      return conn.reply(
        m.chat,
        'Tagga un utente o rispondi a un suo messaggio.\n\nEsempi:\n.clearwarn @utente\n(reply) .clearwarn',
        m
      )
    }

    if (await protectTarget(user)) return

    if (warns[m.chat][user]) {
      delete warns[m.chat][user]
      saveWarns(warns)
      return conn.reply(m.chat, `✅ Warn resettati per @${user.split('@')[0]}`, m, { mentions: [user] })
    } else {
      return conn.reply(m.chat, 'Questo utente non ha warn.', m)
    }
  }

  // ======================
  // 📊 WARNLIST (libero)
  // ======================
  if (cmd === 'warnlist') {
    const users = Object.keys(warns[m.chat] || {})
    if (users.length === 0) return conn.reply(m.chat, '✅ Nessun warn in questo gruppo.', m)

    let text = '📊 *Lista Warn*\n\n'
    let mentions = []

    for (let u of users) {
      text += `@${u.split('@')[0]} → ${warns[m.chat][u]} warn\n`
      mentions.push(u)
    }

    return conn.reply(m.chat, text.trim(), m, { mentions })
  }
}

handler.help = [
  'warn @user motivo',
  'warn (reply) motivo',
  'delwarn @user',
  'delwarn (reply)',
  'setwarn @user 2',
  'setwarn (reply) 2',
  'warnlist',
  'clearwarn @user',
  'clearwarn (reply)'
]
handler.tags = ['group']
handler.command = ['warn', 'delwarn', 'setwarn', 'warnlist', 'clearwarn']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler






