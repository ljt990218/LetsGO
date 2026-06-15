<script setup lang="ts">
import BaseModal from './BaseModal.vue'

defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel: string
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<template>
  <BaseModal
    :open="open"
    eyebrow="CONFIRM ACTION"
    :title="title"
    :description="description"
    closable
    @close="emit('cancel')"
  >
    <div class="confirm-actions">
      <button
        type="button"
        class="danger-action focus-ring"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
      <button
        type="button"
        class="secondary-action focus-ring"
        @click="emit('cancel')"
      >
        再想一手
      </button>
    </div>
  </BaseModal>
</template>

<style scoped>
.confirm-actions {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 10px;
}

.danger-action,
.secondary-action {
  border-radius: 2px;
  padding: 13px 16px;
  font-size: 12px;
  letter-spacing: 0.16em;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease;
}

.danger-action {
  border: 1px solid var(--color-danger-border);
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.danger-action:hover {
  background: var(--color-danger-hover);
}

.secondary-action {
  border: 1px solid var(--color-border-control);
  color: var(--color-text-secondary);
}

.secondary-action:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}
</style>
