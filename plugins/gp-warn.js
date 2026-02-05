const handler = async (m, { conn, text, command, usedPrefix }) => {
  try {
    const target = getTargetUser(m, text);

    if (!target) {
      return m.reply(createUsageMessage(usedPrefix, command));
    }

    const targetNorm = normalizeJid(target);

    // controlli base
    if (targetNorm === conn.user.jid) {
      return m.reply("『 ‼️ 』 *Non puoi warnare il bot.*");
    }
    if (global.owner?.some(owner => owner?.[0] === targetNorm.split("@")[0])) {
      return m.reply("『 🤨 』 *Non puoi warnare un owner.*");
    }

    // controllo membership gruppo (robusto)
    if (m.isGroup) {
      const meta = await conn.groupMetadata(m.chat);
      const groupMembers = (meta.participants || []).map(p => p.id || p.jid || p.participant).filter(Boolean);

      const membersSet = new Set(groupMembers.map(normalizeJid));
      if (!membersSet.has(targetNorm)) {
        return m.reply(`『 ❌ 』 *L'utente ${targetNorm.split("@")[0]} non risulta membro di questo gruppo.*`);
      }
    }

    const reason = getReason(m, text, targetNorm);

    // db user
    const user = getUserData(targetNorm);
    if (!user.warns) user.warns = {};
    if (typeof user.warns[m.chat] !== "number") user.warns[m.chat] = 0;

    user.warns[m.chat] += 1;
    const warnsNow = user.warns[m.chat];

    if (warnsNow >= 3) {
      user.warns[m.chat] = 0;
      await handleRemoval(conn, m, targetNorm, reason);
    } else {
      await handleWarnMessage(conn, m, targetNorm, warnsNow, reason);
    }
  } catch (error) {
    console.error("Errore nell'handler warn:", error);
    return m.reply(`${global.errore || "Errore"}`);
  }
};

function getTargetUser(m, text) {
  if (!m.isGroup) return m.chat;

  // 1) mention
  const mentioned = m.mentionedJid?.[0];
  if (mentioned) return mentioned;

  // 2) reply / quoted
  const quotedSender = m.quoted?.sender || m.quoted?.participant;
  if (quotedSender) return quotedSender;

  // 3) numero scritto nel testo (prende SOLO il primo token)
  if (text?.trim()) return parseUserFromText(text.trim());

  return null;
}

function parseUserFromText(text) {
  const firstToken = text.split(/\s+/)[0] || "";
  const digits = firstToken.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `${digits}@s.whatsapp.net`;
}

function normalizeJid(jid) {
  if (!jid) return jid;
  if (String(jid).includes("@")) return String(jid);
  const digits = String(jid).replace(/[^\d]/g, "");
  return digits ? `${digits}@s.whatsapp.net` : String(jid);
}

function getReason(m, text, target) {
  if (!text) return "Non specificato";

  // se è mention o reply, di solito il text è già il motivo
  if (m.mentionedJid?.length || m.quoted) {
    return text.trim() || "Non specificato";
  }

  // se è numero + motivo: togli il primo token e usa il resto
  const parts = text.trim().split(/\s+/);
  parts.shift();
  const reason = parts.join(" ").trim();
  return reason || "Non specificato";
}

function getUserData(userId) {
  if (!global.db.data.users[userId]) {
    global.db.data.users[userId] = { warns: {} };
  }
  return global.db.data.users[userId];
}

function createUsageMessage(usedPrefix, command) {
  return `
ㅤㅤ⋆｡˚『 ╭ \`WARN\` ╯ 』˚｡⋆
╭
│ 『 📋 』 _*METODI DISPONIBILI:*_
│ • *\`Menziona:\`* ${usedPrefix + command} @utente motivo
│ • *\`Rispondi:\`* Quota un messaggio + ${usedPrefix + command} motivo
│ • *\`Numero:\`* ${usedPrefix + command} 393514357738 motivo
│
╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─`;
}

async function handleWarnMessage(conn, m, target, warnsNow, reason) {
  const username = target.split("@")[0];

  const emoji = warnsNow === 1 ? "⚠️" : "🔔";
  const message = `『 ${emoji} 』 @${username}
- Hai ricevuto un avvertimento
- Motivo: *${reason}*
- Avvertimenti: *${warnsNow}/3*`;

  const fkontak = await createUserFkontak(conn, target);

  await m.reply(message, null, {
    mentions: [target],
    quoted: fkontak || undefined
  });
}

async function handleRemoval(conn, m, target, reason) {
  const username = target.split("@")[0];

  const message = `『 🚫 』 @${username}
- Hai raggiunto *3/3* avvertimenti
- Motivo ultimo: *${reason}*
- Verrai rimosso dal gruppo.`;

  const fkontak = await createUserFkontak(conn, target);

  await m.reply(message, null, {
    mentions: [target],
    quoted: fkontak || undefined
  });

  await conn.groupParticipantsUpdate(m.chat, [target], "remove");
}

async function createUserFkontak(conn, target) {
  try {
    let username = target.split("@")[0];

    try {
      const contact = await conn.onWhatsApp(target);
      if (contact?.[0]?.notify) username = contact[0].notify;
    } catch {}

    return {
      key: {
        participants: "0@s.whatsapp.net",
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "Halo"
      },
      message: {
        contactMessage: {
          vcard:
            `BEGIN:VCARD\nVERSION:3.0\nN:User;Bot;;;\nFN:${username}\n` +
            `item1.TEL;waid=${target.split("@")[0]}:${target.split("@")[0]}\n` +
            `item1.X-ABLabel:Mobile\nEND:VCARD`
        }
      },
      participant: "0@s.whatsapp.net"
    };
  } catch {
    return null;
  }
}

handler.command = ["avverti", "warn", "avvertimento"];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
