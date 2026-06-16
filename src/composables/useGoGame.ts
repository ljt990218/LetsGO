import {
  readonly,
  shallowRef,
  watch
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

export type BoardPointResult = 'play' | 'capture' | null

export function useGoGame() {
  const settings = shallowRef<GameSettings>({ ...DEFAULT_GAME_SETTINGS })
  const actions = shallowRef<GameAction[]>([])
  const phase = shallowRef<GamePhase>('playing')
  const result = shallowRef<GameResult | null>(null)
  const notice = shallowRef('')
  const pendingSavedGame = shallowRef<PersistedGame | null>(null)
  const sgfActions = shallowRef<GameAction[] | null>(null)
  const sgfMoveIndex = shallowRef(0)
  const isVariation = shallowRef(false)
  const variationStartMoveIndex = shallowRef<number | null>(null)
  const engine = shallowRef<GameEngine>(createGameEngine(settings.value))
  const snapshot = shallowRef<GameSnapshot>(createSnapshot())

  watch(notice, (message, _, onCleanup) => {
    if (!message) {
      return
    }

    const timer = window.setTimeout(dismissNotice, 3000)
    onCleanup(() => window.clearTimeout(timer))
  })

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
    clearSgfReview()
    syncAndPersist()
    notice.value = '新对局已开始'
  }

  function handleBoardPoint(point: BoardPoint): BoardPointResult {
    if (phase.value === 'playing') {
      return playAt(point)
    }

    if (phase.value === 'scoring') {
      toggleDeadAt(point)
    }

    return null
  }

  function playAt(point: BoardPoint): BoardPointResult {
    if (phase.value !== 'playing') {
      return null
    }

    const color = engine.value.currentPlayer()
    const previousState = engine.value.currentState()
    const previousCaptures = previousState.blackStonesCaptured
      + previousState.whiteStonesCaptured
    const accepted = engine.value.playAt(point.y, point.x, { render: false })

    if (!accepted) {
      notice.value = '此处不能落子'
      return null
    }

    const nextState = engine.value.currentState()
    const nextCaptures = nextState.blackStonesCaptured
      + nextState.whiteStonesCaptured
    actions.value = [
      ...actions.value,
      {
        type: 'play',
        color,
        x: point.x,
        y: point.y
      }
    ]
    syncAfterAction()
    return nextCaptures > previousCaptures ? 'capture' : 'play'
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
    syncAfterAction()

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
    syncAfterAction()
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
      actions.value = [...parsed.actions]
      phase.value = 'playing'
      result.value = null
      pendingSavedGame.value = null
      sgfActions.value = [...parsed.actions]
      sgfMoveIndex.value = parsed.actions.length
      isVariation.value = false
      variationStartMoveIndex.value = null
      syncAndPersist()
      notice.value = '已载入 SGF 主线，可从末手继续对弈'
      return true
    } catch (error) {
      notice.value = error instanceof Error ? error.message : 'SGF 导入失败'
      return false
    }
  }

  function exportSgf(): string {
    return stringifySgfGame(
      settings.value,
      sgfActions.value ?? actions.value,
      isSgfReviewPosition() ? null : result.value
    )
  }

  function goToSgfMove(moveIndex: number): void {
    if (!sgfActions.value) {
      return
    }

    const nextIndex = Math.min(
      Math.max(Math.trunc(moveIndex), 0),
      sgfActions.value.length
    )

    engine.value = replayGame(settings.value, sgfActions.value.slice(0, nextIndex))
    actions.value = sgfActions.value.slice(0, nextIndex)
    sgfMoveIndex.value = nextIndex
    isVariation.value = false
    variationStartMoveIndex.value = null
    phase.value = 'playing'
    result.value = null
    snapshot.value = createSnapshot()
  }

  function previousSgfMove(): void {
    goToSgfMove(sgfMoveIndex.value - 1)
  }

  function nextSgfMove(): void {
    goToSgfMove(sgfMoveIndex.value + 1)
  }

  function returnToSgfGame(): void {
    if (!sgfActions.value || variationStartMoveIndex.value === null) {
      return
    }

    goToSgfMove(variationStartMoveIndex.value)
    notice.value = '已回到试下前的实战位置'
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
    clearSgfReview()
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

    if (isSgfReviewPosition()) {
      return
    }

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

  function syncAfterAction(): void {
    if (!sgfActions.value) {
      syncAndPersist()
      return
    }

    if (isVariation.value || sgfMoveIndex.value < sgfActions.value.length) {
      if (!isVariation.value) {
        variationStartMoveIndex.value = sgfMoveIndex.value
      }

      isVariation.value = true
      snapshot.value = createSnapshot()
      return
    }

    sgfActions.value = [...actions.value]
    sgfMoveIndex.value = sgfActions.value.length
    syncAndPersist()
  }

  function clearSgfReview(): void {
    sgfActions.value = null
    sgfMoveIndex.value = 0
    isVariation.value = false
    variationStartMoveIndex.value = null
  }

  function isSgfReviewPosition(): boolean {
    const mainline = sgfActions.value
    return mainline !== null
      && (isVariation.value || sgfMoveIndex.value < mainline.length)
  }

  return {
    settings: readonly(settings),
    actions: readonly(actions),
    phase: readonly(phase),
    result: readonly(result),
    snapshot: readonly(snapshot),
    notice: readonly(notice),
    pendingSavedGame: readonly(pendingSavedGame),
    sgfActions: readonly(sgfActions),
    sgfMoveIndex: readonly(sgfMoveIndex),
    isVariation: readonly(isVariation),
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
