import { Redis } from '@upstash/redis'

// Vercel's Upstash marketplace integration provisions KV_REST_API_URL / KV_REST_API_TOKEN,
// not the UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN that Redis.fromEnv() expects.
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})
const LEADERBOARD_KEY = 'wizardWar2:leaderboard'
const MAX_ENTRIES = 100

export default async function handler(request, response) {
  if (request.method === 'GET') {
    const raw = await redis.zrange(LEADERBOARD_KEY, 0, MAX_ENTRIES - 1, { rev: true, withScores: true })
    // The Upstash client auto-deserializes JSON-looking string members back into objects on
    // read, so `raw[i]` may already be an object — only JSON.parse it if it's still a string.
    const entries = []
    for (let i = 0; i < raw.length; i += 2) {
      try {
        const entry = typeof raw[i] === 'string' ? JSON.parse(raw[i]) : raw[i]
        entries.push({ ...entry, score: Number(raw[i + 1]) })
      } catch {
        // skip malformed entries rather than failing the whole request
      }
    }
    response.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30')
    return response.status(200).json({ entries })
  }

  if (request.method === 'POST') {
    const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body || {})
    const name = String(body.name || 'Wizard').slice(0, 20)
    const score = Number(body.score)
    const wave = Number(body.wave) || 0
    const level = Number(body.level) || 1

    if (!Number.isFinite(score) || score <= 0) {
      return response.status(400).json({ error: 'score must be a positive number' })
    }

    const entry = { name, wave, level, ts: Date.now() }
    await redis.zadd(LEADERBOARD_KEY, { score, member: JSON.stringify(entry) })

    const count = await redis.zcard(LEADERBOARD_KEY)
    if (count > MAX_ENTRIES) {
      await redis.zremrangebyrank(LEADERBOARD_KEY, 0, count - MAX_ENTRIES - 1)
    }

    return response.status(200).json({ ok: true })
  }

  response.setHeader('Allow', 'GET, POST')
  return response.status(405).json({ error: 'method not allowed' })
}
