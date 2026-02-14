// plugins/meteo.js
import fs from 'fs'

const weatherCodeMap = (code) => {
  // Open-Meteo weathercode
  // https://open-meteo.com/en/docs
  const m = {
    0:  { t: 'Sereno', e: '☀️' },
    1:  { t: 'Prevalentemente sereno', e: '🌤️' },
    2:  { t: 'Parzialmente nuvoloso', e: '⛅' },
    3:  { t: 'Nuvoloso', e: '☁️' },
    45: { t: 'Nebbia', e: '🌫️' },
    48: { t: 'Nebbia (brina)', e: '🌫️' },
    51: { t: 'Pioviggine leggera', e: '🌦️' },
    53: { t: 'Pioviggine moderata', e: '🌦️' },
    55: { t: 'Pioviggine intensa', e: '🌧️' },
    56: { t: 'Pioviggine gelata leggera', e: '🌧️' },
    57: { t: 'Pioviggine gelata intensa', e: '🌧️' },
    61: { t: 'Pioggia leggera', e: '🌧️' },
    63: { t: 'Pioggia moderata', e: '🌧️' },
    65: { t: 'Pioggia forte', e: '🌧️' },
    66: { t: 'Pioggia gelata leggera', e: '🌧️' },
    67: { t: 'Pioggia gelata forte', e: '🌧️' },
    71: { t: 'Neve leggera', e: '🌨️' },
    73: { t: 'Neve moderata', e: '🌨️' },
    75: { t: 'Neve forte', e: '❄️' },
    77: { t: 'Neve granulare', e: '🌨️' },
    80: { t: 'Rovesci leggeri', e: '🌦️' },
    81: { t: 'Rovesci moderati', e: '🌧️' },
    82: { t: 'Rovesci violenti', e: '⛈️' },
    85: { t: 'Rovesci di neve leggeri', e: '🌨️' },
    86: { t: 'Rovesci di neve forti', e: '❄️' },
    95: { t: 'Temporale', e: '⛈️' },
    96: { t: 'Temporale con grandine', e: '⛈️' },
    99: { t: 'Temporale con grandine forte', e: '⛈️' },
  }
  return m[code] || { t: 'Meteo variabile', e: '🌡️' }
}

async function jfetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'dangerbot-meteo/1.0' }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

let handler = async (m, { conn, args }) => {
  const city = (args || []).join(' ').trim()
  if (!city) {
    return conn.reply(m.chat, 'Uso: .meteo <città>\nEsempio: .meteo Roma', m)
  }

  try {
    // 1) Geocoding città -> lat/lon
    const geoUrl =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=it&format=json`
    const geo = await jfetch(geoUrl)

    if (!geo?.results?.length) {
      return conn.reply(m.chat, `❌ Non trovo "${city}". Prova con: città + stato (es. "Roma Italia")`, m)
    }

    const g = geo.results[0]
    const name = [g.name, g.admin1, g.country].filter(Boolean).join(', ')
    const lat = g.latitude
    const lon = g.longitude
    const tz = g.timezone || 'auto'

    // 2) Meteo attuale + daily pioggia + probabilità pioggia (se disponibile)
    const wxUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=precipitation_sum,precipitation_probability_max,weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=${encodeURIComponent(tz)}`

    const wx = await jfetch(wxUrl)

    const cur = wx.current
    const daily = wx.daily

    const code = cur?.weather_code
    const desc = weatherCodeMap(code)

    const temp = cur?.temperature_2m
    const feels = cur?.apparent_temperature
    const hum = cur?.relative_humidity_2m
    const wind = cur?.wind_speed_10m

    // Oggi (index 0)
    const tMax = daily?.temperature_2m_max?.[0]
    const tMin = daily?.temperature_2m_min?.[0]
    const rainMM = daily?.precipitation_sum?.[0]
    const rainProb = daily?.precipitation_probability_max?.[0] // può essere undefined

    // “porta pioggia?” => sì se prob >= 40 o mm > 0
    const willRain = (typeof rainProb === 'number' && rainProb >= 40) || (typeof rainMM === 'number' && rainMM > 0)
    const rainText = willRain ? '🌧️ Possibile pioggia' : '☀️ Niente pioggia rilevante'

    const probText = (typeof rainProb === 'number') ? `\n🌦️ Prob. pioggia max oggi: *${rainProb}%*` : ''
    const mmText = (typeof rainMM === 'number') ? `\n💧 Precipitazioni oggi: *${rainMM} mm*` : ''

    const msg =
`📍 *Meteo reale* — ${name}

${desc.e} *${desc.t}*
🌡️ Temp: *${temp}°C* (percepita *${feels}°C*)
🔻 Min: *${tMin}°C*  🔺 Max: *${tMax}°C*
💨 Vento: *${wind} km/h*
💧 Umidità: *${hum}%*
${rainText}${probText}${mmText}
`.trim()

    return conn.reply(m.chat, msg, m)

  } catch (e) {
    return conn.reply(m.chat, `❌ Errore meteo: ${e?.message || e}`, m)
  }
}

handler.help = ['meteo <città>']
handler.tags = ['info']
handler.command = ['meteo', 'weather']

export default handler
