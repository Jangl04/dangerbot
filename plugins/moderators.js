// plugins/moderators.js
// Comandi semplici: .modadd / .moddel / .mods
// I moderatori servono solo per "ordine": lista ruoli + protezioni base
// Richiede: global.db (o global.db.data) e owner number in global.owner / global.ownerJid

function dbRoot() {
  global.db = global.db || {};
  // alcune basi usano global.db.data
  return global.db.data ? global.db.data : global.db;
}

function getOwnerJid() {
  // prova più varianti comuni
  if (global.ownerJid) return global.ownerJid;
  if (typeof global.owner === "string" && global.owner.includes("@")) return global.owner;
  // se global.owner è array tipo ["39xxxxxx"]
  if (Array.isArray(global.owner) && global.owner[0]) {
    const n = String(global.owner[0]).replace(/\D/g, "");
    return n ? (n + "@s.whatsapp.net") : null;
  }
  return null;
}

function isOwner(sender) {
  const ownerJid = getOwnerJid();
  return ownerJid ? sender === ownerJid : false;
}

function ensure() {
  const db = dbRoot();
  db.mods = db.mods || {};   // { [gid]: [jid] }
  return db;
}

function getMods(gid) {
  const db = ensure();
  return db.mods[gid] || (db.mods[gid] = []);
}

function pickTarget(m) {
  return (
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && (m.quoted.sender || m.quoted.participant)) ||
    (m.quoted && m.quoted.key && m.quoted.key.participant) ||
    null
  );
}

let handler = async (m, { conn, command, isAdmin }) => {
  // riconosci gruppo in modo robusto
  const isGroup = m.isGroup || (typeof m.chat === "string" && m.chat.endsWith("@g.us"));
  if (!isGroup) return conn.reply(m.chat, "Questo comando funziona solo nei gruppi.", m);

  const cmd = String(command || "").toLowerCase();
  const mods = getMods(m.chat);

  // .mods -> lista
  if (cmd === "mods") {
    if (!mods.length) return conn.reply(m.chat, "👮 Moderatori: 0\nNessun moderatore impostato.", m);

    const list = mods.map((jid, i) => `${i + 1}) @${jid.split("@")[0]}`).join("\n");
    return conn.sendMessage(m.chat, { text: `👮 Moderatori: ${mods.length}\n\n${list}`, mentions: mods }, { quoted: m });
  }

  // gestione moderatori: SOLO owner o admin
  if (!isOwner(m.sender) && !isAdmin) {
    return conn.reply(m.chat, "Solo owner/admin possono gestire i moderatori.", m);
  }

  const target = pickTarget(m);
  if (!target) {
    return conn.reply(
      m.chat,
      "Tagga una persona oppure rispondi a un suo messaggio.\nEsempi:\n- .modadd @user\n- (reply) .modadd",
      m
    );
  }

  const ownerJid = getOwnerJid();
  if (ownerJid && target === ownerJid) {
    return conn.reply(m.chat, "L'owner non serve aggiungerlo come moderatore.", m);
  }

  if (cmd === "modadd") {
    if (!mods.includes(target)) mods.push(target);
    return conn.reply(m.chat, "✅ Moderatore aggiunto.", m);
  }

  if (cmd === "moddel") {
    const next = mods.filter(x => x !== target);
    const db = ensure();
    db.mods[m.chat] = next;
    return conn.reply(m.chat, "✅ Moderatore rimosso.", m);
  }
};

handler.help = ["modadd @user", "moddel @user", "mods"];
handler.tags = ["group"];
handler.command = /^(modadd|moddel|mods)$/i;

module.exports = handler;
