<template>
  <div class="row-card clue" role="listitem" :aria-label="rowLabel">
    <span class="row-index" aria-hidden="true">{{ index + 1 }}</span>
    <div class="slots" aria-hidden="true">
      <button
        v-for="(d, p) in row.digits"
        :key="p"
        class="slot clue-digit"
        :class="`mk-${state.marks[d][p]}`"
        tabindex="-1"
        :title="`Cycle mark for ${d}: ✕ not the right number → ~ in the code → ✓ right position (others become ~). Right-click clears.`"
        @click="cycleMark(d, p)"
        @contextmenu.prevent="clearMark(d, p)"
      >
        <span class="digit">{{ d }}</span>
        <span v-if="state.marks[d][p] > 0" class="mark-badge" :class="`mk-${state.marks[d][p]}`">{{ badge(state.marks[d][p]) }}</span>
      </button>
    </div>
    <div class="pair" aria-hidden="true">
      <span class="pair-item placed"><span class="dot exact"></span><strong>{{ row.placed }}</strong></span>
      <span class="pair-item misplaced"><span class="dot elsewhere"></span><strong>{{ row.misplaced }}</strong></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ClueRow } from '../lib/feedback'
import { cycleMark, clearMark, useGame } from '../composables/useGame'

const props = defineProps<{ row: ClueRow; index: number }>()

const { state } = useGame()

const rowLabel = computed(
  () =>
    `Row ${props.index + 1}: ${props.row.digits.join(' ')}. ${props.row.placed} correct and well placed, ${props.row.misplaced} correct but wrong position.`,
)

function badge(m: number): string {
  if (m === 1) return '✕'
  if (m === 2) return '~'
  return '✓'
}
</script>
