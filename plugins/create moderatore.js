 // plugins/mod.js — Gestione Moderatori (JID normalizzato, salva su global.db)

const BOT_OWNERS = [
  '212781816909@s.whatsapp.net', // TU
  '390935931875@s.whatsapp.net', // TOM
];

function isOwner(jid) {
  return BOT_OWNERS.includes(jid);
}

function ensureDB(chatId) {
  if (!global.db) global.db = { data: { chats: {} } };
  if (!global.db.data) global.db.data = { chats: {} };
  if (!global.db.data.chats) global.db.data.chats = {};
  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {};
  if (!Array.isArray(global.db.data.chats[chatId].mods)) global.db.data.chats[chatId].mods = [];
  return global.db.data.chats[chatId];
}

// Normalizza sempre a "numero@s.whatsapp.net"
function cleanJid(conn, jid) {
  const dj = conn.decodeJid(jid);
  // se è già jid
  if (dj.includes('@')) return dj.replace(/[^\d@]/g, '');
  // se è numero
  const num = String(dj).replace(/[^\d]/g, '');
  return num ? `${num}@s.whatsapp.net` : dj;
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

  // permessi: admin gruppo o owner bot
  const sender = cleanJid(conn, m.sender);
  const senderIsAdmin = await isGroupAdmin(conn, m.chat, sender);
  if (!senderIsAdmin && !isOwner(sender)) {
    return m.reply('🚫 Solo admin del gruppo (o owner bot) possono gestire i moderatori.');
  }

  const modsSet = new Set(chat.mods.map(j => cleanJid(conn, j)));

  // LIST
  if (sub === 'list' || !sub) {
    if (modsSet.size === 0) return m.reply('📌 Nessun moderatore impostato in questo gruppo.');
    const txt = '👮 Moderatori del gruppo:\n' + [...modsSet].map(j => `• @${j.split('@')[0]}`).join('\n');
    return m.reply(txt, null, { mentions: [...modsSet] });
  }

  // target da mention o numero scritto
  let target = (mentionedJid && mentionedJid[0]) || null;
  if (!target && args[1]) {
    const num = args[1].replace(/[^\d]/g, '');
    if (num) target = `${num}@s.whatsapp.net`;
  }
  if (!target) return m.reply('Uso:\n.mod add @user\n.mod del @user\n.mod list');

  target = cleanJid(conn, target);

  // ADD
  if (sub === 'add') {
    modsSet.add(target);
    chat.mods = [...modsSet];
    return m.reply(`✅ Aggiunto moderatore: @${target.split('@')[0]}`, null, { mentions: [target] });
  }

  // DEL
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



