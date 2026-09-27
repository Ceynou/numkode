<template>
  <Modal :open="open" title="How to play" @close="emit('close')">
    <div class="help">
      <p>Deduce the hidden <strong>{{ state.length }}-digit code</strong>. All digits are different, drawn from 0–9.</p>
      <p>Each row is a failed attempt with two clues:</p>
      <ul class="clue-legend">
        <li><span class="dot exact"></span> <strong>Placed</strong> — count of digits that are correct <em>and in the right position</em>.</li>
        <li><span class="dot elsewhere"></span> <strong>Misplaced</strong> — count of digits that are in the code but in the wrong position.</li>
      </ul>
      <p>Example: row <code>4 7 2 9</code> marked <strong>1 ●</strong> and <strong>2 ◐</strong> means exactly one digit stands in the right spot and two more belong to the code, but elsewhere.</p>

      <h3>The zero row</h3>
      <p>Usually the last row shows <strong>0 ● 0 ◐</strong>: none of its digits appear in the code at all — cross them out.
        This is guaranteed for codes up to 5 digits. For 6+ digits it's mathematically impossible with all-distinct digits
        (the code already uses more than half of 0–9), so those puzzles do without.</p>

      <h3>Fairness</h3>
      <p>Every puzzle is verified at generation time: <strong>exactly one code</strong> satisfies all rows. It can always be
        solved by pure logic — no guessing required. Number of rows scales with code length.</p>

      <h3>Checking</h3>
      <p>Fill your answer and press <kbd>Enter</kbd> to check. Checks are unlimited; wrong ones are counted (0-wrong solves are
        bragging rights) and never leak which digits were right.</p>

      <h3>Aids <kbd>C</kbd></h3>
      <ul>
        <li><strong>Mark digits</strong> — click any digit on the clue rows (or a cell in the grid) to cycle its mark:
          blank → <strong class="mk-1">✕ not the right number</strong> → <strong class="mk-2">~ in the code</strong> → <strong class="mk-3">✓ right position</strong>.
          Right-click clears a single cell.</li>
        <li><strong>Auto-mark</strong> — with it on, every state in the cycle applies to the digit on all rows at once:
          ✕ strikes it everywhere, ~ flags it as in the code everywhere, and ✓ pins its position while marking its other spots ~.
          Marking ~ on another occurrence simply re-aims the ✓.</li>
        <li><strong>Auto-unmark</strong> — cycling a mark back to blank clears that digit everywhere, un-striking it in one go.</li>
        <li><strong>Elimination grid</strong> — the same marks as a digit × position table; navigate with arrows + <kbd>Enter</kbd>. Pure note-taking, never checked.</li>
        <li><strong>Codes counter</strong> (Settings) — how many codes still fit <em>your marks</em>; 0 means your marks contradict.</li>
        <li><strong>Ghost notes</strong> (Settings) — digits your marks force, ghosted into the answer row.</li>
        <li><strong>Hint</strong> <kbd>H</kbd> — reveals one position; counted in stats and share.</li>
      </ul>

      <h3>Difficulty</h3>
      <p>Three dials in Settings: <strong>code length</strong> (2–10), <strong>clue strength</strong> — how many fewer digits than
        the code length each row's clues may cover (default 2: on a 5-digit code, every row accounts for at most 3 digits, so no
        single row gives the game away) — and <strong>clue rows</strong> beyond the minimum needed for uniqueness. Extra rows keep
        the code identical for a seed; a lower clue strength re-derives a fresh puzzle.</p>

      <h3>Keyboard shortcuts</h3>
      <table class="keys">
        <tbody>
          <tr><td><kbd>0</kbd>–<kbd>9</kbd></td><td>type digit into answer</td></tr>
          <tr><td><kbd>Enter</kbd></td><td>check answer</td></tr>
          <tr><td><kbd>⌫</kbd></td><td>delete digit</td></tr>
          <tr><td><kbd>←</kbd> <kbd>→</kbd> <kbd>Home</kbd> <kbd>End</kbd></td><td>move cursor</td></tr>
          <tr><td><kbd>D</kbd></td><td>today's daily (at current length)</td></tr>
          <tr><td><kbd>N</kbd></td><td>new practice puzzle</td></tr>
          <tr><td><kbd>H</kbd></td><td>hint</td></tr>
          <tr><td><kbd>C</kbd></td><td>toggle aids panel</td></tr>
          <tr><td><kbd>S</kbd></td><td>copy share text / game link</td></tr>
          <tr><td><kbd>T</kbd></td><td>stats</td></tr>
          <tr><td><kbd>,</kbd></td><td>settings</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>close dialogs</td></tr>
        </tbody>
      </table>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './Modal.vue'
import { useGame } from '../composables/useGame'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { state } = useGame()
</script>
