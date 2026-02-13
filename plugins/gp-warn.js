import fs from 'fs'

const WARN_FILE = './warns.json'

// crea file se non esiste
if (!fs.existsSync(WARN_FILE)) {
  fs.writeFileSync(WARN_FILE, '{}')
}

function loadWarns() {
  return JSON.parse(fs.readFileSync(WARN_FILE))
}

function saveWarns(data) {
  fs.writeFileSync(WARN_FILE, JSON.stringify(data, null, 2))
}

let handler = async (m, { conn, participants, command, args, isAdmin, isOwner }) => {

  if (!m.isGroup) return conn.reply(m.chat, '❌ Solo nei gruppi.', m)

  let warns = loadWarns()
  if (!warns[m.chat]) warns[m.chat] = {}

  // ======================
  // ⚠️ WARN
  // ======================
  if (command === 'warn') {
    if (!isAdmin && !isOwner)
      return conn.reply(m.chat, '❌ Solo admin o owner.', m)

    let user = m.mentionedJid?.[0]
    if (!user)
      return conn.reply(m.chat, 'Tagga un utente.\nEsempio: !warn @utente motivo', m)

    let reason = args.slice(1).join(' ') || 'Nessun motivo'

    warns[m.chat][user] = (warns[m.chat][user] || 0) + 1
    let total = warns[m.chat][user]

    saveWarns(warns)

    await conn.reply(m.chat,
`⚠️ *WARN assegnato!*

👤 Utente: @${user.split('@')[0]}
📌 Motivo: ${reason}
📊 Totale: ${total}/3`,
m,
{ mentions: [user] })

    // Kick automatico
    if (total >= 3) {
      await conn.reply(m.chat, '🚫 3 warn raggiunti. Espulsione...', m)
      await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
      delete warns[m.chat][user]
      saveWarns(warns)
    }
  }

  // ======================
  // 📊 WARNLIST
  // ======================
  if (command === 'warnlist') {
    let users = Object.keys(warns[m.chat])
    if (users.length === 0)
      return conn.reply(m.chat, '✅ Nessun warn in questo gruppo.', m)

    let text = '📊 *Lista Warn*\n\n'
    let mentions = []

    for (let user of users) {
      text += `@${user.split('@')[0]} → ${warns[m.chat][user]} warn\n`
      mentions.push(user)
    }

    conn.reply(m.chat, text, m, { mentions })
  }

  // ======================
  // 🧹 CLEARWARN
  // ======================
  if (command === 'clearwarn') {
    if (!isAdmin && !isOwner)
      return conn.reply(m.chat, '❌ Solo admin o owner.', m)

    let user = m.mentionedJid?.[0]
    if (!user)
      return conn.reply(m.chat, 'Tagga un utente.\nEsempio: !clearwarn @utente', m)

    if (warns[m.chat][user]) {
      delete warns[m.chat][user]
      saveWarns(warns)
      return conn.reply(m.chat, `✅ Warn resettati per @${user.split('@')[0]}`, m, { mentions: [user] })
    } else {
      return conn.reply(m.chat, 'Questo utente non ha warn.', m)
    }
  }
}

handler.help = ['warn @user motivo', 'warnlist', 'clearwarn @user']
handler.tags = ['group']
handler.command = ['warn', 'warnlist', 'clearwarn']

export default handler



