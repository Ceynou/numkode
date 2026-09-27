import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import SettingsModal from '../SettingsModal.vue'
import { startGame, useGame } from '../../composables/useGame'

const { state } = useGame()

async function clickStepFieldButton(index: number, which: 0 | 1): Promise<void> {
  const fields = document.body.querySelectorAll('.step-field')
  const buttons = fields[index].querySelectorAll('.step-btn')
  ;(buttons[which] as HTMLElement).click()
  await nextTick()
  await new Promise((r) => setTimeout(r, 5))
}

describe('SettingsModal steppers', () => {
  it('applies clue rows and clue strength instantly with steppers, clamping by length', async () => {
    startGame('step-test', 5, 1, 2)
    await new Promise((r) => setTimeout(r, 60))
    expect(state.length).toBe(5)
    expect(state.extra).toBe(1)
    expect(state.strength).toBe(2)

    const wrapper = mount(SettingsModal, {
      props: { open: true },
      attachTo: document.body,
    })
    await nextTick()

    expect(document.querySelectorAll('.step-field').length).toBe(2)
    expect(document.querySelectorAll('.step-value')[1].textContent).toBe('2')

    await clickStepFieldButton(1, 1)
    expect(state.strength).toBe(3)
    expect(document.querySelectorAll('.step-value')[1].textContent).toBe('3')

    await clickStepFieldButton(1, 0)
    expect(state.strength).toBe(2)

    await clickStepFieldButton(0, 1)
    expect(state.extra).toBe(2)
    await clickStepFieldButton(0, 0)
    await clickStepFieldButton(0, 0)
    expect(state.extra).toBe(0)
    expect(document.querySelectorAll('.step-value')[0].textContent).toBe('Tight')

    const lengthButtons = document.querySelectorAll('.seg.lengths button')
    ;(lengthButtons[7] as HTMLElement).click()
    await nextTick()
    await new Promise((r) => setTimeout(r, 5))
    expect(state.length).toBe(9)
    expect(state.strength).toBe(1)

    wrapper.unmount()
  })
})
