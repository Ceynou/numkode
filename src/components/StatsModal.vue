<template>
  <Modal :open="open" title="Stats" @close="emit('close')">
    <div class="stats">
      <p class="stats-mode">Current length: {{ state.length }} digits</p>
      <div class="stat-grid">
        <div class="stat"><strong>{{ stats.solved }}</strong><span>solved</span></div>
        <div class="stat"><strong>{{ stats.revealed }}</strong><span>revealed</span></div>
        <div class="stat"><strong>{{ accuracy }}%</strong><span>solve rate</span></div>
        <div class="stat"><strong>{{ stats.streak }}</strong><span>streak</span></div>
      </div>
      <p class="hint-line">
        Best streak {{ stats.maxStreak }} · average wrong checks {{ avgChecks }} · hints used {{ stats.hints }}
      </p>
      <h3>Wrong checks per solve</h3>
      <div class="dist">
        <div v-for="row in distRows" :key="row.label" class="dist-row">
          <span class="dist-label">{{ row.label }}</span>
          <span class="dist-bar" :class="{ best: row.best }" :style="{ width: row.pct + '%' }">{{ row.count }}</span>
        </div>
      </div>
      <p class="hint-line">Stats are stored per code length in this browser only.</p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Modal from './Modal.vue'
import { useGame } from '../composables/useGame'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { state, stats } = useGame()

const accuracy = computed(() => {
  const t = stats.value.solved + stats.value.revealed
  return t === 0 ? 0 : Math.round((stats.value.solved / t) * 100)
})

const avgChecks = computed(() => (stats.value.solved === 0 ? '—' : (stats.value.wrongChecks / stats.value.solved).toFixed(1)))

const distRows = computed(() => {
  const labels = ['0', '1', '2', '3+']
  const rows = labels.map((label) => ({ label, count: stats.value.dist[label] ?? 0, pct: 0, best: false }))
  const max = Math.max(1, ...rows.map((r) => r.count))
  let bestIdx = -1
  for (let i = 0; i < rows.length; i++) if (rows[i].count > 0 && (bestIdx === -1 || rows[i].count > rows[bestIdx].count)) bestIdx = i
  if (bestIdx >= 0) rows[bestIdx].best = true
  for (const r of rows) r.pct = Math.max(6, Math.round((r.count / max) * 100))
  return rows
})
</script>
