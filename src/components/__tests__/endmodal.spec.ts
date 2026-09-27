import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import EndModal from '../EndModal.vue'
import { startGame, useGame } from '../../composables/useGame'

const { state } = useGame()

beforeEach(async () => {
  startGame('end-test', 3, 0, 0)
  await new Promise((r) => setTimeout(r, 80))
  state.status = 'solved'
  state.elapsedMs = 42000
})

describe('EndModal', () => {
  it('shows the result and the elapsed time', async () => {
    const wrapper = mount(EndModal, { props: { open: true }, attachTo: document.body })
    await nextTick()
    expect(document.body.textContent).toContain('Code cracked!')
    expect(document.body.textContent).toContain('0:42')
    wrapper.unmount()
  })

  it('closes before starting the next game so the answer is not spoiled', async () => {
    const wrapper = mount(EndModal, { props: { open: true }, attachTo: document.body })
    await nextTick()
    const buttons = Array.from(document.body.querySelectorAll('button'))
    const practice = buttons.find((b) => b.textContent?.includes('Practice')) as HTMLElement
    practice.click()
    await nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
    const seedBefore = state.seed
    expect(seedBefore).not.toBe('end-test')
    await new Promise((r) => setTimeout(r, 120))
    expect(state.status).toBe('playing')
    expect(state.startedAt).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('daily button also closes and restarts with the daily seed', async () => {
    const wrapper = mount(EndModal, { props: { open: true }, attachTo: document.body })
    await nextTick()
    const buttons = Array.from(document.body.querySelectorAll('button'))
    const daily = buttons.find((b) => b.textContent?.includes('Daily')) as HTMLElement
    daily.click()
    await nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(state.seed).toMatch(/^daily-/)
    wrapper.unmount()
  })
})
