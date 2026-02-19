
// plugins/moderator.js
// Moderatori + protezione owner/admin + comandi ordine
// Compatibile: mention/reply estrazione target robusta + messaggi chiari

const MOD_ALLOWED = new Set(["mod", "mods", "del", "warn", "unwarn", "warns", "lock", "unlock"]);

function ensureDB() {
  global.db = global.db || {};
  // molte basi usano global.db.data
  if (global.db.data) global.db = global.db.data;

  global.db.mods = global.db.mods || {};
  global.db.warns = global.db.warns || {};
}

function isOwnerJid(jid) {
  return !!global.ownerJid && jid === global.ownerJid;
}

function isGroupAdmin(participants, jid) {
  const p = participants?.find(x => x.id === jid);
  return !!p?.admin;
}

function getMods(gid) {
  ensureDB();
  return global.db.mods[gid] || (global.db.mods[gid] = []);
}

function isModerator(gid, jid) {
  return getMods(gid).includes(jid);
}

function isProtectedTarget(participants, targetJid) {
  if (isOwnerJid(targetJid)) return true;
  if (isGroupAdmin(participants, targetJid)) return true;
  return false;
}

// Estrazione target super-robusta: mention OR reply OR key.participant
function pickTarget(m) {
  return (
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && (m.quoted.sender || m.quoted.participant)) ||
    (m.quoted && m.quoted.key && m.quoted.key.participant) ||
    null
  );
}

function warnKey(gid, jid) {
  return `${gid}:${jid}`;
}

function modGate(m, command, isAdmin) {
  // riconosci gruppo anche se m.isGroup non è settato in quella base
  const isGroup = m.isGroup || (typeof m.chat === "string" && m.chat.endsWith("@g.us"));
  if (!isGroup) return { ok: false, reason: "Questo comando funziona solo nei gruppi." };

  if (isOwnerJid(m.sender) || isAdmin) return { ok: true };

  if (isModerator(m.chat, m.sender) && !MOD_ALLOWED.has(command)) {
    return { ok: false, reason: `Permesso negato. I moderatori possono usare solo: ${[...MOD_ALLOWED].join(", ")}` };
  }
  return { ok: true };
}

async function cmdMods(m, { conn }) {
  const mods = getMods(m.chat);
  if (!mods.length) return conn.reply(m.chat, "👮 Moderatori: 0\nNessun moderatore impostato.", m);

  const list = mods.map((jid, i) => `${i + 1}) @${jid.split("@")[0]}`).join("\n");
  return conn.sendMessage(m.chat, { text: `👮 Moderatori: ${mods.length}\n\n${list}`, mentions: mods }, { quoted: m });
}

async function cmdMod(m, { conn, args, isAdmin }) {
  // solo owner/admin possono gestire i mod
  if (!isOwnerJid(m.sender) && !isAdmin) return conn.reply(m.chat, "Solo owner/admin possono gestire i moderatori.", m);

  const sub = (args[0] || "").toLowerCase();
  const mods = getMods(m.chat);

  if (sub === "list") return cmdMods(m, { conn });

  const target = pickTarget(m);
  if (!target) {
    return conn.reply(
      m.chat,
      "Devi taggare un utente *oppure* rispondere a un suo messaggio.\nEsempi:\n- .mod add @user\n- (reply) .mod add",
      m
    );
  }

  if (isOwnerJid(target)) return conn.reply(m.chat, "L'owner non serve aggiungerlo come moderatore.", m);

  if (sub === "add") {
    if (!mods.includes(target)) mods.push(target);
    return conn.reply(m.chat, "✅ Moderatore aggiunto.", m);
  }

  if (sub === "del" || sub === "remove") {
    global.db.mods[m.chat] = mods.filter(x => x !== target);
    return conn.reply(m.chat, "✅ Moderatore rimosso.", m);
  }

  return conn.reply(m.chat, "Uso: .mod add (tag/reply) | .mod del (tag/reply) | .mod list", m);
}

async function cmdDel(m, { conn, participants, isAdmin }) {
  const can = isOwnerJid(m.sender) || isAdmin || isModerator(m.chat, m.sender);
  if (!can) return conn.reply(m.chat, "Solo mod/admin/owner.", m);
  if (!m.quoted) return conn.reply(m.chat, "Rispondi al messaggio da cancellare.", m);

  const author = pickTarget({ quoted: m.quoted }); // prova a leggere autore
  const realAuthor = m.quoted.sender || m.quoted.participant || (m.quoted.key && m.quoted.key.participant);

  if (isModerator(m.chat, m.sender) && realAuthor && isProtectedTarget(participants, realAuthor)) {
    return conn.reply(m.chat, "Non puoi cancellare messaggi di owner/admin.", m);
  }

  return conn.sendMessage(m.chat, { delete: m.quoted.key });
}

async function cmdWarn(m, { conn, args, participants, isAdmin }) {
  const can = isOwnerJid(m.sender) || isAdmin || isModerator(m.chat, m.sender);
  if (!can) return conn.reply(m.chat, "Solo mod/admin/owner.", m);

  const target = pickTarget(m);
  if (!target) return conn.reply(m.chat, "Tagga qualcuno o rispondi a un suo messaggio.", m);

  if (isModerator(m.chat, m.sender) && isProtectedTarget(participants, target)) {
    return conn.reply(m.chat, "Non puoi warnare owner/admin.", m);
  }

  const key = warnKey(m.chat, target);
  global.db.warns[key] = (global.db.warns[key] || 0) + 1;

  const reason = args.slice(1).join(" ").trim();
  const w = global.db.warns[key];

  return conn.sendMessage(
    m.chat,
    { text: `⚠️ Warn a @${target.split("@")[0]} (${w}/3)${reason ? `\nMotivo: ${reason}` : ""}`, mentions: [target] },
    { quoted: m }
  );
}

async function cmdUnwarn(m, { conn, participants, isAdmin }) {
  if (!isOwnerJid(m.sender) && !isAdmin) return conn.reply(m.chat, "Solo admin/owner possono togliere warn.", m);

  const target = pickTarget(m);
  if (!target) return conn.reply(m.chat, "Tagga qualcuno o rispondi a un suo messaggio.", m);

  const key = warnKey(m.chat, target);
  global.db.warns[key] = Math.max(0, (global.db.warns[key] || 0) - 1);
  return conn.reply(m.chat, "✅ Warn ridotto.", m);
}

async function cmdWarns(m, { conn }) {
  const target = pickTarget(m) || m.sender;
  const key = warnKey(m.chat, target);
  const w = global.db.warns[key] || 0;

  return conn.sendMessage(m.chat, { text: `📌 Warn di @${target.split("@")[0]}: ${w}/3`, mentions: [target] }, { quoted: m });
}

async function cmdLock(m, { conn, isBotAdmin, isAdmin }) {
  const can = isOwnerJid(m.sender) || isAdmin || isModerator(m.chat, m.sender);
  if (!can) return conn.reply(m.chat, "Solo mod/admin/owner.", m);
  if (!isBotAdmin) return conn.reply(m.chat, "Devo essere admin per chiudere il gruppo.", m);

  await conn.groupSettingUpdate(m.chat, "announcement");
  return conn.reply(m.chat, "🔒 Gruppo chiuso.", m);
}

async function cmdUnlock(m, { conn, isBotAdmin, isAdmin }) {
  const can = isOwnerJid(m.sender) || isAdmin || isModerator(m.chat, m.sender);
  if (!can) return conn.reply(m.chat, "Solo mod/admin/owner.", m);
  if (!isBotAdmin) return conn.reply(m.chat, "Devo essere admin per aprire il gruppo.", m);

  await conn.groupSettingUpdate(m.chat, "not_announcement");
  return conn.reply(m.chat, "🔓 Gruppo aperto.", m);
}

// ===== Handler =====
let handler = async (m, ctx) => {
  const { conn, command, isAdmin, isBotAdmin, participants, args } = ctx;

  // Gate (e risposta chiara se non è gruppo / permessi)
  const gate = modGate(m, String(command || "").toLowerCase(), isAdmin);
  if (!gate.ok) return conn.reply(m.chat, gate.reason, m);

  switch (String(command).toLowerCase()) {
    case "mods":   return cmdMods(m, { conn });
    case "mod":    return cmdMod(m, { conn, args, isAdmin });
    case "del":    return cmdDel(m, { conn, participants, isAdmin });
    case "warn":   return cmdWarn(m, { conn, args, participants, isAdmin });
    case "unwarn": return cmdUnwarn(m, { conn, participants, isAdmin });
    case "warns":  return cmdWarns(m, { conn });
    case "lock":   return cmdLock(m, { conn, isBotAdmin, isAdmin });
    case "unlock": return cmdUnlock(m, { conn, isBotAdmin, isAdmin });
  }
};

handler.help = ["mod add (tag/reply)", "mod del (tag/reply)", "mod list", "mods"];
handler.tags = ["group"];
handler.command = /^(mod|mods|del|warn|unwarn|warns|lock|unlock)$/i;

module.exports = handler;
