export type GameStatus = 'playing' | 'solved' | 'revealed'

export function buildShare(
  length: number,
  rowCount: number,
  seed: string,
  status: GameStatus,
  wrongChecks: number,
  hintsUsed: number,
  url: string,
  cap = 0,
): string {
  const outcome =
    status === 'solved'
      ? `✅ solved with ${wrongChecks} wrong check${wrongChecks === 1 ? '' : 's'}`
      : status === 'revealed'
        ? '❌ revealed the code'
        : 'still cracking'
  const hints = hintsUsed > 0 ? ` · ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}` : ''
  const capInfo = cap > 0 ? ` · clues ≤${cap}` : ''
  return [`NumKode ${length}-digit · ${rowCount} clue rows${capInfo} · ${outcome}${hints}`, `Seed: ${seed}`, url].join('\n')
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
