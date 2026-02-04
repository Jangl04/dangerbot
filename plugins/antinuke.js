// antinuke modificato da axtral + comando toggle

// Lista admin autorizzati
const registeredAdmins = [
  '212781816909@s.whatsapp.net', // luxifer
  '390935931875@s.whatsapp.net', // tom
  '212785114572@s.whatsapp.net', // bot212
];

// Owner del bot
const BOT_OWNERS = [
  '212781816909@s.whatsapp.net',
  '390935931875@s.whatsapp.net',
];

// fallback se NON hai global.db
const antiNukeMem = new Map(); // key: chatId -> boolean

function getChatObj(chatId) {
  try {
    if (!global.db) return null;
    if (!global.db.data) global.db.data = {};
    if (!global.db.data.chats) global.db.data.chats = {};
    if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {};
    return global.db.data.chats[chatId];
  } catch {
    return null;
  }
}

function isAntiNukeEnabled(chatId) {
  const chat = getChatObj(chatId);
  if (chat) return !!chat.antinuke;
  return antiNukeMem.get(chatId) === true;
}

function setAntiNuke(chatId, value) {
  const chat = getChatObj(chatId);
  if (chat) chat.antinuke = value;
  else antiNukeMem.set(chatId, value);
}

async function handlePromotion(conn, message) {
  try {
    const newAdmin = message.messageStubParameters?.[0];
    const promoter = message.participant;
    const groupId = message.chat;
    const botJid = conn.user.jid;

    const allowed = [botJid, ...BOT_OWNERS, ...registeredAdmins];

    if (allowed.includes(promoter)) return;
    if (newAdmin === botJid) return;

    const metadata = await conn.groupMetadata(groupId);
    const currentAdmins = metadata.participants
      .filter(p => p.admin)
      .map(p => p.id)
      .filter(id => !allowed.includes(id));

    const toDemote = [...new Set([...currentAdmins, promoter, newAdmin])];

    if (toDemote.length > 0) {
      await conn.groupParticipantsUpdate(groupId, toDemote, 'demote');
    }

    await conn.groupSettingUpdate(groupId, 'announcement');

    const text =
`🚨 ANTI-NUKE ATTIVO

👤 @${promoter.split('@')[0]} ha promosso @${newAdmin.split('@')[0]}.

🔒 Gruppo chiuso per possibile tentativo di rubare/svt.

👑 Owner avvisati:
${BOT_OWNERS.map(x => `@${x.split('@')[0]}`).join('\n')}

⚠️ Sistema di sicurezza attivo`;

    await conn.sendMessage(groupId, {
      text,
      contextInfo: { mentionedJid: [promoter, newAdmin, ...BOT_OWNERS] },
    });
  } catch (error) {
    console.error('Errore in handlePromotion:', error);
  }
}

async function handleDemotion(conn, message) {
  try {
    const demoted = message.messageStubParameters?.[0];
    const demoter = message.participant;
    const groupId = message.chat;
    const botJid = conn.user.jid;

    const allowed = [botJid, ...BOT_OWNERS, ...registeredAdmins];

    if (allowed.includes(demoter)) return;
    if (demoted === botJid) return;

    const metadata = await conn.groupMetadata(groupId);
    const currentAdmins = metadata.participants
      .filter(p => p.admin)
      .map(p => p.id)
      .filter(id => !allowed.includes(id));

    const toDemote = [...new Set([...currentAdmins, demoter, demoted])];

    if (toDemote.length > 0) {
      await conn.groupParticipantsUpdate(groupId, toDemote, 'demote');
    }

    await conn.groupSettingUpdate(groupId, 'announcement');

    const text =
`🚨 ANTI-NUKE ATTIVO

👤 @${demoter.split('@')[0]} ha retrocesso @${demoted.split('@')[0]}.

🔒 Gruppo chiuso per possibile tentativo di rubare/svt.

👑 Owner avvisati:
${BOT_OWNERS.map(x => `@${x.split('@')[0]}`).join('\n')}

⚠️ Sistema di sicurezza attivo`;

    await conn.sendMessage(groupId, {
      text,
      contextInfo: { mentionedJid: [demoter, demoted, ...BOT_OWNERS] },
    });
  } catch (error) {
    console.error('Errore in handleDemotion:', error);
  }
}

// ✅ COMANDO (questo è IMPORTANTISSIMO nel tuo framework)
const handler = async (m, { args }) => {
  const opt = (args[0] || 'status').toLowerCase();

  if (opt === 'status') {
    const st = isAntiNukeEnabled(m.chat) ? 'ON ✅' : 'OFF ❌';
    return m.reply(`🛡️ AntiNuke: *${st}*\n\nUsa:\n.antinuke on\n.antinuke off\n.antinuke status`);
  }

  if (opt === 'on' || opt === 'enable' || opt === '1') {
    setAntiNuke(m.chat, true);
    return m.reply('✅ AntiNuke attivato in questo gruppo.');
  }

  if (opt === 'off' || opt === 'disable' || opt === '0') {
    setAntiNuke(m.chat, false);
    return m.reply('❌ AntiNuke disattivato in questo gruppo.');
  }

  return m.reply('Uso: .antinuke on | off | status');
};

handler.help = ['antinuke on/off/status'];
handler.tags = ['group'];
handler.command = /^antinuke$/i;

handler.group = true;
handler.admin = true; // solo admin gruppo (se vuoi anche owner bot, dimmelo)

// ✅ Listener eventi: parte solo se ON
handler.all = async function (m) {
  try {
    if (!m.isGroup) return;
    if (!isAntiNukeEnabled(m.chat)) return;

    if (m.messageStubType === 29) {
      await handlePromotion(conn, m);
    } else if (m.messageStubType === 30) {
      await handleDemotion(conn, m);
    }
  } catch (e) {
    console.error('Errore handler.all antinuke:', e);
  }
};

export default handler;

