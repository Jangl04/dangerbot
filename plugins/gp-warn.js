import fs from 'fs'

const WARN_FILE = './warns.json'
const MAX_WARN = 3 // cambia qui se vuoi 5, 10, ecc.

// crea file se non esiste
if (!fs.existsSync(WARN_FILE)) {
  fs.writeFileSync(WARN_FILE, '{}')
}

function loadWarns() {
  return JSON.parse(fs.readFileSync(WARN_FILE, 'utf-8'))
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

let handler = async (m, { conn, command, args, isAdmin, isOwner }) => {
  if (!m.isGroup) return conn.reply(m.chat, '❌ Solo nei gruppi.', m)

  let warns = loadWarns()
  if (!warns[m.chat]) warns[m.chat] = {}

  const onlyStaff = () => (!isAdmin && !isOwner)
  const needTarget = (txt) =>
    conn.reply(
      m.chat,
      txt ||
        `Tagga un utente o rispondi a un suo messaggio.\n\nEsempi:\n!${command} @utente ...\n(reply) !${command} ...`,
      m
    )

  // ======================
  // ⚠️ WARN
  // ======================
  if (command === 'warn') {
    if (onlyStaff()) return conn.reply(m.chat, '❌ Solo admin o owner.', m)

    let user = getTargetJid(m)
    if (!user) return needTarget('Tagga un utente o rispondi a un suo messaggio.\n\nEsempi:\n!warn @utente motivo\n(reply) !warn motivo')

    // motivo: se tagghi -> args[1..], se reply -> args[0..]
    let reason = (m.mentionedJid?.length ? args.slice(1) : args).join(' ') || 'Nessun motivo'

    warns[m.chat][user] = (warns[m.chat][user] || 0) + 1
    let total = warns[m.chat][user]
    saveWarns(warns)

    await conn.reply(
      m.chat,
      `⚠️ *WARN assegnato!*\n\n👤 Utente: @${user.split('@')[0]}\n📌 Motivo: ${reason}\n📊 Totale: ${total}/${MAX_WARN}`,
      m,
      { mentions: [user] }
    )

    if (total >= MAX_WARN) {
      await conn.reply(m.chat, `🚫 ${MAX_WARN} warn raggiunti. Espulsione...`, m)
      await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
      delete warns[m.chat][user]
      saveWarns(warns)
    }

    return
  }

  // ======================
  // ➖ DELWARN (toglie 1)
  // ======================
  if (command === 'delwarn') {
    if (onlyStaff()) return conn.reply(m.chat, '❌ Solo admin o owner.', m)

    let user = getTargetJid(m)
    if (!user) return needTarget('Tagga un utente o rispondi a un suo messaggio.\n\nEsempi:\n!delwarn @utente\n(reply) !delwarn')

    let current = warns[m.chat][user] || 0
    if (current <= 0)
      return conn.reply(m.chat, `✅ @${user.split('@')[0]} non ha warn.`, m, { mentions: [user] })

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
  if (command === 'setwarn') {
    if (onlyStaff()) return conn.reply(m.chat, '❌ Solo admin o owner.', m)

    let user = getTargetJid(m)
    if (!user) return needTarget('Tagga un utente o rispondi a un suo messaggio.\n\nEsempi:\n!setwarn @utente 2\n(reply) !setwarn 2')

    // numero: se tag -> args[1], se reply -> args[0]
    let nStr = m.mentionedJid?.length ? args[1] : args[0]
    if (!nStr) return conn.reply(m.chat, `Inserisci un numero.\nEsempi:\n!setwarn @utente 2\n(reply) !setwarn 2`, m)

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

    // se impostano a MAX_WARN, kick (coerenza con sistema)
    if (n >= MAX_WARN) {
      await conn.reply(m.chat, `🚫 ${MAX_WARN} warn raggiunti. Espulsione...`, m)
      await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
      delete warns[m.chat][user]
      saveWarns(warns)
    }

    return
  }

  // ======================
  // 📊 WARNLIST
  // ======================
  if (command === 'warnlist') {
    let users = Object.keys(warns[m.chat] || {})
    if (users.length === 0) return conn.reply(m.chat, '✅ Nessun warn in questo gruppo.', m)

    let text = '📊 *Lista Warn*\n\n'
    let mentions = []

    for (let u of users) {
      text += `@${u.split('@')[0]} → ${warns[m.chat][u]} warn\n`
      mentions.push(u)
    }

    return conn.reply(m.chat, text.trim(), m, { mentions })
  }

  // ======================
  // 🧹 CLEARWARN (reset totale)
  // ======================
  if (command === 'clearwarn') {
    if (onlyStaff()) return conn.reply(m.chat, '❌ Solo admin o owner.', m)

    let user = getTargetJid(m)
    if (!user) return needTarget('Tagga un utente o rispondi a un suo messaggio.\n\nEsempi:\n!clearwarn @utente\n(reply) !clearwarn')

    if (warns[m.chat][user]) {
      delete warns[m.chat][user]
      saveWarns(warns)
      return conn.reply(m.chat, `✅ Warn resettati per @${user.split('@')[0]}`, m, { mentions: [user] })
    } else {
      return conn.reply(m.chat, 'Questo utente non ha warn.', m)
    }
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

export default handler





