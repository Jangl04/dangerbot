import fetch from 'node-fetch'

const L = ['UNKNOWN', 'VERY_UNLIKELY', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'VERY_LIKELY']
const score = (v) => Math.max(0, L.indexOf(v || 'UNKNOWN'))

async function toBase64Image(buf, mimetype) {
  if (mimetype === 'image/webp') {
    try {
      const sharp = (await import('sharp')).default
      const jpg = await sharp(buf).jpeg({ quality: 85 }).toBuffer()
      return jpg.toString('base64')
    } catch {
      return buf.toString('base64')
    }
  }
  return buf.toString('base64')
}

async function visionSafeSearch(base64, apiKey) {
  const r = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: 'SAFE_SEARCH_DETECTION' }]
        }]
      })
    }
  )
  const j = await r.json()
  return j.responses?.[0]?.safeSearchAnnotation
}

let handler = async (m, { conn, args, isAdmin, isOwner }) => {
  if (!m.isGroup) return
  if (!isAdmin && !isOwner) return

  const chat = global.db.data.chats[m.chat] ||= {}
  const on = ['on','1','true'].includes((args[0]||'').toLowerCase())
  const off = ['off','0','false'].includes((args[0]||'').toLowerCase())

  if (handler.command[0] === 'antiporno') chat.antiPorn = on ? true : off ? false : chat.antiPorn
  if (handler.command[0] === 'antigore') chat.antiGore = on ? true : off ? false : chat.antiGore

  conn.reply(m.chat,
    `${handler.command[0]}: ${(handler.command[0]==='antiporno'?chat.antiPorn:chat.antiGore) ? 'ON ✅' : 'OFF ❌'}`,
    m
  )
}

handler.help = ['antiporno on/off', 'antigore on/off']
handler.tags = ['group']
handler.command = /^(antiporno|antigore)$/i
export default handler

export async function before(m, { conn, isBotAdmin }) {
  if (!m.isGroup || !isBotAdmin) return true

  const chat = global.db.data.chats?.[m.chat]
  if (!chat || (!chat.antiPorn && !chat.antiGore)) return true

  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) return true

  const t = (m.mtype || '').toLowerCase()
  if (!t.includes('image') && !t.includes('sticker')) return true

  try {
    const buf = await conn.downloadMediaMessage(m)
    const ann = await visionSafeSearch(
      await toBase64Image(buf, m.msg?.mimetype),
      apiKey
    )

    if (!ann) return true

    const porn = score(ann.adult) >= 4 || score(ann.racy) >= 5
    const gore = score(ann.violence) >= 4

    if ((chat.antiPorn && porn) || (chat.antiGore && gore)) {
      await conn.sendMessage(m.chat, { delete: m.key })
    }
  } catch {}

  return true
}
