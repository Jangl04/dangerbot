let handler = async (m, { conn }) => {
  const nome = global.nomebot || 'DangerBot'
  const autore = global.autore || 'Luxifer e Tom'
  const wm = global.wm || 'danger ✧ bot'
  const versione = global.versione || ''

  const testo =
`👋 *Ciao!* Io sono *${nome}* (${wm}) 🤖

🧩 *Chi sono / cosa faccio*
Sono un bot WhatsApp che aiuta a *gestire e animare i gruppi*: rispondo ai comandi, fornisco strumenti utili, faccio piccole automazioni e funzioni divertenti per tenere il gruppo ordinato e attivo.

🛠️ *Il mio “lavoro” nei gruppi*
• Aiuto gli admin con comandi pratici (info, utilità, gestione)
• Do accesso rapido a funzioni e strumenti del bot
• Rendo il gruppo più vivo con comandi di intrattenimento (senza spam)
• Eseguo operazioni su richiesta (io lavoro soprattutto *quando mi comandi*)

👨‍💻 *Sviluppo*
• Creatore: *${autore}*
${versione ? `• Versione: *${versione}*` : ''}

💬 Se vuoi una funzione nuova, dimmelo: si può aggiungere con un plugin 🙂`

  await conn.sendMessage(m.chat, { text: testo }, { quoted: m })
}

handler.help = ['chisono']
handler.tags = ['info']
handler.command = /^(chisono|chi-sono|presentazione|about|info(bot)?)$/i

export default handler







