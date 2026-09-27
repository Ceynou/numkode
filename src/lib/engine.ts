import { rowSpec, type ClueRow } from './feedback'

export interface Survivors {
  buf: Uint8Array
  count: number
}

const permCounts = new Map<number, number>()

export function universeSize(length: number): number {
  const hit = permCounts.get(length)
  if (hit !== undefined) return hit
  let n = 1
  for (let i = 0; i < length; i++) n *= 10 - i
  permCounts.set(length, n)
  return n
}

const universes = new Map<number, Uint8Array>()

export function enumerateUniverse(length: number): Uint8Array {
  const hit = universes.get(length)
  if (hit) return hit
  const total = universeSize(length)
  const buf = new Uint8Array(total * length)
  const code = new Uint8Array(length)
  const used = new Uint8Array(10)
  let w = 0
  const rec = (i: number) => {
    if (i === length) {
      for (let p = 0; p < length; p++) buf[w + p] = code[p]
      w += length
      return
    }
    for (let d = 0; d < 10; d++) {
      if (used[d]) continue
      used[d] = 1
      code[i] = d
      rec(i + 1)
      used[d] = 0
    }
  }
  rec(0)
  universes.set(length, buf)
  return buf
}

export function freshUniverse(length: number): Uint8Array {
  return enumerateUniverse(length).slice()
}

export interface RowSpec {
  digits: number[]
  mask: number
  packed: number
}

export function specsOf(rows: readonly ClueRow[]): RowSpec[] {
  return rows.map(rowSpec)
}

export function filterRows(buf: Uint8Array, count: number, length: number, specs: readonly RowSpec[]): number {
  let write = 0
  for (let r = 0; r < count; r++) {
    const off = r * length
    let ok = true
    for (let k = 0; k < specs.length; k++) {
      const s = specs[k]
      let placed = 0
      let shared = 0
      for (let p = 0; p < length; p++) {
        const d = buf[off + p]
        if (s.mask & (1 << d)) shared++
        if (d === s.digits[p]) placed++
      }
      if (((placed << 4) | (shared - placed)) !== s.packed) {
        ok = false
        break
      }
    }
    if (ok) {
      if (write !== r) {
        for (let p = 0; p < length; p++) buf[write * length + p] = buf[off + p]
      }
      write++
    }
  }
  return write
}

export function survivorsOf(length: number, rows: readonly ClueRow[]): Survivors {
  const buf = freshUniverse(length)
  const count = filterRows(buf, universeSize(length), length, specsOf(rows))
  return { buf, count }
}

const survivorCache = new Map<string, Survivors>()

export function cachedSurvivors(key: string, length: number, rows: readonly ClueRow[]): Survivors {
  const hit = survivorCache.get(key)
  if (hit) return hit
  if (survivorCache.size > 4) survivorCache.clear()
  const s = survivorsOf(length, rows)
  survivorCache.set(key, s)
  return s
}

export function consensusOf(s: Survivors, length: number): (number | null)[] {
  const out: (number | null)[] = new Array(length).fill(null)
  if (s.count === 0) return out
  const first = new Array<number>(length).fill(-1)
  for (let r = 0; r < s.count; r++) {
    for (let p = 0; p < length; p++) {
      const d = s.buf[r * length + p]
      if (r === 0) first[p] = d
      else if (d !== first[p]) first[p] = -1
    }
  }
  for (let p = 0; p < length; p++) out[p] = first[p] >= 0 ? first[p] : null
  return out
}

export function codeAt(s: Survivors, index: number, length: number): number[] {
  const out: number[] = new Array(length)
  for (let p = 0; p < length; p++) out[p] = s.buf[index * length + p]
  return out
}

export interface FittingResult {
  count: number
  consensus: (number | null)[]
}

const fittingCache = new Map<string, FittingResult>()

export function fittingCodes(length: number, marks: readonly number[][]): FittingResult {
  const key = `${length}:${marks.map((r) => r.join('')).join('.')}`
  const hit = fittingCache.get(key)
  if (hit) return hit
  if (fittingCache.size > 8) fittingCache.clear()
  const required: (number | null)[] = new Array(length).fill(null)
  const excluded: boolean[][] = Array.from({ length: 10 }, () => new Array<boolean>(length).fill(false))
  let mustContain = 0
  let contradiction = false
  for (let d = 0; d < 10; d++) {
    for (let p = 0; p < length; p++) {
      const m = marks[d][p]
      if (m === 1) excluded[d][p] = true
      else if (m === 3) {
        if (required[p] !== null && required[p] !== d) contradiction = true
        else required[p] = d
      }
      if (m === 2) mustContain |= 1 << d
    }
  }
  const result: FittingResult = contradiction
    ? { count: 0, consensus: new Array(length).fill(null) }
    : scanFitting(length, required, excluded, mustContain)
  fittingCache.set(key, result)
  return result
}

function scanFitting(length: number, required: (number | null)[], excluded: boolean[][], mustContain: number): FittingResult {
  const buf = enumerateUniverse(length)
  const total = universeSize(length)
  const counts = Array.from({ length: 10 }, () => new Array<number>(length).fill(0))
  let n = 0
  for (let r = 0; r < total; r++) {
    const off = r * length
    let ok = true
    let present = 0
    for (let p = 0; p < length; p++) {
      const d = buf[off + p]
      if (excluded[d][p] || (required[p] !== null && required[p] !== d)) {
        ok = false
        break
      }
      present |= 1 << d
    }
    if (!ok || (mustContain & ~present) !== 0) continue
    n++
    for (let p = 0; p < length; p++) counts[buf[off + p]][p]++
  }
  const consensus: (number | null)[] = new Array(length).fill(null)
  if (n > 0) {
    for (let p = 0; p < length; p++) {
      for (let d = 0; d < 10; d++) {
        if (counts[d][p] === n) {
          consensus[p] = d
          break
        }
      }
    }
  }
  return { count: n, consensus }
}
