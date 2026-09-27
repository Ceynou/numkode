<template>
  <Modal :open="open" :title="state.status === 'solved' ? 'Code cracked!' : 'The code was'" @close="emit('close')">
    <div class="end">
      <p v-if="state.status === 'solved' && state.puzzle" class="end-line">
        Solved with <strong>{{ state.wrongChecks }}</strong> wrong check{{ state.wrongChecks === 1 ? '' : 's' }}
        <span v-if="state.hintsUsed"> · {{ state.hintsUsed }} hint{{ state.hintsUsed > 1 ? 's' : '' }}</span>
      </p>
      <div v-if="state.puzzle" class="end-code" :class="{ lost: state.status !== 'solved' }" :aria-label="`The code was ${state.puzzle.secret.join(' ')}`">
        <span v-for="(d, i) in state.puzzle.secret" :key="i" class="slot" :class="state.status === 'solved' ? 'exact' : 'elsewhere'">
          <span class="digit">{{ d }}</span>
        </span>
      </div>
      <p class="end-par">
        {{ state.puzzle?.rows.length }} clue rows · time <strong>{{ formatTime(state.elapsedMs) }}</strong> · streak <strong>{{ stats.streak }}</strong> · best <strong>{{ stats.maxStreak }}</strong>
      </p>
      <div class="end-actions">
        <button ref="shareBtn" class="btn primary" aria-keyshortcuts="S" @click="emit('share')">Copy result <kbd>S</kbd></button>
        <button class="btn" aria-keyshortcuts="D" @click="emit('close'); startDaily()">Daily <kbd>D</kbd></button>
        <button class="btn" aria-keyshortcuts="N" @click="emit('close'); startPractice()">Practice <kbd>N</kbd></button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Modal from './Modal.vue'
import { startDaily, startPractice, useGame } from '../composables/useGame'
import { formatTime } from '../lib/share'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; share: [] }>()

const { state, stats } = useGame()

const shareBtn = ref<HTMLButtonElement | null>(null)

function focusShare(): void {
  shareBtn.value?.focus()
}

defineExpose({ focusShare })
</script>
