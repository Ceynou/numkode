import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import Board from '../Board.vue'
import ElimGrid from '../ElimGrid.vue'
import { startGame, useGame } from '../../composables/useGame'

const { state, ui } = useGame()

beforeEach(async () => {
  ui.autoMark = true
  ui.autoUnmark = true
  startGame('mark-test', 3, 0, 0)
  await new Promise((r) => setTimeout(r, 80))
  ui.aidsOpen = true
})

describe('ElimGrid marking', () => {
  it('cycles cell marks on click: blank → ✕ → ~ → ✓ → blank', async () => {
    const wrapper = mount(ElimGrid)
    const cell = wrapper.findAll('.elim-cell')[0]
    expect(cell.classes()).toContain('m-0')
    await cell.trigger('click')
    await nextTick()
    expect(cell.classes()).toContain('m-1')
    expect(cell.text()).toContain('✕')
    await cell.trigger('click')
    await nextTick()
    expect(cell.classes()).toContain('m-2')
    expect(cell.text()).toContain('~')
    await cell.trigger('click')
    await nextTick()
    expect(cell.classes()).toContain('m-3')
    expect(cell.text()).toContain('✓')
    await cell.trigger('click')
    await nextTick()
    expect(cell.classes()).toContain('m-0')
    expect(cell.text()).toBe('')
  })

  it('spreads ✕ across the whole digit row when auto-mark is on', async () => {
    const wrapper = mount(ElimGrid)
    const cells = wrapper.findAll('.elim-cell')
    await cells[0].trigger('click')
    expect(state.marks[0]).toEqual([1, 1, 1])
  })

  it('keeps ✕ local when auto-mark is off', async () => {
    ui.autoMark = false
    const wrapper = mount(ElimGrid)
    const cells = wrapper.findAll('.elim-cell')
    await cells[0].trigger('click')
    expect(state.marks[0]).toEqual([1, 0, 0])
  })

  it('clears the whole digit row on wrap-to-blank when auto-unmark is on', async () => {
    state.marks[4] = [3, 2, 1]
    const wrapper = mount(ElimGrid)
    const cells = wrapper.findAll('.elim-cell')
    await cells[4 * state.length + 0].trigger('click')
    expect(state.marks[4]).toEqual([0, 0, 0])
  })

  it('keeps other positions when auto-unmark is off', async () => {
    ui.autoUnmark = false
    state.marks[4] = [3, 2, 1]
    const wrapper = mount(ElimGrid)
    const cells = wrapper.findAll('.elim-cell')
    await cells[4 * state.length + 0].trigger('click')
    expect(state.marks[4]).toEqual([0, 2, 1])
  })

  it('spreads ~ digit-wide and pins ✓ with ~ elsewhere', async () => {
    const wrapper = mount(ElimGrid)
    const cells = wrapper.findAll('.elim-cell')
    await cells[0].trigger('click')
    expect(state.marks[0]).toEqual([1, 1, 1])
    await cells[0].trigger('click')
    expect(state.marks[0]).toEqual([2, 2, 2])
    await cells[0].trigger('click')
    expect(state.marks[0]).toEqual([3, 2, 2])
  })

  it('re-aims ✓ when marking ~ on another occurrence of the digit', async () => {
    state.marks[0] = [3, 2, 2]
    const wrapper = mount(ElimGrid)
    const cells = wrapper.findAll('.elim-cell')
    await cells[1].trigger('click')
    expect(state.marks[0]).toEqual([2, 3, 2])
  })

  it('right-click clears a single cell without spreading', async () => {
    state.marks[0] = [1, 1, 1]
    const wrapper = mount(ElimGrid)
    const cells = wrapper.findAll('.elim-cell')
    await cells[1].trigger('contextmenu')
    expect(state.marks[0]).toEqual([1, 0, 1])
  })

  it('updates shared mark state', async () => {
    const wrapper = mount(ElimGrid)
    const cell = wrapper.findAll('.elim-cell')[0]
    await cell.trigger('click')
    expect(state.marks[0][0]).toBe(1)
  })
})

describe('Clue row digit marking', () => {
  it('clicking a digit on the board cycles its mark', async () => {
    const wrapper = mount(Board)
    const slot = wrapper.find('.row-card.clue .slot.clue-digit')
    const digit = state.puzzle!.rows[0].digits[0]
    expect(slot.classes()).toContain('mk-0')
    await slot.trigger('click')
    await nextTick()
    expect(state.marks[digit][0]).toBe(1)
    expect(slot.classes()).toContain('mk-1')
    expect(slot.find('.mark-badge').text()).toBe('✕')
    await slot.trigger('click')
    await nextTick()
    expect(state.marks[digit][0]).toBe(2)
    expect(slot.classes()).toContain('mk-2')
    await slot.trigger('click')
    await nextTick()
    expect(state.marks[digit][0]).toBe(3)
    expect(slot.classes()).toContain('mk-3')
  })

  it('strikes the same digit on every row occurrence with auto-mark on', async () => {
    const wrapper = mount(Board)
    const digit = state.puzzle!.rows[0].digits[0]
    await wrapper.find('.row-card.clue .slot.clue-digit').trigger('click')
    expect(state.marks[digit].every((m) => m === 1)).toBe(true)
    for (let r = 0; r < state.puzzle!.rows.length; r++) {
      for (let p = 0; p < state.length; p++) {
        if (state.puzzle!.rows[r].digits[p] === digit) {
          expect(wrapper.findAll('.row-card.clue')[r].findAll('.slot.clue-digit')[p].classes()).toContain('mk-1')
        }
      }
    }
  })

  it('reflects the ~ mark on other rows when clicking twice', async () => {
    const wrapper = mount(Board)
    const rows = wrapper.findAll('.row-card.clue')
    const slot = rows[0].findAll('.slot.clue-digit')[0]
    const digit = state.puzzle!.rows[0].digits[0]
    await slot.trigger('click')
    await slot.trigger('click')
    expect(state.marks[digit].every((m) => m === 2)).toBe(true)
    for (let r = 0; r < state.puzzle!.rows.length; r++) {
      for (let p = 0; p < state.length; p++) {
        if (state.puzzle!.rows[r].digits[p] === digit) {
          expect(rows[r].findAll('.slot.clue-digit')[p].classes()).toContain('mk-2')
        }
      }
    }
  })

  it('pins ✓ on the clicked spot and marks other occurrences of the digit ~', async () => {
    const wrapper = mount(Board)
    const rows = wrapper.findAll('.row-card.clue')
    const slot = rows[0].findAll('.slot.clue-digit')[0]
    const digit = state.puzzle!.rows[0].digits[0]
    await slot.trigger('click')
    await slot.trigger('click')
    await slot.trigger('click')
    expect(state.marks[digit][0]).toBe(3)
    expect(state.marks[digit].slice(1).every((m) => m === 2)).toBe(true)
    expect(slot.classes()).toContain('mk-3')
  })

  it('right-click on a row digit clears just that cell', async () => {
    const wrapper = mount(Board)
    const digit = state.puzzle!.rows[0].digits[0]
    await wrapper.find('.row-card.clue .slot.clue-digit').trigger('click')
    await wrapper.find('.row-card.clue .slot.clue-digit').trigger('contextmenu')
    expect(state.marks[digit][0]).toBe(0)
    expect(state.marks[digit].slice(1).every((m) => m === 1)).toBe(true)
  })
})
