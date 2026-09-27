<template>
  <div class="keypad" role="group" aria-label="Number keypad and actions">
    <button
      v-for="d in 10"
      :key="d - 1"
      class="key digit"
      :class="{ used: usedDigits.has(d - 1) }"
      :disabled="blocked"
      :aria-label="`Digit ${d - 1}${usedDigits.has(d - 1) ? ', already in your answer' : ''}`"
      aria-keyshortcuts="0-9"
      tabindex="-1"
      @click="typeDigit(d - 1)"
    >
      {{ d - 1 }}
    </button>
    <div class="key-actions">
      <button class="key action" :disabled="blocked" tabindex="-1" aria-keyshortcuts="Backspace" @click="backspace()">⌫ Delete</button>
      <button class="key action hint" :disabled="blocked" tabindex="-1" aria-keyshortcuts="H" @click="useHint()">💡 Hint</button>
      <button class="key action danger" :disabled="blocked" :aria-label="confirming ? 'Press again to reveal the code and give up' : 'Give up and reveal the code'" tabindex="-1" @click="attemptGiveUp()">
        {{ confirming ? 'Sure?' : 'Give up' }}
      </button>
      <button class="key action primary" :disabled="blocked" tabindex="-1" aria-keyshortcuts="Enter" @click="check()">Check ⏎</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { backspace, check, giveUp, typeDigit, useHint, useGame } from '../composables/useGame'

const { state, usedDigits } = useGame()

const blocked = computed(() => state.status !== 'playing' || state.busy)

const confirming = ref(false)
let confirmTimer: ReturnType<typeof setTimeout> | undefined

function attemptGiveUp(): void {
  if (!confirming.value) {
    confirming.value = true
    if (confirmTimer) clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => {
      confirming.value = false
    }, 3000)
    return
  }
  confirming.value = false
  if (confirmTimer) clearTimeout(confirmTimer)
  giveUp()
}
</script>
