import { describe, expect, it } from 'vitest'
import { fittingCodes } from '../engine'

function blankMarks(length: number): number[][] {
  return Array.from({ length: 10 }, () => new Array(length).fill(0))
}

describe('fittingCodes', () => {
  it('returns the full universe for blank marks', () => {
    expect(fittingCodes(3, blankMarks(3)).count).toBe(720)
  })

  it('pins positions for right-position marks', () => {
    const marks = blankMarks(3)
    marks[4][0] = 3
    const r = fittingCodes(3, marks)
    expect(r.count).toBe(72)
    expect(r.consensus[0]).toBe(4)
    expect(r.consensus[1]).toBeNull()
  })

  it('excludes digits for not-the-right-number marks', () => {
    const marks = blankMarks(3)
    marks[4][0] = 1
    const r = fittingCodes(3, marks)
    expect(r.count).toBe(720 - 72)
    expect(r.consensus[0]).toBeNull()
  })

  it('treats wrong-position marks as digit-present-anywhere', () => {
    const marks = blankMarks(3)
    marks[4][0] = 2
    const r = fittingCodes(3, marks)
    expect(r.count).toBe(720 - 9 * 8 * 7)
  })

  it('reports contradictions as zero', () => {
    const marks = blankMarks(3)
    marks[4][0] = 3
    marks[7][0] = 3
    expect(fittingCodes(3, marks).count).toBe(0)
  })

  it('derives the full code when all positions are marked', () => {
    const marks = blankMarks(4)
    const code = [3, 7, 1, 9]
    code.forEach((d, p) => {
      marks[d][p] = 3
    })
    const r = fittingCodes(4, marks)
    expect(r.count).toBe(1)
    expect(r.consensus).toEqual(code)
  })
})
