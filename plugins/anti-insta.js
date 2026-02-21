// Anti-Instagram Danger Bot
let linkRegex = /(?:https?:\/\/|www\.)[^\s]*instagram[^\s]*|(?:^|\s)[^\s]*instagram[^\s]*\.(com|it|net|org|ru|me|co|io|tv)(?:\/[^\s]*)?/i;

export async function before(m, { isAdmin, isPrems, isBotAdmin, conn }) {
  if (m.isBaileys || m.fromMe) return true;
  if (!m.isGroup) return false;

  let chat = global.db.data.chats[m.chat];
  if (!chat?.antiInsta) return false; // Anti-insta disattivato

  if (!m.text) return true;

  const sender = m.sender;
  const messageId = m.key.id;

  // Solo utenti senza permessi speciali
  if (isAdmin || isPrems) return true;
  if (!isBotAdmin) return true;

  const isInstagramLink = linkRegex.exec(m.text);
  if (!isInstagramLink) return true;

  // Inizializza dati warning
  global.db.data.users[sender] ??= {};
  const userData = global.db.data.users[sender];
  userData.warn ??= 0;
  userData.warnReasons ??= [];

  userData.warn += 1;
  userData.warnReasons.push('link instagram');

  // Elimina messaggio
  await conn.sendMessage(m.chat, {
    delete: { remoteJid: m.chat, fromMe: false, id: messageId, participant: sender },
  });

  const warnLimit = 3;
  const warnCount = userData.warn;
  const remaining = warnLimit - warnCount;

  // Avviso o espulsione
  if (warnCount < warnLimit) {
    await conn.sendMessage(m.chat, {
      text: `╔═══━─━─━─━─━─━─━═══╗
⚡ 𝐃𝐀𝐍𝐆𝐄𝐑 • 𝐀𝐍𝐓𝐈𝐈𝐍𝐒𝐓𝐀
╚═══━─━─━─━─━─━─━═══╝
📡 LINK INSTAGRAM RILEVATO

⚠️ Avvertimento: ${warnCount}/${warnLimit}
🔹 Rimangono: ${remaining}

Prossima violazione → espulsione.
━━━━━━━━━━━━━━━━━━`
    });
  } else {
    // Reset warning
    userData.warn = 0;
    userData.warnReasons = [];

    await conn.sendMessage(m.chat, {
      text: `╔═══━─━─━─━─━─━─━═══╗
⚡ 𝐃𝐀𝐍𝐆𝐄𝐑 • 𝐏𝐔𝐍𝐈𝐙𝐈𝐎𝐍𝐄
╚═══━─━─━─━─━─━─━═══╝
💀 LIMITE SUPERATO

🔹 Utente rimosso per violazioni ripetute.
━━━━━━━━━━━━━━━━━━`
    });

    await conn.groupParticipantsUpdate(m.chat, [sender], 'remove');
  }

  return true;
}