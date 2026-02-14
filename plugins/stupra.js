function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const frasi = [
  "sei stata stuprata a 90 e ti ha trattato come una puttanaccia di merda ",
]

function getTargetJid(m) {
  if (m.mentionedJid && m.mentionedJid.length) return m.mentionedJid[0]
  if (m.quoted) return m.quoted.sender
  return null
}

let handler = async (m, { conn }) => {

  if (!m.isGroup) {
    return conn.reply(m.chat, "Usa questo comando in un gruppo 😈", m)
  }

  let target = getTargetJid(m)
  if (!target) {
    return conn.reply(m.chat, "Tagga qualcuno o rispondi a un messaggio 😏", m)
  }

  if (target === conn.user.jid) {
    return conn.reply(m.chat, "🤖 Non posso stuprare  me stesso.", m)
  }

  const frase = pick(frasi)

  const testo =
`🥵 *Adesso verrai stuprata * 🥵

@${target.split('@')[0]} sei stata stuprata da @${m.sender.split('@')[0]}

${frase}`

  return conn.reply(
    m.chat,
    testo,
    m,
    { mentions: [target, m.sender] }
  )
}

handler.help = ['stupra @user', 'stupra (reply)']
handler.tags = ['fun']
handler.command = ['stupra']

export default handler

