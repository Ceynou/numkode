<template>
  <Modal :open="open" title="Settings" @close="emit('close')">
    <div class="settings">
      <div class="field">
        <span class="field-label">Code length <small>(starts a new puzzle with the same seed)</small></span>
        <span class="seg lengths" role="radiogroup" aria-label="Code length">
          <button v-for="l in 9" :key="l + 1" role="radio" :aria-checked="state.length === l + 1" :class="{ on: state.length === l + 1 }" @click="setLength(l + 1)">
            {{ l + 1 }}
          </button>
        </span>
      </div>

      <div class="field">
        <span class="field-label">Clue rows <small>(extra rows beyond the minimum)</small></span>
        <StepField v-model="extraLocal" :min="0" :max="4" label="Extra clue rows" :format="fmtExtra" />
        <p class="hint-line">Tight = the fewest rows that still pin a unique code. Extra rows never change the code for a seed — applied instantly as you step.</p>
      </div>

      <div class="field">
        <span class="field-label">Clue strength <small>(how many fewer digits each row's clues cover)</small></span>
        <StepField v-model="strengthLocal" :min="0" :max="maxS" label="Clue strength" :format="fmtStrength" :disabled="maxS === 0" />
        <p class="hint-line">{{ strengthHint }}</p>
      </div>

      <div class="field">
        <span class="field-label">Seed</span>
        <form class="seed-form" @submit.prevent="playSeed">
          <input
            ref="seedInput"
            v-model="seedText"
            type="text"
            maxlength="64"
            placeholder="any word, number or daily-2026-09-25"
            aria-label="Seed for the puzzle"
            @keydown.esc.stop="emit('close')"
          />
          <button type="submit" class="btn primary">Play</button>
        </form>
        <p class="hint-line">Same seed + same settings = identical puzzle for everyone. Daily uses today's date at the settings selected above.</p>
      </div>

      <div class="field">
        <span class="field-label">Marking</span>
        <label class="switch">
          <input v-model="ui.autoMark" type="checkbox" />
          <span>Auto-mark everywhere <em>(each mark state applies to the digit on every row)</em></span>
        </label>
        <label class="switch">
          <input v-model="ui.autoUnmark" type="checkbox" />
          <span>Auto-unmark everywhere <em>(cycling a mark back to blank clears that digit everywhere)</em></span>
        </label>
        <p class="hint-line">✕ eliminates the digit, ~ flags it as in the code, ✓ pins its position (its other spots become ~). With auto-mark off, marks apply to the single cell; right-click always clears one cell.</p>
      </div>

      <div class="field">
        <span class="field-label">Aids</span>
        <label class="switch">
          <input v-model="showCount" type="checkbox" @change="ui.showCount = showCount" />
          <span>Codes-fitting-your-marks counter <em>(in the aids panel)</em></span>
        </label>
        <label class="switch">
          <input v-model="autoNotes" type="checkbox" @change="ui.autoNotes = autoNotes" />
          <span>Ghost notes from your marks <em>(digits your marks force, ghosted into the answer row)</em></span>
        </label>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Modal from './Modal.vue'
import StepField from './StepField.vue'
import { startGame, useGame } from '../composables/useGame'
import { maxStrength } from '../lib/puzzle'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { state, ui, flash } = useGame()

const seedText = ref(state.seed)
const seedInput = ref<HTMLInputElement | null>(null)
const showCount = ref(ui.showCount)
const autoNotes = ref(ui.autoNotes)
const extraLocal = ref(state.extra)
const strengthLocal = ref(state.strength)

const maxS = computed(() => maxStrength(state.length))

const strengthHint = computed(() => {
  if (maxS.value === 0) return 'Every digit 0–9 appears in a 10-digit code, so clues are always full-strength here.'
  if (state.strength === 0) return 'Every row may account for all digits of the code.'
  return `Each row's clues cover at most ${state.length - state.strength} of the ${state.length} digits — no single row gives the code away. May re-derive a different code for the same seed.`
})

function fmtExtra(v: number): string {
  return v === 0 ? 'Tight' : `+${v}`
}

function fmtStrength(v: number): string {
  return v === 0 ? 'Full' : `${v}`
}

function syncLocals(): void {
  extraLocal.value = state.extra
  strengthLocal.value = state.strength
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      seedText.value = state.seed
      showCount.value = ui.showCount
      autoNotes.value = ui.autoNotes
      syncLocals()
      setTimeout(() => seedInput.value?.focus(), 50)
    }
  },
)

watch(extraLocal, (v) => {
  if (props.open && v !== state.extra) {
    startGame(state.seed, state.length, v, strengthLocal.value)
    syncLocals()
    flash(v === 0 ? 'Tightest row count' : `${v} extra clue row${v > 1 ? 's' : ''}`)
  }
})

watch(strengthLocal, (v) => {
  if (props.open && v !== state.strength) {
    startGame(state.seed, state.length, extraLocal.value, v)
    syncLocals()
    flash(v === 0 ? 'Full clue strength' : `Clues now cover at most ${state.length - v} digits per row`)
  }
})

function setLength(l: number): void {
  startGame(state.seed, l, extraLocal.value, strengthLocal.value)
  syncLocals()
  flash(`New ${l}-digit puzzle`)
}

function playSeed(): void {
  const seed = seedText.value.trim() || state.seed
  startGame(seed, state.length, extraLocal.value, strengthLocal.value)
  emit('close')
  flash('New puzzle started')
}
</script>
