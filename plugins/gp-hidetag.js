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
  const sender = norm(conn, jid);
  if (global.owner && Array.isArray(global.owner)) {
    for (const o of global.owner) {
      const raw = Array.isArray(o) ? o[0] : o;
      if (!raw) continue;
      const num = String(raw).replace(/[^\d]/g, '');
      if (num && sender === `${num}@s.whatsapp.net`) return true;
    }
  }
  const fallback = ['212781816909', '390935931875'];
  if (fallback.some(n => sender === `${n}@s.whatsapp.net`)) return true;
  return false;
}

function isMod(conn, chatId, jid) {
  const chat = ensureDB(chatId);
  const modsSet = new Set(chat.mods.map(x => norm(conn, x)));
  return modsSet.has(norm(conn, jid));
}

const handler = async (m, { conn, text, participants }) => {
  try {
    const owner = isOwner(conn, m.sender);
    const admin = await isGroupAdmin(conn, m.chat, m.sender);
    const mod = isMod(conn, m.chat, m.sender);

    if (!owner && !admin && !mod) {
      return m.reply('🚫 Solo admin o moderatori possono usare questo comando');
    }

    const users = participants.map(u => norm(conn, u.id));

    if (m.quoted) {
      const quoted = m.quoted;

      if (quoted.mtype === 'imageMessage') {
        const media = await quoted.download();
        return conn.sendMessage(m.chat, { image: media, caption: text || quoted.text || '', mentions: users }, { quoted: m });
      }
      if (quoted.mtype === 'videoMessage') {
        const media = await quoted.download();
        return conn.sendMessage(m.chat, { video: media, caption: text || quoted.text || '', mentions: users }, { quoted: m });
      }
      if (quoted.mtype === 'audioMessage') {
        const media = await quoted.download();
        return conn.sendMessage(m.chat, { audio: media, mimetype: 'audio/mp4', mentions: users }, { quoted: m });
      }
      if (quoted.mtype === 'documentMessage') {
        const media = await quoted.download();
        return conn.sendMessage(m.chat, {
          document: media,
          mimetype: quoted.mimetype,
          fileName: quoted.fileName,
          caption: text || quoted.text || '',
          mentions: users
        }, { quoted: m });
      }
      if (quoted.mtype === 'stickerMessage') {
        const media = await quoted.download();
        return conn.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: m });
      }

      return conn.sendMessage(m.chat, { text: quoted.text || text || '', mentions: users }, { quoted: m });
    }

    if (text) {
      return conn.sendMessage(m.chat, { text, mentions: users }, { quoted: m });
    }

    return m.reply('❌ *Inserisci un testo o rispondi a un messaggio/media*');
  } catch (e) {
    console.error('Errore tag/hidetag:', e);
    return m.reply(`${global.errore || '❌ Si è verificato un errore'}`);
  }
};

handler.help = ['hidetag', 'totag', 'tag'];
handler.tags = ['gruppo'];
handler.command = /^(\.?hidetag|totag|tag)$/i;
handler.group = true;

export default handler;


