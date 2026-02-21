let handler = async (m, { conn, command, args, isAdmin, isOwner, isROwner }) => {

  const isEnable = /attiva|enable|on|1/i.test(command)
  const chats = global.db.data.chats
  const settings = global.db.data.settings

  chats[m.chat] ??= {}
  settings[conn.user.jid] ??= {}

  const chat = chats[m.chat]
  const bot = settings[conn.user.jid]

  /* ====== GRAFICA 𝐍𝚵𝑿𝐒𝐔𝐒 ====== */
  const box = (title, lines) =>
`╔═══━─━─━─━─━─━─━═══╗
   ⚡ 𝐍𝚵𝑿𝐒𝐔𝐒 • ${title} ⚡
╚═══━─━─━─━─━─━─━═══╝
${lines.map(l => `➤ ${l}`).join('\n')}
━━━━━━━━━━━━━━━━━━`

  const noAdmin = box('𝐀𝐂𝐂𝐄𝐒𝐒𝐎 𝐍𝐄𝐆𝐀𝐓𝐎', [
    '⚔️ Solo gli Admin possono evocare questo potere',
    'Il rituale ti è proibito'
  ])

  const noOwner = box('𝐏𝐎𝐓𝐄𝐑𝐄 𝐒𝐔𝐏𝐑𝐄𝐌𝐎', [
    '👑 Solo l’Owner può controllare questa energia',
    'Autorità insufficiente'
  ])

  if (!args[0]) {
    throw box('𝐑𝐈𝐓𝐔𝐀𝐋𝐄 𝐃𝐈 𝐂𝐎𝐌𝐀𝐍𝐃𝐎', [
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

  switch (feature) {

    case 'antilink':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.antiLink === isEnable)
        return m.reply(box('🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antiLink = isEnable
      result = box('🔗 𝐀𝐍𝐓𝐈𝐋𝐈𝐍𝐊', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Blocca portali WhatsApp proibiti del Nexus'
      ])
      break

    case 'antiinsta':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.antiInsta === isEnable)
        return m.reply(box('📸 𝐀𝐍𝐓𝐈𝐈𝐍𝐒𝐓𝐀', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antiInsta = isEnable
      result = box('📸 𝐀𝐍𝐓𝐈𝐈𝐍𝐒𝐓𝐀', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Blocca link Instagram per protezione Nexus'
      ])
      break

    case 'antitelegram':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.antiTelegram === isEnable)
        return m.reply(box('✈️ 𝐀𝐍𝐓𝐈𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antiTelegram = isEnable
      result = box('✈️ 𝐀𝐍𝐓𝐈𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Blocca link Telegram nel Nexus'
      ])
      break

    case 'antitiktok':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.antiTiktok === isEnable)
        return m.reply(box('🎵 𝐀𝐍𝐓𝐈𝐓𝐈𝐊𝐓𝐎𝐊', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antiTiktok = isEnable
      result = box('🎵 𝐀𝐍𝐓𝐈𝐓𝐈𝐊𝐓𝐎𝐊', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Blocca link TikTok per la sicurezza Nexus'
      ])
      break

    case 'antitag':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.antiTag === isEnable)
        return m.reply(box('🏷️ 𝐀𝐍𝐓𝐈𝐓𝐀𝐆', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antiTag = isEnable
      result = box('🏷️ 𝐀𝐍𝐓𝐈𝐓𝐀𝐆', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Blocca tag e menzioni di massa nel Nexus'
      ])
      break

    case 'antinuke':
      if (!isOwner && !isROwner) return m.reply(noOwner)
      if (chat.antinuke === isEnable)
        return m.reply(box('💣 𝐀𝐍𝐓𝐈𝐍𝐔𝐊𝐄', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antinuke = isEnable
      result = box('💣 𝐀𝐍𝐓𝐈𝐍𝐔𝐊𝐄', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Protezione contro distruzione di massa',
        isEnable ? '🛡️ Il gruppo è sotto protezione 𝐍𝚵𝑿𝐒𝐔𝐒' : '☠️ Difese abbassate'
      ])
      break

    case 'antigore':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.antigore === isEnable)
        return m.reply(box('🚫 𝐀𝐍𝐓𝐈𝐆𝐎𝐑𝐄', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antigore = isEnable
      result = box('🚫 𝐀𝐍𝐓𝐈𝐆𝐎𝐑𝐄', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Purificazione contenuti violenti del Nexus'
      ])
      break

    case 'antiporno':
    case 'antiporn':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.antiporno === isEnable)
        return m.reply(box('🔞 𝐀𝐍𝐓𝐈𝐏𝐎𝐑𝐍𝐎', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antiporno = isEnable
      result = box('🔞 𝐀𝐍𝐓𝐈𝐏𝐎𝐑𝐍𝐎', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Purificazione contenuti corrotti del Nexus'
      ])
      break

    case 'modoadmin':
    case 'soloadmin':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.modoadmin === isEnable)
        return m.reply(box('🛡️ 𝐌𝐎𝐃𝐎 𝐀𝐃𝐌𝐈𝐍', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.modoadmin = isEnable
      result = box('🛡️ 𝐌𝐎𝐃𝐎 𝐀𝐃𝐌𝐈𝐍', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Solo gli eletti possono usare i comandi Nexus'
      ])
      break

    case 'benvenuto':
    case 'welcome':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.welcome === isEnable)
        return m.reply(box('👋 𝐑𝐈𝐓𝐔𝐀𝐋𝐄 𝐃𝐈 𝐈𝐍𝐆𝐑𝐄𝐒𝐒𝐎', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.welcome = isEnable
      result = box('👋 𝐑𝐈𝐓𝐔𝐀𝐋𝐄 𝐃𝐈 𝐈𝐍𝐆𝐑𝐄𝐒𝐒𝐎', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Accoglienza Nexus attiva'
      ])
      break

    case 'addio':
    case 'goodbye':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.goodbye === isEnable)
        return m.reply(box('🚪 𝐑𝐈𝐓𝐔𝐀𝐋𝐄 𝐃𝐈 𝐔𝐒𝐂𝐈𝐓𝐀', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.goodbye = isEnable
      result = box('🚪 𝐑𝐈𝐓𝐔𝐀𝐋𝐄 𝐃𝐈 𝐔𝐒𝐂𝐈𝐓𝐀', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Messaggio di congedo Nexus'
      ])
      break

    case 'antiprivato':
      if (!isOwner && !isROwner) return m.reply(noOwner)
      if (bot.antiprivato === isEnable)
        return m.reply(box('🔒 𝐀𝐍𝐓𝐈𝐏𝐑𝐈𝐕𝐀𝐓𝐎', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      bot.antiprivato = isEnable
      result = box('🔒 𝐀𝐍𝐓𝐈𝐏𝐑𝐈𝐕𝐀𝐓𝐎', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Blocca messaggi privati al bot Nexus'
      ])
      break

    case 'antibot':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.antiBot === isEnable)
        return m.reply(box('🤖 𝐀𝐍𝐓𝐈𝐁𝐎𝐓', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antiBot = isEnable
      result = box('🤖 𝐀𝐍𝐓𝐈𝐁𝐎𝐓', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Blocca bot esterni non autorizzati nel Nexus'
      ])
      break

    case 'antispam':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.antispam === isEnable)
        return m.reply(box('🛑 𝐀𝐍𝐓𝐈𝐒𝐏𝐀𝐌', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antispam = isEnable
      result = box('🛑 𝐀𝐍𝐓𝐈𝐒𝐏𝐀𝐌', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Protezione contro spam e flood Nexus'
      ])
      break

    case 'antitrava':
      if (m.isGroup && !(isAdmin || isOwner || isROwner)) return m.reply(noAdmin)
      if (chat.antitrava === isEnable)
        return m.reply(box('🧱 𝐀𝐍𝐓𝐈𝐓𝐑𝐀𝐕𝐀', ['Il sigillo è già ' + (isEnable ? 'attivo' : 'disattivo')]))

      chat.antitrava = isEnable
      result = box('🧱 𝐀𝐍𝐓𝐈𝐓𝐑𝐀𝐕𝐀', [
        `Stato rituale: ${isEnable ? '🟢 𝐀𝐓𝐓𝐈𝐕𝐎' : '🔴 𝐃𝐈𝐒𝐀𝐓𝐓𝐈𝐕𝐎'}`,
        'Blocca messaggi crash e trappole Nexus'
      ])
      break

    default:
      return m.reply(box('❓ 𝐅𝐔𝐍𝐙𝐈𝐎𝐍𝐄 𝐒𝐂𝐎𝐍𝐎𝐒𝐂𝐈𝐔𝐓𝐀', ['Il rituale richiesto non esiste nel Nexus']))
  }

  return m.reply(result)
}

handler.help = ['attiva', 'disattiva']
handler.tags = ['group']
handler.command = ['attiva', '0', 'enable', 'disable', 'on', 'off', '1', 'disattiva']
handler.group = false

export default handler