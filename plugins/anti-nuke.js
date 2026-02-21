// Tracker retrocessioni (2 in 15 sec = nuclear)
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

const registeredAdmins = [
  '212781816909@s.whatsapp.net',
  '390935931875@s.whatsapp.net',
  '4915511309251@s.whatsapp.net',
];

const BOT_OWNERS = [
  '212781816909@s.whatsapp.net',
  '390935931875@s.whatsapp.net',
];

export async function before(m, { conn, isBotAdmin }) {
  if (m.isBaileys || m.fromMe) return true;
  if (!m.isGroup) return false;
  if (!isBotAdmin) return false;

  let chat = global.db.data.chats[m.chat];
  if (!chat) return false;

  // 🔒 Se antinuke non attivo → esce
  if (!chat.antiNuke) return false;

  const botJid = conn.user.jid;
  const groupId = m.chat;
  const promoter = m.participant;
  const allowed = [botJid, ...BOT_OWNERS, ...registeredAdmins];

  try {

    // =============================
    // 🚀 PROMOZIONE (Stub 29)
    // =============================
    if (m.messageStubType === 29) {

      const newAdmin = m.messageStubParameters?.[0];
      if (!newAdmin) return true;

      if (allowed.includes(promoter)) return true;
      if (newAdmin === botJid) return true;

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

      await conn.sendMessage(groupId, {
        text: `╔═══━─━─━─━─━─━─━═══╗
   ⚡ 𝐍𝚵𝑿𝐒𝐔𝐒 • 𝐀𝐍𝐓𝐈𝐍𝐔𝐊𝐄
╚═══━─━─━─━─━─━─━═══╝
🚨 PROMO NON AUTORIZZATA

🔒 Gruppo chiuso per sicurezza.
👑 Owner avvisati.
━━━━━━━━━━━━━━━━━━`,
        contextInfo: {
          mentionedJid: [promoter, newAdmin, ...BOT_OWNERS],
        },
      });

      return true;
    }

    // =============================
    // 💣 RETROCESSIONE (Stub 30)
    // =============================
    if (m.messageStubType === 30) {

      const demoted = m.messageStubParameters?.[0];
      if (!demoted) return true;

      if (allowed.includes(promoter)) return true;
      if (demoted === botJid) return true;

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

        await conn.sendMessage(groupId, {
          text: `╔═══━─━─━─━─━─━─━═══╗
   ⚡ 𝐍𝚵𝑿𝐒𝐔𝐒 • 𝐍𝐔𝐂𝐋𝐄𝐀𝐑
╚═══━─━─━─━─━─━─━═══╝
💥 MODALITÀ NUCLEARE ATTIVATA

Tutti gli admin rimossi.
Gruppo chiuso per takeover.
━━━━━━━━━━━━━━━━━━`,
          contextInfo: {
            mentionedJid: [promoter, demoted, ...BOT_OWNERS, ...(founder ? [founder] : [])],
          },
        });

        demoteTracker.delete(groupId);
        return true;
      }

      // 🔒 Singola retrocessione
      const metadata = await conn.groupMetadata(groupId);

      const currentAdmins = metadata.participants
        .filter(p => p.admin)
        .map(p => p.id)
        .filter(id => !allowed.includes(id));

      const toDemote = [...new Set([...currentAdmins, promoter, demoted])];

      if (toDemote.length > 0) {
        await conn.groupParticipantsUpdate(groupId, toDemote, 'demote');
      }

      await conn.groupSettingUpdate(groupId, 'announcement');

      await conn.sendMessage(groupId, {
        text: `╔═══━─━─━─━─━─━─━═══╗
   ⚡ 𝐍𝚵𝑿𝐒𝐔𝐒 • 𝐀𝐍𝐓𝐈𝐍𝐔𝐊𝐄
╚═══━─━─━─━─━─━─━═══╝
🚨 RETROCESSIONE SOSPETTA

🔒 Gruppo chiuso per sicurezza.
👑 Owner avvisati.
━━━━━━━━━━━━━━━━━━`,
        contextInfo: {
          mentionedJid: [promoter, demoted, ...BOT_OWNERS],
        },
      });

      return true;
    }

  } catch (e) {
    console.error('Errore AntiNuke:', e);
  }

  return true;
}