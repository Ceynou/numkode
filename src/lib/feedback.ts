export interface ClueRow {
  digits: number[]
  placed: number
  misplaced: number
}

export function packedPair(guess: readonly number[], code: readonly number[]): number {
  let mask = 0
  for (let i = 0; i < guess.length; i++) mask |= 1 << guess[i]
  let placed = 0
  let shared = 0
  for (let i = 0; i < code.length; i++) {
    const d = code[i]
    if (mask & (1 << d)) shared++
    if (d === guess[i]) placed++
  }
  return (placed << 4) | (shared - placed)
}

export function rowSpec(row: ClueRow): { digits: number[]; mask: number; packed: number } {
  let mask = 0
  for (const d of row.digits) mask |= 1 << d
  return { digits: row.digits, mask, packed: (row.placed << 4) | row.misplaced }
}

export function placedOf(packed: number): number {
  return packed >> 4
}

export function misplacedOf(packed: number): number {
  return packed & 15
}
