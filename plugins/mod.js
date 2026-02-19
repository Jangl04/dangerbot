// plugins/moderatori.js
// Moderatori + Ordine Gruppo (comandi in italiano)
// Compatibile con: export default handler (ESM) + global.db.data

function ensureDB() {
  global.db = global.db || {}
  global.db.data = global.db.data || {}
  global.db.data.mods = global.db.data.mods || {}   // { [gid]: [jid] }
  global.db.data.warns = global.db.data.warns || {} // { ["gid:jid"]: number }
}

function getMods(gid) {
  ensureDB()
  return global.db.data.mods[gid] || (global.db.data.mods[gid] = [])
}

function warnKey(gid, jid) {
  return `${gid}:${jid}`
}

// prende target da tag o reply
function pickTarget(m) {
  return (
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && (m.quoted.sender || m.quoted.participant)) ||
    (m.quoted && m.quoted.key && m.quoted.key.participant) ||
    null
  )
}

function isTargetAdmin(participants, jid) {
  return !!participants?.some(p => p.id === jid && p.admin)
}

function isModerator(gid, jid) {
  return getMods(gid).includes(jid)
}

// I moderatori NON possono colpire admin
function modCanTouch(participants, actorIsMod, targetJid) {
  if (!actorIsMod) return true
  if (isTargetAdmin(participants, targetJid)) return false
  return true
}

let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin, participants }) => {
  if (!m.isGroup) return conn.reply(m.chat, "Questo comando funziona solo nei gruppi.", m)

  ensureDB()

  const gid = m.chat
  const mods = getMods(gid)
  const actorIsMod = isModerator(gid, m.sender)

  // ====== MODS: lista ======
  if (command === "mods") {
    if (!mods.length) return conn.reply(m.chat, "👮 Moderatori: 0\nNessun moderatore impostato.", m)
    const list = mods.map((jid, i) => `${i + 1}) @${jid.split("@")[0]}`).join("\n")
    return conn.sendMessage(m.chat, { text: `👮 Moderatori: ${mods.length}\n\n${list}`, mentions: mods }, { quoted: m })
  }

  // ====== MOD: gestione moderatori (solo admin) ======
  if (command === "mod") {
    if (!isAdmin) return conn.reply(m.chat, "Solo admin possono gestire i moderatori.", m)

    const sub = (args[0] || "").toLowerCase()
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

    const target = pickTarget(m)
    if (!target) return conn.reply(m.chat, "Tagga un utente o rispondi a un suo messaggio.", m)

    // Evita di mettere admin tra i moderatori (inutile)
    if (isTargetAdmin(participants, target)) {
      return conn.reply(m.chat, "Quell'utente è già admin: non serve impostarlo come moderatore.", m)
    }

    if (sub === "add") {
      if (!mods.includes(target)) mods.push(target)
      return conn.reply(m.chat, `✅ Moderatore aggiunto: @${target.split("@")[0]}`, m, { mentions: [target] })
    }

    if (sub === "del" || sub === "remove") {
      global.db.data.mods[gid] = mods.filter(x => x !== target)
      return conn.reply(m.chat, `✅ Moderatore rimosso: @${target.split("@")[0]}`, m, { mentions: [target] })
    }
  }

  // ====== CHIUSO / APERTO (solo admin; mod non lo metto per sicurezza) ======
  if (command === "chiuso") {
    if (!isAdmin) return conn.reply(m.chat, "Solo admin possono chiudere il gruppo.", m)
    if (!isBotAdmin) return conn.reply(m.chat, "Devo essere admin per chiudere il gruppo.", m)
    await conn.groupSettingUpdate(m.chat, "announcement")
    return conn.reply(m.chat, "🔒 Gruppo chiuso (solo admin scrivono).", m)
  }

  if (command === "aperto") {
    if (!isAdmin) return conn.reply(m.chat, "Solo admin possono aprire il gruppo.", m)
    if (!isBotAdmin) return conn.reply(m.chat, "Devo essere admin per aprire il gruppo.", m)
    await conn.groupSettingUpdate(m.chat, "not_announcement")
    return conn.reply(m.chat, "🔓 Gruppo aperto.", m)
  }

  // ====== WARN: mod può warnare, ma NON admin ======
  if (command === "warn") {
    // consentito a mod o admin
    if (!isAdmin && !actorIsMod) return conn.reply(m.chat, "Solo admin o moderatori possono usare questo comando.", m)

    const target = pickTarget(m)
    if (!target) return conn.reply(m.chat, "Tagga qualcuno o rispondi a un suo messaggio.", m)

    if (!modCanTouch(participants, actorIsMod, target)) {
      return conn.reply(m.chat, "I moderatori non possono warnare gli admin.", m)
    }

    const key = warnKey(gid, target)
    global.db.data.warns[key] = (global.db.data.warns[key] || 0) + 1
    const w = global.db.data.warns[key]
    const motivo = args.slice(1).join(" ").trim()

    return conn.sendMessage(
      m.chat,
      {
        text: `⚠️ Warn a @${target.split("@")[0]} (${w}/3)${motivo ? `\nMotivo: ${motivo}` : ""}`,
        mentions: [target]
      },
      { quoted: m }
    )
  }

  // ====== DELWARN: -1 warn (solo admin) ======
  if (command === "delwarn") {
    if (!isAdmin) return conn.reply(m.chat, "Solo admin possono togliere warn.", m)

    const target = pickTarget(m)
    if (!target) return conn.reply(m.chat, "Tagga qualcuno o rispondi a un suo messaggio.", m)

    const key = warnKey(gid, target)
    global.db.data.warns[key] = Math.max(0, (global.db.data.warns[key] || 0) - 1)
    const w = global.db.data.warns[key]

    return conn.sendMessage(
      m.chat,
      { text: `✅ Warn ridotto. Ora @${target.split("@")[0]} ha ${w}/3`, mentions: [target] },
      { quoted: m }
    )
  }

  // ====== CLEARWARN: azzera warn (solo admin) ======
  if (command === "clearwarn") {
    if (!isAdmin) return conn.reply(m.chat, "Solo admin possono azzerare i warn.", m)

    const target = pickTarget(m)
    if (!target) return conn.reply(m.chat, "Tagga qualcuno o rispondi a un suo messaggio.", m)

    const key = warnKey(gid, target)
    global.db.data.warns[key] = 0

    return conn.sendMessage(
      m.chat,
      { text: `🧹 Warn azzerati per @${target.split("@")[0]}`, mentions: [target] },
      { quoted: m }
    )
  }

  // ====== WARNLIST: lista warn nel gruppo (admin o mod) ======
  if (command === "warnlist") {
    if (!isAdmin && !actorIsMod) return conn.reply(m.chat, "Solo admin o moderatori possono vedere la lista.", m)

    const entries = []
    for (const [k, v] of Object.entries(global.db.data.warns || {})) {
      if (!k.startsWith(gid + ":")) continue
      if (!v || v <= 0) continue
      const jid = k.split(":").slice(1).join(":")
      entries.push([jid, v])
    }

    if (!entries.length) return conn.reply(m.chat, "📌 Nessun warn attivo nel gruppo.", m)

    // ordina per warn desc
    entries.sort((a, b) => b[1] - a[1])

    const mentions = entries.map(e => e[0])
    const text = "📌 Warn attivi nel gruppo:\n\n" + entries
      .map((e, i) => `${i + 1}) @${e[0].split("@")[0]} — ${e[1]}/3`)
      .join("\n")

    return conn.sendMessage(m.chat, { text, mentions }, { quoted: m })
  }
}

handler.help = [
  'mods',
  'mod add @user',
  'mod del @user',
  'mod list',
  'chiuso',
  'aperto',
  'warn @user [motivo]',
  'delwarn @user',
  'clearwarn @user',
  'warnlist'
]

handler.tags = ['group']
handler.command = /^(mod|mods|chiuso|aperto|warn|delwarn|clearwarn|warnlist)$/i
handler.group = true

export default handler


