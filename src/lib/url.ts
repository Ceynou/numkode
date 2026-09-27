export const DEFAULT_LENGTH = 5
export const DEFAULT_EXTRA = 1
export const DEFAULT_STRENGTH = 2

export interface GameRef {
  seed: string
  length: number
  extra: number | null
  strength: number | null
}

export function normalizeLength(len: unknown, fallback: number): number {
  const n = Number(len)
  return Number.isInteger(n) && n >= 2 && n <= 10 ? n : fallback
}

export function normalizeExtra(x: unknown): number {
  const n = Number(x)
  return Number.isInteger(n) && n >= 0 && n <= 4 ? n : 0
}

export function normalizeStrength(s: unknown): number {
  const n = Number(s)
  return Number.isInteger(n) && n >= 0 && n <= 8 ? n : 0
}

export function toHash(seed: string, length: number, extra: number, strength: number): string {
  return `#seed=${encodeURIComponent(seed)}&len=${length}&x=${extra}&s=${strength}`
}

export function fromHash(hash: string, fallbackSeed: string, fallbackLength: number): GameRef {
  if (!hash || hash === '#' || hash === '#/') return { seed: fallbackSeed, length: fallbackLength, extra: null, strength: null }
  const params = new URLSearchParams(hash.replace(/^#\/?/, ''))
  const seedRaw = params.get('seed')
  const seed = seedRaw === null ? fallbackSeed : seedRaw.trim().slice(0, 64)
  const length = normalizeLength(params.get('len'), fallbackLength)
  const extra = params.has('x') ? normalizeExtra(params.get('x')) : null
  const strength = params.has('s') ? normalizeStrength(params.get('s')) : null
  return { seed: seed || fallbackSeed, length, extra, strength }
}
