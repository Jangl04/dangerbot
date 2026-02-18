// MUTE TOTALE (NO SPAM) + PROTEZIONE OWNER/BOT + NO SELF-UNMUTE
// comandi: .m / .muta, .um / .smuta
// mute: mention o reply
// durata: 10, 10m, 30s, perm/0
// avviso: SOLO 1 volta quando tenta di scrivere/usare comandi

const mutedUsers = new Map();
// key: normalizedNumber -> { until: number (0 = perm), warned: boolean }

function normalizeNumFromJid(jid) {
  if (!jid) return '';
  return jid.split('@')[0].replace(/^39/, '');
}

function getOwnerNums() {
  const owners = global.owner || [];
  const nums = new Set();
  for (const o of owners) {
    const raw = Array.isArray(o) ? o[0] : o;
    if (!raw) continue;
    const n = String(raw).replace(/\D/g, '').replace(/^39/, '');
    if (n) nums.add(n);
  }
  return nums;
}

function parseDuration(args = []) {
  const text = args.join(' ').trim();

  if (/(^|\s)(perm|perma|permanente|0)(\s|$)/i.test(text)) return 0;

  const m = text.match(/(^|\s)(\d+)\s*(s|sec|m|min)?(\s|$)/i);
  if (!m) return null;

  const value = parseInt(m[2], 10);
  const unit = (m[3] || 'm').toLowerCase();
  return unit.startsWith('s') ? value * 1000 : value * 60000;
}

async function warnOnce(conn, chat, num) {
  const data = mutedUsers.get(num);
  if (!data) return;

  if (!data.warned) {
    data.warned = true;
    mutedUsers.set(num, data);
    try {
      await conn.sendMessage(chat, { text: 'Ora non puoi parlare perché sei stato mutato 🔇' });
    } catch {}
  }
}

let handler = async (m, { conn, command, args, participants }) => {
  const cmd = (command || '').toLowerCase();
  const isMute = cmd === 'm' || cmd === 'muta';
  const isUnmute = cmd === 'um' || cmd === 'smuta';

  const DEFAULT_MUTE_MIN = 10; // 👈 cambia qui

  // sender
  const senderJid = conn.decodeJid(m.sender);
  const senderNum = normalizeNumFromJid(senderJid);

  // target: mention o reply
  let targets = [];
  if (m.mentionedJid?.length) {
    targets = m.mentionedJid.map(j => conn.decodeJid(j));
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

  // verifica gruppo (numero)
  const setPartecipanti = new Set(
    participants.flatMap(p => {
      const a = conn.decodeJid(p.id);
      const b = p.jid ? conn.decodeJid(p.jid) : null;
      return [normalizeNumFromJid(a), b ? normalizeNumFromJid(b) : null].filter(Boolean);
    })
  );

  targets = targets.filter(j => setPartecipanti.has(normalizeNumFromJid(j)));
  if (!targets.length) return m.reply('Utente non nel gruppo.');

  // BOT + OWNER
  const botJid = conn.decodeJid(conn.user.jid);
  const botNum = normalizeNumFromJid(botJid);
  const ownerNums = getOwnerNums();

  // ✅ BLOCCO: un mutato non può smutarsi da solo
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

    if (isMute && num === botNum) {
      await m.reply('Non puoi mutare il bot.');
      continue;
    }

    if (isMute && ownerNums.has(num)) {
      await m.reply('Non puoi mutare un owner.');
      continue;
    }

    if (isMute) {
      const until = timeMs ? Date.now() + timeMs : 0;
      mutedUsers.set(num, { until, warned: false });
      didSomething = true;
    } else if (isUnmute) {
      const existed = mutedUsers.delete(num);
      if (existed) didSomething = true;
    }
  }

  if (!didSomething) return;
  return m.reply(isMute ? 'Mutato 🔇' : 'Smutato ✅');
};

// ✅ MUTE TOTALE: blocca TUTTO (messaggi + comandi)
handler.before = async (m, { conn, isCommand }) => {
  if (!m.sender || m.sender === conn.user.jid) return;

  const senderJid = conn.decodeJid(m.sender);
  const senderNum = normalizeNumFromJid(senderJid);

  const data = mutedUsers.get(senderNum);
  if (!data) return;

  // scadenza
  if (data.until && Date.now() > data.until) {
    mutedUsers.delete(senderNum);
    return;
  }

  // cancella qualsiasi cosa scriva (messaggio o comando)
  try {
    await conn.sendMessage(m.chat, { delete: m.key });
  } catch {}

  // avviso SOLO 1 volta
  await warnOnce(conn, m.chat, senderNum);

  // blocca completamente
  return false;
};

handler.help = ['m', 'muta', 'um', 'smuta'];
handler.tags = ['gruppo'];
handler.command = /^(m|muta|um|smuta)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;



