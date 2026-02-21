const menuText = `
☣️ 𝐍ΞXSUS – 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋𝐋𝐎 𝐒𝐈𝐂𝐔𝐑𝐄𝐙𝐙𝐀 ☣️
════════════════════

⚙️ 𝐀𝐓𝐓𝐈𝐕𝐀𝐙𝐈𝐎𝐍𝐄 𝐌𝐎𝐃𝐔𝐋𝐈
➤ ${usedPrefix}attiva <funzione> 🟢
➤ ${usedPrefix}disattiva <funzione> 🔴

════════════════════
🛡️ 𝐒𝐂𝐔𝐃𝐎 𝐏𝐑𝐎𝐓𝐄𝐙𝐈𝐎𝐍𝐄
➤ 🔗 AntiLink       → ${stato(chat.antiLink)}
➤ 🧱 AntiTrava      → ${stato(chat.antitrava)}
➤ 💣 AntiNuke       → ${stato(chat.antinuke)}
➤ 🛑 AntiSpam       → ${stato(chat.antispam)}
➤ 🤖 AntiBot        → ${stato(chat.antiBot)}
➤ 📸 AntiInsta      → ${stato(chat.antiInsta)}
➤ ✈️ AntiTelegram   → ${stato(chat.antiTelegram)}
➤ 🎵 AntiTiktok     → ${stato(chat.antiTiktok)}
➤ 🏷️ AntiTag        → ${stato(chat.antiTag)}
➤ 🚫 AntiGore       → ${stato(chat.antigore)}
➤ 🔞 AntiPorno      → ${stato(chat.antiporno)}

════════════════════
🔒 𝐌𝐎𝐃𝐀𝐋𝐈𝐓À 𝐂𝐎𝐍𝐓𝐑𝐎𝐋𝐋𝐎
➤ 🛡️ SoloAdmin      → ${stato(chat.modoadmin)}

════════════════════
📡 𝐌𝐄𝐒𝐒𝐀𝐆𝐆𝐈 𝐀𝐔𝐓𝐎𝐌𝐀𝐓𝐈𝐂𝐈
➤ 👋 Benvenuto      → ${stato(chat.welcome)}
➤ 🚪 Addio          → ${stato(chat.goodbye)}

════════════════════
👑 𝐋𝐈𝐕𝐄𝐋𝐋𝐎 𝐒𝐔𝐏𝐑𝐄𝐌𝐎
➤ 🔒 AntiPrivato    → ${stato(bot.antiprivato)}

════════════════════
🔻 Livello sicurezza dinamico.
`.trim()