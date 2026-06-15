<script setup lang="ts">
defineProps<{
  open: boolean
  eyebrow: string
  title: string
  description?: string
  closable?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="modal-backdrop"
        @click.self="closable && emit('close')"
      >
        <section
          class="modal-card"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <button
            v-if="closable"
            type="button"
            class="modal-close focus-ring"
            aria-label="关闭"
            @click="emit('close')"
          >
            ×
          </button>

          <header class="modal-header">
            <span class="modal-eyebrow">{{ eyebrow }}</span>
            <h2 class="modal-title">{{ title }}</h2>
            <p
              v-if="description"
              class="modal-description"
            >
              {{ description }}
            </p>
          </header>

          <div class="modal-content">
            <slot />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 32px;
  background: var(--background-modal-backdrop);
  backdrop-filter: blur(14px);
}

.modal-card {
  position: relative;
  width: min(100%, 500px);
  overflow: hidden;
  border: 1px solid var(--color-modal-border);
  border-radius: 4px;
  background: var(--background-modal-card);
  box-shadow: var(--shadow-modal);
}

.modal-card::before {
  position: absolute;
  top: 0;
  left: 28px;
  width: 64px;
  height: 2px;
  background: var(--color-accent);
  content: '';
}

.modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--color-modal-close-border);
  color: var(--color-text-secondary);
  font-family: Georgia, serif;
  font-size: 20px;
  transition:
    border-color 160ms ease,
    color 160ms ease;
}

.modal-close:hover {
  border-color: var(--color-border-hover);
  color: var(--color-modal-close-hover);
}

.modal-header {
  padding: 34px 38px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-eyebrow {
  color: var(--color-accent);
  font-family: Georgia, serif;
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.modal-title {
  margin-top: 9px;
  color: var(--color-text-strong);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.modal-description {
  margin-top: 9px;
  color: var(--color-modal-description);
  font-size: 13px;
  line-height: 1.7;
}

.modal-content {
  padding: 28px 38px 36px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition:
    opacity 200ms ease,
    transform 240ms ease;
}

.modal-enter-from,
.modal-leave-to,
.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  opacity: 0;
}

.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  transform: translateY(12px) scale(0.98);
}
</style>
