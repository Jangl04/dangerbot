// ✅ OWNER BOT (protezione)
const BOT_OWNERS = [
  '212781816909@s.whatsapp.net',
  '390935931875@s.whatsapp.net',
  '639753512076@s.whatsapp.net',
]

// Helper: reply senza variabili non definite
function reply(conn, m, text, extra = {}) {
  // `conn.reply(jid, text, quoted, options)`
  return conn.reply(m.chat, text, m, extra)
}

// Helper: prova a estrarre un jid target da mention / reply / testo
function getTargetJid(m, text) {
  // 1) Mention
  if (m.mentionedJid && m.mentionedJid.length) return m.mentionedJid[0]

  // 2) Reply (quoted)
  if (m.quoted && m.quoted.sender) return m.quoted.sender

  // 3) Numero puro (es: 393331112233)
  if (text && /^\d{10,15}$/.test(text.trim())) return `${text.trim()}@s.whatsapp.net`

  // 4) Formato @123456...
  if (text) {
    const match = text.match(/@(\d{10,15})/)
    if (match) return `${match[1]}@s.whatsapp.net`
  }

  return null
}

var handler = async (m, { conn, text, command }) => {
  const cmd = (command || '').toLowerCase()

  // Mappa comandi -> azione
  let action = null
  let successMsg = ''
  let errorMsg = ''
  let helpMsg = ''

  if (['promote', 'promuovi', 'p'].includes(cmd)) {
    action = 'promote'
    successMsg = `『 ✅ 』 \`Utente promosso come admin.\``
    errorMsg = `『 ❌ 』 \`Errore nel promuovere l'utente.\``
    helpMsg = `『 👤 』 \`Chi vuoi promuovere? Menziona o rispondi a un messaggio.\`\nEsempi: .p @numero | .p 39333...`
  } else if (['demote', 'retrocedi', 'r'].includes(cmd)) {
    action = 'demote'
    successMsg = `『 ✅ 』 \`Utente retrocesso (non è più admin).\``
    errorMsg = `『 ❌ 』 \`Errore nel retrocedere l'utente.\``
    helpMsg = `『 👤 』 \`Chi vuoi retrocedere? Menziona o rispondi a un messaggio.\`\nEsempi: .r @numero | .r 39333...`
  } else {
    return
  }

  // ✅ SOLO owner bot possono usare questi comandi
  if (!BOT_OWNERS.includes(m.sender)) {
    return reply(conn, m, '❌ Solo gli *owner del bot* possono promuovere o retrocedere admin.')
  }

  const targetJid = getTargetJid(m, text)

  if (!targetJid) {
    return reply(conn, m, helpMsg)
  }

  // Validazione jid numero
  const num = targetJid.split('@')[0]
  if (!/^\d{10,15}$/.test(num)) {
    return reply(conn, m, `『 🩼 』 \`Menziona o inserisci un numero valido (10-15 cifre).\``)
  }

  // ✅ Non puoi modificare permessi di un altro owner
  if (BOT_OWNERS.includes(targetJid)) {
    return reply(conn, m, '❌ Non puoi modificare i permessi di un altro *owner del bot*.')
  }

  // (opzionale) evita azioni su te stesso
  // if (targetJid === m.sender) return reply(conn, m, '❌ Non puoi modificare i tuoi permessi con questo comando.')

  try {
    // Aggiorna partecipante
    await conn.groupParticipantsUpdate(m.chat, [targetJid], action)

    // Risposta con mention (così lo “tagga” anche se non hai scritto @)
    return reply(conn, m, successMsg, { mentions: [targetJid] })
  } catch (e) {
    return reply(conn, m, errorMsg)
  }
}

handler.help = ['promuovi', 'retrocedi', 'p', 'r']
handler.tags = ['gruppo']
handler.command = ['promote', 'promuovi', 'p', 'demote', 'retrocedi', 'r']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

