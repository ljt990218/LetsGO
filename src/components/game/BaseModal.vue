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
  background:
    radial-gradient(circle at 50% 30%, rgb(40 42 34 / 42%), transparent 42%),
    rgb(7 8 6 / 84%);
  backdrop-filter: blur(14px);
}

.modal-card {
  position: relative;
  width: min(100%, 500px);
  overflow: hidden;
  border: 1px solid rgb(200 167 106 / 32%);
  border-radius: 4px;
  background:
    linear-gradient(145deg, rgb(37 39 32 / 98%), rgb(20 21 17 / 99%));
  box-shadow:
    0 32px 90px rgb(0 0 0 / 56%),
    inset 0 1px rgb(255 255 255 / 4%);
}

.modal-card::before {
  position: absolute;
  top: 0;
  left: 28px;
  width: 64px;
  height: 2px;
  background: #c8a76a;
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
  border: 1px solid #45463c;
  color: #aaa694;
  font-family: Georgia, serif;
  font-size: 20px;
  transition:
    border-color 160ms ease,
    color 160ms ease;
}

.modal-close:hover {
  border-color: #8b7956;
  color: #f0e8d7;
}

.modal-header {
  padding: 34px 38px 24px;
  border-bottom: 1px solid #34362e;
}

.modal-eyebrow {
  color: #c8a76a;
  font-family: Georgia, serif;
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.modal-title {
  margin-top: 9px;
  color: #f2ecdf;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.modal-description {
  margin-top: 9px;
  color: #9d9c8e;
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
