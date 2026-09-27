import { describe, expect, it } from 'vitest'
import { buildShare, formatTime } from '../share'

describe('formatTime', () => {
  it('formats zero and short durations', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(4999)).toBe('0:04')
    expect(formatTime(65000)).toBe('1:05')
    expect(formatTime(3615000)).toBe('60:15')
  })
})

describe('buildShare', () => {
  it('includes time and clue cap when present', () => {
    const text = buildShare(5, 7, 'abc', 'solved', 1, 0, 'http://x/#game', 3, 95000)
    expect(text).toContain('5-digit')
    expect(text).toContain('7 clue rows')
    expect(text).toContain('clues ≤3')
    expect(text).toContain('1 wrong check')
    expect(text).toContain('1:35')
    expect(text).toContain('Seed: abc')
  })

  it('omits time and cap when absent', () => {
    const text = buildShare(4, 5, 'abc', 'revealed', 0, 1, 'http://x/')
    expect(text).not.toContain('clues ≤')
    expect(text).not.toContain('· 0:')
    expect(text).toContain('1 hint')
  })
})
