let handler = async (m, { conn, mentionedJid }) => {
  // lista insulti SOFT (puoi aggiungerne quanti vuoi)
  const insulti = [
    'oggi hai il carisma di una patata lessa 🥔',
    'sei utile come il WiFi che non prende 📶',
    'se l’intelligenza fosse benzina, saresti a secco ⛽',
    'parli tanto ma dici poco, talento raro 👏',
    'sei la prova che la selezione naturale si distrae 😌',
    'hai meno logica di un dado truccato 🎲',
    'sei simpatico… a piccole dosi 😏',
    'il tuo cervello è in modalità risparmio energetico 🔋'
    'Riesci a essere irrilevante anche quando ti impegni' 
    'Se il silenzio fosse competenza, oggi saresti un esperto' 
    'Se l’argomentazione fosse un’arte, tu saresti la bozza che nessuno salva.' 
  ]

  // scegli bersaglio
  let targetJid =
    mentionedJid && mentionedJid.length
      ? mentionedJid[0]
      : m.sender

  const nome = targetJid.split('@')[0]
  const insulto = insulti[Math.floor(Math.random() * insulti.length)]

  const testo = `😈 *@${nome}* ${insulto}`

  await conn.sendMessage(
    m.chat,
    { text: testo, mentions: [targetJid] },
    { quoted: m }
  )
}

handler.help = ['insulta @utente']
handler.tags = ['fun']
handler.command = /^insulta$/i

export default handler
