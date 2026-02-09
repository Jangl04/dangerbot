let handler = async (m, { conn }) => {
  const insulti = [
    'oggi hai il carisma di una patata lessa 🥔',
    'sei utile come il WiFi che non prende 📶',
    'se l’intelligenza fosse benzina, saresti a secco ⛽',
    'parli tanto ma dici poco, talento raro 👏',
    'sei la prova che la selezione naturale si distrae 😌',
    'hai meno logica di un dado truccato 🎲',
    'sei simpatico… a piccole dosi 😏',
    'il tuo cervello è in modalità risparmio energetico 🔋'
    ' Se l’argomentazione fosse un’arte, tu saresti la bozza che nessuno salva'
    ' Se il silenzio fosse competenza, oggi saresti un esperto'
    ' Riesci a essere irrilevante anche quando ti impegni'
  ]

  // ✅ PRENDI SEMPRE I TAG REALI DA QUI
  let target =
    m.mentionedJid && m.mentionedJid.length > 0
      ? m.mentionedJid[0]
      : m.sender

  const insulto = insulti[Math.floor(Math.random() * insulti.length)]
  const nome = target.split('@')[0]

  const testo = `😈 *@${nome}* ${insulto}`

  await conn.sendMessage(
    m.chat,
    {
      text: testo,
      mentions: [target]
    },
    { quoted: m }
  )
}

handler.help = ['insulta @utente']
handler.tags = ['fun']
handler.command = /^insulta$/i

export default handler
