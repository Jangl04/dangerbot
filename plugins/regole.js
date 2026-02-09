let handler = async (m, { conn }) => {
  // ✏️ MODIFICA QUI LE REGOLE
  const regole =
`📌 *REGOLE DEL GRUPPO*
1) Si al flame.
2) Niente spam / flood.
3) Niente link a caso senza permesso.
4) Niente porno / gore .
5) Non scrivere in privato senza permesso.
6) Se hai problemi, tagga un admin: *.admin*

✅ Chi non rispetta le regole può essere mutato o rimosso.`

  await conn.sendMessage(m.chat, { text: regole }, { quoted: m })
}

handler.help = ['regole']
handler.tags = ['group']
handler.command = /^regole$/i

export default handler
