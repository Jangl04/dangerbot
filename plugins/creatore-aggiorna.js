import { execSync } from 'child_process'

let handler = async (m, { conn, text }) => {
  try {

    await m.react('⏳')

    let checkUpdates = execSync('git fetch && git status -uno', { encoding: 'utf-8' })

    // ✅ Già aggiornato
    if (
      checkUpdates.includes('Your branch is up to date') ||
      checkUpdates.includes('nothing to commit')
    ) {
      await conn.reply(
        m.chat,
`╔════════════════════╗
   ☠️ 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 • UPDATE ☠️
╚════════════════════╝
➤ ✅ Il sistema è già al massimo livello
➤ Nessuna patch da applicare
════════════════════`,
        m
      )
      await m.react('✅')
      return
    }

    // 🔄 Aggiornamento disponibile
    if (checkUpdates.includes('Your branch is behind')) {

      await conn.reply(
        m.chat,
`╔════════════════════╗
   ☠️ 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 • UPDATE ☠️
╚════════════════════╝
➤ 📥 Nuova versione individuata
➤ ⚡ Applicazione patch in corso...
════════════════════`,
        m
      )

      let updateResult = execSync(
        'git reset --hard && git pull' + (m.fromMe && text ? ' ' + text : ''),
        { encoding: 'utf-8' }
      )

      await conn.reply(
        m.chat,
`╔════════════════════╗
   ☠️ 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 • UPDATE ☠️
╚════════════════════╝
➤ ✅ Aggiornamento completato
➤ 🤖 Sistema allineato all’ultima release
➤ 📦 Output:
\`\`\`
${updateResult.trim()}
\`\`\`
════════════════════`,
        m
      )

      await m.react('🚀')
      return
    }

    // ⚠️ Forzato
    let forceUpdate = execSync(
      'git reset --hard && git pull' + (m.fromMe && text ? ' ' + text : ''),
      { encoding: 'utf-8' }
    )

    await conn.reply(
      m.chat,
`╔════════════════════╗
   ☠️ 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 • FORCE UPDATE ☠️
╚════════════════════╝
➤ ⚡ Operazione completata con successo
➤ 🤖 Tutti i sistemi riallineati
➤ 📦 Output:
\`\`\`
${forceUpdate.trim()}
\`\`\`
════════════════════`,
      m
    )

    await m.react('🤖')

  } catch (err) {

    await conn.reply(
      m.chat,
`╔════════════════════╗
   ☠️ 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 • ERRORE ☠️
╚════════════════════╝
➤ ❌ Update fallito
➤ ⚠️ Controlla connessione o permessi
➤ 📄 Dettaglio:
\`\`\`
${err.message}
\`\`\`
════════════════════`,
      m
    )

    await m.react('❌')
  }
}

handler.help = ['aggiorna']
handler.tags = ['creatore']
handler.command = ['aggiorna', 'update', 'aggiornabot']
handler.rowner = true

export default handler