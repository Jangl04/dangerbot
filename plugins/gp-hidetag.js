// ====== OWNER ======
const BOT_OWNERS = [
  '212781816909@s.whatsapp.net',
  '390935931875@s.whatsapp.net',
];

function isOwner(jid) {
  return BOT_OWNERS.includes(jid);
}

// ====== MOD STORE UNIFICATO ======
if (!global.__modsStore) global.__modsStore = new Map(); // chatId -> Set(jid)

function normJid(conn, jid) {
  return conn.decodeJid(jid);
}

function getMods(conn, chatId) {
  // 1) DB
  const dbMods = global.db?.data?.chats?.[chatId]?.mods;
  if (Array.isArray(dbMods)) return new Set(dbMods.map(j => normJid(conn, j)));

  // 2) fallback globale
  if (!global.__modsStore.has(chatId)) global.__modsStore.set(chatId, new Set());
  return global.__modsStore.get(chatId);
}

function isMod(conn, chatId, jid) {
  const mods = getMods(conn, chatId);
  return mods.has(normJid(conn, jid));
}

// ====== COMMAND ======
const handler = async (m, { conn, text, participants }) => {
  try {
    // ✅ Permessi: owner OR admin OR moderatore
    let isAdmin = false;
    try {
      const meta = await conn.groupMetadata(m.chat);
      const sender = normJid(conn, m.sender);
      const p = meta.participants.find(x => normJid(conn, x.id) === sender);
      isAdmin = !!p?.admin;
    } catch {}

    if (!isOwner(normJid(conn, m.sender)) && !isAdmin && !isMod(conn, m.chat, m.sender)) {
      return m.reply('🚫 *Solo admin o moderatori possono usare questo comando*');
    }

    const users = participants.map(u => normJid(conn, u.id));

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
// ❌ NON mettere handler.admin=true

export default handler;
