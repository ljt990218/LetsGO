import * as sgf from '@sabaki/sgf'
import type { SgfNode } from '@sabaki/sgf'
import type {
  BoardSize,
  GameAction,
  GameResult,
  GameSettings,
  ParsedSgfGame,
  StoneColor
} from '../types/go'

const UNSUPPORTED_SETUP_FIELDS = [
  'HA',
  'AB',
  'AW',
  'AE',
  'PL'
]

export function parseSgfGame(contents: string): ParsedSgfGame {
  if (!contents.trim()) {
    throw new Error('SGF 文件内容为空')
  }

  if (contents.includes('\uFFFD')) {
    throw new Error('SGF 文件不是有效的 UTF-8 编码')
  }

  const roots = sgf.parse(contents)
  if (roots.length !== 1) {
    throw new Error('仅支持包含一盘棋的 SGF 文件')
  }

  const root = roots[0]
  const gameType = firstValue(root, 'GM')
  if (gameType && gameType !== '1') {
    throw new Error('SGF 文件不是围棋棋谱')
  }

  const boardSize = parseBoardSize(firstValue(root, 'SZ'))
  const komi = parseKomi(firstValue(root, 'KM'))
  const settings: GameSettings = {
    blackName: firstValue(root, 'PB')?.trim() || '黑方',
    whiteName: firstValue(root, 'PW')?.trim() || '白方',
    boardSize,
    komi
  }

  const actions = parseMainLine(root, boardSize)

  return {
    settings,
    actions
  }
}

export function stringifySgfGame(
  settings: GameSettings,
  actions: readonly GameAction[],
  result: GameResult | null
): string {
  const root: SgfNode = {
    id: 0,
    parentId: null,
    children: [],
    data: {
      FF: ['4'],
      GM: ['1'],
      CA: ['UTF-8'],
      SZ: [String(settings.boardSize)],
      KM: [String(settings.komi)],
      PB: [settings.blackName],
      PW: [settings.whiteName]
    }
  }

  if (result) {
    root.data.RE = [result.sgfResult]
  }

  let parent = root

  actions.forEach((action, index) => {
    const property = action.color === 'black' ? 'B' : 'W'
    const vertex = action.type === 'pass'
      ? ''
      : sgf.stringifyVertex([action.x, action.y])

    const node: SgfNode = {
      id: index + 1,
      parentId: parent.id,
      children: [],
      data: {
        [property]: [vertex]
      }
    }

    parent.children.push(node)
    parent = node
  })

  return sgf.stringify(root, {
    linebreak: '\n',
    indent: '  '
  })
}

function parseMainLine(root: SgfNode, boardSize: BoardSize): GameAction[] {
  const actions: GameAction[] = []
  let expectedColor: StoneColor = 'black'
  let node: SgfNode | undefined = root

  while (node) {
    rejectUnsupportedSetup(node)

    const hasBlackMove = Boolean(node.data.B)
    const hasWhiteMove = Boolean(node.data.W)

    if (hasBlackMove && hasWhiteMove) {
      throw new Error('SGF 节点不能同时包含黑白双方落子')
    }

    if (hasBlackMove || hasWhiteMove) {
      const color: StoneColor = hasBlackMove ? 'black' : 'white'
      if (color !== expectedColor) {
        throw new Error('SGF 落子顺序不是黑白交替')
      }

      const value = firstValue(node, hasBlackMove ? 'B' : 'W')
      if (value === undefined) {
        throw new Error('SGF 落子数据缺失')
      }

      if (value === '') {
        actions.push({
          type: 'pass',
          color
        })
      } else {
        const [x, y] = sgf.parseVertex(value)
        if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) {
          throw new Error('SGF 包含棋盘范围外的落子')
        }

        actions.push({
          type: 'play',
          color,
          x,
          y
        })
      }

      expectedColor = expectedColor === 'black' ? 'white' : 'black'
    }

    node = node.children[0]
  }

  return actions
}

function rejectUnsupportedSetup(node: SgfNode): void {
  const unsupported = UNSUPPORTED_SETUP_FIELDS.find(field => node.data[field])
  if (unsupported) {
    throw new Error(`暂不支持含 ${unsupported} 的摆子或让子棋谱`)
  }
}

function parseBoardSize(value: string | undefined): BoardSize {
  const size = Number(value)
  if (size !== 9 && size !== 13 && size !== 19) {
    throw new Error('SGF 棋盘大小必须是 9、13 或 19 路')
  }

  return size
}

function parseKomi(value: string | undefined): number {
  const komi = Number(value)
  if (!Number.isFinite(komi)) {
    throw new Error('SGF 缺少有效贴目信息')
  }

  return komi
}

function firstValue(node: SgfNode, field: string): string | undefined {
  return node.data[field]?.[0]
}
