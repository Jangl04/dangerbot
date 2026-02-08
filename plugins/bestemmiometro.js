import fs from 'fs'
import path from 'path'

const DB_FILE = path.resolve('data/bestemmiometro.json')

function ensureDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
    fs.writeFileSync(DB_FILE, JSON.stringify({ enabled: {}, counts: {} }, null, 2))
  }
}
function readDB() { ensureDB(); return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) }
function writeDB(db) { ensureDB(); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)) }

// ✅ più permissive (prendono anche "porcodio" attaccato)
const PATTERNS = [
  /porc[oa]\s*d[i1]o/i,
  /porc[oa]\s*madonn[a4]/i,
  /d[i1]o\s*cane/i,
  /d[i1]o\s*porco/i,
  /madonn[a4]\s*puttan/i,
]

function getText(m) {
  return (m.text || m.message?.conversation || '').toString()
}

async function countIfEnabled(m) {
  try {
    if (!m.isGroup) return
    const text = getText(m)
    if (!text) return

    const db = readDB()
    if (!db.enabled[m.chat]) return

    let hits = 0
    for (const re of PATTERNS) if (re.test(text)) hits++

    if (hits <= 0) return
    db.counts[m.chat] = (db.counts[m.chat] || 0) + hits
    writeDB(db)
  } catch {}
}

let handler = async (m, { text, isAdmin }) => {
  if (!m.isGroup) return m.reply('❌ Questo comando funziona solo nei gruppi.')

  const args = (text || '').trim().split(/\s+/)
  const sub = (args[0] || '').toLowerCase()
  const cmd = (m.text || '').trim().split(/\s+/)[0].toLowerCase()

  if (/^\.?attiva$/i.test(cmd)) {
    if (sub !== 'bestemmiometro') return
    if (!isAdmin) return m.reply('❌ Solo gli admin possono attivarlo.')

    const db = readDB()
    db.enabled[m.chat] = true
    db.counts[m.chat] = db.counts[m.chat] || 0
    writeDB(db)
    return m.reply('✅ Bestemmiometro ATTIVO in questo gruppo.')
  }

  if (/^\.?disattiva$/i.test(cmd)) {
    if (sub !== 'bestemmiometro') return
    if (!isAdmin) return m.reply('❌ Solo gli admin possono disattivarlo.')

    const db = readDB()
    db.enabled[m.chat] = false
    writeDB(db)
    return m.reply('✅ Bestemmiometro DISATTIVATO in questo gruppo.')
  }

  if (/^\.?reset$/i.test(cmd)) {
    if (sub !== 'bestemmiometro') return
    if (!isAdmin) return m.reply('❌ Solo gli admin possono resettare.')

    const db = readDB()
    db.counts[m.chat] = 0
    writeDB(db)
    return m.reply('🧹 Bestemmiometro resettato a 0.')
  }

  if (/^\.?bestemmiometro$/i.test(cmd)) {
    const db = readDB()
    const on = !!db.enabled[m.chat]
    const c = db.counts[m.chat] || 0
    return m.reply(`📟 *Bestemmiometro*\n• Stato: *${on ? 'ATTIVO' : 'DISATTIVO'}*\n• Conteggio: *${c}*`)
  }
}

// ✅ comandi
handler.help = ['bestemmiometro', 'attiva bestemmiometro', 'disattiva bestemmiometro', 'reset bestemmiometro']
handler.tags = ['group']
handler.command = /^(bestemmiometro|attiva|disattiva|reset)$/i

export default handler

// ✅ QUI È LA PARTE IMPORTANTE: molti bot usano export before/all, non handler.before
export async function before(m) {
  await countIfEnabled(m)
}

// ✅ e per compatibilità massima (alcuni usano all)
export async function all(m) {
  await countIfEnabled(m)
}




