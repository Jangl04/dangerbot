// 00-mute-total.js
// MUTE TOTALE REALE (blocca anche i comandi tipo .menu/.tag) + NO SPAM
// comandi admin: .m / .muta, .um / .smuta
// durata: 10, 10m, 30s, perm/0
// avviso: UNA SOLA VOLTA

global.mutedUsers = global.mutedUsers || new Map();
// key: numero normalizzato -> { until: number (0=perm), warned: boolean }

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

async function warnOnce(conn, chat, num) {
  const data = global.mutedUsers.get(num);
  if (!data) return;

  if (!data.warned) {
    data.warned = true;
    global.mutedUsers.set(num, data);
    try {
      await conn.sendMessage(chat, { text: 'Ora non puoi parlare perché sei stato mutato 🔇' });
    } catch {}
  }
}

/**
 * ✅ BLOCCO TOTALE GLOBALE
 * Questa parte gira su OGNI messaggio e ferma TUTTO (anche i comandi).
 */
let handler = async (m, { conn }) => {
  return;
};

handler.all = async function (m, { conn }) {
  if (!m?.sender || m.sender === conn.user.jid) return;

  const senderJid = conn.decodeJid(m.sender);
  const senderNum = normalizeNumFromJid(senderJid);

  const data = global.mutedUsers.get(senderNum);
  if (!data) return;

  // scadenza
  if (data.until && Date.now() > data.until) {
    global.mutedUsers.delete(senderNum);
    return;
  }

  // cancella qualunque messaggio (comandi inclusi)
  await deleteMsg(conn, m);

  // avviso 1 volta
  await warnOnce(conn, m.chat, senderNum);

  // 🔒 blocca davvero: impedisce agli altri plugin di leggere il contenuto
  // (alcune basi continuano a processare: così li “accechiamo”)
  try { m.text = ''; } catch {}
  try { m.body = ''; } catch {}
  try { m.message = null; } catch {}

  return true; // nelle basi che rispettano il return, ferma qui
};

/**
 * ✅ COMANDI ADMIN (muta/smuta)
 */
handler.command = /^(m|muta|um|smuta)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

handler.help = ['m', 'muta', 'um', 'smuta'];
handler.tags = ['gruppo'];

handler.exec = async (m, { conn, command, args, participants }) => {
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

  // verifica gruppo per numero
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

  // NO SELF-UNMUTE se mutato
  if (isUnmute) {
    const tryingSelf = targets.some(j => normalizeNumFromJid(j) === senderNum);
    const senderIsMuted = global.mutedUsers.has(senderNum);
    if (senderIsMuted && tryingSelf) return m.reply('Sei mutato, non puoi smutarti da solo.');
  }

  // durata
  let timeMs = parseDuration(args);
  if (timeMs === null && isMute) timeMs = DEFAULT_MUTE_MIN * 60000;

  let did = false;

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
      global.mutedUsers.set(num, { until, warned: false });
      did = true;
    } else if (isUnmute) {
      const existed = global.mutedUsers.delete(num);
      if (existed) did = true;
    }
  }

  if (!did) return;
  return m.reply(isMute ? 'Mutato 🔇' : 'Smutato ✅');
};

// alcune basi chiamano handler direttamente, altre handler.exec: supportiamo entrambe
const _old = handler;
handler = async (...args) => {
  // se è un comando mute/smute usa exec
  const [m, ctx] = args;
  const c = (ctx?.command || '').toLowerCase();
  if (/^(m|muta|um|smuta)$/i.test(c)) return _old.exec(m, ctx);
  return;
};

handler.all = _old.all;
handler.help = _old.help;
handler.tags = _old.tags;
handler.command = _old.command;
handler.group = _old.group;
handler.admin = _old.admin;
handler.botAdmin = _old.botAdmin;

export default handler;
