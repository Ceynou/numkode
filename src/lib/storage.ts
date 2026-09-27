import type { ClueRow } from './feedback'
import type { Puzzle } from './puzzle'

const PREFIX = 'numkode2:'

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

function validRows(rows: unknown, length: number): rows is ClueRow[] {
  return (
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows.every(
      (r) =>
        r !== null &&
        typeof r === 'object' &&
        Array.isArray((r as ClueRow).digits) &&
        (r as ClueRow).digits.length === length &&
        (r as ClueRow).digits.every((d) => typeof d === 'number') &&
        typeof (r as ClueRow).placed === 'number' &&
        typeof (r as ClueRow).misplaced === 'number',
    )
  )
}

export function loadPuzzle(key: string): Puzzle | null {
  const v = read(`puzzle:${key}`) as Puzzle | null
  if (!v || typeof v.length !== 'number' || !Array.isArray(v.secret) || !validRows(v.rows, v.length)) return null
  return v
}

export function savePuzzle(key: string, p: Puzzle): void {
  write(`puzzle:${key}`, p)
}

export interface Stats {
  solved: number
  revealed: number
  wrongChecks: number
  hints: number
  streak: number
  maxStreak: number
  dist: Record<string, number>
}

const EMPTY_STATS: Stats = { solved: 0, revealed: 0, wrongChecks: 0, hints: 0, streak: 0, maxStreak: 0, dist: {} }

export function statsKey(length: number, extra: number, strength: number): string {
  return `L${length}x${extra}s${strength}`
}

export function getStats(length: number, extra: number, strength: number): Stats {
  const v = read(`stats:${statsKey(length, extra, strength)}`) as Stats | null
  return v ? { ...EMPTY_STATS, ...v, dist: { ...v.dist } } : { ...EMPTY_STATS, dist: {} }
}

export function recordSolved(length: number, extra: number, strength: number, wrongChecks: number, hintsUsed: number): Stats {
  const s = getStats(length, extra, strength)
  s.solved++
  s.wrongChecks += wrongChecks
  s.hints += hintsUsed
  s.streak++
  s.maxStreak = Math.max(s.maxStreak, s.streak)
  const k = wrongChecks >= 3 ? '3+' : String(wrongChecks)
  s.dist[k] = (s.dist[k] ?? 0) + 1
  write(`stats:${statsKey(length, extra, strength)}`, s)
  return s
}

export function recordRevealed(length: number, extra: number, strength: number, hintsUsed: number): Stats {
  const s = getStats(length, extra, strength)
  s.revealed++
  s.hints += hintsUsed
  s.streak = 0
  write(`stats:${statsKey(length, extra, strength)}`, s)
  return s
}

export interface UiSettings {
  aidsOpen: boolean
  autoNotes: boolean
  showCount: boolean
  seenHelp: boolean
  autoMark: boolean
  autoUnmark: boolean
}

const DEFAULT_SETTINGS: UiSettings = {
  aidsOpen: false,
  autoNotes: false,
  showCount: false,
  seenHelp: false,
  autoMark: true,
  autoUnmark: true,
}

export function getUiSettings(): UiSettings {
  const v = read('ui') as Partial<UiSettings> | null
  return { ...DEFAULT_SETTINGS, ...v }
}

export function saveUiSettings(s: UiSettings): void {
  write('ui', s)
}
