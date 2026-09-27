import { describe, expect, it } from 'vitest'
import { DEFAULT_STRENGTH, fromHash, normalizeStrength, toHash } from '../url'

describe('url', () => {
  it('round-trips seed, length, extra and strength', () => {
    const hash = toHash('daily-2026-09-27', 7, 2, 3)
    const ref = fromHash(hash, 'fallback', 5)
    expect(ref.seed).toBe('daily-2026-09-27')
    expect(ref.length).toBe(7)
    expect(ref.extra).toBe(2)
    expect(ref.strength).toBe(3)
  })

  it('defaults to strength 2 and extra 1 when params are absent', () => {
    const ref = fromHash('#seed=abc&len=4', 'fallback', 5)
    expect(ref.strength).toBeNull()
    expect(ref.extra).toBeNull()
    expect(DEFAULT_STRENGTH).toBe(2)
  })

  it('clamps junk strength values', () => {
    expect(normalizeStrength('9')).toBe(0)
    expect(normalizeStrength('-1')).toBe(0)
    expect(normalizeStrength('abc')).toBe(0)
    expect(normalizeStrength('3')).toBe(3)
  })

  it('decodes encoded seeds', () => {
    const ref = fromHash(toHash('my seed & more', 4, 0, 0), 'fallback', 5)
    expect(ref.seed).toBe('my seed & more')
  })
})
