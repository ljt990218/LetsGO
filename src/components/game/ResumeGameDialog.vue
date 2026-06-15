<script setup lang="ts">
import type { PersistedGame } from '../../types/go'
import BaseModal from './BaseModal.vue'

defineProps<{
  open: boolean
  savedGame: PersistedGame | null
}>()

const emit = defineEmits<{
  resume: []
  newGame: []
}>()

function formatSavedAt(value: string | undefined): string {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
</script>

<template>
  <BaseModal
    :open="open"
    eyebrow="UNFINISHED MATCH"
    title="棋局尚温"
    description="浏览器中保存着上一盘棋，你可以接着落子，或另开新局。"
  >
    <div
      v-if="savedGame"
      class="saved-summary"
    >
      <div class="saved-player">
        <i class="saved-stone saved-stone-black" />
        <span>{{ savedGame.settings.blackName }}</span>
      </div>
      <span class="saved-versus">对</span>
      <div class="saved-player">
        <i class="saved-stone saved-stone-white" />
        <span>{{ savedGame.settings.whiteName }}</span>
      </div>
    </div>

    <div
      v-if="savedGame"
      class="saved-meta"
    >
      <span>{{ savedGame.settings.boardSize }} 路</span>
      <span>第 {{ savedGame.actions.length }} 手</span>
      <span>{{ formatSavedAt(savedGame.savedAt) }}</span>
    </div>

    <div class="resume-actions">
      <button
        type="button"
        class="primary-action focus-ring"
        @click="emit('resume')"
      >
        继续对弈
      </button>
      <button
        type="button"
        class="secondary-action focus-ring"
        @click="emit('newGame')"
      >
        另开新局
      </button>
    </div>
  </BaseModal>
</template>

<style scoped>
.saved-summary {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 18px;
  padding: 22px 0;
}

.saved-player {
  display: grid;
  justify-items: center;
  gap: 10px;
  color: var(--color-text-primary);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 18px;
  letter-spacing: 0.12em;
}

.saved-stone {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.saved-stone-black {
  background: radial-gradient(circle at 32% 28%, #555, #060606 62%);
  box-shadow: 0 7px 14px rgb(0 0 0 / 44%);
}

.saved-stone-white {
  border: 1px solid #b9b6aa;
  background: radial-gradient(circle at 32% 28%, #fff, #c9c5b9 68%);
  box-shadow: 0 7px 14px rgb(0 0 0 / 30%);
}

.saved-versus {
  color: var(--color-text-subtle);
  font-size: 12px;
}

.saved-meta {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-bottom: 28px;
  color: var(--color-text-muted);
  font-size: 11px;
  letter-spacing: 0.1em;
}

.saved-meta span + span::before {
  margin-right: 18px;
  color: var(--color-text-faint);
  content: '·';
}

.resume-actions {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 10px;
}

.primary-action,
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

.primary-action {
  border: 1px solid var(--color-accent);
  background: var(--color-accent);
  color: var(--color-accent-on);
  font-weight: 700;
}

.secondary-action {
  border: 1px solid var(--color-border-control);
  color: var(--color-text-secondary);
}

.primary-action:hover {
  background: var(--color-accent-hover);
}

.secondary-action:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}
</style>
