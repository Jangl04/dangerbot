let handler = async (m, { conn }) => {
  const link = 'https://chat.whatsapp.com/IGn4PkanPDn6sjG0J2yubV?mode=gi_t'
  await conn.sendMessage(
    m.chat,
    { text: `🔥 Entra nel mio gruppo ufficiale!\n${link}` },
    { quoted: m }
  )
}

handler.help = ['thedanger']
handler.tags = ['info']
handler.command = /^miogruppo$/i

export default handler




