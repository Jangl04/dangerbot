// plugins/gp-hidetag.js — tag/hidetag/totag per Admin + Moderatori + Owner

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
  if (dj.includes('@')) return dj.replace(/[^\d@]/g, '');
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

function isMod(conn, chatId, jid) {
  const chat = ensureDB(chatId);
  const modsSet = new Set(chat.mods.map(j => cleanJid(conn, j)));
  return modsSet.has(cleanJid(conn, jid));
}

const handler = async (m, { conn, text, participants }) => {
  try {
    // ✅ Permessi: Owner OR Admin WA OR Moderatore bot
    const sender = cleanJid(conn, m.sender);
    const admin = await isGroupAdmin(conn, m.chat, sender);

    if (!isOwner(sender) && !admin && !isMod(conn, m.chat, sender)) {
      return m.reply('🚫 Solo admin o moderatori possono usare questo comando');
    }

    const users = participants.map(u => cleanJid(conn, u.id));

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
        return conn.sendMessage(
          m.chat,
          { document: media, mimetype: quoted.mimetype, fileName: quoted.fileName, caption: text || quoted.text || '', mentions: users },
          { quoted: m }
        );
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
// ❌ NON mettere handler.admin = true

export default handler;

