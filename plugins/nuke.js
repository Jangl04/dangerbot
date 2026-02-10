let handler = async (m, { conn, participants, isBotAdmin }) => {
    if (!m.isGroup) return;

    const ownerJids = global.owner.map(o => o[0] + '@s.whatsapp.net');
    if (!ownerJids.includes(m.sender)) return;

    if (!isBotAdmin) return;

    const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

    // 🔹 CAMBIO NOME GRUPPO
    try {
        let metadata = await conn.groupMetadata(m.chat);
        let oldName = metadata.subject;
        let newName = `${oldName} | 𝑺𝑽𝑻 𝑩𝒀 The Danger`;
        await conn.groupUpdateSubject(m.chat, newName);
    } catch (e) {
        console.error('Errore cambio nome gruppo:', e);
    }

    let usersToRemove = participants
        .map(p => p.jid)
        .filter(jid =>
            jid &&
            jid !== botId &&
            !ownerJids.includes(jid)
        );

    if (!usersToRemove.length) return;

    let allJids = participants.map(p => p.jid);

    await conn.sendMessage(m.chat, {
        text: "Non si schiaccia l'intento di non ucciderla semplicemente sparisce proprio come questo gruppo."
    });

    await conn.sendMessage(m.chat, {
        text: "𝐀𝐯𝐞𝐭𝐞 𝐚𝐯𝐮𝐭𝐨 𝐨𝐧𝐨𝐫𝐞 𝐝𝐢 𝐞𝐬𝐬𝐞𝐫𝐞 𝐬𝐭𝐚𝐭𝐢 𝐜𝐨𝐧𝐪𝐮𝐢𝐬𝐭𝐚𝐭𝐢 𝐝𝐚 Luxifer e Tom 𝑪𝑰 𝑻𝑹𝑨𝑺𝑭𝑬𝑹𝑰𝑨𝑴𝑶 𝑸𝑼𝑨 https://chat.whatsapp.com/IGn4PkanPDn6sjG0J2yubV?mode=gi_t",
        mentions: allJids
    });

    try {
        await conn.groupParticipantsUpdate(m.chat, usersToRemove, 'remove');
    } catch (e) {
        console.error(e);
        await m.reply("❌ Errore durante l'hard wipe.");
    }
};

handler.command = ['castiga'];
handler.group = true;
handler.botAdmin = true;
handler.owner = true;

export default handler;
