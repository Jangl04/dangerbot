// MUTE UNICO (NO SPAM) + PROTEZIONE OWNER/BOT + NO SELF-UNMUTE
// + "Utente già mutato" / "Questo utente non è mutato"
// Nota: blocco comandi dipende dalla base. Qui facciamo il massimo nel singolo plugin.

const mutedUsers = new Map();
// key: normalizedNumber -> { until: number (0=perm), warned: boolean }

function normalizeNumFromJid(jid) {
  if (!jid) return '';
  const num = jid.split('@')[0].replace(/\D/g, '');
  return num.replace(/^39/, '');
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

async function deleteMsg(conn, m) {
  try {
    await conn.sendMessage(m.chat, { delete: m.key });
  } catch {}
}

let handler = async (m, { conn, command, args, participants }) => {
  const cmd = (command || '').toLowerCase();
  const isMute = cmd === 'm' || cmd === 'muta';
  const isUnmute = cmd === 'um' || cmd === 'smuta';

  const DEFAULT_MUTE_MIN = 10;

  const senderNum = normalizeNumFromJid(conn.decodeJid(m.sender));

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

  // verifica gruppo (numero) + compat @lid
  const setPartecipanti = new Set(
    participants.flatMap(p => {
      const a = conn.decodeJid(p.id);
      const b = p.jid ? conn.decodeJid(p.jid) : null;
      return [normalizeNumFromJid(a), b ? normalizeNumFromJid(b) : null].filter(Boolean);
    })
  );

  targets = targets.filter(j => setPartecipanti.has(normalizeNumFromJid(j)));
  if (!targets.length) return m.reply('Utente non nel gruppo.');

  // protezioni
  const botNum = normalizeNumFromJid(conn.decodeJid(conn.user.jid));
  const ownerNums = getOwnerNums();

  // no self-unmute se mutato
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
      if (mutedUsers.has(num)) {
        await m.reply('Utente già mutato.');
        continue;
      }
      const until = timeMs ? Date.now() + timeMs : 0;
      mutedUsers.set(num, { until, warned: false });
      didSomething = true;
      continue;
    }

    if (isUnmute) {
      if (!mutedUsers.has(num)) {
        await m.reply('Questo utente non è mutato.');
        continue;
      }
      mutedUsers.delete(num);
      didSomething = true;
      continue;
    }
  }

  if (!didSomething) return;
  return m.reply(isMute ? 'Mutato 🔇' : 'Smutato ✅');
};

// BLOCCO MUTE (messaggi + tentativo blocco comandi)
handler.before = async (m, { conn }) => {
  if (!m?.sender || m.sender === conn.user.jid) return;

  const senderNum = normalizeNumFromJid(conn.decodeJid(m.sender));
  const data = mutedUsers.get(senderNum);
  if (!data) return;

  // scadenza
  if (data.until && Date.now() > data.until) {
    mutedUsers.delete(senderNum);
    return;
  }

  // cancella qualsiasi cosa inviata
  await deleteMsg(conn, m);

  // avviso UNA sola volta
  if (!data.warned) {
    data.warned = true;
    mutedUsers.set(senderNum, data);
    try {
      await conn.sendMessage(m.chat, { text: 'Ora non puoi parlare perché sei stato mutato 🔇' });
    } catch {}
  }

  // tentativo “mute totale” anche sui comandi (alcune basi rispettano questo)
  try { m.text = ''; } catch {}
  try { m.body = ''; } catch {}
  try { m.message = null; } catch {}

  return false;
};

handler.help = ['m', 'muta', 'um', 'smuta'];
handler.tags = ['gruppo'];
handler.command = /^(m|muta|um|smuta)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;





