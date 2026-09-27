# NumKode

A seeded, always-solvable **code-deduction puzzle** — rows of numbers with classic
Mastermind-style clues, and exactly one code fits them all. Think of the "crack the code"
puzzles, but generated fresh from any seed and playable entirely with the keyboard.
Built with Vue 3 + Vite; ships as a static site, ready for GitHub Pages.

## The puzzle

- A hidden code of **2–10 digits** (all different, from 0–9) must be deduced — not guessed at.
- The board shows **clue rows**: failed attempts, each annotated with two numbers:
  - 🟢 **placed** — how many digits are correct *and* in the correct position
  - 🟡 **misplaced** — how many digits belong to the code but sit in the wrong position
- **The last row is usually a "zero row"** (0 placed / 0 misplaced) for codes up to 5 digits:
  none of its digits appear in the code — cross them out. For 6–10 digit codes a zero row is
  mathematically impossible with all-distinct digits (the code already uses more than half of 0–9).
- Fill your answer and press <kbd>Enter</kbd> to **check**. Checks are unlimited; wrong ones are
  counted (0-wrong solves are bragging rights) and never leak which digits were right.

## Seeded & guaranteed fair

Every puzzle comes from a **seed** (`daily-YYYY-MM-DD`, a random practice seed, or anything you
type). Same seed + length = identical puzzle for everyone, and the URL hash always carries the
game so links are shareable.

Generation (`src/lib/puzzle.ts`) draws the secret and adds clue rows — chosen greedily to
maximize information — until **exactly one code in the entire universe of distinct-digit
combinations satisfies every clue**. That uniqueness is the guarantee: the puzzle is always
solvable by pure logic. Row counts scale with code length (≈4–5 rows for 2–3 digits up to
≈10 for 10 digits — long codes are inherently harder to pin down because every candidate
shares most digits). Puzzles are verified by unit tests across all lengths.

## Play by keyboard

`0–9` type · `Enter` check · `Backspace` delete · `←/→/Home/End` move cursor ·
`D` daily · `N` new practice · `H` hint · `C` aids · `S` share · `T` stats · `?` help ·
`,` settings · `Esc` close. All controls are tabbable with visible focus; dialogs are
focus-trapped; guess results are announced via ARIA live regions.

## Difficulty

Three dials in Settings — length as buttons, the other two as steppers that apply instantly:

- **Code length** — 2 to 10 digits.
- **Clue strength** — how many fewer digits than the code length each row's clues may cover
  (default 2: on a 5-digit code every row accounts for at most 3 digits, so no single row gives
  the game away). 0 means Full. The generator constructs compliant rows and keeps adding them
  until the solution is still unique, so the solvability guarantee holds at every strength.
  (Long codes mathematically force stronger clues — every digit 0–9 appears in a 10-digit code,
  so 10-digit games are always Full.)
- **Clue rows** — 0 (`Tight`) is the minimum row set that still pins a unique code; up to `+4`
  adds extra rows to cross-reference. Extra rows never change the code for a given seed; a lower
  clue strength re-derives a fresh puzzle from it.

## Visual aids (they never spoil, they just carry the pencil work)

- **Marking digits** — click any digit on the clue rows (or cells in the aids grid) to cycle its
  mark: blank → **✕ not the right number** → **~ in the code** → **✓ right position**.
  With **auto-mark** (on by default) every state in the cycle applies to the digit on all rows
  at once: ✕ strikes it everywhere, ~ flags it as present everywhere, and ✓ pins its position
  while marking its other occurrences ~ — clicking another occurrence simply re-aims the ✓.
  **Auto-unmark** clears the digit everywhere when cycled back to blank — both toggleable in the
  aids panel and Settings. Right-click always clears a single cell. The 10×L elimination grid
  (`C`) shows the same marks and is keyboard-navigable (arrows + `Enter`).
- **Codes counter** (Settings, off by default) — how many codes still fit *your marks*;
  hitting 0 means your notes contradict, hitting 1 means you've pinned the code.
- **Ghost notes** (Settings, off by default) — digits your marks force, ghosted into the answer row.
- **Hint** (`H`) — reveals one position, counted in stats and share text.

## Project setup

```bash
npm install
npm run dev       # local dev server
npm test          # unit tests (feedback math, engine, uniqueness/determinism guarantees)
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
```

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push to `main` (or run the workflow manually). The included workflow
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the site and deploys `dist/`.

The build uses a relative base (`base: './'` in `vite.config.ts`), so it works under
`https://<user>.github.io/<repo>/` without extra configuration.

## How it works inside

- `src/lib/feedback.ts` — the clue math: a packed `(placed, misplaced)` pair per row, computed
  via digit bitmasks (valid because all codes and rows use distinct digits).
- `src/lib/engine.ts` — the universe of all k-permutations of 0–9 as a flat `Uint8Array`
  (3.6 M codes at length 10), with in-place constraint filtering, survivor counts and
  position-consensus deduction.
- `src/lib/puzzle.ts` — the seeded generator: greedy entropy-based row selection until the
  survivor count is exactly 1, deterministic fallback rows to guarantee termination, and the
  zero-row convention. Results are cached per seed in `localStorage`.
- `src/composables/useGame.ts` — game state: answer input, cursor, checks, hints, marks,
  stats, and URL-hash sync.

## License

MIT
