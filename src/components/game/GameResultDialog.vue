<script setup lang="ts">
import { computed } from 'vue'
import type {
  GameResult,
  GameSettings
} from '../../types/go'
import BaseModal from './BaseModal.vue'

const props = defineProps<{
  open: boolean
  result: GameResult | null
  settings: GameSettings
}>()

const emit = defineEmits<{
  close: []
  export: []
  newGame: []
}>()

const winnerName = computed(() => {
  if (!props.result || props.result.winner === 'draw') {
    return '和棋'
  }

  return props.result.winner === 'black'
    ? props.settings.blackName
    : props.settings.whiteName
})
</script>

<template>
  <BaseModal
    :open="open"
    eyebrow="GAME COMPLETE"
    title="一局终了"
    description="胜负已定，棋谱与结果已保存到浏览器。"
    closable
    @close="emit('close')"
  >
    <div
      v-if="result"
      class="result-hero"
    >
      <span class="result-kicker">胜者</span>
      <strong>{{ winnerName }}</strong>
      <p>{{ result.summary }}</p>
    </div>

    <div
      v-if="result?.reason === 'score'"
      class="score-grid"
    >
      <div>
        <span>黑方</span>
        <b>{{ result.blackScore }}</b>
      </div>
      <div>
        <span>白方</span>
        <b>{{ result.whiteScore }}</b>
      </div>
    </div>

    <div class="result-actions">
      <button
        type="button"
        class="primary-action focus-ring"
        @click="emit('newGame')"
      >
        再开一局
      </button>
      <button
        type="button"
        class="secondary-action focus-ring"
        @click="emit('export')"
      >
        导出棋谱
      </button>
    </div>
  </BaseModal>
</template>

<style scoped>
.result-hero {
  display: grid;
  justify-items: center;
  padding: 8px 0 28px;
  text-align: center;
}

.result-kicker {
  color: var(--color-text-muted);
  font-size: 10px;
  letter-spacing: 0.28em;
}

.result-hero strong {
  margin-top: 8px;
  color: var(--color-accent-strong);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 36px;
  font-weight: 500;
  letter-spacing: 0.14em;
}

.result-hero p {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  letter-spacing: 0.12em;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 24px;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.score-grid div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  color: var(--color-text-muted);
  font-size: 11px;
  letter-spacing: 0.1em;
}

.score-grid div + div {
  border-left: 1px solid var(--color-border);
}

.score-grid b {
  color: var(--color-text-primary);
  font-family: Georgia, serif;
  font-size: 20px;
  font-weight: 400;
}

.result-actions {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 10px;
}

.primary-action,
.secondary-action {
  border-radius: 2px;
  padding: 13px 16px;
  font-size: 12px;
  letter-spacing: 0.16em;
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
</style>
