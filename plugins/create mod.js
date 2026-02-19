// plugins/moderator.js
// Ruolo MODERATORE: solo comandi "ordine" + protezione owner/admin (intoccabili dai mod)

const MOD_ALLOWED = new Set([
  "del",
  "warn",
  "unwarn",
  "warns",
  "chiuso",
  "aperto",
  "mods",      // lista moderatori
  "mod"        // gestione moderatori (solo admin/owner)
]);

function ensureDB() {
  global.db = global.db || {};
  global.db.mods = global.db.mods || {};   // { [gid]: [jid, ...] }
  global.db.warns = global.db.warns || {}; // { ["gid:jid"]: number }
}

function isOwnerJid(jid) {
  return !!global.ownerJid && jid === global.ownerJid;
}

function isGroupAdmin(participants, jid) {
  const p = participants?.find(x => x.id === jid);
  return !!p?.admin; // "admin" o "superadmin"
}

function getMods(gid) {
  ensureDB();
  return global.db.mods[gid] || (global.db.mods[gid] = []);
}

function isModerator(gid, jid) {
  return getMods(gid).includes(jid);
}

// owner/admin sono protetti (i mod non possono agirci contro)
function isProtectedTarget(participants, targetJid) {
  if (isOwnerJid(targetJid)) return true;
  if (isGroupAdmin(participants, targetJid)) return true;
  return false;
}

// gate: se moderatore (non admin/owner) può usare solo whitelist
function modGate(m, command, isAdmin) {
  if (!m.isGroup) return { ok: true };
  if (isOwnerJid(m.sender) || isAdmin) return { ok: true };

  if (isModerator(m.chat, m.sender) && !MOD_ALLOWED.has(command)) {
    return {
      ok: false,
      reason: `Permesso negato. I moderatori possono usare solo: ${[...MOD_ALLOWED].join(", ")}`
    };
  }
  return { ok: true };
}

function warnKey(gid, jid) {
  return `${gid}:${jid}`;
}

async function cmdMods(m, { conn }) {
  ensureDB();
  const mods = getMods(m.chat);

  if (!mods.length) {
    return conn.reply(m.chat, "👮 Moderatori: 0\nNessun moderatore impostato.", m);
  }

  const list = mods.map((jid, i) => `${i + 1}) @${jid.split("@")[0]}`).join("\n");
  return conn.sendMessage(
    m.chat,
    { text: `👮 Moderatori: ${mods.length}\n\n${list}`, mentions: mods },
    { quoted: m }
  );
}

// .mod add @user | .mod del @user | .mod list
async function cmdMod(m, { conn, args, participants, isAdmin }) {
  ensureDB();
  if (!m.isGroup) return conn.reply(m.chat, "Solo nei gruppi.", m);

  // SOLO owner o admin possono gestire i moderatori
  if (!isOwnerJid(m.sender) && !isAdmin) {
    return conn.reply(m.chat, "Solo owner/admin possono gestire i moderatori.", m);
  }

  const sub = (args[0] || "").toLowerCase();
  const mods = getMods(m.chat);

  if (sub === "list") return cmdMods(m, { conn });

  const target = (m.mentionedJid && m.mentionedJid[0]) || null;
  if (!target) return conn.reply(m.chat, "Tagga un utente. Esempio: .mod add @user", m);

  // Non aggiungere owner come mod (inutile)
  if (isOwnerJid(target)) return conn.reply(m.chat, "L'owner non serve aggiungerlo come moderatore.", m);

  if (sub === "add") {
    if (!mods.includes(target)) mods.push(target);
    return conn.reply(m.chat, "✅ Moderatore aggiunto.", m);
  }

  if (sub === "del" || sub === "remove") {
    global.db.mods[m.chat] = mods.filter(x => x !== target);
    return conn.reply(m.chat, "✅ Moderatore rimosso.", m);
  }

  return conn.reply(m.chat, "Uso: .mod add @user | .mod del @user | .mod list", m);
}

// .del (reply a un messaggio)
async function cmdDel(m, { conn, participants, isAdmin }) {
  if (!m.quoted) return conn.reply(m.chat, "Rispondi al messaggio da cancellare.", m);

  const can = isOwnerJid(m.sender) || isAdmin || isModerator(m.chat, m.sender);
  if (!can) return conn.reply(m.chat, "Solo mod/admin/owner.", m);

  // I mod NON possono cancellare messaggi di owner/admin
  const author = m.quoted.sender;
  if (isModerator(m.chat, m.sender) && isProtectedTarget(participants, author)) {
    return conn.reply(m.chat, "Non puoi cancellare messaggi di owner/admin.", m);
  }

  await conn.sendMessage(m.chat, { delete: m.quoted.key });
}

// .warn @user [motivo]
async function cmdWarn(m, { conn, args, participants, isAdmin }) {
  const can = isOwnerJid(m.sender) || isAdmin || isModerator(m.chat, m.sender);
  if (!can) return conn.reply(m.chat, "Solo mod/admin/owner.", m);

  const target =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && m.quoted.sender) ||
    null;

  if (!target) return conn.reply(m.chat, "Tagga qualcuno o rispondi a un messaggio.", m);

  // MOD non può warnare owner/admin
  if (isModerator(m.chat, m.sender) && isProtectedTarget(participants, target)) {
    return conn.reply(m.chat, "Non puoi warnare owner/admin.", m);
  }

  const key = warnKey(m.chat, target);
  global.db.warns[key] = (global.db.warns[key] || 0) + 1;

  const reason = args.slice(1).join(" ").trim();
  const w = global.db.warns[key];

  return conn.sendMessage(
    m.chat,
    {
      text: `⚠️ Warn a @${target.split("@")[0]} (${w}/3)${reason ? `\nMotivo: ${reason}` : ""}`,
      mentions: [target]
    },
    { quoted: m }
  );
}

// .unwarn @user  (solo admin/owner per sicurezza)
async function cmdUnwarn(m, { conn, participants, isAdmin }) {
  if (!isOwnerJid(m.sender) && !isAdmin) {
    return conn.reply(m.chat, "Solo admin/owner possono togliere warn.", m);
  }

  const target =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && m.quoted.sender) ||
    null;

  if (!target) return conn.reply(m.chat, "Tagga qualcuno o rispondi a un messaggio.", m);

  const key = warnKey(m.chat, target);
  global.db.warns[key] = Math.max(0, (global.db.warns[key] || 0) - 1);

  return conn.reply(m.chat, "✅ Warn ridotto.", m);
}

// .warns [@user]
async function cmdWarns(m, { conn }) {
  ensureDB();
  const target = (m.mentionedJid && m.mentionedJid[0]) || m.sender;
  const key = warnKey(m.chat, target);
  const w = global.db.warns[key] || 0;

  return conn.sendMessage(
    m.chat,
    { text: `📌 Warn di @${target.split("@")[0]}: ${w}/3`, mentions: [target] },
    { quoted: m }
  );
}

// .lock / .unlock (chiude/apre scrittura gruppo)
async function cmdLock(m, { conn, isBotAdmin, isAdmin }) {
  const can = isOwnerJid(m.sender) || isAdmin || isModerator(m.chat, m.sender);
  if (!can) return conn.reply(m.chat, "Solo mod/admin/owner.", m);
  if (!isBotAdmin) return conn.reply(m.chat, "Devo essere admin per chiudere il gruppo.", m);

  await conn.groupSettingUpdate(m.chat, "announcement");
  return conn.reply(m.chat, "🔒 Gruppo chiuso (solo admin scrivono).", m);
}

async function cmdUnlock(m, { conn, isBotAdmin, isAdmin }) {
  const can = isOwnerJid(m.sender) || isAdmin || isModerator(m.chat, m.sender);
  if (!can) return conn.reply(m.chat, "Solo mod/admin/owner.", m);
  if (!isBotAdmin) return conn.reply(m.chat, "Devo essere admin per aprire il gruppo.", m);

  await conn.groupSettingUpdate(m.chat, "not_announcement");
  return conn.reply(m.chat, "🔓 Gruppo aperto.", m);
}

// ===== HANDLER UNICO =====
let handler = async (m, ctx) => {
  const { conn, command, isAdmin, isBotAdmin, participants, args } = ctx;

  if (!m.isGroup) return;

  // Gate permessi moderatori
  const gate = modGate(m, command.toLowerCase(), isAdmin);
  if (!gate.ok) return conn.reply(m.chat, gate.reason, m);

  // Dispatch comandi
  switch (command.toLowerCase()) {
    case "mods":
      return cmdMods(m, { conn });

    case "mod":
      return cmdMod(m, { conn, args, participants, isAdmin });

    case "del":
      return cmdDel(m, { conn, participants, isAdmin });

    case "warn":
      return cmdWarn(m, { conn, args, participants, isAdmin });

    case "delwarn":
      return cmdUnwarn(m, { conn, participants, isAdmin });

    case "warns":
      return cmdWarns(m, { conn });

    case "chiuso":
      return cmdLock(m, { conn, isBotAdmin, isAdmin });

    case "aperto":
      return cmdUnlock(m, { conn, isBotAdmin, isAdmin });

    default:
      // se arriva qui, comunque era in whitelist (o admin/owner), ma non implementato
      return;
  }
};

handler.help = ["mod add @user", "mod del @user", "mod list", "mods", "warn @user", "delwarn @user", "warns", "del", "chiuso", "aperto"];
handler.tags = ["group"];
handler.command = /^(mod|mods|warn|unwarn|warns|del|lock|unlock)$/i;

module.exports = handler;

