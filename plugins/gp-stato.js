const groupFeatures = [
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
  { key: 'antiprivato', name: '🔒 Antiprivato', desc: 'Blocca chiunque scrive in pv al bot' },
  { key: 'soloCreatore', name: '👑 Solocreatore', desc: 'Solo il creatore puo usare i comandi' },
  { key: 'jadibotmd', name: '🧬 Subbots', desc: 'Subbots' },
  { key: 'read', name: '👀 Lettura', desc: 'Il bot legge automaticamente i messaggi' },
  { key: 'anticall', name: '❌📞 Antichiamate', desc: 'Rifiuta automaticamente le chiamate' }
];

const handler = async (m, { conn }) => {
  const chat = global.db.data.chats[m.chat] || {};
  const settings = global.db.data.settings?.[conn.user.jid] || {};

  let activeGroup = groupFeatures.filter(f => chat[f.key]);
  let activeOwner = ownerFeatures.filter(f => settings[f.key]);

  if (!activeGroup.length && !activeOwner.length) {
    return m.reply('⚙️ Nessuna funzione attiva.');
  }

  let text = '📊 *STATO FUNZIONI ATTIVE*\n\n';

  if (activeGroup.length) {
    text += '╭─〔 👥 Gruppo 〕\n';
    text += activeGroup.map(f => `│ ${f.name}`).join('\n');
    text += '\n╰──────────────\n\n';
  }

  if (activeOwner.length) {
    text += '╭─〔 👑 Owner 〕\n';
    text += activeOwner.map(f => `│ ${f.name}`).join('\n');
    text += '\n╰──────────────\n';
  }

  m.reply(text.trim());
};

handler.help = ['stato'];
handler.tags = ['group'];
handler.command = /^stato$/i;

export default handler;