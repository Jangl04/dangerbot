const handler = async (m, { conn, command, usedPrefix }) => {
  // target: tag oppure reply
  const target =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && (m.quoted.sender || m.quoted.participant));

  if (!target) {
    return m.reply(
      `Uso: ${usedPrefix}${command} @utente\nOppure rispondi a un messaggio con ${usedPrefix}${command}`
    );
  }

  const sender = m.sender;

  const senderName = conn.getName ? await conn.getName(sender) : sender.split("@")[0];
  const targetName = conn.getName ? await conn.getName(target) : target.split("@")[0];

  // ---- PRENDO LA KEY DEL MESSAGGIO A CUI REAGIRE ----
  let reactKey = null;

  // 1) se il tuo wrapper mette la key sul quoted
  if (m.quoted?.key) reactKey = m.quoted.key;

  // 2) costruisco key dal contextInfo (tipico Baileys)
  if (!reactKey) {
    const ctx =
      m.message?.extendedTextMessage?.contextInfo ||
      m.message?.imageMessage?.contextInfo ||
      m.message?.videoMessage?.contextInfo ||
      m.message?.documentMessage?.contextInfo;

    const stanzaId = ctx?.stanzaId;
    const participant = ctx?.participant;

    if (stanzaId) {
      reactKey = {
        remoteJid: m.chat,
        fromMe: false,
        id: stanzaId,
        participant: participant || target, // fallback
      };
    }
  }

  // 3) fallback: reagisci al messaggio comando (almeno sai se le reaction funzionano)
  if (!reactKey && m.key) reactKey = m.key;

  // ---- INVIO REAZIONE ----
  try {
    await conn.sendMessage(m.chat, {
      react: { text: "😘", key: reactKey },
    });
  } catch (e) {
    console.log("ERRORE REACTION .bacia:", e?.message || e);
  }

  // testo finale
  const text = `😘 *${senderName}* bacia *${targetName}* 💋`;
  await conn.sendMessage(m.chat, { text, mentions: [sender, target] }, { quoted: m });
};

handler.help = ["bacia @utente / (reply)"];
handler.tags = ["fun"];
handler.command = /^bacia$/i;

export default handler;













