<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="emit('close')">
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="modal"
        tabindex="-1"
        @keydown.esc.stop="emit('close')"
        @keydown.tab="trapTab"
      >
        <header class="modal-head">
          <h2>{{ title }}</h2>
          <button class="icon-btn" aria-label="Close dialog (Esc)" @click="emit('close')">✕</button>
        </header>
        <div class="modal-body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement as HTMLElement | null
      await nextTick()
      panel.value?.focus()
    } else {
      previousFocus?.focus?.()
      previousFocus = null
    }
  },
)

function trapTab(e: KeyboardEvent): void {
  const root = panel.value
  if (!root) return
  const focusables = Array.from(root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(
    (el) => !el.hasAttribute('disabled'),
  )
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement as HTMLElement | null
  if (e.shiftKey && (active === first || !root.contains(active))) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}
</script>
