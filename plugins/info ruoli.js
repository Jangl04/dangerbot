const handler = m => m;

async function handlePromotion(message) {
  const giver = message.sender.split('@')[0];
  const receiver = message.messageStubParameters[0].split('@')[0];

  const text = 
`🩸 𝐑𝐈𝐓𝐎 𝐃𝐈 𝐀𝐒𝐂𝐄𝐒𝐀 🩸

✦ *@${giver}*
ha conferito i *poteri* a
✦ *@${receiver}*

🔥 Il sacrificio è stato accettato.`;

  await conn.sendMessage(message.chat, {
    text,
    mentions: [message.sender, message.messageStubParameters[0]]
  });
}

async function handleDemotion(message) {
  const giver = message.sender.split('@')[0];
  const receiver = message.messageStubParameters[0].split('@')[0];

  const text = 
`⛓️ 𝐑𝐈𝐓𝐎 𝐃𝐈 𝐂𝐀𝐃𝐔𝐓𝐀 ⛓️

✦ *@${giver}*
ha strappato i *poteri* a
✦ *@${receiver}*

🕯️ Il sacrificio è compiuto.`;

  await conn.sendMessage(message.chat, {
    text,
    mentions: [message.sender, message.messageStubParameters[0]]
  });
}

handler.all = async function (m) {
  if (m.messageStubType === 29) {
    await handlePromotion(m);
  } 
  else if (m.messageStubType === 30) {
    await handleDemotion(m);
  }
};

export default handler;
