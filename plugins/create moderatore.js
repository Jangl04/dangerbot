import axios from "axios";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

async function urlToWebpSticker(url) {
  const tmpIn = path.join("/tmp", `kiss_${Date.now()}.gif`);
  const tmpOut = path.join("/tmp", `kiss_${Date.now()}.webp`);

  // Scarica la GIF/MP4
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(tmpIn, Buffer.from(res.data));

  // Converti in WEBP sticker (512x512, trasparenza, loop)
  await execFileAsync("ffmpeg", [
    "-y",
    "-i", tmpIn,
    "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=0x00000000",
    "-loop", "0",
    "-lossless", "1",
    "-preset", "default",
    "-an",
    "-vsync", "0",
    tmpOut
  ]);

  const webp = fs.readFileSync(tmpOut);

  // pulizia
  try { fs.unlinkSync(tmpIn); } catch {}
  try { fs.unlinkSync(tmpOut); } catch {}

  return webp;
}

const handler = async (m, { conn, command, usedPrefix }) => {
  const target =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && (m.quoted.sender || m.quoted.participant));

  if (!target) {
    return m.reply(`Uso: ${usedPrefix}${command} @utente\nOppure rispondi a un messaggio con ${usedPrefix}${command}`);
  }

  const sender = m.sender;

  const senderName = conn.getName ? await conn.getName(sender) : sender.split("@")[0];
  const targetName = conn.getName ? await conn.getName(target) : target.split("@")[0];

  const text = `😘 *${senderName}* bacia *${targetName}* 💋`;

  // Link stabile (puoi cambiarlo)
  const kissUrl = "https://media.giphy.com/media/EVODaJHSXZGta/giphy.gif";

  try {
    const stickerBuffer = await urlToWebpSticker(kissUrl);
    await conn.sendMessage(m.chat, { sticker: stickerBuffer, mentions: [sender, target] }, { quoted: m });
  } catch (e) {
    // Se fallisce la conversione, almeno manda il testo
    await conn.sendMessage(m.chat, { text: `⚠️ Sticker non disponibile.\n\n${text}`, mentions: [sender, target] }, { quoted: m });
    return;
  }

  await conn.sendMessage(m.chat, { text, mentions: [sender, target] }, { quoted: m });
};

handler.help = ["bacia @utente"];
handler.tags = ["fun"];
handler.command = /^bacia$/i;

export default handler;









