let handler = async (m, { conn, text }) => {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Estrae il codice del gruppo dal link
  let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
  let [, code] = text.match(linkRegex) || [];
  if (!code) throw '❌ Link non valido! Inserisci un link valido di WhatsApp.';

  // Messaggio iniziale
  await m.reply('☠️ *𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓* sta avviando il rituale d’ingresso...\n🕯️ Connettendo i circuiti oscuri.');

  await delay(2000);
  await m.reply('💀 Onde digitali oscure convergono sul portale...');

  await delay(2000);
  await m.reply('⚡ Evocazione quasi completa... stabilizzando il nucleo energetico.');

  try {
    await conn.groupAcceptInvite(code);
    await delay(1500);
    await m.reply('🌌 Rituale completato!\n☠️ *𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓* ha attraversato il portale e ora controlla il gruppo.\n🛡️ Ordine e protezione attivi.');
  } catch (e) {
    throw '⚡ Errore: il bot è già presente nel gruppo o il link non è valido.';
  }
};

handler.help = ['join <chat.whatsapp.com>'];
handler.tags = ['owner'];
handler.command = ['join'];
handler.rowner = true;

export default handler;