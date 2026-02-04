// 00-max-security.js
// Moderatori (non admin WhatsApp) + blocco comandi per mod + protezione anti-demote OWNER
// Copia/incolla e modifica SOLO BOT_OWNERS e (se vuoi) PREFIXES / MOD_BLOCKED.

const BOT_OWNERS = [
  '212781816909@s.whatsapp.net', // TU (metti il tuo jid)
  '390935931875@s.whatsapp.net', // TOM
];

// =====================
// Storage mods per gruppo
// =====================
const modMem = new Map(); // fallback in-memory se non esiste global.db

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

function getMods(chatId) {
  const chat = getChatObj(chatId);
  if (chat) {
    if (!Array.isArray(chat.mods)) chat.mods = [];
    return new Set(chat.mods);
  }
  if (!modMem.has(chatId)) modMem.set(chatId, new Set());
  return modMem.get(chatId);
}

function saveMods(chatId, set) {
  const chat = getChatObj(chatId);
  if (chat) chat.mods = [...set];
  else modMem.set(chatId, set);
}

function isOwner(jid) {
  return BOT_OWNERS.includes(jid);
}

function isMod(chatId, jid) {
  const mods = getMods(chatId);
  return mods.has(jid) || isOwner(jid);
}

// =====================
// Config “massima sicurezza” per moderatori
// =====================
const PREFIXES = ['.', '!', '/', '#'];

// Comandi BLOCCATI ai moderatori (puoi aggiungere varianti reali del tuo bot)
const MOD_BLOCKED = new Set([
  // kick / ban
  'kick', 'caccia', 'remove', 'ban', 'banna',

  // gestione ruoli admin
  'demote', 'retrocedi', 'retrocede',
  'promote', 'promuovi',

  // aggiungere gente (consigliato bloccarlo)
  'add', 'aggiungi',

  // inviti/gestione link (se il tuo bot li ha)
  'revoke', 'linkreset', 'resetlink',
]);

function parseCommand(text = '') {
  const t = text.trim();
  const p = PREFIXES.find(x => t.startsWith(x));
  if (!p) return null;
  const body = t.slice(p.length).trim();
  if (!body) return null;
  return body.split(/\s+/)[0].toLowerCase();
}

async function isGroupAdmin(conn, chatId, jid) {
  try {
    const meta = await conn.groupMetadata(chatId);
    const part = meta.participants.find(x => x.id === jid);
    return !!part?.admin;
  } catch {
    return false;
  }
}

async function isBotAdmin(conn, chatId) {
  try {
    const meta = await conn.groupMetadata(chatId);
    const botJid = conn.user?.jid;
    const part = meta.participants.find(x => x.id === botJid);
    return !!part?.admin;
  } catch {
    return false;
  }
}

// =====================
// Azione “MAX”: ripristina owner + punisce chi demota
// =====================
async function protectOwnerDemotion(conn, m) {
  // Stub 30 = demotion
  const demoted = m.messageStubParameters?.[0]; // jid retrocesso
  const demoter = m.participant;                // chi ha fatto l’azione
  const groupId = m.chat;

  if (!demoted || !demoter) return;
  if (!isOwner(demoted)) return; // proteggiamo SOLO gli owner

  const botIsAdmin = await isBotAdmin(conn, groupId);

  const alertText =
`🚨 *PROTEZIONE OWNER*
Qualcuno ha provato a retrocedere un OWNER.

👤 Demoter: @${demoter.split('@')[0]}
👑 Owner colpito: @${demoted.split('@')[0]}

${botIsAdmin ? '✅ Sto ripristinando i permessi e bloccando l’attacco.' : '⚠️ Non posso ripristinare: il bot NON è admin.'}`;

  // Avvisa subito (anche se non è admin)
  await conn.sendMessage(groupId, {
    text: alertText,
    contextInfo: { mentionedJid: [demoter, demoted, ...BOT_OWNERS] },
  });

  if (!botIsAdmin) return;

  // 1) Ripromuovi owner retrocesso
  try {
    await conn.groupParticipantsUpdate(groupId, [demoted], 'promote');
  } catch (e) {
    console.error('Errore promote owner:', e);
  }

  // 2) Retrocedi chi ha demotato (se non è owner)
  if (!isOwner(demoter)) {
    try {
      await conn.groupParticipantsUpdate(groupId, [demoter], 'demote');
    } catch (e) {
      console.error('Errore demote demoter:', e);
    }
  }

  // 3) Chiudi gruppo (solo admin possono scrivere)
  try {
    await conn.groupSettingUpdate(groupId, 'announcement');
  } catch (e) {
    console.error('Errore chiusura gruppo:', e);
  }

  // Messaggio finale
  const doneText =
`🔒 *SICUREZZA ATTIVA*
- Owner ripristinato (se possibile)
- Attaccante limitato (se possibile)
- Gruppo chiuso per sicurezza`;

  await conn.sendMessage(groupId, {
    text: doneText,
    contextInfo: { mentionedJid: [demoter, demoted, ...BOT_OWNERS] },
  });
}

// =====================
// HANDLER COMANDO: .mod add/del/list
// =====================
const handler = async (m, { args, mentionedJid, conn }) => {
  // gestione moderatori
  const sub = (args[0] || '').toLowerCase();
  const mods = getMods(m.chat);

  if (!sub || sub === 'list') {
    if (mods.size === 0) return m.reply('📌 Nessun moderatore impostato in questo gruppo.');
    const txt = '👮 *Moderatori del gruppo:*\n' + [...mods].map(j => `- @${j.split('@')[0]}`).join('\n');
    return m.reply(txt, null, { mentions: [...mods] });
  }

  // Permessi: admin gruppo O owner bot
  const senderIsAdmin = await isGroupAdmin(conn, m.chat, m.sender);
  if (!senderIsAdmin && !isOwner(m.sender)) {
    return m.reply('🚫 Solo admin del gruppo (o owner bot) possono gestire i moderatori.');
  }

  // target da mention o numero
  let target = (mentionedJid && mentionedJid[0]) || null;
  if (!target && args[1]) {
    const num = args[1].replace(/[^\d]/g, '');
    if (num) target = num + '@s.whatsapp.net';
  }
  if (!target) return m.reply('Uso:\n.mod add @user\n.mod del @user\n.mod list');

  if (sub === 'add') {
    mods.add(target);
    saveMods(m.chat, mods);
    return m.reply(`✅ Aggiunto moderatore: @${target.split('@')[0]}`, null, { mentions: [target] });
  }

  if (sub === 'del' || sub === 'remove') {
    mods.delete(target);
    saveMods(m.chat, mods);
    return m.reply(`❌ Rimosso moderatore: @${target.split('@')[0]}`, null, { mentions: [target] });
  }

  return m.reply('Uso:\n.mod add @user\n.mod del @user\n.mod list');
};

handler.help = ['mod add @user', 'mod del @user', 'mod list'];
handler.tags = ['group'];
handler.command = /^mod$/i;
handler.group = true;

// =====================
// FILTRO GLOBALE: blocca comandi vietati ai moderatori + anti-demote owner
// =====================
handler.all = async function (m) {
  try {
    if (!m.isGroup) return;

    // 1) PROTEZIONE OWNER: se retrocedono un owner, reagisci (stub 30)
    if (m.messageStubType === 30) {
      await protectOwnerDemotion(conn, m);
      // non return: può comunque fare altre cose dopo, ma di solito basta così
    }

    // 2) BLOCCO COMANDI AI MOD (tranne se admin gruppo)
    const text = m.text || m.body || '';
    const cmd = parseCommand(text);
    if (!cmd) return;

    // se non è moderatore -> non fare nulla
    if (!isMod(m.chat, m.sender)) return;

    // se è admin gruppo, lasciamo passare (admin > mod)
    const admin = await isGroupAdmin(conn, m.chat, m.sender);
    if (admin) return;

    // moderatore NON-admin: blocca i comandi in blacklist
    if (MOD_BLOCKED.has(cmd)) {
      return m.reply('🚫 Questo comando è bloccato per i moderatori.');
    }
  } catch (e) {
    console.error('Errore max-security handler.all:', e);
  }
};

export default handler;
