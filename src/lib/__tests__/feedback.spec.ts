import { describe, expect, it } from 'vitest'
import { misplacedOf, packedPair, placedOf, rowSpec } from '../feedback'

describe('packedPair', () => {
  it('identical codes are all placed', () => {
    const p = packedPair([1, 2, 3], [1, 2, 3])
    expect(placedOf(p)).toBe(3)
    expect(misplacedOf(p)).toBe(0)
  })

  it('disjoint codes are all absent', () => {
    const p = packedPair([1, 2, 3], [4, 5, 6])
    expect(placedOf(p)).toBe(0)
    expect(misplacedOf(p)).toBe(0)
  })

  it('full permutation is all misplaced', () => {
    const p = packedPair([1, 2, 3], [3, 1, 2])
    expect(placedOf(p)).toBe(0)
    expect(misplacedOf(p)).toBe(3)
  })

  it('mixed case', () => {
    const p = packedPair([4, 7, 2, 9], [4, 2, 7, 1])
    expect(placedOf(p)).toBe(1)
    expect(misplacedOf(p)).toBe(2)
  })

  it('shared digits count once, placed digits do not double count', () => {
    const p = packedPair([5, 1, 2], [5, 7, 1])
    expect(placedOf(p)).toBe(1)
    expect(misplacedOf(p)).toBe(1)
  })

  it('rowSpec packs placed and misplaced', () => {
    const s = rowSpec({ digits: [1, 2, 3, 4], placed: 2, misplaced: 1 })
    expect(s.packed).toBe((2 << 4) | 1)
    expect(s.mask).toBe(0b11110)
    expect(s.digits).toEqual([1, 2, 3, 4])
  })
})
