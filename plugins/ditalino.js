function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const frasi = [
  "questa zozzona ⁨⁩è venuta così tanto da allagare il gruppo si salvi chi può 🔞💦"
]

let handler = async (m, { conn }) => {

  // 1️⃣ manda messaggio iniziale
  const sent = await conn.sendMessage(m.chat, {
    text: "👈🏼👉🏼👆🏻👇🏼☝🏻"
  }, { quoted: m })

  // 2️⃣ aspetta 1 secondo
  await new Promise(r => setTimeout(r, 1000))

  const nuovaFrase = pick(frasi)

  // 3️⃣ modifica il messaggio
  await conn.sendMessage(m.chat, {
    text: `🔥 *Ditalino Mode* 🔥\n\n${nuovaFrase}`,
    edit: sent.key
  })
}

handler.help = ['ditalino']
handler.tags = ['fun']
handler.command = ['ditalino']

export default handler
