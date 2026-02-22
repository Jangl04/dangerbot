// plugins/index/fake-nuke.js
// NUKE FAKE: stesso effetto "paura", ma NON cambia davvero impostazioni/nome/descrizione.

const COOLDOWN_MS = 60_000

function getMentions(m) {
  const s = new Set()
  if (m.mentionedJid?.length) m.mentionedJid.forEach(j => s.add(j))
  if (m.quoted?.sender) s.add(m.quoted.sender)
  return [...s]
}

async function getInviteLink(conn, chat) {
  // Se il bot è admin può generare il link; altrimenti ritorna stringa vuota.
  try {
    const code = await conn.groupInviteCode(chat)
    return `https://chat.whatsapp.com/${code}`
  } catch {
    return ''
  }
}

let handler = async (m, { conn, command, isAdmin, isOwner, isROwner, text }) => {
  if (!m.isGroup) return m.reply('Questo comando funziona solo nei gruppi.')
  if (!isAdmin && !isOwner && !isROwner) return m.reply('Solo admin/owner possono usare questo comando.')

  if (!global.db?.data) await global.loadDatabase()
  const chatdb = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})

  const now = Date.now()
  const last = chatdb.__fakeNukeLast || 0
  if (now - last < COOLDOWN_MS) {
    const s = Math.ceil((COOLDOWN_MS - (now - last)) / 1000)
    return m.reply(`Aspetta ${s}s prima di rifarlo 😈`)
  }

  const mentions = getMentions(m)
  const reason = (text || '').trim()

  if (['nuke', 'fakenuke', 'nukefake'].includes(command)) {
    chatdb.__fakeNukeLast = now
    chatdb.__fakeNukeArmed = true

    // (facoltativo) link invito
    const invite = await getInviteLink(conn, m.chat)

    const banner =
`╭──────────────────────╮
│  ☣️  GRUPPO SVUOTATO  ☣️  │
╰──────────────────────╯

📣 DAL BOT MIGLIORE DI ZOZZAP

${reason ? `🧾 MOTIVO: ${reason}\n` : ''}${mentions.length ? `🎯 TARGET: ${mentions.map(j => '@' + j.split('@')[0]).join(' ')}\n` : ''}${invite ? `🔗 ENTRATE TUTTI QUI:\n${invite}\n` : ''}⚡ Powered by BLD-BLOOD BOT

_(tranquilli: è uno scherzo, non ho cambiato nulla davvero)_`

    return conn.sendMessage(
      m.chat,
      { text: banner, mentions },
      { quoted: m }
    )
  }

  if (['resuscita', 'ripristina', 'revive'].includes(command)) {
    if (!chatdb.__fakeNukeArmed) return m.reply('Non c’è nessun nuke da ripristinare qui 😇')
    chatdb.__fakeNukeArmed = false

    const msg =
`✨✨ RIPRISTINO COMPLETATO ✨✨
━━━━━━━━━━━━━━━━━━━━━━

✅ Nome e descrizione tornati alla normalità.
🔓 Chat aperta a tutti i partecipanti.

_(anche qui: era tutto finto 😅)_`

    return conn.sendMessage(
      m.chat,
      { text: msg, mentions },
      { quoted: m }
    )
  }
}

handler.help = ['nuke', 'resuscita']
handler.tags = ['group']
handler.command = ['nuke', 'fakenuke', 'nukefake', 'resuscita', 'ripristina', 'revive']
handler.group = true

export default handler
