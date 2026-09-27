<template>
  <div class="step-field" role="group" :aria-label="label">
    <button type="button" class="step-btn" :disabled="disabled || modelValue <= min" :aria-label="`Decrease ${label}`" @click="step(-1)">−</button>
    <span class="step-value" aria-live="polite">{{ display }}</span>
    <button type="button" class="step-btn" :disabled="disabled || modelValue >= max" :aria-label="`Increase ${label}`" @click="step(1)">+</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ modelValue: number; min: number; max: number; label: string; disabled?: boolean; format?: (v: number) => string }>(), {
  disabled: false,
  format: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const display = computed(() => (props.format ? props.format(props.modelValue) : String(props.modelValue)))

function step(delta: number): void {
  emit('update:modelValue', Math.max(props.min, Math.min(props.max, props.modelValue + delta)))
}
</script>
