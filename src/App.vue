<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <span class="brand-num">NUM</span><span class="brand-kode">KODE</span>
      </div>
      <nav class="toolbar" aria-label="Game controls">
        <button class="btn" @click="startDaily()" aria-keyshortcuts="D"><span>Daily</span><kbd>D</kbd></button>
        <button class="btn" @click="startPractice()" aria-keyshortcuts="N"><span>Practice</span><kbd>N</kbd></button>
        <button class="btn" :class="{ on: ui.aidsOpen }" @click="toggleAids()" aria-keyshortcuts="C" :aria-pressed="ui.aidsOpen"><span>Aids</span><kbd>C</kbd></button>
        <button class="btn" @click="modal = 'stats'" aria-keyshortcuts="T"><span>Stats</span><kbd>T</kbd></button>
        <button class="btn" @click="modal = 'help'" aria-keyshortcuts="?"><span>Help</span><kbd>?</kbd></button>
        <button class="btn" @click="modal = 'settings'" aria-keyshortcuts=","><span>Settings</span><kbd>,</kbd></button>
      </nav>
    </header>

    <div class="meta-bar">
      <button class="chip" :title="`Seed: ${state.seed}. Click to copy puzzle link.`" @click="doShare()">
        <span class="chip-label">Seed</span><code>{{ state.seed }}</code>
      </button>
      <span class="chip static"><span class="chip-label">Code</span><strong>{{ state.length }}d</strong></span>
      <span v-if="state.puzzle" class="chip static" title="Clue rows shown">
        <span class="chip-label">Rows</span><strong>{{ state.puzzle.rows.length }}</strong>
      </span>
      <span v-if="state.startedAt > 0" class="chip static" title="Elapsed time">
        <span class="chip-label">Time</span><strong>{{ formatTime(state.elapsedMs) }}</strong>
      </span>
      <span v-if="state.strength > 0" class="chip static" :title="`Each row's clues cover at most ${state.length - state.strength} of the ${state.length} digits`">
        <span class="chip-label">Clues</span><strong>≤{{ state.length - state.strength }}</strong>
      </span>
      <span v-if="state.wrongChecks > 0" class="chip static warn" title="Wrong checks so far">
        <span class="chip-label">Wrong</span><strong>{{ state.wrongChecks }}</strong>
      </span>
      <span v-if="state.busy" class="chip static busy"><span class="spinner" aria-hidden="true"></span>cracking…</span>
    </div>

    <template v-if="state.puzzle && !state.busy">
      <Board />
      <KeyPad />
      <ElimGrid />
    </template>
    <div v-else class="placeholder" role="status" aria-label="Generating puzzle">
      <span class="spinner big" aria-hidden="true"></span>
      <p>Cracking the seed into clue rows…</p>
    </div>

    <footer class="foot">
      <p>Type <kbd>0</kbd>–<kbd>9</kbd> · <kbd>Enter</kbd> check · <kbd>⌫</kbd> delete · <kbd>←</kbd><kbd>→</kbd> move · <kbd>?</kbd> all shortcuts</p>
      <p class="foot-note">Exactly one code fits all rows — every puzzle is solvable by pure logic. <kbd>C</kbd> toggles aids.</p>
    </footer>

    <div class="sr-only" role="status" aria-live="polite">{{ announcement }}</div>
    <div class="toast-wrap" aria-live="polite"><transition name="fade"><div v-if="toast" class="toast">{{ toast }}</div></transition></div>

    <HelpModal :open="modal === 'help'" @close="closeModal" />
    <SettingsModal :open="modal === 'settings'" @close="closeModal" />
    <StatsModal :open="modal === 'stats'" @close="closeModal" />
    <EndModal ref="endModalRef" :open="modal === 'end'" @close="closeModal" @share="doShare" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import Board from './components/Board.vue'
import KeyPad from './components/KeyPad.vue'
import ElimGrid from './components/ElimGrid.vue'
import HelpModal from './components/HelpModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import StatsModal from './components/StatsModal.vue'
import EndModal from './components/EndModal.vue'
import { backspace, check, initGame, moveCursor, setCursor, startDaily, startPractice, typeDigit, useGame } from './composables/useGame'
import { buildShare, copyText, formatTime } from './lib/share'

const { state, ui, announcement, toast, flash, toggleAids } = useGame()

const modal = ref<null | 'help' | 'settings' | 'stats' | 'end'>(null)
const endModalRef = ref<InstanceType<typeof EndModal> | null>(null)

function closeModal(): void {
  modal.value = null
}

watch(
  () => state.status,
  (s) => {
    if (s === 'playing') {
      modal.value = null
      return
    }
    setTimeout(() => {
      modal.value = 'end'
      endModalRef.value?.focusShare()
    }, 700)
  },
)

async function doShare(): Promise<void> {
  const url = location.href
  const text = buildShare(
    state.length,
    state.puzzle?.rows.length ?? 0,
    state.seed,
    state.status,
    state.wrongChecks,
    state.hintsUsed,
    url,
    state.strength > 0 ? state.length - state.strength : 0,
    state.elapsedMs,
  )
  const ok = await copyText(text)
  flash(ok ? 'Copied to clipboard' : 'Copy failed — select and copy manually')
}

function onKey(e: KeyboardEvent): void {
  const t = e.target as HTMLElement | null
  const inField = !!t?.closest?.('input, textarea, select, [contenteditable="true"]')
  if (e.key === 'Escape') {
    if (modal.value) {
      modal.value = null
      e.preventDefault()
      return
    }
    if (inField) {
      ;(t as HTMLElement).blur?.()
      e.preventDefault()
    }
    return
  }
  if (modal.value) {
    if (modal.value === 'end' && (e.key === 'Enter' || e.key.toLowerCase() === 's')) {
      e.preventDefault()
      void doShare()
    }
    return
  }
  if (t instanceof HTMLElement && t.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return
  if (inField || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key >= '0' && e.key <= '9') {
    typeDigit(Number(e.key))
    e.preventDefault()
    return
  }
  switch (e.key) {
    case 'Enter':
      check()
      e.preventDefault()
      return
    case 'Backspace':
      backspace()
      e.preventDefault()
      return
    case 'ArrowLeft':
      moveCursor(-1)
      e.preventDefault()
      return
    case 'ArrowRight':
      moveCursor(1)
      e.preventDefault()
      return
    case 'Home':
      setCursor(0)
      e.preventDefault()
      return
    case 'End':
      setCursor(state.length - 1)
      e.preventDefault()
      return
  }
  switch (e.key.toLowerCase()) {
    case 'n':
      startPractice()
      break
    case 'd':
      startDaily()
      break
    case 'c':
      toggleAids()
      break
    case 's':
      void doShare()
      break
    case 't':
      modal.value = 'stats'
      break
    case '?':
      modal.value = 'help'
      break
    case ',':
      modal.value = 'settings'
      break
  }
}

onMounted(() => {
  initGame()
  window.addEventListener('keydown', onKey)
  if (!ui.seenHelp) {
    modal.value = 'help'
    ui.seenHelp = true
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})
</script>
