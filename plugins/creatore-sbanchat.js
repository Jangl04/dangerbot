let handler = async (m) => {
  global.db.data.chats[m.chat].isBanned = false;
  let message = '𝔹𝕌𝕆ℕ𝔾𝕀𝕆ℝℕ𝕆 𝕄𝔼ℝ𝔻𝔼, 𝕄𝕀 𝕊𝕆ℕ𝕆 𝕊𝕍𝔼𝔾𝕃𝕀𝔸𝕋𝕆 🫨';
  await conn.sendMessage(m.chat, { 
      text: message,
      contextInfo: {
          forwardingScore: 99,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
              newsletterJid: '',
              serverMessageId: '',
              newsletterName: 'THE-DANGER'
          }
      }
  }, { quoted: m });
};

handler.help = ['unbanchat'];
handler.tags = ['owner'];
handler.command = /^on$/i;
handler.rowner = true;
export default handler;