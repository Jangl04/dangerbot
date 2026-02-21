let handler = async (m, { conn, command, args, isAdmin, isOwner, isROwner }) => {

  // ✅ Controllo attivazione / disattivazione
  const isEnable = /^(attiva|enable|on|1)$/i.test(command)

  const chats = global.db.data.chats
  const settings = global.db.data.settings

  chats[m.chat] ??= {}
  settings[conn.user.jid] ??= {}

  const chat = chats[m.chat]
  const bot = settings[conn.user.jid]

  // ⚠️ Inizializza tutte le proprietà se non ci sono
  const features = [
    'antiLink','antiInsta','antiTelegram','antiTiktok','antiTag','antinuke',
    'antigore','antiporno','modoadmin','welcome','goodbye','antiBot','antispam',
    'antiprivato','antitrava'
  ]
  for (let f of features) {
    if (f.startsWith('anti') || f === 'modoadmin' || f === 'welcome' || f === 'goodbye') {
      chat[f] ??= false
    } else {
      bot[f] ??= false
    }
  }

  /* ====== GRAFICA 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 ====== */
  const box = (title, lines) =>
`╔══════════════════════╗
   ☠️ 𝐃𝐀𝐍𝐆𝐄𝐑 𝐁𝐎𝐓 • ${title} ☠️
╚══════════════════════╝
${lines.map(l => `➤ ${l}`).join('\n')}
══════════════════════`

  const noAdmin = box('ACCESSO NEGATO', [
    '🚫 Permessi insufficienti',
    'Solo ADMIN possono eseguire questo comando'
  ])

  const noOwner = box('LIVELLO ROOT', [
    '👑 Funzione riservata al proprietario',
    'Autorità richiesta: MASSIMA'
  ])

  if (!args[0]) {
    throw box('RITUALE DANGER BOT', [
      '.attiva <funzione>',
      '.disattiva <funzione>',
      '',
      'Funzioni disponibili:',
      'antilink, antigore, antiporno, modoadmin',
      'benvenuto, addio, antiprivato, antibot',
      'antispam, antinuke, antiinsta, antitelegram',
      'antitiktok, antitag, antitrava'
    ])
  }

  let feature = args[0].toLowerCase()
  let result = ''

  const stateStr = (s) => s ? '🟢 PROTEZIONE ATTIVA' : '🔴 PROTEZIONE DISATTIVATA'

  switch (feature) {

    case 'antilink':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.antiLink = isEnable
      result = box('🔗 ANTILINK', [
        `Stato: ${stateStr(chat.antiLink)}`,
        isEnable ? '🛡️ I link esterni verranno bloccati' : '⚠️ Il gruppo è esposto ai link'
      ])
      break

    case 'antiinsta':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.antiInsta = isEnable
      result = box('📸 ANTI-INSTA', [
        `Stato: ${stateStr(chat.antiInsta)}`,
        isEnable ? '🛡️ Blocca link Instagram' : '⚠️ I link Instagram non vengono filtrati'
      ])
      break

    case 'antitelegram':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.antiTelegram = isEnable
      result = box('✈️ ANTI-TELEGRAM', [
        `Stato: ${stateStr(chat.antiTelegram)}`,
        isEnable ? '🛡️ Blocca link Telegram' : '⚠️ I link Telegram non vengono filtrati'
      ])
      break

    case 'antitiktok':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.antiTiktok = isEnable
      result = box('🎵 ANTI-TIKTOK', [
        `Stato: ${stateStr(chat.antiTiktok)}`,
        isEnable ? '🛡️ Blocca link TikTok' : '⚠️ I link TikTok non vengono filtrati'
      ])
      break

    case 'antitag':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.antiTag = isEnable
      result = box('🏷️ ANTI-TAG', [
        `Stato: ${stateStr(chat.antiTag)}`,
        isEnable ? '🛡️ Blocca tag e menzioni di massa' : '⚠️ Tag non filtrati'
      ])
      break

    case 'antinuke':
      if (!isOwner && !isROwner) return m.reply(noOwner)
      chat.antinuke = isEnable
      result = box('💣 ANTINUKE', [
        `Stato: ${stateStr(chat.antinuke)}`,
        isEnable ? '🛡️ Protezione contro distruzione di massa' : '☠️ Difese abbassate'
      ])
      break

    case 'antigore':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.antigore = isEnable
      result = box('🚫 ANTIGORE', [
        `Stato: ${stateStr(chat.antigore)}`,
        isEnable ? '🛡️ Contenuti violenti bloccati' : '⚠️ Contenuti violenti permessi'
      ])
      break

    case 'antiporno':
    case 'antiporn':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.antiporno = isEnable
      result = box('🔞 ANTI-PORNO', [
        `Stato: ${stateStr(chat.antiporno)}`,
        isEnable ? '🛡️ Contenuti sessuali bloccati' : '⚠️ Contenuti sessuali permessi'
      ])
      break

    case 'modoadmin':
    case 'soloadmin':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.modoadmin = isEnable
      result = box('🛡️ MODO ADMIN', [
        `Stato: ${stateStr(chat.modoadmin)}`,
        isEnable ? '🛡️ Solo admin possono usare i comandi' : '⚠️ Tutti possono usare i comandi'
      ])
      break

    case 'benvenuto':
    case 'welcome':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.welcome = isEnable
      result = box('👋 RITUALE DI INGRESSO', [
        `Stato: ${stateStr(chat.welcome)}`,
        isEnable ? '🛡️ Messaggio di benvenuto attivo' : '⚠️ Messaggi di benvenuto disattivati'
      ])
      break

    case 'addio':
    case 'goodbye':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.goodbye = isEnable
      result = box('🚪 RITUALE DI USCITA', [
        `Stato: ${stateStr(chat.goodbye)}`,
        isEnable ? '🛡️ Messaggio di congedo attivo' : '⚠️ Messaggi di congedo disattivati'
      ])
      break

    case 'antiprivato':
      if (!isOwner && !isROwner) return m.reply(noOwner)
      bot.antiprivato = isEnable
      result = box('🔒 ANTI-PRIVATO', [
        `Stato: ${stateStr(bot.antiprivato)}`,
        isEnable ? '🛡️ Blocca messaggi privati al bot' : '⚠️ Messaggi privati permessi'
      ])
      break

    case 'antibot':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.antiBot = isEnable
      result = box('🤖 ANTIBOT', [
        `Stato: ${stateStr(chat.antiBot)}`,
        isEnable ? '🛡️ Blocca bot esterni' : '⚠️ Bot esterni permessi'
      ])
      break

    case 'antispam':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.antispam = isEnable
      result = box('🛑 ANTISPAM', [
        `Stato: ${stateStr(chat.antispam)}`,
        isEnable ? '🛡️ Protezione contro spam attiva' : '⚠️ Spam permesso'
      ])
      break

    case 'antitrava':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      chat.antitrava = isEnable
      result = box('🧱 ANTITRAVA', [
        `Stato: ${stateStr(chat.antitrava)}`,
        isEnable ? '🛡️ Blocca crash e trappole' : '⚠️ Messaggi pericolosi permessi'
      ])
      break

    default:
      return m.reply(box('❓ FUNZIONE SCONOSCIUTA', ['Il rituale richiesto non esiste nel Nexus']))
  }

  return m.reply(result)
}

handler.help = ['attiva', 'disattiva']
handler.tags = ['group']
handler.command = ['attiva', 'disattiva', 'enable', 'disable', 'on', 'off', '1', '0']
handler.group = true

export default handler