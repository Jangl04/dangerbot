const handler = async (m, { conn, text, command, usedPrefix }) => {
  try {
    const target = getTargetUser(m, text);
    if (!target) return m.reply(createUsageMessage(usedPrefix, command));

    const targetNum = jidToNumber(target);

    // non warnare bot / owner
    if (sameUser(target, conn.user.jid)) return m.reply("『 ‼️ 』 Non puoi warnare il bot.");
    if (global.owner?.some(o => String(o?.[0]) === targetNum)) return m.reply("『 🤨 』 Non puoi warnare un owner.");

    // controllo membership: confronto SOLO numeri (robusto)
    if (m.isGroup) {
      const meta = await conn.groupMetadata(m.chat);
      const nums = new Set(
        (meta.participants || [])
          .map(p => p.id || p.jid || p.participant)
          .filter(Boolean)
          .map(jidToNumber)
          .filter(Boolean)
      );

      if (!nums.has(targetNum)) {
        return m.reply(`『 ❌ 』 L'utente ${targetNum} non risulta membro di questo gruppo.`);
      }
    }

    const reason = getReason(m, text, usedPrefix, command);

    // db
    const user = getUserData(target);
    if (!user.warns) user.warns = {};
    if (typeof user.warns[m.chat] !== "number") user.warns[m.chat] = 0;

    user.warns[m.chat] += 1;
    const warnsNow = user.warns[m.chat];

    if (warnsNow >= 3) {
      user.warns[m.chat] = 0;
      await handleRemoval(conn, m, target, reason, warnsNow);
    } else {
      await handleWarnMessage(conn, m, target, reason, warnsNow);
    }
  } catch (error) {
    console.error("Errore nell'handler warn:", error);
    return m.reply(`${global.errore || "Errore"}`);
  }
};

/* ================= TARGET PARSING ================= */

function getTargetUser(m, text) {
  // 1) Mention "reale" (contextInfo) — affidabile
  const ctx =
    m.message?.extendedTextMessage?.contextInfo ||
    m.message?.imageMessage?.contextInfo ||
    m.message?.videoMessage?.contextInfo ||
    m.message?.documentMessage?.contextInfo ||
    m.message?.conversation?.contextInfo;

  if (ctx?.mentionedJid?.length) return ctx.mentionedJid[0];

  // fallback: alcuni wrapper espongono già m.mentionedJid
  if (m.mentionedJid?.length) return m.mentionedJid[0];

  // 2) Reply / quoted — affidabile
  const q =
    m.quoted?.sender ||
    m.quoted?.participant ||
    m.quoted?.key?.participant ||
    m.msg?.contextInfo?.participant;

  if (q) return q;

  // 3) Numero scritto nel testo (primo argomento dopo il comando)
  // es: ".warn 3935xxxx motivo"
  const t = (text || "").trim();
  if (!t) return null;

  const first = t.split(/\s+/)[0] || "";
  const digits = first.replace(/[^\d]/g, "");
  if (!digits) return null;

  return `${digits}@s.whatsapp.net`;
}

/* ================= NORMALIZE ================= */

function jidToNumber(jid) {
  if (!jid) return "";
  const s = String(jid);

  // es: "3937xxx:12@s.whatsapp.net" -> "3937xxx"
  const beforeAt = s.split("@")[0] || "";
  const beforeDevice = beforeAt.split(":")[0] || "";
  const digits = beforeDevice.replace(/[^\d]/g, "");
  return digits;
}

function sameUser(a, b) {
  return jidToNumber(a) && jidToNumber(a) === jidToNumber(b);
}

/* ================= REASON ================= */

function getReason(m, text, usedPrefix, command) {
  // Se è reply/mention spesso il "text" è solo motivo (o vuoto)
  const t = (text || "").trim();
  if (!t) return "Non specificato";

  // Se l’utente ha scritto ".warn numero motivo", il framework passa in "text" solo "numero motivo"
  // Quindi: se il primo token è un numero, lo togliamo.
  const parts = t.split(/\s+/);
  const first = parts[0] || "";
  const firstDigits = first.replace(/[^\d]/g, "");

  if (firstDigits.length >= 6) {
    parts.shift(); // rimuove numero
  }
  const reason = parts.join(" ").trim();
  return reason || "Non specificato";
}

/* ================= DB ================= */

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
│ 『 📋 』 _*METODI:*_
│ • ${usedPrefix + command} @utente motivo
│ • (reply) + ${usedPrefix + command} motivo
│ • ${usedPrefix + command} 3935xxxx motivo
╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─
`.trim();
}

/* ================= ACTIONS ================= */

async function handleWarnMessage(conn, m, target, reason, warnsNow) {
  const num = jidToNumber(target);
  const emoji = warnsNow === 1 ? "⚠️" : "🔔";

  const msg = `『 ${emoji} 』 @${num}
- Hai ricevuto un avvertimento
- Motivo: *${reason}*
- Avvertimenti: *${warnsNow}/3*`;

  const fkontak = await createUserFkontak(conn, target);

  await m.reply(msg, null, {
    mentions: [target],
    quoted: fkontak || undefined
  });
}

async function handleRemoval(conn, m, target, reason) {
  const num = jidToNumber(target);

  const msg = `『 🚫 』 @${num}
- Hai raggiunto *3/3* avvertimenti
- Ultimo motivo: *${reason}*
- Verrai rimosso dal gruppo.`;

  const fkontak = await createUserFkontak(conn, target);

  await m.reply(msg, null, {
    mentions: [target],
    quoted: fkontak || undefined
  });

  await conn.groupParticipantsUpdate(m.chat, [target], "remove");
}

async function createUserFkontak(conn, target) {
  try {
    let username = jidToNumber(target);

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
            `item1.TEL;waid=${jidToNumber(target)}:${jidToNumber(target)}\n` +
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


