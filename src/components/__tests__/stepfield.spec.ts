import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StepField from '../StepField.vue'

describe('StepField', () => {
  it('increments and decrements via v-model', async () => {
    const wrapper = mount(StepField, {
      props: { modelValue: 2, min: 0, max: 4, label: 'Clue strength' },
    })
    const [minus, plus] = wrapper.findAll('.step-btn')
    await plus.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3])
    await minus.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([1])
  })

  it('clamps at bounds and disables buttons there', async () => {
    const wrapper = mount(StepField, {
      props: { modelValue: 4, min: 0, max: 4, label: 'Clue strength' },
    })
    const [minus, plus] = wrapper.findAll('.step-btn')
    expect(plus.attributes('disabled')).toBeDefined()
    await minus.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3])
    await wrapper.setProps({ modelValue: 0 })
    expect(minus.attributes('disabled')).toBeDefined()
    expect(plus.attributes('disabled')).toBeUndefined()
  })

  it('formats the displayed value', () => {
    const wrapper = mount(StepField, {
      props: { modelValue: 0, min: 0, max: 4, label: 'Extra clue rows', format: (v: number) => (v === 0 ? 'Tight' : `+${v}`) },
    })
    expect(wrapper.find('.step-value').text()).toBe('Tight')
  })

  it('disables everything when disabled', () => {
    const wrapper = mount(StepField, {
      props: { modelValue: 1, min: 0, max: 2, label: 'x', disabled: true },
    })
    for (const btn of wrapper.findAll('.step-btn')) expect(btn.attributes('disabled')).toBeDefined()
  })
})
