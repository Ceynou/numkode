<template>
  <section v-if="ui.aidsOpen" ref="rootEl" class="clues-panel" aria-label="Deduction aids">
    <header class="clues-head">
      <h3>Deduction aids</h3>
      <button class="chip static clear-btn" @click="clearMarks()">Clear marks</button>
    </header>

    <p v-if="ui.showCount" class="remaining">
      Codes fitting your marks: <strong>{{ aidsData?.count ?? '…' }}</strong>
      <span v-if="aidsData && aidsData.count === 0">(no code fits — check your marks)</span>
      <span v-else-if="aidsData && aidsData.count === 1">(your marks pin the code!)</span>
    </p>

    <div class="mark-options">
      <label class="mini-switch">
        <input v-model="ui.autoMark" type="checkbox" />
        <span>marks apply to the digit on every row</span>
      </label>
      <label class="mini-switch">
        <input v-model="ui.autoUnmark" type="checkbox" />
        <span>clearing clears the digit everywhere</span>
      </label>
    </div>

    <div class="elim-wrap">
      <div class="elim-grid" role="grid" aria-label="Elimination grid: rows are digits 0 to 9, columns are code positions. Select a cell and press Enter to cycle its mark.">
        <div role="row" class="elim-head">
          <span class="elim-corner"></span>
          <span v-for="p in state.length" :key="p" role="columnheader" class="elim-pos">{{ p }}</span>
        </div>
        <div v-for="d in 10" :key="d - 1" role="row" class="elim-row">
          <span role="rowheader" class="elim-digit">{{ d - 1 }}</span>
          <button
            v-for="p in state.length"
            :key="p"
            :ref="el => setCell(el, d - 1, p - 1)"
            role="gridcell"
            class="elim-cell"
            :class="`m-${state.marks[d - 1][p - 1]}`"
            :data-cell="`${d - 1}:${p - 1}`"
            :tabindex="focusKey === `${d - 1}:${p - 1}` ? 0 : -1"
            :aria-label="`Digit ${d - 1}, position ${p}: ${markLabel(state.marks[d - 1][p - 1])}`"
            @focus="focusKey = `${d - 1}:${p - 1}`"
            @keydown.arrow-up.stop.prevent="moveFocus(d - 2, p - 1)"
            @keydown.arrow-down.stop.prevent="moveFocus(d, p - 1)"
            @keydown.arrow-left.stop.prevent="moveFocus(d - 1, p - 2)"
            @keydown.arrow-right.stop.prevent="moveFocus(d - 1, p)"
            @click="cycleMark(d - 1, p - 1)"
            @contextmenu.prevent="clearMark(d - 1, p - 1)"
          >
            <span v-if="state.marks[d - 1][p - 1] === 1">✕</span>
            <span v-else-if="state.marks[d - 1][p - 1] === 2">~</span>
            <span v-else-if="state.marks[d - 1][p - 1] === 3">✓</span>
          </button>
        </div>
      </div>
    </div>
    <p class="clues-note">
      Click a digit on the rows above (or a cell here) to cycle: blank → <strong class="mk-1">✕ not the right number</strong> →
      <strong class="mk-2">~ in the code</strong> → <strong class="mk-3">✓ right position</strong>.
      With the toggles above, every state applies to the digit on all rows — ✓ pins one position and marks its other spots ~.
      Right-click always clears a single cell. Notes are never checked against the solution.
    </p>
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { clearMark, clearMarks, cycleMark, useGame } from '../composables/useGame'

const { state, ui, aidsData } = useGame()

const rootEl = ref<HTMLElement | null>(null)
const focusKey = ref('0:0')
const cellEls = new Map<string, HTMLElement>()

function setCell(el: unknown, d: number, p: number): void {
  if (el instanceof HTMLElement) cellEls.set(`${d}:${p}`, el)
  else cellEls.delete(`${d}:${p}`)
}

function moveFocus(d: number, p: number): void {
  const nd = Math.max(0, Math.min(9, d))
  const np = Math.max(0, Math.min(state.length - 1, p))
  focusKey.value = `${nd}:${np}`
  void nextTick(() => cellEls.get(`${nd}:${np}`)?.focus())
}

function markLabel(m: number): string {
  if (m === 1) return 'marked not the right number'
  if (m === 2) return 'marked wrong position'
  if (m === 3) return 'marked right position'
  return 'unmarked'
}
</script>
