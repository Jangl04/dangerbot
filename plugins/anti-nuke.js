// Lista admin autorizzati
const registeredAdmins = [
  '212781816909@s.whatsapp.net', // luxifer
  '390935931875@s.whatsapp.net', // tom
  '4915511309251@s.whatsapp.net', // bot 49
];

// Owner del bot
const BOT_OWNERS = [
  '212781816909@s.whatsapp.net',
  '390935931875@s.whatsapp.net',
];

// Tracker retrocessioni admin (2 in 15 secondi = nuclear)
const demoteTracker = new Map(); // groupId -> { count, expiresAt }

function trackDemotion(groupId) {
  const now = Date.now();
  const data = demoteTracker.get(groupId);

  if (!data || now > data.expiresAt) {
    demoteTracker.set(groupId, { count: 1, expiresAt: now + 15000 });
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

🔒 Gruppo chiuso per possibile tentativo di takeover.

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

    const demoteCount = trackDemotion(groupId);

    // 💥 NUCLEAR MODE
    if (demoteCount >= 2) {
      const metadata = await conn.groupMetadata(groupId);

      const founder =
        metadata.owner ||
        metadata.subjectOwner ||
        metadata.participants.find(p => p.admin === 'superadmin')?.id ||
        null;

      const toDemoteAll = metadata.participants
        .filter(p => p.admin)
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

Un admin ha retrocesso 2 amministratori in pochi secondi.

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

    // Logica normale
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

🔒 Gruppo chiuso per possibile tentativo di takeover.

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

const handler = m => m;

handler.before = async function (m, { conn, isBotAdmin }) {
  try {
    if (!m.isGroup) return;
    if (!isBotAdmin) return;

    // 29 = promote
    if (m.messageStubType === 29) {
      await handlePromotion(conn, m);
    }

    // 30 = demote
    if (m.messageStubType === 30) {
      await handleDemotion(conn, m);
    }

  } catch (e) {
    console.error('Errore AntiNuke before:', e);
  }
};

export default handler;