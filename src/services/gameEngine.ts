import { Game as TenukiGame, type TenukiPoint } from 'tenuki'
import type {
  BoardPoint,
  GameAction,
  GamePhase,
  GameResult,
  GameSettings,
  GameSnapshot,
  PlayAction,
  StoneColor
} from '../types/go'

export type GameEngine = TenukiGame

export function createGameEngine(settings: GameSettings): GameEngine {
  return new TenukiGame({
    boardSize: settings.boardSize,
    scoring: 'area',
    koRule: 'positional-superko',
    komi: settings.komi
  })
}

export function replayGame(
  settings: GameSettings,
  actions: readonly GameAction[],
  deadPoints: readonly BoardPoint[] = []
): GameEngine {
  const game = createGameEngine(settings)

  for (const action of actions) {
    if (game.currentPlayer() !== action.color) {
      throw new Error('棋谱落子顺序不合法')
    }

    const accepted = action.type === 'pass'
      ? game.pass({ render: false })
      : game.playAt(action.y, action.x, { render: false })

    if (!accepted) {
      throw new Error('棋谱包含不合法落子')
    }
  }

  for (const point of deadPoints) {
    const marked = game.toggleDeadAt(point.y, point.x, { render: false })
    if (!marked) {
      throw new Error('终局死子标记无效')
    }
  }

  return game
}

export function createGameSnapshot(
  game: GameEngine,
  actions: readonly GameAction[],
  phase: GamePhase,
  result: GameResult | null
): GameSnapshot {
  const state = game.currentState()
  const deadPoints = phase === 'playing'
    ? []
    : game.deadStones().map(point => ({ x: point.x, y: point.y }))

  return {
    currentPlayer: game.currentPlayer(),
    moveNumber: state.moveNumber,
    intersections: state.intersections.map(mapIntersection),
    blackCaptures: state.whiteStonesCaptured,
    whiteCaptures: state.blackStonesCaptured,
    lastMove: findLastMove(actions),
    deadPoints,
    result
  }
}

function mapIntersection(point: TenukiPoint) {
  return {
    x: point.x,
    y: point.y,
    color: point.value
  }
}

function findLastMove(actions: readonly GameAction[]): PlayAction | null {
  for (let index = actions.length - 1; index >= 0; index -= 1) {
    const action = actions[index]
    if (action.type === 'play') {
      return action
    }
  }

  return null
}

export function createScoreResult(
  blackScore: number,
  whiteScore: number
): GameResult {
  const margin = Math.abs(blackScore - whiteScore)

  if (blackScore === whiteScore) {
    return {
      reason: 'score',
      winner: 'draw',
      blackScore,
      whiteScore,
      margin: 0,
      sgfResult: '0',
      summary: '双方和棋'
    }
  }

  const winner: StoneColor = blackScore > whiteScore ? 'black' : 'white'
  const winnerLabel = winner === 'black' ? '黑方' : '白方'

  return {
    reason: 'score',
    winner,
    blackScore,
    whiteScore,
    margin,
    sgfResult: `${winner === 'black' ? 'B' : 'W'}+${formatScore(margin)}`,
    summary: `${winnerLabel}胜 ${formatScore(margin)} 子`
  }
}

export function createResignResult(resigningPlayer: StoneColor): GameResult {
  const winner: StoneColor = resigningPlayer === 'black' ? 'white' : 'black'

  return {
    reason: 'resign',
    winner,
    blackScore: null,
    whiteScore: null,
    margin: 0,
    sgfResult: `${winner === 'black' ? 'B' : 'W'}+R`,
    summary: `${winner === 'black' ? '黑方' : '白方'}中盘胜`
  }
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
