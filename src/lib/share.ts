export type GameStatus = 'playing' | 'solved' | 'revealed'

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function buildShare(
  length: number,
  rowCount: number,
  seed: string,
  status: GameStatus,
  wrongChecks: number,
  hintsUsed: number,
  url: string,
  cap = 0,
  timeMs = 0,
): string {
  const outcome =
    status === 'solved'
      ? `✅ solved with ${wrongChecks} wrong check${wrongChecks === 1 ? '' : 's'}`
      : status === 'revealed'
        ? '❌ revealed the code'
        : 'still cracking'
  const hints = hintsUsed > 0 ? ` · ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}` : ''
  const capInfo = cap > 0 ? ` · clues ≤${cap}` : ''
  const time = timeMs > 0 ? ` · ${formatTime(timeMs)}` : ''
  return [`NumKode ${length}-digit · ${rowCount} clue rows${capInfo} · ${outcome}${hints}${time}`, `Seed: ${seed}`, url].join('\n')
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}
