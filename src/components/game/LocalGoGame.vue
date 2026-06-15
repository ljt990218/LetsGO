<script setup lang="ts">
import {
  onMounted,
  shallowRef,
  useTemplateRef
} from 'vue'
import type {
  BoardPoint,
  GameSettings
} from '../../types/go'
import { useGameSound } from '../../composables/useGameSound'
import { useGoGame } from '../../composables/useGoGame'
import { useTheme } from '../../composables/useTheme'
import ConfirmDialog from './ConfirmDialog.vue'
import GameResultDialog from './GameResultDialog.vue'
import GameSidebar from './GameSidebar.vue'
import GoBoard from './GoBoard.vue'
import NewGameDialog from './NewGameDialog.vue'
import ResumeGameDialog from './ResumeGameDialog.vue'

const {
  settings,
  actions,
  phase,
  result,
  snapshot,
  notice,
  pendingSavedGame,
  sgfActions,
  sgfMoveIndex,
  isVariation,
  inspectSavedGame,
  resumeSavedGame,
  discardSavedGame,
  startNewGame,
  handleBoardPoint,
  pass,
  undo,
  resumePlay,
  confirmScore,
  resign,
  importSgf,
  exportSgf,
  goToSgfMove,
  previousSgfMove,
  nextSgfMove,
  returnToSgfGame,
  dismissNotice,
  showNotice
} = useGoGame()
const {
  preference: themePreference,
  setThemePreference
} = useTheme()
const {
  preference: soundPreference,
  setPreference: setSoundPreference,
  playMoveSound
} = useGameSound()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const showNewGame = shallowRef(false)
const showResumeGame = shallowRef(false)
const showResignConfirm = shallowRef(false)
const showResult = shallowRef(false)

onMounted(() => {
  showResumeGame.value = inspectSavedGame()
  showNewGame.value = !showResumeGame.value
})

function handleStartGame(nextSettings: GameSettings): void {
  startNewGame(nextSettings)
  showNewGame.value = false
  showResult.value = false
}

function handleGameBoardPoint(point: BoardPoint): void {
  const result = handleBoardPoint(point)
  if (result) {
    playMoveSound(result === 'capture')
  }
}

function handleResumeGame(): void {
  const resumed = resumeSavedGame()
  showResumeGame.value = false
  showNewGame.value = !resumed
  showResult.value = resumed && phase.value === 'finished'
}

function handleDiscardAndCreate(): void {
  discardSavedGame()
  showResumeGame.value = false
  showNewGame.value = true
}

function handleConfirmScore(): void {
  confirmScore()
  showResult.value = true
}

function handleConfirmResign(): void {
  resign()
  showResignConfirm.value = false
  showResult.value = true
}

function triggerImport(): void {
  fileInput.value?.click()
}

function createSgfFileName(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}-${settings.value.blackName}-${settings.value.whiteName}.sgf`
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  try {
    const imported = importSgf(await file.text())
    if (imported) {
      showResult.value = false
    }
  } catch {
    showNotice('无法读取 SGF 文件')
  }
}

function downloadSgf(): void {
  const content = exportSgf()
  const url = URL.createObjectURL(new Blob([content], {
    type: 'application/x-go-sgf;charset=utf-8'
  }))
  const link = document.createElement('a')
  link.href = url
  link.download = createSgfFileName()
  link.click()
  URL.revokeObjectURL(url)
}

function openNewGameFromResult(): void {
  showResult.value = false
  showNewGame.value = true
}
</script>

<template>
  <main class="local-game-shell">
    <div class="ambient-line ambient-line-left" />
    <div class="ambient-line ambient-line-right" />

    <section class="game-layout">
      <div class="board-column">
        <div class="board-caption">
          <div>
            <span>一局清谈</span>
            <b>落子无悔，胜负由心</b>
          </div>
          <p>LOCAL MATCH · AUTOSAVED</p>
        </div>

        <GoBoard
          :snapshot="snapshot"
          :phase="phase"
          @point="handleGameBoardPoint"
        />
      </div>

      <GameSidebar
        :settings="settings"
        :snapshot="snapshot"
        :phase="phase"
        :actions="actions"
        :sgf-move-count="sgfActions?.length ?? null"
        :sgf-move-index="sgfMoveIndex"
        :is-variation="isVariation"
        :theme-preference="themePreference"
        :sound-preference="soundPreference"
        @pass="pass"
        @undo="undo"
        @resume-play="resumePlay"
        @confirm-score="handleConfirmScore"
        @resign="showResignConfirm = true"
        @new-game="showNewGame = true"
        @import-sgf="triggerImport"
        @export-sgf="downloadSgf"
        @go-to-sgf-move="goToSgfMove"
        @previous-sgf-move="previousSgfMove"
        @next-sgf-move="nextSgfMove"
        @return-to-sgf-game="returnToSgfGame"
        @show-result="showResult = true"
        @update-theme="setThemePreference"
        @update-sound="setSoundPreference"
      />
    </section>

    <input
      ref="fileInput"
      class="hidden"
      type="file"
      accept=".sgf,application/x-go-sgf,text/plain"
      @change="handleFileChange"
    >

    <Transition name="toast">
      <button
        v-if="notice"
        type="button"
        class="notice-toast focus-ring"
        @click="dismissNotice"
      >
        <span>{{ notice }}</span>
        <b>关闭</b>
      </button>
    </Transition>

    <NewGameDialog
      :open="showNewGame"
      :initial-settings="settings"
      @close="showNewGame = false"
      @start="handleStartGame"
    />

    <ResumeGameDialog
      :open="showResumeGame"
      :saved-game="pendingSavedGame"
      @resume="handleResumeGame"
      @new-game="handleDiscardAndCreate"
    />

    <ConfirmDialog
      :open="showResignConfirm"
      title="确认认输"
      description="认输后本局立即结束，并将胜负结果写入棋谱。"
      confirm-label="确认认输"
      @cancel="showResignConfirm = false"
      @confirm="handleConfirmResign"
    />

    <GameResultDialog
      :open="showResult"
      :result="result"
      :settings="settings"
      @close="showResult = false"
      @export="downloadSgf"
      @new-game="openNewGameFromResult"
    />
  </main>
</template>

<style scoped>
.local-game-shell {
  position: relative;
  min-width: 1120px;
  min-height: 100vh;
  overflow: hidden;
  background: var(--background-shell);
  color: var(--color-text-primary);
  transition:
    background 180ms ease,
    color 180ms ease;
}

.local-game-shell::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    repeating-linear-gradient(
      102deg,
      transparent 0,
      transparent 42px,
      var(--background-shell-texture) 43px,
      transparent 44px
    );
  content: '';
  opacity: 0.7;
}

.game-layout {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(620px, 1fr) 360px;
  align-items: center;
  gap: clamp(52px, 6vw, 110px);
  padding: 32px clamp(38px, 5vw, 84px);
}

.board-column {
  display: grid;
  justify-items: center;
  gap: 12px;
}

.board-caption {
  display: flex;
  width: min(77vh, calc(100vw - 470px));
  min-width: 580px;
  align-items: end;
  justify-content: space-between;
  padding: 0 2px;
}

.board-caption div {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.board-caption span,
.board-caption p {
  color: var(--color-caption);
  font-size: 8px;
  letter-spacing: 0.24em;
}

.board-caption b {
  color: var(--color-caption-strong);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.14em;
}

.ambient-line {
  position: absolute;
  z-index: 0;
  width: 1px;
  background: linear-gradient(transparent, var(--color-ambient-line), transparent);
}

.ambient-line-left {
  top: 0;
  bottom: 0;
  left: 26px;
}

.ambient-line-right {
  top: 16%;
  right: 24px;
  bottom: 16%;
}

.notice-toast {
  position: fixed;
  z-index: 80;
  top: 24px;
  left: 50%;
  display: flex;
  min-width: 320px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border: 1px solid var(--color-toast-border);
  border-radius: 2px;
  background: var(--background-toast);
  padding: 12px 14px 12px 16px;
  color: var(--color-toast-text);
  font-size: 11px;
  letter-spacing: 0.08em;
  box-shadow: var(--shadow-toast);
  transform: translateX(-50%);
}

.notice-toast b {
  color: var(--color-accent);
  font-size: 9px;
  font-weight: 500;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px);
}
</style>
