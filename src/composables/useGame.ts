import { computed, reactive, ref, watch } from 'vue'
import { fittingCodes } from '../lib/engine'
import { dailySeed, generatePuzzle, type Puzzle } from '../lib/puzzle'
import {
  getStats,
  getUiSettings,
  recordRevealed,
  recordSolved,
  saveUiSettings,
  type Stats,
  type UiSettings,
} from '../lib/storage'
import { randomSeed, rngFromSeed } from '../lib/rng'
import { DEFAULT_EXTRA, DEFAULT_LENGTH, DEFAULT_STRENGTH, fromHash, normalizeLength, toHash } from '../lib/url'
import { maxStrength } from '../lib/puzzle'
import type { GameStatus } from '../lib/share'

const ui = reactive<UiSettings>(getUiSettings())

const state = reactive({
  seed: '',
  length: DEFAULT_LENGTH as number,
  extra: DEFAULT_EXTRA as number,
  strength: DEFAULT_STRENGTH as number,
  puzzle: null as Puzzle | null,
  answer: [] as (number | null)[],
  cursor: 0,
  hints: {} as Record<number, number>,
  hintsUsed: 0,
  wrongChecks: 0,
  marks: [] as number[][],
  status: 'playing' as GameStatus,
  busy: false,
  shake: 0,
})

const announcement = ref('')
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined
let genToken = 0

function say(msg: string): void {
  announcement.value = ''
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      announcement.value = msg
    })
  } else {
    announcement.value = msg
  }
}

function flash(msg: string): void {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2600)
}

function syncHash(): void {
  const target = toHash(state.seed, state.length, state.extra, state.strength)
  if (location.hash !== target) history.replaceState(null, '', target)
}

function isLocked(p: number): boolean {
  return state.hints[p] !== undefined
}

function resetRound(): void {
  const len = state.length
  state.answer = new Array(len).fill(null)
  state.cursor = 0
  state.hints = {}
  state.hintsUsed = 0
  state.wrongChecks = 0
  state.status = 'playing'
  state.marks = Array.from({ length: 10 }, () => new Array(len).fill(0))
}

export function startGame(seed: string, length?: number, extra?: number, strength?: number): void {
  const len = normalizeLength(length ?? state.length, DEFAULT_LENGTH)
  const ext = Math.max(0, Math.min(4, Math.round(extra ?? state.extra)))
  const maxS = maxStrength(len)
  const s = Math.max(0, Math.min(maxS, Math.round(strength ?? state.strength)))
  state.seed = seed
  state.length = len
  state.extra = ext
  state.strength = s
  syncHash()
  const token = ++genToken
  state.busy = true
  setTimeout(() => {
    if (token !== genToken) return
    state.puzzle = generatePuzzle(seed, len, ext, s === 0 ? 0 : len - s)
    resetRound()
    state.busy = false
    say(`New ${len}-digit puzzle from seed ${seed}. ${state.puzzle.rows.length} clue rows. Fill your answer and press Enter to check.`)
  }, 30)
}

export function startDaily(): void {
  startGame(dailySeed())
}

export function startPractice(): void {
  startGame(randomSeed())
}

export function typeDigit(d: number): void {
  if (state.status !== 'playing' || state.busy) return
  const len = state.length
  let pos = state.cursor
  while (pos < len && isLocked(pos)) pos++
  if (pos >= len) return
  if (state.answer.some((x, i) => x === d && i !== pos)) {
    say(`Digit ${d} is already in your answer. Digits must all be different.`)
    return
  }
  state.answer[pos] = d
  let next = pos + 1
  while (next < len && state.answer[next] !== null) next++
  state.cursor = next < len ? next : Math.min(pos + 1, len - 1)
}

export function backspace(): void {
  if (state.status !== 'playing' || state.busy) return
  if (state.answer[state.cursor] !== null && !isLocked(state.cursor)) {
    state.answer[state.cursor] = null
    return
  }
  if (state.cursor > 0) {
    state.cursor--
    if (!isLocked(state.cursor)) state.answer[state.cursor] = null
  }
}

export function moveCursor(delta: number): void {
  state.cursor = Math.max(0, Math.min(state.length - 1, state.cursor + delta))
}

export function setCursor(pos: number): void {
  if (pos >= 0 && pos < state.length) state.cursor = pos
}

export function check(): void {
  if (state.status !== 'playing' || state.busy || !state.puzzle) return
  if (state.answer.some((d) => d === null)) {
    state.shake++
    say(`Fill all ${state.length} digits before checking.`)
    return
  }
  const guess = state.answer.map((d) => d as number)
  if (guess.every((d, i) => d === state.puzzle!.secret[i])) {
    state.status = 'solved'
    recordSolved(state.length, state.extra, state.strength, state.wrongChecks, state.hintsUsed)
    say(`Correct! The code was ${state.puzzle.secret.join(' ')}.`)
    return
  }
  state.wrongChecks++
  state.shake++
  say(`That's not the code. Wrong checks so far: ${state.wrongChecks}.`)
}

export function giveUp(): void {
  if (state.status !== 'playing' || state.busy || !state.puzzle) return
  state.status = 'revealed'
  recordRevealed(state.length, state.extra, state.strength, state.hintsUsed)
  say(`The code was ${state.puzzle.secret.join(' ')}.`)
}

export function useHint(): void {
  if (state.status !== 'playing' || state.busy || !state.puzzle) return
  const consensus = aidsData.value?.consensus ?? new Array<number | null>(state.length).fill(null)
  const fresh: number[] = []
  const deducible: number[] = []
  for (let p = 0; p < state.length; p++) {
    if (isLocked(p)) continue
    if (consensus[p] === null) fresh.push(p)
    else deducible.push(p)
  }
  const pool = fresh.length > 0 ? fresh : deducible
  if (pool.length === 0) {
    flash('Every position is already revealed')
    return
  }
  const rng = rngFromSeed(`${state.seed}::hint::${state.hintsUsed}`)
  const pos = pool[Math.floor(rng() * pool.length)]
  const digit = state.puzzle.secret[pos]
  state.hints[pos] = digit
  state.hintsUsed++
  state.answer[pos] = digit
  state.marks[digit][pos] = 3
  for (let pp = 0; pp < state.length; pp++) {
    if (pp !== pos && state.marks[digit][pp] === 0) state.marks[digit][pp] = 2
  }
  say(`Hint: position ${pos + 1} is ${digit}.`)
}

export function cycleMark(d: number, p: number): void {
  const next = (state.marks[d][p] + 1) % 4
  state.marks[d][p] = next
  if (next === 0 && ui.autoUnmark) {
    for (let pp = 0; pp < state.length; pp++) state.marks[d][pp] = 0
    return
  }
  if (!ui.autoMark) return
  if (next === 1 || next === 2) {
    for (let pp = 0; pp < state.length; pp++) state.marks[d][pp] = next
  } else if (next === 3) {
    for (let pp = 0; pp < state.length; pp++) state.marks[d][pp] = pp === p ? 3 : 2
  }
}

export function clearMark(d: number, p: number): void {
  state.marks[d][p] = 0
}

export function clearMarks(): void {
  state.marks = Array.from({ length: 10 }, () => new Array(state.length).fill(0))
  flash('Marks cleared')
}

export function applyCandidate(code: number[]): void {
  if (state.status !== 'playing' || state.busy) return
  for (let i = 0; i < state.length; i++) {
    if (!isLocked(i)) state.answer[i] = code[i]
  }
  state.cursor = state.length - 1
  say(`Filled ${code.join('')}. Press Enter to check.`)
}

const usedDigits = computed(() => new Set(state.answer.filter((d): d is number => d !== null)))

const aidsData = computed(() => {
  if (!state.puzzle) return null
  return fittingCodes(state.length, state.marks)
})

const notes = computed<(number | null)[]>(() => {
  if (!ui.autoNotes) return new Array(state.length).fill(null)
  const consensus = aidsData.value?.consensus ?? new Array<number | null>(state.length).fill(null)
  return consensus.map((d, p) => (d !== null && state.answer[p] === null ? d : null))
})

const stats = computed<Stats>(() => getStats(state.length, state.extra, state.strength))

const isDaily = computed(() => state.seed === dailySeed())

function toggleAids(): void {
  ui.aidsOpen = !ui.aidsOpen
}

watch(
  () => ({ ...ui }),
  (v) => saveUiSettings(v),
  { deep: true },
)

export function useGame() {
  return {
    state,
    ui,
    announcement,
    toast,
    usedDigits,
    aidsData,
    notes,
    stats,
    isDaily,
    flash,
    toggleAids,
  }
}

export function initGame(): void {
  const ref = fromHash(location.hash, dailySeed(), DEFAULT_LENGTH)
  startGame(ref.seed, ref.length, ref.extra ?? DEFAULT_EXTRA, ref.strength ?? DEFAULT_STRENGTH)
}
