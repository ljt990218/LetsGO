import type {
  BoardPoint,
  GameAction,
  GamePhase,
  GameResult,
  GameSettings,
  PersistedGame
} from '../types/go'

export const STORAGE_KEY = 'wgo.local-game.v1'

export interface PersistedGameReadResult {
  game: PersistedGame | null
  error: string | null
}

export function readPersistedGame(): PersistedGameReadResult {
  try {
    const content = localStorage.getItem(STORAGE_KEY)

    if (!content) {
      return {
        game: null,
        error: null
      }
    }

    const parsed: unknown = JSON.parse(content)
    if (!isPersistedGame(parsed)) {
      throw new Error('存档格式不正确')
    }

    return {
      game: parsed,
      error: null
    }
  } catch {
    clearPersistedGame()

    return {
      game: null,
      error: '本地存档已损坏，已为你清除'
    }
  }
}

export function writePersistedGame(game: PersistedGame): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
    return null
  } catch {
    return '无法写入本地存档，请检查浏览器存储权限'
  }
}

export function clearPersistedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts
  }
}

function isPersistedGame(value: unknown): value is PersistedGame {
  if (!isRecord(value) || value.version !== 1) {
    return false
  }

  return isGameSettings(value.settings)
    && Array.isArray(value.actions)
    && value.actions.every(isGameAction)
    && isGamePhase(value.phase)
    && Array.isArray(value.deadPoints)
    && value.deadPoints.every(isBoardPoint)
    && (value.result === null || isGameResult(value.result))
    && typeof value.savedAt === 'string'
    && !Number.isNaN(Date.parse(value.savedAt))
}

function isGameSettings(value: unknown): value is GameSettings {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.blackName === 'string'
    && typeof value.whiteName === 'string'
    && (value.boardSize === 9 || value.boardSize === 13 || value.boardSize === 19)
    && typeof value.komi === 'number'
    && Number.isFinite(value.komi)
}

function isGameAction(value: unknown): value is GameAction {
  if (!isRecord(value) || (value.color !== 'black' && value.color !== 'white')) {
    return false
  }

  if (value.type === 'pass') {
    return true
  }

  return value.type === 'play' && isBoardPoint(value)
}

function isBoardPoint(value: unknown): value is BoardPoint {
  return isRecord(value)
    && Number.isInteger(value.x)
    && Number.isInteger(value.y)
}

function isGamePhase(value: unknown): value is GamePhase {
  return value === 'playing' || value === 'scoring' || value === 'finished'
}

function isGameResult(value: unknown): value is GameResult {
  return isRecord(value)
    && (value.reason === 'score' || value.reason === 'resign')
    && (value.winner === 'black' || value.winner === 'white' || value.winner === 'draw')
    && isNullableFiniteNumber(value.blackScore)
    && isNullableFiniteNumber(value.whiteScore)
    && typeof value.margin === 'number'
    && Number.isFinite(value.margin)
    && typeof value.sgfResult === 'string'
    && typeof value.summary === 'string'
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
