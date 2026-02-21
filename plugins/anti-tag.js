let handler = m => m;

handler.before = async function (m, { conn, isAdmin, isPrems, isBotAdmin, isOwner, isROwner }) {
    if (!m.isGroup) return false;

    const botNumber = conn.decodeJid(conn.user?.jid || conn.user?.id || '');
    const isBot = m.sender === botNumber;

    if (m.mentionedJid && m.mentionedJid.length > 0 && !isBot && !isOwner && !isROwner && !isAdmin && !isPrems) {
        const tagLimit = 40;
        let warnLimit = 3;

        if (m.mentionedJid.length > tagLimit) {
            const userJid = conn.decodeJid(m.sender);

            global.db.data.users[userJid] ??= { warn: 0, warnReasons: [] };
            global.db.data.users[userJid].warn += 1;
            global.db.data.users[userJid].warnReasons.push('tag eccessivi');

            if (isBotAdmin) {
                try {
                    await conn.sendMessage(m.chat, {
                        delete: {
                            remoteJid: m.chat,
                            fromMe: false,
                            id: m.key.id,
                            participant: m.key.participant,
                        },
                    });
                } catch (e) {
                    console.error('Errore nella cancellazione del messaggio:', e);
                }
            }

            let warnCount = global.db.data.users[userJid].warn;
            let remaining = warnLimit - warnCount;

            if (warnCount < warnLimit) {
                await conn.sendMessage(m.chat, { 
                    text: `╔═══━─━─━─━─━─━─━═══╗
⚡ 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 • ANTI-TAG
╚═══━─━─━─━─━─━─━═══╝
⚠️ Troppi tag nel messaggio

🔹 Avvertimento: ${warnCount}/${warnLimit}
🔹 Rimangono: ${remaining}

Prossima violazione → espulsione.
━━━━━━━━━━━━━━━━━━`
                });
            } else {
                global.db.data.users[userJid].warn = 0;
                global.db.data.users[userJid].warnReasons = [];

                if (isBotAdmin) {
                    try {
                        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove');
                        await conn.sendMessage(m.chat, { 
                            text: `⛔ @${userJid.split('@')[0]} RIMOSSO DAL GRUPPO DOPO 3 AVVERTIMENTI`,
                            mentions: [userJid]
                        });
                    } catch {
                        await conn.sendMessage(m.chat, { 
                            text: `⚠️ @${userJid.split('@')[0]} DOVREBBE ESSERE RIMOSSO, MA IL BOT NON È ADMIN`,
                            mentions: [userJid]
                        });
                    }
                } else {
                    await conn.sendMessage(m.chat, { 
                        text: `⚠️ @${userJid.split('@')[0]} DOVREBBE ESSERE RIMOSSO, MA IL BOT NON È ADMIN`,
                        mentions: [userJid]
                    });
                }
            }

            return true;
        }
    }

    return false;
};

export default handler;