// fake-nuke.js — NUKE FAKE (non cambia niente davvero)

const COOLDOWN_MS = 60_000

function mentionsFrom(m) {
  const s = new Set()
  if (m.mentionedJid?.length) m.mentionedJid.forEach(j => s.add(j))
  if (m.quoted?.sender) s.add(m.quoted.sender)
  return [...s]
}

let handler = async (m, { conn, command, text, isAdmin, isOwner, isROwner }) => {
  if (!m.isGroup) return m.reply('Solo gruppi.')
  if (!isAdmin && !isOwner && !isROwner) return m.reply('Solo admin/owner.')

  if (!global.db?.data) await global.loadDatabase?.()
  const chatdb = global.db?.data?.chats?.[m.chat] || (global.db.data.chats[m.chat] = {})

  const now = Date.now()
  const last = chatdb.__fakeNukeLast || 0
  if (now - last < COOLDOWN_MS) {
    const s = Math.ceil((COOLDOWN_MS - (now - last)) / 1000)
    return m.reply(`Cooldown: ${s}s`)
  }

  const mentions = mentionsFrom(m)
  const reason = (text || '').trim()

  if (['nuke', 'fakenuke'].includes(command)) {
    chatdb.__fakeNukeLast = now
    chatdb.__fakeNukeArmed = true

    const msg =
`╭──────────────────────╮
│  ☣️  GRUPPO SVUOTATO  ☣️  │
╰──────────────────────╯

📣 DAL BOT MIGLIORE DI ZOZZAP
${reason ? `🧾 MOTIVO: ${reason}\n` : ''}${mentions.length ? `🎯 TARGET: ${mentions.map(j => '@' + j.split('@')[0]).join(' ')}\n` : ''}⚡ Powered by BOT

_(scherzo: non ho cambiato nulla davvero)_`

    return conn.sendMessage(m.chat, { text: msg, mentions }, { quoted: m })
  }

  if (['resuscita', 'revive', 'ripristina'].includes(command)) {
    if (!chatdb.__fakeNukeArmed) return m.reply('Niente da ripristinare.')
    chatdb.__fakeNukeArmed = false

    const msg =
`✨✨ RIPRISTINO COMPLETATO ✨✨
━━━━━━━━━━━━━━━━━━━━━━

✅ Nome e descrizione tornati alla normalità.
🔓 Chat aperta a tutti i partecipanti.

_(anche questo era finto 😅)_`

    return conn.sendMessage(m.chat, { text: msg, mentions }, { quoted: m })
  }
}

handler.help = ['nuke', 'resuscita']
handler.tags = ['group']

// 👇 metto ENTRAMBI gli stili, così prende su più basi
handler.command = ['nuke', 'fakenuke', 'resuscita', 'revive', 'ripristina']
handler.group = true

export default handler
