  let handler = async (m, { conn, usedPrefix, text }) => {
  let { key } = await conn.sendMessage(m.chat, { text: "ah, quindi la mettiamo cosi?" }, { quoted: m });
  const array = [
    "8==👊==D", "8===👊=D", "8=👊===D", "8==👊==D", "8===👊=D", "8====👊D", "8===👊=D", "8==👊==D", "8=👊===D", "8👊====D", "8=👊===D","8==👊==D", "8===👊=D", "8====👊D","8==👊==D", "8===👊=D", "8=👊===D", "8=👊===D", "8==👊==D", "8===👊=D", "8====👊D💦"
  ];

  for (let item of array) {
    await conn.sendMessage(m.chat, { text: `${item}`, edit: key }, { quoted: m });
    await new Promise(resolve => setTimeout(resolve, 50)); // Delay di 0.5 secondi per prevenirlo ma nulla
  }
  return conn.sendMessage(m.chat, { text: `Ohssy, finalmente sei riuscito a farmi sborrare 💦`.trim() , edit: key, mentions: [m.sender] }, { quoted: m });
};

handler.help = ['sega'];
handler.tags = ['giochi'];
handler.command = /^sega$/i;
handler.admin = true;//rate overlimit alle porte
export default handler;
