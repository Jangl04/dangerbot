const handler = async (message, { conn, usedPrefix = '.' }) => {

    const userId = message.sender;
    const userCount = Object.keys(global.db?.data?.users || {}).length;

    const menuText = `
☠️ 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 – 𝐀𝐑𝐄𝐍𝐀 𝐆𝐈𝐎𝐂𝐇𝐈 ☠️
════════════════════

👥 Utenti registrati: ${userCount}
🎮 Modalità: ATTIVA

════════════════════
🩸 𝐌𝐄𝐓𝐑𝐈 𝐃𝐈 𝐑𝐈𝐒𝐂𝐇𝐈𝐎
➤ ${usedPrefix}bellometro 🥶
➤ ${usedPrefix}gaymetro 🌈
➤ ${usedPrefix}lesbiometro 💗
➤ ${usedPrefix}masturbometro 🍷
➤ ${usedPrefix}fortunometro 🍀
➤ ${usedPrefix}intelligiometro 🧠

════════════════════
🎯 𝐀𝐙𝐙𝐀𝐑𝐃𝐎 & 𝐂𝐀𝐎𝐒
➤ ${usedPrefix}sborra 💦
➤ ${usedPrefix}il 🎲
➤ ${usedPrefix}wasted 🕴🏻
➤ ${usedPrefix}comunista 🚩
➤ ${usedPrefix}bisex 🔥
➤ ${usedPrefix}gay 🏳️‍🌈
➤ ${usedPrefix}simpcard 🃏
➤ ${usedPrefix}trans 🏳️‍⚧️

════════════════════
🕹️ 𝐒𝐅𝐈𝐃𝐄
➤ ${usedPrefix}tris ❌⭕
➤ ${usedPrefix}impiccato 🪢
➤ ${usedPrefix}classificabandiera 🏆

════════════════════
🎭 𝐂𝐎𝐍𝐓𝐄𝐍𝐔𝐓𝐈
➤ ${usedPrefix}meme 🤣
➤ ${usedPrefix}cibo 🍣
➤ ${usedPrefix}bandiera 🚩
➤ ${usedPrefix}s / sticker 🏷️
➤ ${usedPrefix}wm 🔮
➤ ${usedPrefix}cur 🎶

════════════════════
💍 𝐑𝐄𝐋𝐀𝐙𝐈𝐎𝐍𝐈
➤ ${usedPrefix}sposa 👰🏻
➤ ${usedPrefix}divorzia 💔
➤ ${usedPrefix}amante 🫂
➤ ${usedPrefix}adotta 👶🏻
➤ ${usedPrefix}famiglia 🧑‍🧑‍🧒‍🧒
➤ ${usedPrefix}toglifiglio 👣
➤ ${usedPrefix}togliamante 🩸

════════════════════
⚡ Entra. Gioca. Sopravvivi.
`.trim();

    const buttons = [
        { buttonId: `${usedPrefix}menu`, buttonText: { displayText: '🏠 Menu Principale' }, type: 1 },
        { buttonId: `${usedPrefix}menuadmin`, buttonText: { displayText: '🛡 Menu Admin' }, type: 1 },
        { buttonId: `${usedPrefix}menuowner`, buttonText: { displayText: '👑 Menu Owner' }, type: 1 },
        { buttonId: `${usedPrefix}menumod`, buttonText: { displayText: '🫅🏻 Moderazione' }, type: 1 },
        { buttonId: `${usedPrefix}menufunzioni`, buttonText: { displayText: '🚨 Funzioni' }, type: 1 },
        { buttonId: `${usedPrefix}menuludopatici`, buttonText: { displayText: '📱 Area Digitale' }, type: 1 }
    ];

    await conn.sendMessage(message.chat, {
        text: menuText,
        footer: '⚡ Danger Bot • Arena Giochi',
        buttons: buttons,
        headerType: 1
    });
};

handler.help = ['menugiochi'];
handler.tags = ['menu'];
handler.command = /^(menugiochi|giochi)$/i;

export default handler;