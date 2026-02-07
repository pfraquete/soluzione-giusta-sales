// src/lib/sales/rate-limiter.ts
interface RateLimitEntry { count: number; resetAt: number }

const store = new Map<string, RateLimitEntry>()
const RATE_LIMIT_MS = parseInt(process.env.WHATSAPP_RATE_LIMIT_MS || '3000')
const MAX_PER_HOUR = parseInt(process.env.MAX_MESSAGES_PER_HOUR || '100')
const WINDOW_MS = 60 * 60 * 1000

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(identifier)
  if (store.size > 10000) {
    store.forEach((val, key) => { if (val.resetAt < now) store.delete(key) })
  }
  if (!entry || entry.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_PER_HOUR - 1, resetAt: now + WINDOW_MS }
  }
  if (entry.count >= MAX_PER_HOUR) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count++
  return { allowed: true, remaining: MAX_PER_HOUR - entry.count, resetAt: entry.resetAt }
}

const lastMessageStore = new Map<string, number>()
export function checkMinInterval(phone: string): boolean {
  const now = Date.now()
  const lastTime = lastMessageStore.get(phone) || 0
  if (now - lastTime < RATE_LIMIT_MS) return false
  lastMessageStore.set(phone, now)
  if (lastMessageStore.size > 5000) {
    lastMessageStore.forEach((val, key) => { if (now - val > WINDOW_MS) lastMessageStore.delete(key) })
  }
  return true
}

export async function validatePagarmeSignature(body: string, signature: string): Promise<boolean> {
  const secret = process.env.PAGARME_WEBHOOK_SECRET
  if (!secret) { console.warn('[SECURITY] PAGARME_WEBHOOK_SECRET not set'); return false }
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const expected = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    return signature === expected
  } catch { return false }
}

export function validateEvolutionWebhook(request: Request): boolean {
  const apiKey = request.headers.get('apikey') || request.headers.get('x-api-key')
  const expectedKey = process.env.EVOLUTION_OCCHIALE_API_KEY || process.env.EVOLUTION_EKKLE_API_KEY
  if (!expectedKey) return true
  return apiKey === expectedKey
}
