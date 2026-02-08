import fs from 'fs'
import path from 'path'

const DB_FILE = path.resolve('data/bestemmiometro.json')

function ensureDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
    fs.writeFileSync(DB_FILE, JSON.stringify({ enabled: {}, counts: {} }, null, 2))
  }
}

function readDB() {
  ensureDB()
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
}

function writeDB(db) {
  ensureDB()
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

// Regex base (puoi aggiungerne/toglierne)
const PATTERNS = [
  /\bporc[oa]\s*d[i1]o\b/i,
  /\bporc[oa]\s*madonn[a4]\b/i,
  /\bd[i1]o\s*cane\b/i,
  /\bd[i1]o\s*porco\b/i,
  /\bmadonn[a4]\s*puttan[ae]\b/i,
]

// Conta su ogni messaggio (se attivo nel gruppo)
async function countIfEnabled(m) {
  try {
    if (!m.isGroup) return
    const text = (m.text || m.message?.conversation || '').toString()
    if (!text) return

    const db = readDB()
    if (!db.enabled[m.chat]) return

    let hits = 0
    for (const re of PATTERNS) {
      const match = text.match(re)
      if (match) hits += 1
    }
    if (hits <= 0) return

    db.counts[m.chat] = (db.counts[m.chat] || 0) + hits
    writeDB(db)
  } catch {
    // silenzio: non bloccare il bot
  }
}

let handler = async (m, { conn, text, isAdmin }) => {
  // Comandi solo in gruppo
  if (!m.isGroup) return m.reply('❌ Questo comando funziona solo nei gruppi.')

  const args = (text || '').trim().split(/\s+/)
  const sub = (args[0] || '').toLowerCase() // es: "bestemmiometro"

  const cmd = (m.text || '').trim().split(/\s+/)[0].toLowerCase()

  // .attiva bestemmiometro
  if (/^\.?attiva$/i.test(cmd)) {
    if (sub !== 'bestemmiometro') return
    if (!isAdmin) return m.reply('❌ Solo gli admin possono attivarlo.')

    const db = readDB()
    db.enabled[m.chat] = true
    db.counts[m.chat] = db.counts[m.chat] || 0
    writeDB(db)
    return m.reply('✅ Bestemmiometro ATTIVO in questo gruppo.')
  }

  // .disattiva bestemmiometro
  if (/^\.?disattiva$/i.test(cmd)) {
    if (sub !== 'bestemmiometro') return
    if (!isAdmin) return m.reply('❌ Solo gli admin possono disattivarlo.')

    const db = readDB()
    db.enabled[m.chat] = false
    writeDB(db)
    return m.reply('✅ Bestemmiometro DISATTIVATO in questo gruppo.')
  }

  // .reset bestemmiometro
  if (/^\.?reset$/i.test(cmd)) {
    if (sub !== 'bestemmiometro') return
    if (!isAdmin) return m.reply('❌ Solo gli admin possono resettare.')

    const db = readDB()
    db.counts[m.chat] = 0
    writeDB(db)
    return m.reply('🧹 Bestemmiometro resettato a 0.')
  }

  // .bestemmiometro (mostra stato + conteggio)
  if (/^\.?bestemmiometro$/i.test(cmd)) {
    const db = readDB()
    const on = !!db.enabled[m.chat]
    const c = db.counts[m.chat] || 0
    return m.reply(
      `📟 *Bestemmiometro*\n` +
      `• Stato: *${on ? 'ATTIVO' : 'DISATTIVO'}*\n` +
      `• Conteggio: *${c}*`
    )
  }
}

// ✅ questa parte fa contare ogni messaggio
handler.before = async (m) => {
  await countIfEnabled(m)
}

handler.help = ['bestemmiometro', 'attiva bestemmiometro', 'disattiva bestemmiometro', 'reset bestemmiometro']
handler.tags = ['group']
handler.command = /^(bestemmiometro|attiva|disattiva|reset)$/i

export default handler



