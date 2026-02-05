const handler = async (m, { conn, text, command, usedPrefix }) => {
  try {
    const target = getTargetUser(m);

    if (!target) {
      return m.reply(createUsageMessage(usedPrefix, command));
    }

    // controllo bot / owner
    if (target === conn.user.jid) {
      return m.reply("『 ‼️ 』 Non puoi warnare il bot.");
    }
    if (global.owner?.some(o => o[0] === target.split("@")[0])) {
      return m.reply("『 🤨 』 Non puoi warnare un owner.");
    }

    // controllo membership (Baileys MD safe)
    if (m.isGroup) {
      const meta = await conn.groupMetadata(m.chat);
      const members = meta.participants
        .map(p => p.id || p.jid || p.participant)
        .filter(Boolean);

      if (!members.includes(target)) {
        return m.reply(`『 ❌ 』 L'utente ${target.split("@")[0]} non risulta membro di questo gruppo.`);
      }
    }

    const reason = getReason(m, text);

    // db
    const user = getUserData(target);
    if (!user.warns) user.warns = {};
    if (typeof user.warns[m.chat] !== "number") user.warns[m.chat] = 0;

    user.warns[m.chat]++;

    if (user.warns[m.chat] >= 3) {
      user.warns[m.chat] = 0;
      await handleRemoval(conn, m, target, reason);
    } else {
      await handleWarnMessage(conn, m, target, user.warns[m.chat], reason);
    }

  } catch (e) {
    console.error(e);
    m.reply("Errore");
  }
};

/* ================= UTILS ================= */

function getTargetUser(m) {
  // 1️⃣ mention REALI (contextInfo)
  const ctx = m.message?.extendedTextMessage?.contextInfo;
  if (ctx?.mentionedJid?.length) {
    return ctx.mentionedJid[0];
  }

  // 2️⃣ reply
  if (m.quoted?.sender) {
    return m.quoted.sender;
  }

  // 3️⃣ numero scritto
  const text = m.text || "";
  const token = text.split(/\s+/)[1];
  if (!token) return null;

  const digits = token.replace(/[^\d]/g, "");
  if (!digits) return null;

  return `${digits}@s.whatsapp.net`;
}

function getReason(m, text) {
  if (!text) return "Non specificato";

  const parts = text.trim().split(/\s+/);
  parts.shift(); // comando
  parts.shift(); // target

  return parts.join(" ").trim() || "Non specificato";
}

function getUserData(id) {
  if (!global.db.data.users[id]) {
    global.db.data.users[id] = { warns: {} };
  }
  return global.db.data.users[id];
}

function createUsageMessage(p, c) {
  return `
『 WARN 』
${p + c} @utente motivo
${p + c} (reply) motivo
${p + c} 3935xxxx motivo
`;
}

async function handleWarnMessage(conn, m, target, n, reason) {
  await m.reply(
    `⚠️ @${target.split("@")[0]}\nWarn ${n}/3\nMotivo: ${reason}`,
    null,
    { mentions: [target] }
  );
}

async function handleRemoval(conn, m, target, reason) {
  await m.reply(
    `🚫 @${target.split("@")[0]}\n3/3 warn\nMotivo: ${reason}`,
    null,
    { mentions: [target] }
  );
  await conn.groupParticipantsUpdate(m.chat, [target], "remove");
}

handler.command = ["warn", "avverti", "avvertimento"];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;

