// plugins/mod.js — Gestione Moderatori (owner/admin riconosciuti in modo robusto)

function ensureDB(chatId) {
  if (!global.db) global.db = { data: { chats: {} } };
  if (!global.db.data) global.db.data = { chats: {} };
  if (!global.db.data.chats) global.db.data.chats = {};
  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {};
  if (!Array.isArray(global.db.data.chats[chatId].mods)) global.db.data.chats[chatId].mods = [];
  return global.db.data.chats[chatId];
}

function cleanJid(conn, jid) {
  const dj = conn.decodeJid(jid);
  // normalizza anche roba tipo +39..., spazi ecc.
  if (dj.includes('@')) return dj.replace(/[^\d@]/g, '');
  const num = String(dj).replace(/[^\d]/g, '');
  return num ? `${num}@s.whatsapp.net` : dj;
}

// ✅ owner robusto: usa global.owner se esiste, altrimenti BOT_OWNERS fallback
const BOT_OWNERS_FALLBACK = [
  '212781816909@s.whatsapp.net',
  '390935931875@s.whatsapp.net',
];

function getOwnersNormalized(conn) {
  const list = [];

  // molti bot hanno global.owner = [['number','name',true], ...] oppure ['number', ...]
  if (global.owner) {
    if (Array.isArray(global.owner)) {
      for (const o of global.owner) {
        if (Array.isArray(o) && o[0]) list.push(String(o[0]));
        else if (typeof o === 'string') list.push(o);
      }
    }
  }

  // fallback
  for (const o of BOT_OWNERS_FALLBACK) list.push(o);

  // normalizza tutti a jid
  const normalized = new Set();
  for (const raw of list) {
    const n = String(raw).replace(/[^\d]/g, '');
    if (n) normalized.add(`${n}@s.whatsapp.net`);
    if (raw.includes('@')) normalized.add(raw.replace(/[^\d@]/g, ''));
  }
  return normalized;
}

async function isGroupAdmin(conn, chatId, jid) {
  try {
    const meta = await conn.groupMetadata(chatId);
    const sender = cleanJid(conn, jid);
    const p = meta.participants.find(x => cleanJid(conn, x.id) === sender);
    return !!p?.admin;
  } catch {
    return false;
  }
}

const handler = async (m, { conn, args, mentionedJid }) => {
  const sub = (args[0] || 'list').toLowerCase();
  const chat = ensureDB(m.chat);

  const sender = cleanJid(conn, m.sender);
  const owners = getOwnersNormalized(conn);
  const senderIsOwner = owners.has(sender);
  const senderIsAdmin = await isGroupAdmin(conn, m.chat, sender);

  if (!senderIsAdmin && !senderIsOwner) {
    return m.reply('🚫 Solo admin del gruppo (o owner bot) possono gestire i moderatori.');
  }

  const modsSet = new Set(chat.mods.map(j => cleanJid(conn, j)));

  if (sub === 'list') {
    if (modsSet.size === 0) return m.reply('📌 Nessun moderatore impostato in questo gruppo.');
    const txt = '👮 Moderatori del gruppo:\n' + [...modsSet].map(j => `• @${j.split('@')[0]}`).join('\n');
    return m.reply(txt, null, { mentions: [...modsSet] });
  }

  let target = (mentionedJid && mentionedJid[0]) || null;
  if (!target && args[1]) {
    const num = args[1].replace(/[^\d]/g, '');
    if (num) target = `${num}@s.whatsapp.net`;
  }
  if (!target) return m.reply('Uso:\n.mod add @user\n.mod del @user\n.mod list');

  target = cleanJid(conn, target);

  if (sub === 'add') {
    modsSet.add(target);
    chat.mods = [...modsSet];
    return m.reply(`✅ Aggiunto moderatore: @${target.split('@')[0]}`, null, { mentions: [target] });
  }

  if (sub === 'del' || sub === 'remove') {
    modsSet.delete(target);
    chat.mods = [...modsSet];
    return m.reply(`❌ Rimosso moderatore: @${target.split('@')[0]}`, null, { mentions: [target] });
  }

  return m.reply('Uso:\n.mod add @user\n.mod del @user\n.mod list');
};

handler.help = ['mod add @user', 'mod del @user', 'mod list'];
handler.tags = ['group'];
handler.command = /^mod$/i;
handler.group = true;

export default handler;




