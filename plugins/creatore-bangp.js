
let handler = async (m) => {
global.db.data.chats[m.chat].isBanned = true
m.reply('💤 𝔹𝕆𝕋 𝔼ℕ𝕋ℝ𝔸𝕋𝕆 𝕀ℕ 𝕄𝕆𝔻𝔸𝕃𝕀𝕋À 𝔸𝔽𝕂, 𝕍𝔸𝔻𝕆 𝔸 ℕ𝔸ℕℕ𝔸 𝔹𝔼𝕃𝕃𝕀 🥱')
}
handler.help = ['banchat']
handler.tags = ['owner']
handler.command = /^off$/i
handler.rowner = true
export default handler