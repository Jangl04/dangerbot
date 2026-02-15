// ✅ OWNER BOT (aggiunto solo per protezione)
const BOT_OWNERS = [
  '212781816909@s.whatsapp.net',
  '390935931875@s.whatsapp.net',
  '639753512076@s.whatsapp.net',
];

var handler = async (m, { conn, text, command }) => {
  let action, successMsg, errorMsg, helpMsg;
  if (['promote', 'promuovi', 'p'].includes(command)) {
    action = 'promote';
    successMsg = `『 ✅ 』 \`È stato promosso al ruolo di amministratore.\``;
    errorMsg = `『 ❌ 』 \`Errore nel promuovere l'utente.\``;
    helpMsg = `『 👤 』 \`A chi vuoi dare amministratore?\``;
  } else if (['demote', 'retrocedi', 'r'].includes(command)) {
    action = 'demote';
    successMsg = `『 ✅ 』 \`È stato retrocesso dal ruolo di amministratore.\``;
    errorMsg = `『 ❌ 』 \`Errore nel retrocedere l'utente.\``;
    helpMsg = `『 👤 』 \`A chi vuoi togliere amministratore?\``;
  } else {
    return;
  }

  let number;
  if (m.mentionedJid && m.mentionedJid[0]) {
    number = m.mentionedJid[0].split('@')[0];
  } else if (m.quoted && m.quoted.sender) {
    number = m.quoted.sender.split('@')[0];
  } else if (text && !isNaN(text)) {
    number = text;
  } else if (text) {
    let match = text.match(/@(\d+)/);
    if (match) number = match[1];
  } else {
    return conn.reply(m.chat, helpMsg, m, rcanal);
  }

  if (!number || number.length < 10 || number.length > 15) {
    return conn.reply(m.chat, `『 🩼 』 \`Menziona un numero valido.\``, m, rcanal);
  }

  try {
    let user = number + '@s.whatsapp.net';

    // ✅ BLOCCO AGGIUNTO #1: solo owner possono promote/demote
    if (!BOT_OWNERS.includes(m.sender)) {
      return conn.reply(m.chat, '❌ Solo gli *owner del bot* possono promuovere o retrocedere admin.', m, rcanal);
    }

    // ✅ BLOCCO AGGIUNTO #2: gli owner non si possono toccare tra loro (né promote né demote)
    if (BOT_OWNERS.includes(user)) {
      return conn.reply(m.chat, '❌ Non puoi modificare i permessi di un altro owner del bot.', m, rcanal);
    }

    await conn.groupParticipantsUpdate(m.chat, [user], action);
    conn.reply(m.chat, successMsg, m, fake);
  } catch (e) {
    conn.reply(m.chat, errorMsg, m, rcanal);
  }
};

handler.help = ['promuovi', 'retrocedi', 'p', 'r'];
handler.tags = ['gruppo'];
handler.command = ['promote', 'promuovi', 'p', 'demote', 'retrocedi', 'r'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
