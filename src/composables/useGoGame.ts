import {
  readonly,
  shallowRef
} from 'vue'
import type {
  BoardPoint,
  GameAction,
  GamePhase,
  GameResult,
  GameSettings,
  GameSnapshot,
  PersistedGame
} from '../types/go'
import {
  createGameEngine,
  createGameSnapshot,
  createResignResult,
  createScoreResult,
  replayGame,
  type GameEngine
} from '../services/gameEngine'
import {
  clearPersistedGame,
  readPersistedGame,
  writePersistedGame
} from '../services/gamePersistence'
import {
  parseSgfGame,
  stringifySgfGame
} from '../services/sgfAdapter'

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  blackName: '墨川',
  whiteName: '月白',
  boardSize: 19,
  komi: 7.5
}

export function useGoGame() {
  const settings = shallowRef<GameSettings>({ ...DEFAULT_GAME_SETTINGS })
  const actions = shallowRef<GameAction[]>([])
  const phase = shallowRef<GamePhase>('playing')
  const result = shallowRef<GameResult | null>(null)
  const notice = shallowRef('')
  const pendingSavedGame = shallowRef<PersistedGame | null>(null)
  const engine = shallowRef<GameEngine>(createGameEngine(settings.value))
  const snapshot = shallowRef<GameSnapshot>(createSnapshot())

  function inspectSavedGame(): boolean {
    const stored = readPersistedGame()
    if (stored.error) {
      notice.value = stored.error
    }

    pendingSavedGame.value = stored.game
    return Boolean(stored.game)
  }

  function resumeSavedGame(): boolean {
    if (!pendingSavedGame.value) {
      return false
    }

    try {
      replaceGame(pendingSavedGame.value)
      pendingSavedGame.value = null
      notice.value = '已恢复上次对局'
      return true
    } catch {
      pendingSavedGame.value = null
      clearPersistedGame()
      notice.value = '本地存档无法恢复，已为你清除'
      return false
    }
  }

  function discardSavedGame(): void {
    pendingSavedGame.value = null
    clearPersistedGame()
  }

  function startNewGame(nextSettings: GameSettings): void {
    const normalizedSettings = normalizeSettings(nextSettings)
    const nextGame = createGameEngine(normalizedSettings)

    engine.value = nextGame
    settings.value = normalizedSettings
    actions.value = []
    phase.value = 'playing'
    result.value = null
    pendingSavedGame.value = null
    syncAndPersist()
    notice.value = '新对局已开始'
  }

  function handleBoardPoint(point: BoardPoint): void {
    if (phase.value === 'playing') {
      playAt(point)
      return
    }

    if (phase.value === 'scoring') {
      toggleDeadAt(point)
    }
  }

  function playAt(point: BoardPoint): boolean {
    if (phase.value !== 'playing') {
      return false
    }

    const color = engine.value.currentPlayer()
    const accepted = engine.value.playAt(point.y, point.x, { render: false })

    if (!accepted) {
      notice.value = '此处不能落子'
      return false
    }

    actions.value = [
      ...actions.value,
      {
        type: 'play',
        color,
        x: point.x,
        y: point.y
      }
    ]
    syncAndPersist()
    return true
  }

  function pass(): void {
    if (phase.value !== 'playing') {
      return
    }

    const color = engine.value.currentPlayer()
    if (!engine.value.pass({ render: false })) {
      return
    }

    actions.value = [
      ...actions.value,
      {
        type: 'pass',
        color
      }
    ]
    phase.value = engine.value.isOver() ? 'scoring' : 'playing'
    syncAndPersist()

    if (phase.value === 'scoring') {
      notice.value = '双方连续停一手，请标记死子后确认数子'
    }
  }

  function undo(): void {
    if (phase.value !== 'playing' || actions.value.length === 0) {
      notice.value = '当前没有可以悔回的棋步'
      return
    }

    engine.value.undo()
    actions.value = actions.value.slice(0, -1)
    syncAndPersist()
  }

  function resumePlay(): void {
    if (phase.value !== 'scoring') {
      return
    }

    engine.value.undo()
    actions.value = actions.value.slice(0, -1)
    phase.value = 'playing'
    result.value = null
    syncAndPersist()
    notice.value = '已撤回最后一次停一手，继续对弈'
  }

  function toggleDeadAt(point: BoardPoint): void {
    if (phase.value !== 'scoring') {
      return
    }

    if (engine.value.intersectionAt(point.y, point.x).value === 'empty') {
      return
    }

    engine.value.toggleDeadAt(point.y, point.x, { render: false })
    syncAndPersist()
  }

  function confirmScore(): void {
    if (phase.value !== 'scoring') {
      return
    }

    const score = engine.value.score()
    result.value = createScoreResult(score.black, score.white)
    phase.value = 'finished'
    syncAndPersist()
  }

  function resign(): void {
    if (phase.value !== 'playing') {
      return
    }

    result.value = createResignResult(engine.value.currentPlayer())
    phase.value = 'finished'
    syncAndPersist()
  }

  function importSgf(contents: string): boolean {
    try {
      const parsed = parseSgfGame(contents)
      const nextGame = replayGame(parsed.settings, parsed.actions)

      engine.value = nextGame
      settings.value = parsed.settings
      actions.value = parsed.actions
      phase.value = 'playing'
      result.value = null
      pendingSavedGame.value = null
      syncAndPersist()
      notice.value = '已载入 SGF 主线，可从末手继续对弈'
      return true
    } catch (error) {
      notice.value = error instanceof Error ? error.message : 'SGF 导入失败'
      return false
    }
  }

  function exportSgf(): string {
    return stringifySgfGame(settings.value, actions.value, result.value)
  }

  function dismissNotice(): void {
    notice.value = ''
  }

  function showNotice(message: string): void {
    notice.value = message
  }

  function replaceGame(saved: PersistedGame): void {
    const nextGame = replayGame(saved.settings, saved.actions, saved.deadPoints)

    if (saved.phase === 'playing' && nextGame.isOver()) {
      throw new Error('存档对局阶段无效')
    }

    if (saved.phase === 'scoring' && !nextGame.isOver()) {
      throw new Error('存档计分阶段无效')
    }

    if (saved.phase === 'finished' && !saved.result) {
      throw new Error('存档缺少终局结果')
    }

    if (saved.phase !== 'finished' && saved.result) {
      throw new Error('存档结果与对局阶段不一致')
    }

    if (saved.result?.reason === 'score' && !nextGame.isOver()) {
      throw new Error('存档数子结果无效')
    }

    engine.value = nextGame
    settings.value = { ...saved.settings }
    actions.value = [...saved.actions]
    phase.value = saved.phase
    result.value = saved.result
    snapshot.value = createSnapshot()
  }

  function createSnapshot(): GameSnapshot {
    return createGameSnapshot(
      engine.value,
      actions.value,
      phase.value,
      result.value
    )
  }

  function syncAndPersist(): void {
    snapshot.value = createSnapshot()

    const saveError = writePersistedGame({
      version: 1,
      settings: settings.value,
      actions: actions.value,
      phase: phase.value,
      deadPoints: snapshot.value.deadPoints,
      result: result.value,
      savedAt: new Date().toISOString()
    })

    if (saveError) {
      notice.value = saveError
    }
  }

  return {
    settings: readonly(settings),
    actions: readonly(actions),
    phase: readonly(phase),
    result: readonly(result),
    snapshot: readonly(snapshot),
    notice: readonly(notice),
    pendingSavedGame: readonly(pendingSavedGame),
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
    dismissNotice,
    showNotice
  }
}

function normalizeSettings(settings: GameSettings): GameSettings {
  return {
    blackName: settings.blackName.trim() || '黑方',
    whiteName: settings.whiteName.trim() || '白方',
    boardSize: settings.boardSize,
    komi: Number(settings.komi)
  }
}
