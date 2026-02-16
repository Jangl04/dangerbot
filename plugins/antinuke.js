// antinuke modificato da axtral + comando toggle

// Lista admin autorizzati
const registeredAdmins = [
  '212781816909@s.whatsapp.net', // luxifer
  '390935931875@s.whatsapp.net', // tom
  '4915511309251@s.whatsapp.net', // bot49
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

// ✅ aggiunta minima: solo owner bot possono toggle ON/OFF
function isBotOwner(jid) {
  return BOT_OWNERS.includes(jid);
}

/**
 * ✅ NUOVA FUNZIONE: tracker retrocessioni admin (soglia 2 in 15 secondi)
 * - key: groupId -> { count, expiresAt }
 */
const demoteTracker = new Map(); // groupId -> { count, expiresAt }

function trackDemotion(groupId) {
  const now = Date.now();
  const data = demoteTracker.get(groupId);

  // se non esiste o è scaduto, reset
  if (!data || now > data.expiresAt) {
    demoteTracker.set(groupId, { count: 1, expiresAt: now + 15_000 });
    return 1;
  }

  data.count += 1;
  demoteTracker.set(groupId, data);
  return data.count;
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

    /**
     * ✅ NUOVO: se in 15s vengono fatti 2 demote → NUCLEAR MODE
     * Toglie admin a tutti tranne: bot, BOT_OWNERS, founder del gruppo
     */
    const demoteCount = trackDemotion(groupId);

    if (demoteCount >= 2) {
      const metadata = await conn.groupMetadata(groupId);

      // founder / owner gruppo (a seconda di come lo espone il framework)
      const founder =
        metadata.owner ||
        metadata.subjectOwner ||
        metadata.participants.find(p => p.admin === 'superadmin')?.id ||
        null;

      const toDemoteAll = metadata.participants
        .filter(p => p.admin) // solo admin
        .map(p => p.id)
        .filter(id =>
          id !== botJid &&
          !BOT_OWNERS.includes(id) &&
          (founder ? id !== founder : true)
        );

      if (toDemoteAll.length > 0) {
        await conn.groupParticipantsUpdate(groupId, toDemoteAll, 'demote');
      }

      await conn.groupSettingUpdate(groupId, 'announcement');

      const text =
`💥 NUCLEAR PROTECTION ATTIVATA

Un amministratore ha retrocesso 2 admin in pochi secondi.

✅ Tutti gli admin sono stati rimossi.
👑 Owner del bot e Founder sono protetti.

🔒 Gruppo chiuso per sicurezza.`;

      const mentions = [
        demoter,
        demoted,
        ...BOT_OWNERS,
        ...(founder ? [founder] : [])
      ];

      await conn.sendMessage(groupId, {
        text,
        contextInfo: { mentionedJid: mentions },
      });

      demoteTracker.delete(groupId);
      return;
    }

    // ✅ Logica originale (non toccata)
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

  // ✅ owner-only SOLO per ON/OFF (non tocco altro)
  if (opt === 'on' || opt === 'enable' || opt === '1' || opt === 'off' || opt === 'disable' || opt === '0') {
    const sender = m.sender || m.participant;
    if (!isBotOwner(sender)) return m.reply('❌ Solo gli *owner del bot* possono attivare/disattivare AntiNuke.');
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


