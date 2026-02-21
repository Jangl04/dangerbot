const handler = async (message, { conn, usedPrefix = '.' }) => {

 const menuText = `
🎰 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 – 𝐙𝐎𝐍𝐀 𝐀𝐙𝐙𝐀𝐑𝐃𝐎 🎰
════════════════════

💸 𝐂𝐀𝐒𝐒𝐀 𝐍𝐄𝐑𝐀
➤ ${usedPrefix}wallet 👛 Portafoglio
➤ ${usedPrefix}banca 🏦 Conto bancario

════════════════════
🩸 𝐎𝐏𝐄𝐑𝐀𝐙𝐈𝐎𝐍𝐈
➤ ${usedPrefix}deposita 💰 Deposita crediti
➤ ${usedPrefix}prelievo 💸 Preleva crediti

════════════════════
🎲 𝐀𝐑𝐄𝐀 𝐑𝐈𝐒𝐂𝐇𝐈𝐎
➤ ${usedPrefix}slot 🎰 Slot clandestina

════════════════════
⚠️ Il banco osserva.
💀 Il rischio è reale.
🔖 Versione: 1.0
`.trim();

    // INVIO SOLO TESTO
    await conn.sendMessage(message.chat, { text: menuText });
};

handler.help = ['menuludopatici'];
handler.tags = ['menu'];
handler.command = /^(menuludopatici)$/i;

export default handler;