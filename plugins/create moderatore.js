function ensureDB(chatId) {
  if (!global.db) global.db = { data: { chats: {} } };
  if (!global.db.data) global.db.data = { chats: {} };
  if (!global.db.data.chats) global.db.data.chats = {};
  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {};
  if (!Array.isArray(global.db.data.chats[chatId].mods)) global.db.data.chats[chatId].mods = [];
  return global.db.data.chats[chatId];
}

function norm(conn, jid) {
  return conn.decodeJid(jid);
}

async function isGroupAdmin(conn, chatId, jid) {
  try {
    const meta = await conn.groupMetadata(chatId);
    const sender = norm(conn, jid);
    const p = meta.participants.find(x => norm(conn, x.id) === sender);
    return !!p?.admin;
  } catch {
    return false;
  }
}

function isOwner(conn, jid) {
  // prende owner dal bot se esiste
  const sender = norm(conn, jid);

  if (global.owner && Array.isArray(global.owner)) {
    for (const o of global.owner) {
      const raw = Array.isArray(o) ? o[0] : o;
      if (!raw) continue;
      const num = String(raw).replace(/[^\d]/g, '');
      if (num && sender === `${num}@s.whatsapp.net`) return true;
    }
  }

  // fallback: aggiungi i tuoi numeri QUI se vuoi
  const fallback = ['212781816909', '390935931875'];
  if (fallback.some(n => sender === `${n}@s.whatsapp.net`)) return true;

  return false;
}

const handler = async (m, { conn, args, mentionedJid }) => {
  const sub = (args[0] || 'list').toLowerCase();
  const chat = ensureDB(m.chat);

  const senderIsAdmin = await isGroupAdmin(conn, m.chat, m.sender);
  const senderIsOwner = isOwner(conn, m.sender);

  if (!senderIsAdmin && !senderIsOwner) {
    return m.reply('🚫 Solo admin del gruppo (o owner bot) possono gestire i moderatori.');
  }

  const modsSet = new Set(chat.mods.map(j => norm(conn, j)));

  if (sub === 'list') {
    if (modsSet.size === 0) return m.reply('📌 Nessun moderatore impostato.');
    const txt = '👮 Moderatori del gruppo (JID):\n' + [...modsSet].map(j => `• ${j}`).join('\n');
    return m.reply(txt);
  }

  let target = (mentionedJid && mentionedJid[0]) || null;
  if (!target) return m.reply('Uso:\n.mod add @user\n.mod del @user\n.mod list');

  target = norm(conn, target);

  if (sub === 'add') {
    modsSet.add(target);
    chat.mods = [...modsSet];
    return m.reply(`✅ Aggiunto moderatore (JID):\n${target}`);
  }

  if (sub === 'del' || sub === 'remove') {
    modsSet.delete(target);
    chat.mods = [...modsSet];
    return m.reply(`❌ Rimosso moderatore (JID):\n${target}`);
  }

  return m.reply('Uso:\n.mod add @user\n.mod del @user\n.mod list');
};

handler.help = ['mod add @user', 'mod del @user', 'mod list'];
handler.tags = ['group'];
handler.command = /^mod$/i;
handler.group = true;

export default handler;





