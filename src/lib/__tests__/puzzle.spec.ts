import { describe, expect, it } from 'vitest'
import { misplacedOf, packedPair, placedOf, type ClueRow } from '../feedback'
import { survivorsOf } from '../engine'
import { dailySeed, generatePuzzle, maxStrength } from '../puzzle'

function checkRow(secret: number[], row: ClueRow): void {
  const p = packedPair(row.digits, secret)
  expect(placedOf(p)).toBe(row.placed)
  expect(misplacedOf(p)).toBe(row.misplaced)
}

function expectValidPuzzle(seed: string, length: number): void {
  const puzzle = generatePuzzle(seed, length)
  expect(puzzle.secret.length).toBe(length)
  expect(new Set(puzzle.secret).size).toBe(length)
  expect(puzzle.rows.length).toBeGreaterThanOrEqual(3)
  expect(puzzle.rows.length).toBeLessThanOrEqual(16)
  const seen = new Set<string>()
  for (const row of puzzle.rows) {
    expect(row.digits.length).toBe(length)
    expect(new Set(row.digits).size).toBe(length)
    expect(row.digits.join('')).not.toBe(puzzle.secret.join(''))
    expect(seen.has(row.digits.join(''))).toBe(false)
    seen.add(row.digits.join(''))
    expect(row.placed + row.misplaced).toBeLessThanOrEqual(length)
    checkRow(puzzle.secret, row)
  }
  const survivors = survivorsOf(length, puzzle.rows)
  expect(survivors.count).toBe(1)
  const only = [...survivors.buf.slice(0, length)]
  expect(only).toEqual(puzzle.secret)
  if (length <= 5) {
    const last = puzzle.rows[puzzle.rows.length - 1]
    expect(last.placed).toBe(0)
    expect(last.misplaced).toBe(0)
  } else {
    for (const row of puzzle.rows) {
      expect(row.placed + row.misplaced).toBeGreaterThan(0)
    }
  }
}

describe('generatePuzzle', () => {
  it('is deterministic per seed and length', () => {
    const a = generatePuzzle('alpha', 4)
    const b = generatePuzzle('alpha', 4)
    expect(a.secret).toEqual(b.secret)
    expect(a.rows).toEqual(b.rows)
  })

  it('varies across seeds', () => {
    const secrets = new Set<string>()
    for (let i = 0; i < 10; i++) secrets.add(generatePuzzle(`seed-${i}`, 3).secret.join(''))
    expect(secrets.size).toBeGreaterThan(1)
  })

  const samples: Array<[number, number, number]> = [
    [2, 25, 5000],
    [3, 20, 5000],
    [4, 12, 10000],
    [5, 8, 15000],
    [6, 5, 30000],
    [7, 3, 60000],
    [8, 2, 120000],
    [9, 1, 300000],
    [10, 1, 300000],
  ]

  for (const [length, n, timeout] of samples) {
    it(
      `produces uniquely solvable puzzles for ${length} digits`,
      () => {
        for (let i = 0; i < n; i++) expectValidPuzzle(`spec-${length}-${i}`, length)
      },
      timeout,
    )
  }

  it('grows row count with code length on average', () => {
    const avg = (length: number, seeds: string[]): number =>
      seeds.reduce((acc, s) => acc + generatePuzzle(s, length).rows.length, 0) / seeds.length
    const short = avg(2, ['g1', 'g2', 'g3', 'g4', 'g5'])
    const long = avg(9, ['g1', 'g2', 'g3', 'g4', 'g5'])
    expect(long).toBeGreaterThanOrEqual(short)
  })

  it('derives a daily seed from the date', () => {
    expect(dailySeed(new Date(2026, 8, 25))).toBe('daily-2026-09-25')
  })

  it('adds exactly the requested extra clue rows without changing the code', () => {
    const tight = generatePuzzle('extra-check', 4, 0)
    const wide = generatePuzzle('extra-check', 4, 2)
    expect(wide.secret).toEqual(tight.secret)
    expect(wide.rows.length).toBe(tight.rows.length + 2)
    const survivors = survivorsOf(4, wide.rows)
    expect(survivors.count).toBe(1)
    expect([...survivors.buf.slice(0, 4)]).toEqual(wide.secret)
    const last = wide.rows[wide.rows.length - 1]
    expect(last.placed).toBe(0)
    expect(last.misplaced).toBe(0)
  })

  it('is deterministic with extras', () => {
    const a = generatePuzzle('extra-det', 5, 3)
    const b = generatePuzzle('extra-det', 5, 3)
    expect(a.rows).toEqual(b.rows)
  })

  it('respects the clue cap on every row while staying uniquely solvable', () => {
    const cases: Array<[number, number, number]> = [
      [4, 3, 3],
      [4, 2, 4],
      [5, 2, 3],
      [6, 2, 2],
      [3, 1, 3],
    ]
    for (const [length, cap, n] of cases) {
      for (let i = 0; i < n; i++) {
        const puzzle = generatePuzzle(`cap-${length}-${cap}-${i}`, length, 0, cap)
        expect(puzzle.rows.length).toBeGreaterThanOrEqual(3)
        for (const row of puzzle.rows) {
          expect(row.placed + row.misplaced).toBeLessThanOrEqual(cap)
          checkRow(puzzle.secret, row)
        }
        const survivors = survivorsOf(length, puzzle.rows)
        expect(survivors.count).toBe(1)
        expect([...survivors.buf.slice(0, length)]).toEqual(puzzle.secret)
      }
    }
  })

  it('is deterministic per cap', () => {
    const a = generatePuzzle('cap-det', 4, 0, 2)
    const b = generatePuzzle('cap-det', 4, 0, 2)
    expect(a.rows).toEqual(b.rows)
  })

  it('offers sane max strength per length', () => {
    expect(maxStrength(2)).toBe(1)
    expect(maxStrength(3)).toBe(2)
    expect(maxStrength(4)).toBe(3)
    expect(maxStrength(5)).toBe(4)
    expect(maxStrength(6)).toBe(4)
    expect(maxStrength(7)).toBe(3)
    expect(maxStrength(8)).toBe(2)
    expect(maxStrength(9)).toBe(1)
    expect(maxStrength(10)).toBe(0)
  })
})
