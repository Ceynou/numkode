<template>
  <div class="board" :class="`len-${state.length}`" role="list" aria-label="Clue rows and your answer">
    <ClueRow v-for="(r, i) in state.puzzle!.rows" :key="i" :row="r" :index="i" />

    <div class="row-card answer" :class="{ shake: shakeOn, solved: state.status === 'solved' }" role="group" aria-label="Your answer">
      <span class="row-index ans" aria-hidden="true">YOU</span>
      <div class="slots">
        <div
          v-for="(d, p) in state.answer"
          :key="p"
          class="slot"
          :class="{ cursor: p === state.cursor && state.status === 'playing', locked: isLocked(p), note: notes[p] !== null && d === null }"
          role="button"
          :tabindex="-1"
          :aria-label="slotLabel(p, d)"
          @click="setCursor(p)"
        >
          <span v-if="d !== null" class="digit" :class="{ 'locked-digit': isLocked(p) }">{{ d }}</span>
          <span v-else-if="notes[p] !== null" class="digit ghost">{{ notes[p] }}</span>
        </div>
      </div>
      <div class="pair" aria-hidden="true">
        <span v-if="state.status === 'solved'" class="pair-item placed"><span class="dot exact"></span><strong>✓</strong></span>
        <span v-else-if="state.wrongChecks > 0" class="pair-item missed"><span class="dot none"></span><strong>{{ state.wrongChecks }}</strong></span>
        <span v-else class="pair-item placeholder">?</span>
      </div>
    </div>

    <div v-if="state.status === 'revealed' && state.puzzle" class="row-card reveal" role="group" :aria-label="`The code was ${state.puzzle.secret.join(' ')}`">
      <span class="row-index ans" aria-hidden="true">CODE</span>
      <div class="slots" aria-hidden="true">
        <div v-for="(d, p) in state.puzzle.secret" :key="p" class="slot exact">
          <span class="digit">{{ d }}</span>
        </div>
      </div>
      <div class="pair"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ClueRow from './Row.vue'
import { setCursor, useGame } from '../composables/useGame'

const { state, notes } = useGame()

const shakeOn = ref(false)
let shakeTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => state.shake,
  () => {
    shakeOn.value = false
    if (shakeTimer) clearTimeout(shakeTimer)
    requestAnimationFrame(() => {
      shakeOn.value = true
      shakeTimer = setTimeout(() => {
        shakeOn.value = false
      }, 360)
    })
  },
)

function isLocked(p: number): boolean {
  return state.hints[p] !== undefined
}

function slotLabel(p: number, d: number | null): string {
  const note = notes.value[p]
  const hint = isLocked(p) ? 'hint-locked' : note !== null && d === null ? `deduced ${note}` : ''
  return `Answer slot ${p + 1}: ${d ?? 'empty'}${hint ? ` (${hint})` : ''}`
}
</script>
