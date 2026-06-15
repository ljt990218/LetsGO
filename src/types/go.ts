export type StoneColor = 'black' | 'white'

export type BoardSize = 9 | 13 | 19

export type GamePhase = 'playing' | 'scoring' | 'finished'

export interface BoardPoint {
  x: number
  y: number
}

export interface GameSettings {
  blackName: string
  whiteName: string
  boardSize: BoardSize
  komi: number
}

export interface PlayAction extends BoardPoint {
  type: 'play'
  color: StoneColor
}

export interface PassAction {
  type: 'pass'
  color: StoneColor
}

export type GameAction = PlayAction | PassAction

export type GameWinner = StoneColor | 'draw'

export interface GameResult {
  reason: 'score' | 'resign'
  winner: GameWinner
  blackScore: number | null
  whiteScore: number | null
  margin: number
  sgfResult: string
  summary: string
}

export interface BoardIntersection extends BoardPoint {
  color: StoneColor | 'empty'
}

export interface GameSnapshot {
  currentPlayer: StoneColor
  moveNumber: number
  intersections: BoardIntersection[]
  blackCaptures: number
  whiteCaptures: number
  lastMove: PlayAction | null
  deadPoints: BoardPoint[]
  result: GameResult | null
}

export interface PersistedGame {
  version: 1
  settings: GameSettings
  actions: GameAction[]
  phase: GamePhase
  deadPoints: BoardPoint[]
  result: GameResult | null
  savedAt: string
}

export interface ParsedSgfGame {
  settings: GameSettings
  actions: GameAction[]
}
