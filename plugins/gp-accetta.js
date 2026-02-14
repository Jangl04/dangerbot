const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function normalizeJid(conn, raw) {
  if (!raw) return null

  // decodeJid se esiste (nel tuo bot esiste)
  let j = conn.decodeJid ? conn.decodeJid(raw) : raw

  // alcuni id arrivano tipo "39333xxxx:12@s.whatsapp.net" -> togli ":12"
  const [left, right] = j.split('@')
  const phone = (left || '').replace(/:\d+$/, '')
  if (!phone) return null

  return `${phone}@${right || 's.whatsapp.net'}`
}

let handler = async (m, { conn, isAdmin, isBotAdmin, args, usedPrefix, command }) => {
  if (!m.isGroup) return
  if (!isBotAdmin) return m.reply("❌ Devo essere admin per gestire richieste.")
  if (!isAdmin) return m.reply("❌ Solo admin del gruppo possono usare questo comando.")

  const groupId = m.chat

  let pending
  try {
    pending = await conn.groupRequestParticipantsList(groupId)
  } catch (e) {
    return m.reply("❌ Non riesco a leggere le richieste. Controlla che l’approvazione richieste sia attiva.")
  }

  if (!pending?.length) return m.reply("✅ Non ci sono richieste in sospeso.")

  // prendi jid in modo compatibile con diverse versioni
  const rawJids = pending.map(p => p?.jid || p?.id || p?.participant || p?.from).filter(Boolean)
  const jids = rawJids.map(j => normalizeJid(conn, j)).filter(Boolean)

  if (!args[0]) {
    return m.reply(
`📨 Richieste in sospeso: *${jids.length}*

Comandi:
• ${usedPrefix}${command} accetta        (tutte, una per volta)
• ${usedPrefix}${command} accetta 5      (prime 5)
• ${usedPrefix}${command} rifiuta        (tutte, una per volta)
• ${usedPrefix}${command} accetta39      (solo +39)
• ${usedPrefix}${command} rifiuta39      (solo +39)`
    )
  }

  const sub = (args[0] || '').toLowerCase()

  async function processOneByOne(list, action) {
    let ok = 0
    for (const jid of list) {
      try {
        await conn.groupRequestParticipantsUpdate(groupId, [jid], action)
        ok++
        await sleep(600) // evita rifiuti/limiti
      } catch (e) {
        // se vuoi, puoi anche loggare e continuare
        console.log('[RICHIESTE] errore su', jid, e?.message || e)
        // continua sugli altri
        await sleep(600)
      }
    }
    return ok
  }

  if (sub === 'accetta') {
    const n = Number(args[1])
    const list = Number.isFinite(n) && n > 0 ? jids.slice(0, Math.floor(n)) : jids

    const ok = await processOneByOne(list, 'approve')
    return m.reply(`✅ Accettate ${ok}/${list.length} richieste.`)
  }

  if (sub === 'rifiuta') {
    const ok = await processOneByOne(jids, 'reject')
    return m.reply(`❌ Rifiutate ${ok}/${jids.length} richieste.`)
  }

  if (sub === 'accetta39') {
    const list = jids.filter(j => j.startsWith('39'))
    if (!list.length) return m.reply("❌ Nessuna richiesta con prefisso +39.")
    const ok = await processOneByOne(list, 'approve')
    return m.reply(`🇮🇹 Accettate ${ok}/${list.length} richieste +39.`)
  }

  if (sub === 'rifiuta39') {
    const list = jids.filter(j => j.startsWith('39'))
    if (!list.length) return m.reply("❌ Nessuna richiesta con prefisso +39.")
    const ok = await processOneByOne(list, 'reject')
    return m.reply(`🇮🇹 Rifiutate ${ok}/${list.length} richieste +39.`)
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


