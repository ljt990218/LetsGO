declare module 'tenuki' {
  export interface TenukiPoint {
    x: number
    y: number
    value: 'black' | 'white' | 'empty'
  }

  export interface TenukiState {
    moveNumber: number
    intersections: TenukiPoint[]
    blackStonesCaptured: number
    whiteStonesCaptured: number
  }

  export interface TenukiGameOptions {
    boardSize: number
    scoring: 'area' | 'territory' | 'equivalence'
    koRule: 'simple' | 'positional-superko' | 'situational-superko' | 'natural-situational-superko'
    komi: number
  }

  export class Game {
    constructor(options: TenukiGameOptions)
    playAt(y: number, x: number, options?: { render?: boolean }): boolean
    pass(options?: { render?: boolean }): boolean
    undo(): void
    isOver(): boolean
    currentPlayer(): 'black' | 'white'
    currentState(): TenukiState
    intersectionAt(y: number, x: number): TenukiPoint
    toggleDeadAt(y: number, x: number, options?: { render?: boolean }): boolean | undefined
    deadStones(): Array<{ x: number, y: number }>
    score(): { black: number, white: number }
  }
}

declare module '@sabaki/sgf' {
  export interface SgfNode {
    id: string | number
    data: Record<string, string[]>
    parentId: string | number | null
    children: SgfNode[]
  }

  export function parse(contents: string): SgfNode[]
  export function stringify(
    nodes: SgfNode | SgfNode[],
    options?: {
      linebreak?: string
      indent?: string
    }
  ): string
  export function parseVertex(input: string): [number, number]
  export function stringifyVertex(vertex: [number, number]): string
}
