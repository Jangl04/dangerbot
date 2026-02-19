// Plugin Moderatori - compatibile con export default handler (ESM)
// Comandi:
// .mod add @user   | (reply) .mod add
// .mod del @user   | (reply) .mod del
// .mod list
// .mods

let handler = async (m, { conn, args, usedPrefix, isAdmin, participants }) => {
  // deve essere gruppo
  if (!m.isGroup) return conn.reply(m.chat, "Questo comando funziona solo nei gruppi.", m)

  // db compatibile con la tua base
  global.db = global.db || {}
  global.db.data = global.db.data || {}
  global.db.data.mods = global.db.data.mods || {} // { [gid]: [jid] }

  const gid = m.chat
  const mods = global.db.data.mods[gid] || (global.db.data.mods[gid] = [])

  // helper: prendi target da tag o reply
  const pickTarget = () => {
    return (
      (m.mentionedJid && m.mentionedJid[0]) ||
      (m.quoted && (m.quoted.sender || m.quoted.participant)) ||
      (m.quoted && m.quoted.key && m.quoted.key.participant) ||
      null
    )
  }

  const sub = (args[0] || "").toLowerCase()

  // comando rapido lista
  if (/^mods$/i.test(m.text?.slice(usedPrefix.length)?.trim()?.split(/\s+/)[0] || "")) {
    // se la tua base non passa "command" qui, gestiamo .mods in file separato sotto.
  }

  // se è .mods gestiamo anche qui (così hai 1 solo file)
  if ((m.text || "").toLowerCase().startsWith(usedPrefix + "mods")) {
    if (!mods.length) return conn.reply(m.chat, "👮 Moderatori: 0\nNessun moderatore impostato.", m)

    const list = mods.map((jid, i) => `${i + 1}) @${jid.split("@")[0]}`).join("\n")
    return conn.sendMessage(m.chat, { text: `👮 Moderatori: ${mods.length}\n\n${list}`, mentions: mods }, { quoted: m })
  }

  // gestione moderatori: solo admin (o owner)
  // Se vuoi owner-only, dimmelo e lo stringiamo ancora.
  if (!isAdmin) return conn.reply(m.chat, "Solo admin possono gestire i moderatori.", m)

  if (sub === "list") {
    if (!mods.length) return conn.reply(m.chat, "👮 Moderatori: 0\nNessun moderatore impostato.", m)

    const list = mods.map((jid, i) => `${i + 1}) @${jid.split("@")[0]}`).join("\n")
    return conn.sendMessage(m.chat, { text: `👮 Moderatori: ${mods.length}\n\n${list}`, mentions: mods }, { quoted: m })
  }

  if (sub !== "add" && sub !== "del" && sub !== "remove") {
    return conn.reply(
      m.chat,
      `Uso:\n• ${usedPrefix}mod add @user (o reply)\n• ${usedPrefix}mod del @user (o reply)\n• ${usedPrefix}mod list\n• ${usedPrefix}mods`,
      m
    )
  }

  const target = pickTarget()
  if (!target) {
    return conn.reply(m.chat, `Tagga un utente o rispondi a un suo messaggio.\nEsempio: ${usedPrefix}mod add @user`, m)
  }

  // protezione: i moderatori NON servono per admin/owner
  // (owner = chi ha creato il gruppo o owner bot non lo sappiamo qui, quindi proteggiamo almeno gli admin)
  const isTargetAdmin = participants?.some(p => p.id === target && p.admin)
  if (isTargetAdmin) return conn.reply(m.chat, "Non ha senso impostare un admin come moderatore.", m)

  if (sub === "add") {
    if (!mods.includes(target)) mods.push(target)
    return conn.reply(m.chat, `✅ Moderatore aggiunto: @${target.split("@")[0]}`, m, { mentions: [target] })
  }

  if (sub === "del" || sub === "remove") {
    global.db.data.mods[gid] = mods.filter(x => x !== target)
    return conn.reply(m.chat, `✅ Moderatore rimosso: @${target.split("@")[0]}`, m, { mentions: [target] })
  }
}

handler.help = ['mod', 'mods']
handler.tags = ['group']

// Accetta sia "mod" che "mods" nello stesso file
handler.command = /^(mod|mods)$/i

// solo gruppo
handler.group = true

export default handler

