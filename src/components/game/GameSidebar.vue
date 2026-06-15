<script setup lang="ts">
import { computed } from 'vue'
import type {
  GameAction,
  GamePhase,
  GameSettings,
  GameSnapshot
} from '../../types/go'
import type { SoundPreference } from '../../composables/useGameSound'
import type { ThemePreference } from '../../composables/useTheme'

const props = defineProps<{
  settings: GameSettings
  snapshot: GameSnapshot
  phase: GamePhase
  actions: readonly GameAction[]
  sgfMoveCount: number | null
  sgfMoveIndex: number
  isVariation: boolean
  themePreference: ThemePreference
  soundPreference: SoundPreference
}>()

const emit = defineEmits<{
  pass: []
  undo: []
  resumePlay: []
  confirmScore: []
  resign: []
  newGame: []
  importSgf: []
  exportSgf: []
  goToSgfMove: [moveIndex: number]
  previousSgfMove: []
  nextSgfMove: []
  returnToSgfGame: []
  showResult: []
  updateTheme: [preference: ThemePreference]
  updateSound: [preference: SoundPreference]
}>()

const themeOptions: ReadonlyArray<{
  value: ThemePreference
  label: string
}> = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '系统' }
]

const soundOptions: ReadonlyArray<{
  value: SoundPreference
  label: string
}> = [
  { value: 'random', label: '随机' },
  { value: 'stone1', label: '落子声 1' },
  { value: 'stone2', label: '落子声 2' },
  { value: 'stone3', label: '落子声 3' },
  { value: 'stone4', label: '落子声 4' },
  { value: 'stone5', label: '落子声 5' },
  { value: 'off', label: '关闭' }
]

const phaseLabel = computed(() => {
  if (props.phase === 'scoring') {
    return '终局数子'
  }

  if (props.phase === 'finished') {
    return '本局已结束'
  }

  return `${props.snapshot.currentPlayer === 'black' ? '黑方' : '白方'}落子`
})

const lastActionLabel = computed(() => {
  const action = props.actions[props.actions.length - 1]
  if (!action) {
    return '静候第一手'
  }

  if (action.type === 'pass') {
    return `${action.color === 'black' ? '黑方' : '白方'}停一手`
  }

  return `落子 ${toCoordinate(action.x, action.y)}`
})

const currentMoveLabel = computed(() => {
  if (props.isVariation) {
    return `变化图 · 第 ${props.snapshot.moveNumber} 手`
  }

  return `第 ${props.snapshot.moveNumber} 手`
})

function handleSgfMoveInput(event: Event): void {
  emit('goToSgfMove', Number((event.target as HTMLInputElement).value))
}

function handleSoundInput(event: Event): void {
  emit('updateSound', (event.target as HTMLSelectElement).value as SoundPreference)
}

function toCoordinate(x: number, y: number): string {
  const letters = 'ABCDEFGHJKLMNOPQRST'
  return `${letters[x]}${props.settings.boardSize - y}`
}
</script>

<template>
  <aside class="game-sidebar">
    <header class="brand-block">
      <div class="brand-mark">
        弈
      </div>
      <div>
        <p class="brand-kicker">LOCAL GO ROOM</p>
        <h1>松烟棋室</h1>
      </div>
    </header>

    <section class="turn-block">
      <div class="turn-line">
        <span class="section-label">此刻</span>
        <span class="move-count">{{ currentMoveLabel }}</span>
      </div>
      <strong>{{ phaseLabel }}</strong>
      <p>{{ lastActionLabel }}</p>
    </section>

    <section
      v-if="sgfMoveCount !== null"
      class="sgf-review"
    >
      <div class="sgf-review-title">
        <span>棋谱进度</span>
        <b>{{ sgfMoveIndex }} / {{ sgfMoveCount }}</b>
      </div>
      <input
        class="sgf-slider"
        type="range"
        min="0"
        :max="sgfMoveCount"
        :value="sgfMoveIndex"
        aria-label="选择棋谱已下步数"
        @input="handleSgfMoveInput"
      >
      <div class="sgf-review-actions">
        <button
          type="button"
          class="sgf-review-button focus-ring"
          :disabled="sgfMoveIndex === 0"
          @click="emit('previousSgfMove')"
        >
          上一步
        </button>
        <button
          type="button"
          class="sgf-review-button focus-ring"
          :disabled="sgfMoveIndex === sgfMoveCount"
          @click="emit('nextSgfMove')"
        >
          下一步
        </button>
        <button
          type="button"
          class="sgf-review-button sgf-review-return focus-ring"
          :disabled="!isVariation"
          @click="emit('returnToSgfGame')"
        >
          回实战
        </button>
      </div>
    </section>

    <section class="players">
      <article
        class="player-card"
        :class="{ 'player-card-active': phase === 'playing' && snapshot.currentPlayer === 'black' }"
      >
        <i class="player-stone player-stone-black" />
        <div class="player-copy">
          <span>黑方</span>
          <strong>{{ settings.blackName }}</strong>
        </div>
        <div class="capture-count">
          <span>提子</span>
          <b>{{ snapshot.blackCaptures }}</b>
        </div>
      </article>

      <article
        class="player-card"
        :class="{ 'player-card-active': phase === 'playing' && snapshot.currentPlayer === 'white' }"
      >
        <i class="player-stone player-stone-white" />
        <div class="player-copy">
          <span>白方</span>
          <strong>{{ settings.whiteName }}</strong>
        </div>
        <div class="capture-count">
          <span>提子</span>
          <b>{{ snapshot.whiteCaptures }}</b>
        </div>
      </article>
    </section>

    <section class="rule-strip">
      <div>
        <span>规则</span>
        <b>中国规则</b>
      </div>
      <div>
        <span>棋盘</span>
        <b>{{ settings.boardSize }} 路</b>
      </div>
      <div>
        <span>贴目</span>
        <b>{{ settings.komi }}</b>
      </div>
    </section>

    <section class="primary-controls">
      <template v-if="phase === 'playing'">
        <button
          type="button"
          class="control-primary focus-ring"
          @click="emit('pass')"
        >
          停一手
        </button>
        <button
          type="button"
          class="control-secondary focus-ring"
          :disabled="actions.length === 0"
          @click="emit('undo')"
        >
          悔棋
        </button>
      </template>

      <template v-else-if="phase === 'scoring'">
        <button
          type="button"
          class="control-primary focus-ring"
          @click="emit('confirmScore')"
        >
          确认数子
        </button>
        <button
          type="button"
          class="control-secondary focus-ring"
          @click="emit('resumePlay')"
        >
          继续对弈
        </button>
      </template>

      <template v-else>
        <button
          type="button"
          class="control-primary focus-ring"
          @click="emit('showResult')"
        >
          查看结果
        </button>
        <button
          type="button"
          class="control-secondary focus-ring"
          @click="emit('newGame')"
        >
          再开一局
        </button>
      </template>
    </section>

    <nav class="quiet-actions">
      <button
        type="button"
        class="quiet-action focus-ring"
        @click="emit('newGame')"
      >
        新对局
      </button>
      <button
        type="button"
        class="quiet-action focus-ring"
        @click="emit('importSgf')"
      >
        导入 SGF
      </button>
      <button
        type="button"
        class="quiet-action focus-ring"
        @click="emit('exportSgf')"
      >
        导出 SGF
      </button>
      <button
        v-if="phase === 'playing'"
        type="button"
        class="quiet-action quiet-action-danger focus-ring"
        @click="emit('resign')"
      >
        认输
      </button>
    </nav>

    <section class="theme-switcher">
      <span>界面主题</span>
      <div class="theme-options">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          class="theme-option focus-ring"
          :class="{ 'theme-option-active': themePreference === option.value }"
          :aria-pressed="themePreference === option.value"
          @click="emit('updateTheme', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section class="theme-switcher">
      <span>对局音效</span>
      <select
        class="sound-select focus-ring"
        :value="soundPreference"
        aria-label="选择落子音效"
        @change="handleSoundInput"
      >
        <option
          v-for="option in soundOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </section>

    <footer class="sidebar-footer">
      <span>自动保存已开启</span>
      <i />
      <span>数据仅留在此浏览器</span>
    </footer>
  </aside>
</template>

<style scoped>
.game-sidebar {
  display: flex;
  width: 360px;
  min-height: min(760px, calc(100vh - 64px));
  flex-direction: column;
  border-left: 1px solid var(--color-border);
  padding: 4px 0 0 32px;
  animation: sidebar-arrive 700ms 80ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.brand-mark {
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  border: 1px solid var(--color-brand-border);
  color: var(--color-brand);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 25px;
  transform: rotate(-3deg);
}

.brand-kicker,
.section-label {
  color: var(--color-text-muted);
  font-family: Georgia, serif;
  font-size: 9px;
  letter-spacing: 0.28em;
}

.brand-block h1 {
  margin-top: 4px;
  color: var(--color-text-primary);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.16em;
}

.turn-block {
  padding: 28px 0 24px;
}

.turn-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.move-count {
  color: var(--color-text-subtle);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.turn-block strong {
  display: block;
  margin-top: 8px;
  color: var(--color-accent-strong);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 29px;
  font-weight: 500;
  letter-spacing: 0.12em;
}

.turn-block p {
  margin-top: 5px;
  color: var(--color-text-subtle);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.players {
  display: grid;
  gap: 8px;
}

.sgf-review {
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: 14px 0;
}

.sgf-review-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text-subtle);
  font-size: 9px;
  letter-spacing: 0.12em;
}

.sgf-review-title b {
  color: var(--color-accent-soft);
  font-family: Georgia, serif;
  font-size: 11px;
  font-weight: 400;
}

.sgf-slider {
  width: 100%;
  accent-color: var(--color-accent);
}

.sgf-review-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.sgf-review-button {
  border: 1px solid var(--color-border-control);
  border-radius: 2px;
  padding: 7px 4px;
  color: var(--color-text-muted);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.sgf-review-button:hover:not(:disabled) {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

.sgf-review-button:disabled {
  cursor: not-allowed;
  opacity: 0.32;
}

.sgf-review-return {
  border-color: var(--color-border-active);
  color: var(--color-accent);
}

.player-card {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: 3px;
  background: var(--background-player-card);
  padding: 13px 14px;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

.player-card-active {
  border-color: var(--color-border-active);
  background: var(--background-player-active);
  transform: translateX(-5px);
}

.player-card-active::before {
  position: absolute;
  top: 11px;
  bottom: 11px;
  left: -1px;
  width: 2px;
  background: var(--color-accent);
  content: '';
}

.player-stone {
  width: 29px;
  height: 29px;
  border-radius: 50%;
}

.player-stone-black {
  background: radial-gradient(circle at 32% 28%, #555, #050505 62%);
  box-shadow: 0 6px 12px rgb(0 0 0 / 48%);
}

.player-stone-white {
  border: 1px solid #c2bfb3;
  background: radial-gradient(circle at 32% 28%, #fff, #c9c5b9 68%);
  box-shadow: 0 6px 12px rgb(0 0 0 / 30%);
}

.player-copy {
  display: grid;
  gap: 2px;
}

.player-copy span,
.capture-count span,
.rule-strip span {
  color: var(--color-text-subtle);
  font-size: 9px;
  letter-spacing: 0.14em;
}

.player-copy strong {
  color: var(--color-text-primary);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.12em;
}

.capture-count {
  display: grid;
  justify-items: end;
  gap: 1px;
}

.capture-count b {
  color: var(--color-accent-soft);
  font-family: Georgia, serif;
  font-size: 16px;
  font-weight: 400;
}

.rule-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 20px;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.rule-strip div {
  display: grid;
  gap: 3px;
  padding: 12px 0;
}

.rule-strip div + div {
  border-left: 1px solid var(--color-border);
  padding-left: 12px;
}

.rule-strip b {
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
}

.primary-controls {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 8px;
  margin-top: 22px;
}

.control-primary,
.control-secondary {
  border-radius: 2px;
  padding: 13px 12px;
  font-size: 12px;
  letter-spacing: 0.17em;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.control-primary {
  border: 1px solid var(--color-accent);
  background: var(--color-accent);
  color: var(--color-accent-on);
  font-weight: 700;
}

.control-primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

.control-secondary {
  border: 1px solid var(--color-border-control);
  color: var(--color-text-secondary);
}

.control-secondary:hover:not(:disabled) {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

.control-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.quiet-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  margin-top: 20px;
  background: var(--color-border);
}

.quiet-action {
  background: var(--background-quiet-action);
  padding: 10px;
  color: var(--color-text-muted);
  font-size: 10px;
  letter-spacing: 0.1em;
  transition:
    background 160ms ease,
    color 160ms ease;
}

.quiet-action:hover {
  background: var(--background-quiet-action-hover);
  color: var(--color-text-primary);
}

.quiet-action-danger:hover {
  color: var(--color-danger);
}

.theme-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  color: var(--color-text-faint);
  font-size: 9px;
  letter-spacing: 0.1em;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  width: 156px;
  background: var(--color-border);
}

.sound-select {
  width: 156px;
  border: 1px solid var(--color-border);
  border-radius: 0;
  background: var(--background-quiet-action);
  padding: 7px 8px;
  color: var(--color-text-muted);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.theme-option {
  background: var(--background-quiet-action);
  padding: 7px 5px;
  color: var(--color-text-muted);
  font-size: 9px;
  letter-spacing: 0.08em;
  transition:
    background 160ms ease,
    color 160ms ease;
}

.theme-option:hover {
  background: var(--background-quiet-action-hover);
  color: var(--color-text-primary);
}

.theme-option-active,
.theme-option-active:hover {
  background: var(--color-accent);
  color: var(--color-accent-on);
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding-top: 24px;
  color: var(--color-text-faint);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.sidebar-footer i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-border-hover);
}

@keyframes sidebar-arrive {
  from {
    opacity: 0;
    transform: translateX(18px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
