import { filterRows, freshUniverse, universeSize } from './engine'
import { misplacedOf, packedPair, placedOf, rowSpec, type ClueRow } from './feedback'
import { rngFromSeed } from './rng'
import { loadPuzzle, savePuzzle } from './storage'

export interface Puzzle {
  seed: string
  length: number
  secret: number[]
  rows: ClueRow[]
}

const MAX_ROWS = 16
const MAX_TOTAL = 18
const GREEDY_MAX = 250000
const SAMPLES = 12

const cache = new Map<string, Puzzle>()

export function minShared(length: number): number {
  return Math.max(1, 2 * length - 10)
}

export function maxStrength(length: number): number {
  return Math.max(0, length - minShared(length))
}

function partialShuffle<T>(rng: () => number, pool: T[], take: number): T[] {
  const n = pool.length
  const limit = Math.min(take, n)
  for (let i = 0; i < limit; i++) {
    const j = i + Math.floor(rng() * (n - i))
    const t = pool[i]
    pool[i] = pool[j]
    pool[j] = t
  }
  return pool.slice(0, limit)
}

function seededCode(rng: () => number, length: number, secret: readonly number[], cap: number): number[] {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  if (!cap) {
    for (let i = 9; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      const t = pool[i]
      pool[i] = pool[j]
      pool[j] = t
    }
    return pool.slice(0, length)
  }
  const minS = minShared(length)
  const maxS = Math.min(cap, length)
  const s = minS + Math.floor(rng() * (maxS - minS + 1))
  const secretPool = secret.slice()
  const complement: number[] = []
  const mask = secret.reduce((m, d) => m | (1 << d), 0)
  for (const d of pool) if (!(mask & (1 << d))) complement.push(d)
  const picked = partialShuffle(rng, secretPool, s).concat(partialShuffle(rng, complement, length - s))
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = picked[i]
    picked[i] = picked[j]
    picked[j] = t
  }
  return picked
}

function sharedCount(a: readonly number[], b: readonly number[]): number {
  let mask = 0
  for (const d of b) mask |= 1 << d
  let n = 0
  for (const d of a) if (mask & (1 << d)) n++
  return n
}

function maskOf(digits: readonly number[]): number {
  let mask = 0
  for (const d of digits) mask |= 1 << d
  return mask
}

function sumSqBuckets(buf: Uint8Array, count: number, length: number, digits: readonly number[], mask: number): number {
  const buckets = new Map<number, number>()
  for (let r = 0; r < count; r++) {
    const off = r * length
    let placed = 0
    let shared = 0
    for (let p = 0; p < length; p++) {
      const d = buf[off + p]
      if (mask & (1 << d)) shared++
      if (d === digits[p]) placed++
    }
    const k = (placed << 4) | (shared - placed)
    buckets.set(k, (buckets.get(k) ?? 0) + 1)
  }
  let sum = 0
  for (const v of buckets.values()) sum += v * v
  return sum
}

function rowBudget(length: number, cap: number): number {
  const size = universeSize(length)
  const feedbacks = ((length + 1) * (length + 2)) / 2
  const minRows = Math.ceil(Math.log(size) / Math.log(feedbacks))
  const base = Math.max(4, Math.min(10, minRows + 2))
  return Math.min(MAX_ROWS - 2, base + (cap ? 4 : 0))
}

function craftZeroRow(rng: () => number, secret: readonly number[], length: number): ClueRow {
  const mask = maskOf(secret)
  const complement: number[] = []
  for (let d = 0; d < 10; d++) if (!(mask & (1 << d))) complement.push(d)
  for (let i = complement.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = complement[i]
    complement[i] = complement[j]
    complement[j] = t
  }
  return { digits: complement.slice(0, length), placed: 0, misplaced: 0 }
}

function finalizeRows(rng: () => number, secret: readonly number[], length: number, rows: ClueRow[]): ClueRow[] {
  const zeroIdx = rows.findIndex((r) => r.placed === 0 && r.misplaced === 0)
  if (zeroIdx >= 0) {
    const zero = rows.splice(zeroIdx, 1)[0]
    rows.push(zero)
    return rows
  }
  if (length <= 5 && rows.length < MAX_TOTAL) rows.push(craftZeroRow(rng, secret, length))
  return rows
}

function freshRow(rng: () => number, length: number, secret: readonly number[], secretKey: string, seen: Set<string>, cap: number): number[] | null {
  const cand = seededCode(rng, length, secret, cap)
  const k = cand.join('')
  if (k === secretKey || seen.has(k)) return null
  return cand
}

function pickEliminator(buf: Uint8Array, count: number, length: number, secret: readonly number[], cap: number): number {
  let pick = -1
  if (!cap) {
    for (let r = 0; r < count; r++) {
      let equals = true
      for (let p = 0; p < length; p++) {
        if (buf[r * length + p] !== secret[p]) {
          equals = false
          break
        }
      }
      if (!equals) {
        pick = r
        break
      }
    }
    return pick
  }
  const cand: number[] = new Array(length)
  for (let r = 0; r < count; r++) {
    let equals = true
    for (let p = 0; p < length; p++) {
      cand[p] = buf[r * length + p]
      if (cand[p] !== secret[p]) equals = false
    }
    if (equals) continue
    if (sharedCount(cand, secret) <= cap) return r
  }
  return -1
}

function generateRows(
  rng: () => number,
  secret: readonly number[],
  buf: Uint8Array,
  count: number,
  length: number,
  cap: number,
): { rows: ClueRow[]; count: number } {
  const rows: ClueRow[] = []
  const seen = new Set<string>()
  const secretKey = secret.join('')
  const budget = rowBudget(length, cap)
  let misses = 0
  while (count > 1 && rows.length < budget && misses < 60) {
    let digits: number[] | null = null
    if (rows.length > 0 && count <= GREEDY_MAX) {
      let bestScore = Infinity
      for (let s = 0; s < SAMPLES; s++) {
        let cand: number[] | null = null
        if (!cap && s < 3 && count > 2) {
          const idx = s === 0 ? 0 : s === 1 ? count >> 1 : count - 1
          const survivor: number[] = new Array(length)
          for (let p = 0; p < length; p++) survivor[p] = buf[idx * length + p]
          const k = survivor.join('')
          if (k !== secretKey && !seen.has(k)) cand = survivor
        }
        if (!cand) cand = freshRow(rng, length, secret, secretKey, seen, cap)
        if (!cand) {
          misses++
          continue
        }
        const score = sumSqBuckets(buf, count, length, cand, maskOf(cand))
        if (score < bestScore) {
          bestScore = score
          digits = cand
          if (score <= count) break
        }
      }
    }
    if (!digits) digits = freshRow(rng, length, secret, secretKey, seen, cap)
    if (!digits) {
      misses++
      continue
    }
    seen.add(digits.join(''))
    const packed = packedPair(digits, secret)
    const row: ClueRow = { digits, placed: placedOf(packed), misplaced: misplacedOf(packed) }
    rows.push(row)
    count = filterRows(buf, count, length, [rowSpec(row)])
  }
  while (count > 1 && rows.length < MAX_ROWS) {
    const pick = pickEliminator(buf, count, length, secret, cap)
    let digits: number[] | null = null
    if (pick >= 0) {
      digits = new Array(length)
      for (let p = 0; p < length; p++) digits[p] = buf[pick * length + p]
    } else if (cap) {
      digits = freshRow(rng, length, secret, secretKey, seen, cap)
    }
    if (!digits) break
    const packed = packedPair(digits, secret)
    const row: ClueRow = { digits, placed: placedOf(packed), misplaced: misplacedOf(packed) }
    rows.push(row)
    count = filterRows(buf, count, length, [rowSpec(row)])
  }
  return { rows, count }
}

export function generatePuzzle(seed: string, length: number, extra = 0, cap = 0): Puzzle {
  const key = `${seed}|${length}|x${extra}|c${cap}`
  const hit = cache.get(key)
  if (hit) return hit
  const stored = loadPuzzle(key)
  if (stored && stored.length === length && stored.secret.length === length && stored.rows.length > 0) {
    cache.set(key, stored)
    return stored
  }
  const effectiveCap = cap > 0 ? Math.max(minShared(length), Math.min(cap, length - 1)) : 0
  let last: Puzzle | null = null
  for (let salt = 0; salt < 16; salt++) {
    const rng = rngFromSeed(`${seed}::${length}::${salt}`)
    const secret = seededCode(rng, length, [], 0)
    const buf = freshUniverse(length)
    const { rows, count } = generateRows(rng, secret, buf, universeSize(length), length, effectiveCap)
    last = { seed, length, secret, rows }
    if (count === 1) {
      let added = 0
      let misses = 0
      const capped = Math.max(0, Math.min(extra, MAX_TOTAL - rows.length))
      while (added < capped && misses < 40) {
        const cand = freshRow(rng, length, secret, secret.join(''), new Set(rows.map((r) => r.digits.join(''))), effectiveCap)
        if (!cand) {
          misses++
          continue
        }
        const packed = packedPair(cand, secret)
        rows.push({ digits: cand, placed: placedOf(packed), misplaced: misplacedOf(packed) })
        added++
      }
      last.rows = finalizeRows(rng, secret, length, rows)
      cache.set(key, last)
      savePuzzle(key, last)
      return last
    }
  }
  const fallback = last as Puzzle
  cache.set(key, fallback)
  savePuzzle(key, fallback)
  return fallback
}

export function dailySeed(now = new Date()): string {
  const y = now.getFullYear()
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `daily-${y}-${m}-${day}`
}
