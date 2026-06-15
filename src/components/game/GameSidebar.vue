<script setup lang="ts">
import { computed } from 'vue'
import type {
  GameAction,
  GamePhase,
  GameSettings,
  GameSnapshot
} from '../../types/go'

const props = defineProps<{
  settings: GameSettings
  snapshot: GameSnapshot
  phase: GamePhase
  actions: readonly GameAction[]
  sgfMoveCount: number | null
  sgfMoveIndex: number
  isVariation: boolean
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
}>()

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
  border-left: 1px solid #36382f;
  padding: 4px 0 0 32px;
  animation: sidebar-arrive 700ms 80ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid #34362e;
}

.brand-mark {
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  border: 1px solid #8d3f34;
  color: #a74b3f;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 25px;
  transform: rotate(-3deg);
}

.brand-kicker,
.section-label {
  color: #8f8d7e;
  font-family: Georgia, serif;
  font-size: 9px;
  letter-spacing: 0.28em;
}

.brand-block h1 {
  margin-top: 4px;
  color: #eee7d8;
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
  color: #77776b;
  font-size: 10px;
  letter-spacing: 0.12em;
}

.turn-block strong {
  display: block;
  margin-top: 8px;
  color: #daba7a;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 29px;
  font-weight: 500;
  letter-spacing: 0.12em;
}

.turn-block p {
  margin-top: 5px;
  color: #77776b;
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
  border-top: 1px solid #34362e;
  border-bottom: 1px solid #34362e;
  padding: 14px 0;
}

.sgf-review-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #77776b;
  font-size: 9px;
  letter-spacing: 0.12em;
}

.sgf-review-title b {
  color: #b9af9d;
  font-family: Georgia, serif;
  font-size: 11px;
  font-weight: 400;
}

.sgf-slider {
  width: 100%;
  accent-color: #c8a76a;
}

.sgf-review-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.sgf-review-button {
  border: 1px solid #45473d;
  border-radius: 2px;
  padding: 7px 4px;
  color: #969487;
  font-size: 9px;
  letter-spacing: 0.08em;
}

.sgf-review-button:hover:not(:disabled) {
  border-color: #817a67;
  color: #eee7d8;
}

.sgf-review-button:disabled {
  cursor: not-allowed;
  opacity: 0.32;
}

.sgf-review-return {
  border-color: #756546;
  color: #c8a76a;
}

.player-card {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  border: 1px solid #3c3e35;
  border-radius: 3px;
  background: rgb(255 255 255 / 1.4%);
  padding: 13px 14px;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

.player-card-active {
  border-color: #8b7854;
  background: linear-gradient(90deg, rgb(200 167 106 / 9%), transparent 65%);
  transform: translateX(-5px);
}

.player-card-active::before {
  position: absolute;
  top: 11px;
  bottom: 11px;
  left: -1px;
  width: 2px;
  background: #c8a76a;
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
  color: #77776c;
  font-size: 9px;
  letter-spacing: 0.14em;
}

.player-copy strong {
  color: #d7d1c3;
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
  color: #b9af9d;
  font-family: Georgia, serif;
  font-size: 16px;
  font-weight: 400;
}

.rule-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 20px;
  border-top: 1px solid #34362e;
  border-bottom: 1px solid #34362e;
}

.rule-strip div {
  display: grid;
  gap: 3px;
  padding: 12px 0;
}

.rule-strip div + div {
  border-left: 1px solid #34362e;
  padding-left: 12px;
}

.rule-strip b {
  color: #aaa798;
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
  border: 1px solid #c8a76a;
  background: #c8a76a;
  color: #171711;
  font-weight: 700;
}

.control-primary:hover {
  background: #e0bf7e;
  transform: translateY(-1px);
}

.control-secondary {
  border: 1px solid #4b4d42;
  color: #aaa89b;
}

.control-secondary:hover:not(:disabled) {
  border-color: #817a67;
  color: #eee7d8;
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
  background: #34362e;
}

.quiet-action {
  background: #171814;
  padding: 10px;
  color: #8f8e82;
  font-size: 10px;
  letter-spacing: 0.1em;
  transition:
    background 160ms ease,
    color 160ms ease;
}

.quiet-action:hover {
  background: #22231d;
  color: #d5cdbc;
}

.quiet-action-danger:hover {
  color: #c87467;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding-top: 24px;
  color: #65665c;
  font-size: 9px;
  letter-spacing: 0.08em;
}

.sidebar-footer i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #81775e;
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
