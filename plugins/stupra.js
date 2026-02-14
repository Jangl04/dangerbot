function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const frasi = [
  "⁨sei stat𝐚 stuprat𝐚 a 90 e ti hanno trattato come una puttana di merda “AHHH…AAAHHH, si continua non fermarti e ti hanno stuprato così violentemente che non riesci nemmeno a reggerti in piedi stupida troia di merda" 
]

let handler = async (m, { conn }) => {

  const frase = pick(frasi)

  return conn.reply(
    m.chat,
    `🥵 *Ora verrai stuprata *🥵 \n\n${frase}`,
    m
  )
}

handler.help = ['stupra']
handler.tags = ['fun']
handler.command = ['stupra']

export default handler
