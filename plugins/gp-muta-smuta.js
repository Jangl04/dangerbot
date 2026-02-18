// MUTE MINIMAL - nessuna grafica ingombrante
// comandi: .m / .muta, .um / .smuta

const mutedUsers = new Map();
// key: jid -> { until: number (0 = perm), lastNotify: number }

function parseDuration(args = []) {
  const text = args.join(' ').trim();

  // perm / 0
  if (/(^|\s)(perm|perma|permanente|0)(\s|$)/i.test(text)) {
    return 0;
  }

  // 10 / 10m / 10min / 30s / 30sec
  const m = text.match(/(^|\s)(\d+)\s*(s|sec|m|min)?(\s|$)/i);
  if (!m) return null;

  const value = parseInt(m[2], 10);
  const unit = (m[3] || 'm').toLowerCase();

  return unit.startsWith('s') ? value * 1000 : value * 60000;
}

let handler = async (m, { conn, command, args, participants }) => {
  const cmd = (command || '').toLowerCase();
  const isMute = cmd === 'm' || cmd === 'muta';
  const isUnmute = cmd === 'um' || cmd === 'smuta';

  const DEFAULT_MUTE_MIN = 10; // 👈 cambia qui (default 10 minuti)

  // target: mention o reply
  let targets = [];

  if (m.mentionedJid?.length) {
    targets = m.mentionedJid.map(j => conn.decodeJid(j));
  } else if (m.quoted?.sender) {
    targets = [conn.decodeJid(m.quoted.sender)];
  }

  if (!targets.length) {
    return m.reply(
      `Uso:\n` +
      `- .m @user [10|10m|30s|perm]\n` +
      `- (reply) .m [10|10m|30s|perm]\n` +
      `- .um @user\n` +
      `- (reply) .um`
    );
  }

  // verifica che siano nel gruppo
  const setPartecipanti = new Set(participants.map(p => conn.decodeJid(p.id)));
  targets = targets.filter(jid => setPartecipanti.has(jid));

  if (!targets.length) return m.reply('Utente non nel gruppo.');

  // non mutare il bot
  targets = targets.filter(jid => jid !== conn.user.jid);

  if (!targets.length) return;

  // durata
  let timeMs = parseDuration(args);
  if (timeMs === null && isMute) timeMs = DEFAULT_MUTE_MIN * 60000;

  // applica
  for (const jid of targets) {
    if (isMute) {
      const until = timeMs ? Date.now() + timeMs : 0; // 0 = perm
      mutedUsers.set(jid, { until, lastNotify: 0 });
    } else if (isUnmute) {
      mutedUsers.delete(jid);
    }
  }

  // risposta super semplice (facoltativa)
  // Se non vuoi nemmeno questa, dimmelo e la tolgo.
  return m.reply(isMute ? 'Utente mutato 🔇' : 'Utente smutato ✅');
};

// blocca messaggi dei mutati
handler.before = async (m, { conn, isCommand }) => {
  if (!m.sender || m.sender === conn.user.jid) return;

  const jid = conn.decodeJid(m.sender);
  const data = mutedUsers.get(jid);
  if (!data) return;

  // scadenza
  if (data.until && Date.now() > data.until) {
    mutedUsers.delete(jid);
    return;
  }

  // cancella il messaggio del mutato
  try {
    await conn.sendMessage(m.chat, { delete: m.key });
  } catch {}

  // manda SOLO il messaggio semplice (anti-spam: max 1 ogni 5 sec)
  const now = Date.now();
  if (!data.lastNotify || now - data.lastNotify > 5000) {
    data.lastNotify = now;
    mutedUsers.set(jid, data);

    try {
      await conn.sendMessage(m.chat, {
        text: 'Ora non puoi parlare perché sei stato mutato 🔇'
      });
    } catch {}
  }

  return false;
};

handler.help = ['m', 'muta', 'um', 'smuta'];
handler.tags = ['gruppo'];
handler.command = /^(m|muta|um|smuta)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;

