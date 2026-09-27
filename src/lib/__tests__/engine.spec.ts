import { describe, expect, it } from 'vitest'
import { misplacedOf, packedPair, placedOf } from '../feedback'
import { codeAt, consensusOf, enumerateUniverse, filterRows, specsOf, survivorsOf, universeSize } from '../engine'
import type { ClueRow } from '../feedback'

describe('universeSize', () => {
  it('counts k-permutations of 10 digits', () => {
    expect(universeSize(2)).toBe(90)
    expect(universeSize(3)).toBe(720)
    expect(universeSize(4)).toBe(5040)
    expect(universeSize(5)).toBe(30240)
    expect(universeSize(6)).toBe(151200)
    expect(universeSize(10)).toBe(3628800)
  })
})

describe('enumerateUniverse', () => {
  it('enumerates lexicographic range', () => {
    const buf = enumerateUniverse(3)
    expect(buf.length).toBe(720 * 3)
    expect([...buf.slice(0, 3)]).toEqual([0, 1, 2])
    expect([...buf.slice(719 * 3)]).toEqual([9, 8, 7])
  })

  it('contains only distinct-digit codes', () => {
    const buf = enumerateUniverse(4)
    for (let r = 0; r < 130; r++) {
      const code = [...buf.slice(r * 37 * 4, r * 37 * 4 + 4)]
      expect(new Set(code).size).toBe(4)
    }
  })
})

describe('filterRows', () => {
  it('keeps exactly the codes matching every row pair', () => {
    const rows: ClueRow[] = [
      { digits: [0, 1, 2], placed: 1, misplaced: 0 },
      { digits: [3, 4, 5], placed: 0, misplaced: 1 },
    ]
    const s = survivorsOf(3, rows)
    expect(s.count).toBeGreaterThan(0)
    for (let r = 0; r < s.count; r++) {
      const code = codeAt(s, r, 3)
      for (const row of rows) {
        const p = packedPair(row.digits, code)
        expect(placedOf(p)).toBe(row.placed)
        expect(misplacedOf(p)).toBe(row.misplaced)
      }
    }
  })

  it('always keeps the true secret', () => {
    const secret = [4, 7, 1]
    const rows: ClueRow[] = [
      { digits: [0, 4, 2], ...unpack(packedPair([0, 4, 2], secret)) },
      { digits: [7, 0, 3], ...unpack(packedPair([7, 0, 3], secret)) },
    ]
    const s = survivorsOf(3, rows)
    const codes = Array.from({ length: s.count }, (_, i) => codeAt(s, i, 3).join(''))
    expect(codes).toContain(secret.join(''))
  })
})

function unpack(p: number): { placed: number; misplaced: number } {
  return { placed: placedOf(p), misplaced: misplacedOf(p) }
}

describe('consensusOf', () => {
  it('confirms all positions when a row pins the whole code', () => {
    const s = survivorsOf(3, [{ digits: [0, 1, 2], placed: 3, misplaced: 0 }])
    expect(s.count).toBe(1)
    const c = consensusOf(s, 3)
    expect(c).toEqual([0, 1, 2])
  })

  it('returns null where survivors disagree', () => {
    const s = survivorsOf(3, [])
    const c = consensusOf(s, 3)
    expect(c.every((d) => d === null)).toBe(true)
  })
})

describe('filterRows incremental matches batch', () => {
  it('single-row passes equal one batch pass', () => {
    const row: ClueRow = { digits: [1, 2, 3, 4], placed: 2, misplaced: 1 }
    const a = enumerateUniverse(4).slice()
    const step1 = filterRows(a, universeSize(4), 4, specsOf([row]))
    const b = survivorsOf(4, [row])
    expect(step1).toBe(b.count)
  })
})
