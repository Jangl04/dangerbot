const handler = async (message, { conn, usedPrefix = '.' }) => {

    const menuText = `
⚡ 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 – 𝐎𝐖𝐍𝐄𝐑 𝐂𝐎𝐍𝐓𝐑𝐎𝐋 ⚡

════════════════════
🚫 𝐆𝐄𝐒𝐓𝐈𝐎𝐍𝐄 𝐔𝐓𝐄𝐍𝐓𝐈
➤ ${usedPrefix}banuser 🔒 Blocca utente dal bot
➤ ${usedPrefix}unbanuser 🔓 Sblocca utente
➤ ${usedPrefix}addmod 🛡️ Nomina moderatore
➤ ${usedPrefix}delmod 🩸 Rimuovi moderatore
➤ ${usedPrefix}resetmod 🗑️ Reset completo moderatori

════════════════════
🤖 𝐂𝐎𝐍𝐓𝐑𝐎𝐋𝐋𝐎 𝐁𝐎𝐓
➤ ${usedPrefix}join + link 🚪 Forza ingresso bot
➤ ${usedPrefix}reimpostagp ♻️ Reimposta link gruppo
➤ ${usedPrefix}getid (link gp) 🆔 Ottieni ID gruppo
➤ ${usedPrefix}out 🚷 Espelli bot dal gruppo
➤ ${usedPrefix}aggiorna 🌐 Aggiorna sistema

════════════════════
📡 𝐅𝐔𝐍𝐙𝐈𝐎𝐍𝐈 𝐄𝐒𝐂𝐋𝐔𝐒𝐈𝐕𝐄
➤ ${usedPrefix}bigtag 📢 Tag globale
➤ ${usedPrefix}off 🌙 Modalità AFK
➤ ${usedPrefix}on ☀️ Disattiva AFK
➤ ${usedPrefix}getpl 📂 Ottieni plugin

════════════════════
 Autorità massima attiva
`.trim();

    await conn.sendMessage(message.chat, { text: menuText });
};

handler.help = ['menuowner'];
handler.tags = ['menu'];
handler.command = /^(menuowner)$/i;

export default handler;