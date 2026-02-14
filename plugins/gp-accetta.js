let handler = async (m, { conn, isAdmin, isBotAdmin, args, usedPrefix, command }) => {
  if (!m.isGroup) return
  if (!isBotAdmin) return m.reply("❌ Devo essere admin per gestire richieste.")
  if (!isAdmin) return m.reply("❌ Solo admin del gruppo possono usare questo comando.")

  const groupId = m.chat

  let pending
  try {
    pending = await conn.groupRequestParticipantsList(groupId)
  } catch (e) {
    return m.reply("❌ Errore nel recuperare le richieste.\nAssicurati che il gruppo abbia le richieste di accesso attive.")
  }

  if (!pending || !pending.length)
    return m.reply("✅ Non ci sono richieste in sospeso.")

  // Nessun argomento → mostra stato
  if (!args[0]) {
    return m.reply(`📨 Richieste in sospeso: ${pending.length}\n\nUsa:\n${usedPrefix}${command} accetta\n${usedPrefix}${command} rifiuta\n${usedPrefix}${command} accetta39`)
  }

  // ACCETTA TUTTE
  if (args[0] === 'accetta') {
    const jidList = pending.map(p => p.jid)
    await conn.groupRequestParticipantsUpdate(groupId, jidList, 'approve')
    return m.reply(`✅ Accettate ${jidList.length} richieste.`)
  }

  // RIFIUTA TUTTE
  if (args[0] === 'rifiuta') {
    const jidList = pending.map(p => p.jid)
    await conn.groupRequestParticipantsUpdate(groupId, jidList, 'reject')
    return m.reply(`❌ Rifiutate ${jidList.length} richieste.`)
  }

  // ACCETTA SOLO +39
  if (args[0] === 'accetta39') {
    const daAccettare = pending.filter(p => p.jid.startsWith('39'))
    const jidList = daAccettare.map(p => p.jid)

    if (!jidList.length)
      return m.reply("❌ Nessuna richiesta con prefisso +39.")

    await conn.groupRequestParticipantsUpdate(groupId, jidList, 'approve')
    return m.reply(`🇮🇹 Accettate ${jidList.length} richieste con prefisso +39.`)
  }
}

handler.command = ['richieste']
handler.tags = ['gruppo']
handler.help = ['richieste', 'richieste accetta', 'richieste rifiuta', 'richieste accetta39']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
