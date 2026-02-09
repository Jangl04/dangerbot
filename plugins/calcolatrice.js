function safeEval(expr) {
  // normalizza: 10% => (10/100)
  expr = expr.replace(/(\d+(\.\d+)?)\s*%/g, '($1/100)')

  // consenti solo caratteri matematici sicuri
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    throw new Error('Espressione non valida. Usa solo numeri e + - * / ( ) %')
  }

  // evita robe strane tipo ** o // ripetuti a caso (minimo controllo)
  if (expr.includes('**') || expr.includes('//')) {
    throw new Error('Operatore non consentito.')
  }

  // eval “controllato” (con whitelist sopra)
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${expr});`)()
  if (!Number.isFinite(result)) throw new Error('Risultato non valido.')
  return result
}

let handler = async (m, { conn, text }) => {
  const expr = (text || '').trim()
  if (!expr) {
    return conn.sendMessage(
      m.chat,
      { text: '🧮 Uso: *.calcola* 12*(3+5)\nEsempi: *.calcola* 10% + 250\n*.calcola* (100/4)+7' },
      { quoted: m }
    )
  }

  try {
    const res = safeEval(expr)
    await conn.sendMessage(m.chat, { text: `🧮 ${expr} = *${res}*` }, { quoted: m })
  } catch (e) {
    await conn.sendMessage(m.chat, { text: `❌ ${e.message}` }, { quoted: m })
  }
}

handler.help = ['calcola <espressione>']
handler.tags = ['tools']
handler.command = /^calcola$/i

export default handler






