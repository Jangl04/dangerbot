import fetch from 'node-fetch';

let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
  const userName = m.pushName || 'Utente';

  let userProfilePicBuffer;
  try {
    const profilePicUrl = await conn.profilePictureUrl(m.sender, 'image');
    userProfilePicBuffer = await (await fetch(profilePicUrl)).arrayBuffer();
  } catch (e) {
    try {
      userProfilePicBuffer = await (await fetch(global.foto)).arrayBuffer();
    } catch (e2) {
      userProfilePicBuffer = Buffer.from([]);
    }
  }

  let dynamicContextInfo;
  if (global.fake && global.fake.contextInfo) {
    dynamicContextInfo = global.fake.contextInfo;
  } else {
    dynamicContextInfo = {
      externalAdReply: {
        title: "varebot",
        body: "Sistema di gestione funzioni",
        mediaType: 1,
        jpegThumbnail: userProfilePicBuffer.length > 0 ? userProfilePicBuffer : null
      }
    };
  }

  let isEnable = /true|enable|attiva|(turn)?on|1/i.test(command);
  if (/disable|disattiva|off|0/i.test(command)) isEnable = false;

  global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {};
  global.db.data.users[m.sender] = global.db.data.users[m.sender] || {};
  let chat = global.db.data.chats[m.chat];
  let user = global.db.data.users[m.sender];
  let bot = global.db.data.settings[conn.user.jid] || {};

  const adminFeatures = [
  { key: 'welcome', name: '👋 Welcome', desc: 'Messaggio di benvenuto' },
  { key: 'antinuke', name: '🚨 AntiNuke', desc: 'Anti-Nuke'},
  { key: 'goodbye', name: '🚪 Addio', desc: 'Messaggio di addio' },
  { key: 'antispam', name: '🛑 Antispam', desc: 'Antispam' },
  { key: 'antitoxic', name: '🤬 Antitossici', desc: 'Avverte e rimuove per parolacce/insulti' },
  { key: 'antiBot', name: '🤖❌ Antibot', desc: 'Rimuove eventuali bot indesiderati' },
  { key: 'antioneview', name: '👁️‍🗨️ Antiviewonce', desc: 'Antiviewonce' },
  { key: 'rileva', name: '📡 Rileva', desc: 'Rileva eventi gruppo' },
  { key: 'antiporn', name: '🔞 Antiporno', desc: 'Antiporno' },
  { key: 'antigore', name: '🚫 Antigore', desc: 'Antigore' },
  { key: 'modoadmin', name: '🛡️ Soloadmin', desc: 'Solo gli admin possono usare i comandi' },
  { key: 'ai', name: '🧠 IA', desc: 'Intelligenza artificiale' },
  { key: 'vocali', name: '🎤 Siri', desc: 'Risponde con audio agli audio e msg ricevuti' },
  { key: 'antivoip', name: '📞❌ Antivoip', desc: 'Antivoip' },
  { key: 'antiLink', name: '🔗❌ Antilink', desc: 'Antilink whatsapp' },
  { key: 'antiLink2', name: '🌐❌ Antilinksocial', desc: 'Antilink social' },
  { key: 'reaction', name: '😎 Reazioni', desc: 'Reazioni automatiche' },
  { key: 'autolevelup', name: '⬆️ Autolivello', desc: 'Messaggio di livello automatico' }
];

const ownerFeatures = [
  { key: 'antiprivato', name: '🔒 \`Antiprivato\`', desc: 'Blocca chiunque scrive in pv al bot' },
  { key: 'soloCreatore', name: '👑 Solocreatore', desc: 'Solo il creatore puo usare i comandi' },
  { key: 'jadibotmd', name: '🧬 Subbots', desc: 'Subbots' },
  { key: 'read', name: '👀 Lettura', desc: 'Il bot legge automaticamente i messaggi' },
  { key: 'anticall', name: '❌📞 Antichiamate', desc: 'Rifiuta automaticamente le chiamate' }
];
  const createSections = (features) => [
    {
      title: 'Attiva',
      rows: features.map(f => ({ title: f.name, description: f.desc, id: `${usedPrefix}attiva ${f.key}` }))
    },
    {
      title: 'Disattiva',
      rows: features.map(f => ({ title: f.name, description: f.desc, id: `${usedPrefix}disattiva ${f.key}` }))
    }
  ];

  if (!args.length) {
    const adminSections = createSections(adminFeatures);
    const ownerSections = createSections(ownerFeatures);

    let cards = [];
    const varebot = 'media/menu/varebot.jpeg';
    if (isOwner || isROwner) {
      cards = [
        {
          image: { url: varebot },
          title: '『 👥 』 \`Impostazioni Admin\`',
          body: '- 〘 🛠️ 〙 *Gestisci le funzioni del gruppo selezionando attiva o disattiva.*',
          footer: '˗ˏˋ ☾ 𝚟𝚊𝚛𝚎𝚋𝚘𝚝 ☽ ˎˊ˗',
          buttons: [
            {
              name: 'single_select',
              buttonParamsJson: JSON.stringify({
                title: 'Impostazioni gruppo',
                sections: adminSections
              })
            }
          ]
        },
        {
          image: { url: 'https://i.ibb.co/kVdFLyGL/sam.jpg' },
          title: '『 👑 』 \`Impostazioni Owner\`',
          body: '- 〘 🛠️ 〙Gestisci le funzioni proprietario selezionando attiva o disattiva.',
          footer: '˗ˏˋ ☾ 𝚟𝚊𝚛𝚎𝚋𝚘𝚝 ☽ ˎˊ˗',
          buttons: [
            {
              name: 'single_select',
              buttonParamsJson: JSON.stringify({
                title: 'Seleziona azione',
                sections: ownerSections
              })
            }
          ]
        }
      ];
    } else {
      cards = [
        { 
          image: { url: varebot },
          title: '『 👥 』 \`Impostazioni Admin\`',
          body: '- 〘 🛠️ 〙 *Gestisci le funzioni del gruppo selezionando attiva o disattiva.*',
          footer: '˗ˏˋ ☾ 𝚟𝚊𝚛𝚎𝚋𝚘𝚝 ☽ ˎˊ˗',
          buttons: [
            {
              name: 'single_select',
              buttonParamsJson: JSON.stringify({
                title: 'Impostazioni gruppo',
                sections: adminSections
              })
            }
          ]
        }
      ];
    }

    const message = {
      text: '*Sistema di gestione funzioni*',
      footer: '*─ׄ✦☾⋆⁺₊✧ 𝓿𝓪𝓻𝓮𝓫𝓸𝓽 ✧₊⁺⋆☽✦─ׅ⭒*',
      cards: cards,
      contextInfo: dynamicContextInfo
    };

    const fkontak_menu = {
      key: { participant: m.sender, remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'BotAssistant' },
      message: {
        contactMessage: {
          displayName: userName,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${userName};;;\nFN:${userName}\nitem1.X-ABLabel:📱 Cellulare\nitem1.TEL;waid=${m.sender.split('@')[0]}:+${m.sender.split('@')[0]}\nitem2.EMAIL;type=INTERNET:bot@whatsapp.com\nitem2.X-ABLabel:💌 Email\nEND:VCARD`,
          jpegThumbnail: userProfilePicBuffer
        }
      },
      participant: m.sender
    };

    return conn.sendMessage(m.chat, message, { quoted: fkontak_menu });
  }
  let results = [];
  for (let type of args.map(arg => arg.toLowerCase())) {
    let result = { type, status: '', success: false };

    switch (type) {
      case 'welcome':
      case 'benvenuto':
        if (!m.isGroup && !isOwner) {
          result.status = '『 ❌ 』 Comando valido solo nei gruppi';
          break;
        }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.welcome === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.welcome = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

         case 'antinuke':

        if (m.isGroup && !(isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`Solo gli owner del bot possono usare questo comando`*';
          break;
        }

        if (chat.antinuke === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }

        chat.antinuke = isEnable;

        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'goodbye':
      case 'addio':
        if (!m.isGroup && !isOwner) {
          result.status = '『 ❌ 』 Comando valido solo nei gruppi';
          break;
        }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.goodbye === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.goodbye = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antiprivato':
      case 'antipriv':
        if (!isOwner && !isROwner) {
          result.status = '『 ❌ 』 Richiede privilegi di proprietario';
          break;
        }
        if (bot.antiprivato === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        bot.antiprivato = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'read':
      case 'lettura':
        if (!isOwner && !isROwner) {
          result.status = '『 ❌ 』 Richiede privilegi di proprietario';
          break;
        }
        if (settings.read === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        settings.read = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antibot':
      case 'antibots':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antiBot === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antiBot = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antisubbots':
      case 'antisub':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antiBot2 === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antiBot2 = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antitoxic':
      case 'antitossici':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antitoxic === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antitoxic = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antivoip':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antivoip === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antivoip = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'modoadmin':
      case 'soloadmin':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.modoadmin === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.modoadmin = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'solocreatore':
      case 'solowner':
      case 'soloowner':
        if (!isROwner) {
          result.status = '『 ❌ 』 Richiede privilegi di proprietario';
          break;
        }
        if (bot.soloCreatore === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        bot.soloCreatore = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

        case 'anticall':
        if (!isROwner) {
          result.status = '『 ❌ 』 Richiede privilegi di proprietario';
          break;
        }
        if (settings.anticall === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        settings.anticall = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antioneview':
      case 'antiviewonce':
        if (!m.isGroup && !isOwner) {
          result.status = '『 ❌ 』 Comando valido solo nei gruppi';
          break;
        }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antioneview === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antioneview = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'reaction':
      case 'reazioni':
        if (!m.isGroup && !isOwner) {
          result.status = '『 ❌ 』 Comando valido solo nei gruppi';
          break;
        }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.reaction === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.reaction = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antilinkuni':
      case 'antilinkuniversale':
      case 'antilinktutto':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antiLinkUni === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antiLinkUni = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antilink2':
      case 'antilinkhard':
      case 'antilinksocial':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antiLink2 === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antiLink2 = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'autolevelup':
      case 'autolivello':
      case 'autolvl':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.autolevelup === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.autolevelup = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antispam':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antispam === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antispam = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antiporn':
      case 'antiporno':
      case 'antiNSFW':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antiporno === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antiporno = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antigore':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antigore === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antigore = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'ia':
      case 'ai':
        if (!m.isGroup && !isOwner) {
          result.status = '『 ❌ 』 Comando valido solo nei gruppi';
          break;
        }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.ai === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.ai = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

        case 'vocali':
        case 'siri':
        if (!m.isGroup && !isOwner) {
          result.status = '『 ❌ 』 Comando valido solo nei gruppi';
          break;
        }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.vocali === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.vocali = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'subbots':
        if (!isOwner && !isROwner) {
          result.status = '『 ❌ 』 Richiede privilegi di proprietario';
          break;
        }
        if (bot.jadibotmd === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        bot.jadibotmd = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'detect':
      case 'rileva':  
        if (!m.isGroup && !isOwner) {
          result.status = '『 ❌ 』 Comando valido solo nei gruppi';
          break;
        }
        if (m.isGroup && !isAdmin && !isOwner && !isROwner) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.rileva === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.rileva = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;

      case 'antilink':
      case 'nolink':
        if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
          result.status = '\n- 〘 🛠️ 〙 *`ꪶ͢Solo gli admin del gruppo possono usare questo comandoꫂ`*';
          break;
        }
        if (chat.antiLink === isEnable) {
          result.status = `『 ⚠️ 』 Già ${isEnable ? 'attivo' : 'disattivato'}`;
          break;
        }
        chat.antiLink = isEnable;
        result.status = `『 ✅ 』 ${isEnable ? 'Attivato' : 'Disattivato'}`;
        result.success = true;
        break;
      default:
        result.status = '『 ❌ 』 Comando non riconosciuto';
        break;
    }
    results.push(result);
  }
  let summaryMessage = `『 🉐 』 \`Riepilogo modifiche:\`\n\n`;
  results.forEach(result => {
    summaryMessage += `- *\`${result.type}\`*${result.status}`;
  });

  const fkontak_confirm = {
    key: { participant: m.sender, remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'BotFunction' },
    message: { 
      contactMessage: { 
        displayName: userName, 
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${userName};;;\nFN:${userName}\nitem1.X-ABLabel:📱 Cellulare\nitem1.TEL;waid=${m.sender.split('@')[0]}:+${m.sender.split('@')[0]}\nitem2.EMAIL;type=INTERNET:bot@whatsapp.com\nitem2.X-ABLabel:💌 Email\nEND:VCARD`,
        jpegThumbnail: userProfilePicBuffer
      }
    },
    participant: m.sender
  };

  await conn.sendMessage(m.chat, { text: summaryMessage, { quoted: fkontak_confirm });
};

handler.help = ['attiva', 'disattiva'];
handler.tags = ['main'];
handler.command = ['enable', 'disable', 'attiva', 'disattiva', 'on', 'off'];

export default handler;
