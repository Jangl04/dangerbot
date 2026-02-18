// MUTE TOTALE (NO SPAM) - semplice e pulito
// comandi: .m / .muta, .um / .smuta
// mute: mention o reply
// durata: 10, 10m, 30s, perm/0
// effetto mute: cancella QUALSIASI cosa scriva (messaggi e comandi), avviso 1 sola volta

const mutedUsers = new Map();
// key: numero normalizzato -> { until: number (0=perm), warned: boolean }

function normalizeNumFromJid(jid) {
  if (!jid) return '';
  // prende solo la parte prima di @, rimuove simboli e toglie 39 se c’è
  const num = jid.split('@')[0].replace(/\D/g, '');
  return num.replace(/^39/, '');
}

function getOwnerNums() {
  const owners = global.owner || [];
  const nums = new Set();

  for (const o of owners) {
    const raw = Array.isArray(o) ? o[0] : o; // supporta [['39123', 'name']] oppure ['39123']
    if (!raw) continue;
    const n = String(raw).replace(/\D/g, '').replace(/^39/, '');
    if (n) nums.add(n);
  }
  return nums;
}

function parseDuration(args = []) {
  const text = args.join(' ').trim();

  // perm / 0
  if (/(^|\s)(perm|perma|permanente|0)(\s|$)/i.test(text)) return 0;

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

  const DEFAULT_MUTE_MIN = 10; // 👈 cambia qui il default

  // sender
  const senderJid = conn.decodeJid(m.sender);
  const senderNum = normalizeNumFromJid(senderJid);

  // target: mention o reply
  let targets = [];
  if (m.mentionedJid?.length) {
    targets = m.mentionedJid.map(j => conn.decodeJid(j));
    // toglie i @argomenti (non è obbligatorio ma utile)
    args = args.filter(a => !a.startsWith('@'));
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

  // ✅ verifica gruppo (per numero) + compatibilità @lid
  const setPartecipanti = new Set(
    participants.flatMap(p => {
      const a = conn.decodeJid(p.id);
      const b = p.jid ? conn.decodeJid(p.jid) : null;
      return [normalizeNumFromJid(a), b ? normalizeNumFromJid(b) : null].filter(Boolean);
    })
  );

  targets = targets.filter(j => setPartecipanti.has(normalizeNumFromJid(j)));
  if (!targets.length) return m.reply('Utente non nel gruppo.');

  // bot + owner
  const botJid = conn.decodeJid(conn.user.jid);
  const botNum = normalizeNumFromJid(botJid);
  const ownerNums = getOwnerNums();

  // ✅ blocco: un mutato non può smutarsi da solo
  if (isUnmute) {
    const tryingSelf = targets.some(j => normalizeNumFromJid(j) === senderNum);
    const senderIsMuted = mutedUsers.has(senderNum);
    if (senderIsMuted && tryingSelf) {
      return m.reply('Sei mutato, non puoi smutarti da solo.');
    }
  }

  // durata
  let timeMs = parseDuration(args);
  if (timeMs === null && isMute) timeMs = DEFAULT_MUTE_MIN * 60000;

  let didSomething = false;

  for (const jid of targets) {
    const num = normalizeNumFromJid(jid);

    // protezione bot
    if (isMute && num === botNum) {
      await m.reply('Non puoi mutare il bot.');
      continue;
    }

    // protezione owner
    if (isMute && ownerNums.has(num)) {
      await m.reply('Non puoi mutare un owner.');
      continue;
    }

    if (isMute) {
      const until = timeMs ? Date.now() + timeMs : 0; // 0 = perm
      mutedUsers.set(num, { until, warned: false });
      didSomething = true;
    } else if (isUnmute) {
      const existed = mutedUsers.delete(num);
      if (existed) didSomething = true;
    }
  }

  if (!didSomething) return;

  // risposta minimal (se vuoi silenzioso totale dimmelo e tolgo anche questa)
  return m.reply(isMute ? 'Mutato 🔇' : 'Smutato ✅');
};

// ✅ MUTE TOTALE VERO: blocca messaggi + comandi + tutto (NON dipende da isCommand)
handler.before = async (m, { conn }) => {
  if (!m.sender || m.sender === conn.user.jid) return;

  const senderJid = conn.decodeJid(m.sender);
  const senderNum = normalizeNumFromJid(senderJid);

  const data = mutedUsers.get(senderNum);
  if (!data) return;

  // scadenza mute
  if (data.until && Date.now() > data.until) {
    mutedUsers.delete(senderNum);
    return;
  }

  // cancella qualsiasi cosa scriva
  try {
    await conn.sendMessage(m.chat, { delete: m.key });
  } catch {}

  // avviso UNA SOLA VOLTA (no spam)
  if (!data.warned) {
    data.warned = true;
    mutedUsers.set(senderNum, data);

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




