import fs from 'fs'

const FILE = './botstatus.json'

if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}')

function loadData() {
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
}

function saveData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

let handler = async (m, { conn, command, isOwner }) => {
  if (!m.isGroup) return conn.reply(m.chat, '❌ Solo nei gruppi.', m)
  if (!isOwner) return conn.reply(m.chat, '❌ Questo comando è riservato all’Owner.', m)

  let data = loadData()

  if (command === 'off') {
    data[m.chat] = true
    saveData(data)
    return conn.reply(m.chat, '🔴 Bot disattivato in questo gruppo.\nUsa !on per riattivarlo.', m)
  }

  if (command === 'on') {
    delete data[m.chat]
    saveData(data)
    return conn.reply(m.chat, '🟢 Bot riattivato in questo gruppo.', m)
  }
}

handler.help = ['off', 'on']
handler.tags = ['owner']
handler.command = ['off', 'on']
handler.owner = true // extra sicurezza (il tuo handler già supporta plugin.owner)

export default handler
