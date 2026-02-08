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

// ✅ prende anche "porcodio" attaccato, maiuscole, spazi ecc.
const PATTERNS = [
  /porc[oa]\s*d[i1]o/i,
  /porc[oa]\s*madonn[a4]/i,
  /d[i1]o\s*cane/i,
  /d[i1]o\s*porco/i,
  /madonn[a4]\s*puttan/i,
]

function getText(m) {
  return (m.text || m.message?.conversation || m.msg?.text || '').toString()
}

let handler = async (m) => {
  if (!m.isGroup) return

  const txt = getText(m).trim()
  if (!txt) return

  // ✅ comandi italiani (manuali)
  const low = txt.toLowerCase()

  const db = readDB()

  // .attiva bestemmiometro
  if (low === '.attiva bestemmiometro') {
    // se il tuo bot passa isAdmin altrove, qui facciamo check "semplice":
    // molti bot hanno m.isAdmin / m.isGroupAdmin / m.isAdminGroup, se non esiste ignora.
    if (m.isAdmin === false) return m.reply?.('❌ Solo admin.') // se supportato
    db.enabled[m.chat] = true
    db.counts[m.chat] = db.counts[m.chat] || 0
    writeDB(db)
    return m.reply?.('✅ Bestemmiometro ATTIVO in questo gruppo.')
  }

  // .disattiva bestemmiometro
  if (low === '.disattiva bestemmiometro') {
    if (m.isAdmin === false) return m.reply?.('❌ Solo admin.')
    db.enabled[m.chat] = false
    writeDB(db)
    return m.reply?.('✅ Bestemmiometro DISATTIVATO in questo gruppo.')
  }

  // .reset bestemmiometro
  if (low === '.reset bestemmiometro') {
    if (m.isAdmin === false) return m.reply?.('❌ Solo admin.')
    db.counts[m.chat] = 0
    writeDB(db)
    return m.reply?.('🧹 Bestemmiometro resettato a 0.')
  }

  // .bestemmiometro
  if (low === '.bestemmiometro') {
    const on = !!db.enabled[m.chat]
    const c = db.counts[m.chat] || 0
    return m.reply?.(`📟 *Bestemmiometro*\n• Stato: *${on ? 'ATTIVO' : 'DISATTIVO'}*\n• Conteggio: *${c}*`)
  }

  // ✅ conteggio su messaggi normali (solo se attivo)
  if (!db.enabled[m.chat]) return

  let hits = 0
  for (const re of PATTERNS) if (re.test(txt)) hits++
  if (hits <= 0) return

  db.counts[m.chat] = (db.counts[m.chat] || 0) + hits
  writeDB(db)
}

// 🔥 Questa è la chiave: prende QUALSIASI testo, non solo comandi
handler.customPrefix = /[\s\S]+/i
handler.command = new RegExp

handler.help = ['attiva bestemmiometro', 'disattiva bestemmiometro', 'bestemmiometro', 'reset bestemmiometro']
handler.tags = ['group']

export default handler





