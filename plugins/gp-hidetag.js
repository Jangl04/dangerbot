// ====== CONFIG ======
const BOT_OWNERS = [
  '212781816909@s.whatsapp.net', // TU
  '390935931875@s.whatsapp.net', // TOM
];

// ====== HELPERS ======
function isOwner(jid) {
  return BOT_OWNERS.includes(jid);
}

function getMods(chatId) {
  const mods = global.db?.data?.chats?.[chatId]?.mods;
  if (!Array.isArray(mods)) return new Set();
  return new Set(mods);
}

function isMod(chatId, jid) {
  return getMods(chatId).has(jid); // owner NON è mod
}

// ====== COMMAND ======
const handler = async (m, { conn, text, participants, command }) => {
  try {
    // ✅ Permessi: owner OR admin OR moderatore
    let isAdmin = false;
    try {
      const meta = await conn.groupMetadata(m.chat);
      const p = meta.participants.find(x => conn.decodeJid(x.id) === conn.decodeJid(m.sender));
      isAdmin = !!p?.admin;
    } catch {}

    if (!isOwner(m.sender) && !isAdmin && !isMod(m.chat, m.sender)) {
      return m.reply('🚫 *Solo admin o moderatori possono usare questo comando*');
    }

    const users = participants.map((u) => conn.decodeJid(u.id));

    if (m.quoted) {
      const quoted = m.quoted;

      if (quoted.mtype === 'imageMessage') {
        const media = await quoted.download();
        await conn.sendMessage(m.chat, {
          image: media,
          caption: text || quoted.text || '',
          mentions: users
        }, { quoted: m });

      } else if (quoted.mtype === 'videoMessage') {
        const media = await quoted.download();
        await conn.sendMessage(m.chat, {
          video: media,
          caption: text || quoted.text || '',
          mentions: users
        }, { quoted: m });

      } else if (quoted.mtype === 'audioMessage') {
        const media = await quoted.download();
        await conn.sendMessage(m.chat, {
          audio: media,
          mimetype: 'audio/mp4',
          mentions: users
        }, { quoted: m });

      } else if (quoted.mtype === 'documentMessage') {
        const media = await quoted.download();
        await conn.sendMessage(m.chat, {
          document: media,
          mimetype: quoted.mimetype,
          fileName: quoted.fileName,
          caption: text || quoted.text || '',
          mentions: users
        }, { quoted: m });

      } else if (quoted.mtype === 'stickerMessage') {
        const media = await quoted.download();
        await conn.sendMessage(m.chat, {
          sticker: media,
          mentions: users
        }, { quoted: m });

      } else {
        await conn.sendMessage(m.chat, {
          text: quoted.text || text || '',
          mentions: users
        }, { quoted: m });
      }

    } else if (text) {
      await conn.sendMessage(m.chat, {
        text: text,
        mentions: users
      }, { quoted: m });

    } else {
      return m.reply('❌ *Inserisci un testo o rispondi a un messaggio/media*');
    }

  } catch (e) {
    console.error('Errore tag/hidetag:', e);
    m.reply(`${global.errore || '❌ Si è verificato un errore'}`);
  }
};

handler.help = ['hidetag', 'totag', 'tag'];
handler.tags = ['gruppo'];
handler.command = /^(\.?hidetag|totag|tag)$/i;

// ✅ NON usare handler.admin=true, altrimenti i mod non entrano mai nel comando
handler.group = true;

export default handler;
