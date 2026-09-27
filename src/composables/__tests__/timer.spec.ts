import { describe, expect, it } from 'vitest'
import { applyCandidate, check, startGame, useGame } from '../../composables/useGame'

const { state } = useGame()

describe('timer', () => {
  it('starts after generation and freezes when solved', async () => {
    startGame('timer-test', 3, 0, 0)
    await new Promise((r) => setTimeout(r, 80))
    expect(state.startedAt).toBeGreaterThan(0)
    await new Promise((r) => setTimeout(r, 1100))
    expect(state.elapsedMs).toBeGreaterThanOrEqual(500)
    applyCandidate(state.puzzle!.secret)
    check()
    expect(state.status).toBe('solved')
    const frozen = state.elapsedMs
    await new Promise((r) => setTimeout(r, 700))
    expect(state.elapsedMs).toBe(frozen)
  })
})
