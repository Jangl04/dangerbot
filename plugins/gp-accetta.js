let handler = async (m, { conn, isAdmin, isBotAdmin, args, usedPrefix, command }) => {
  if (!m.isGroup) return
  if (!isBotAdmin) return m.reply("❌ Devo essere admin per gestire richieste.")
  if (!isAdmin) return m.reply("❌ Solo admin del gruppo possono usare questo comando.")

  const groupId = m.chat

  let pending = []
  try {
    pending = await conn.groupRequestParticipantsList(groupId)
  } catch (e) {
    return m.reply("❌ Non riesco a leggere le richieste.\nAssicurati che nel gruppo sia attiva l’approvazione dei nuovi membri.")
  }

  if (!pending?.length) return m.reply("✅ Non ci sono richieste in sospeso.")

  // helper: tira fuori jid in modo robusto e pulito
  const getJid = (p) => {
    const raw = p?.jid || p?.id || p?.participant || p?.from
    if (!raw) return null
    return conn.decodeJid ? conn.decodeJid(raw) : raw
  }

  const allJids = pending.map(getJid).filter(Boolean)

  async function doUpdate(jids, action) {
    if (!jids.length) return 0
    try {
      await conn.groupRequestParticipantsUpdate(groupId, jids, action)
      return jids.length
    } catch (e) {
      // internal-server-error ecc.
      throw e
    }
  }

  // nessun argomento: menu semplice
  if (!args[0]) {
    return m.reply(
`📨 Richieste in sospeso: *${pending.length}*

Usa:
• ${usedPrefix}${command} accetta      (tutte)
• ${usedPrefix}${command} accetta 10   (prime 10)
• ${usedPrefix}${command} rifiuta      (tutte)
• ${usedPrefix}${command} accetta39    (solo +39)
• ${usedPrefix}${command} rifiuta39    (rifiuta solo +39)`
    )
  }

  const sub = (args[0] || '').toLowerCase()

  // ACCETTA
  if (sub === 'accetta') {
    const n = Number(args[1])
    const jids = Number.isFinite(n) && n > 0 ? allJids.slice(0, Math.floor(n)) : allJids
    try {
      const ok = await doUpdate(jids, 'approve')
      return m.reply(`✅ Accettate ${ok} richieste.`)
    } catch (e) {
      return m.reply(
        `❌ WhatsApp ha rifiutato l’operazione (internal-server-error).\n` +
        `Controlla che nel gruppo sia attiva l’approvazione richieste e che il bot sia admin.\n\n` +
        `Dettagli: ${e?.message || e}`
      )
    }
  }

  // RIFIUTA
  if (sub === 'rifiuta') {
    try {
      const ok = await doUpdate(allJids, 'reject')
      return m.reply(`❌ Rifiutate ${ok} richieste.`)
    } catch (e) {
      return m.reply(
        `❌ Errore nel rifiutare (internal-server-error).\n` +
        `Dettagli: ${e?.message || e}`
      )
    }
  }

  // ACCETTA SOLO +39
  if (sub === 'accetta39') {
    const jids = allJids.filter(j => j.startsWith('39'))
    if (!jids.length) return m.reply("❌ Nessuna richiesta con prefisso +39.")
    try {
      const ok = await doUpdate(jids, 'approve')
      return m.reply(`🇮🇹 Accettate ${ok} richieste con prefisso +39.`)
    } catch (e) {
      return m.reply(`❌ Errore (internal-server-error).\nDettagli: ${e?.message || e}`)
    }
  }

  // RIFIUTA SOLO +39
  if (sub === 'rifiuta39') {
    const jids = allJids.filter(j => j.startsWith('39'))
    if (!jids.length) return m.reply("❌ Nessuna richiesta con prefisso +39.")
    try {
      const ok = await doUpdate(jids, 'reject')
      return m.reply(`🇮🇹 Rifiutate ${ok} richieste con prefisso +39.`)
    } catch (e) {
      return m.reply(`❌ Errore (internal-server-error).\nDettagli: ${e?.message || e}`)
    }
  }

  return m.reply("❌ Opzione non valida. Scrivi .richieste per vedere i comandi.")
}

handler.command = ['richieste']
handler.tags = ['gruppo']
handler.help = ['richieste']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

