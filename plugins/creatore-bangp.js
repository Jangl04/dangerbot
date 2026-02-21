
let handler = async (m) => {
global.db.data.chats[m.chat].isBanned = true
m.reply('𝐌𝐨𝐝𝐚𝐥𝐢𝐭à 𝐀𝐅𝐊 𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐚 ✓')
}
handler.help = ['banchat']
handler.tags = ['owner']
handler.command = /^off$/i
handler.rowner = true
export default handler