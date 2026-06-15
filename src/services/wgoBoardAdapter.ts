import {
  Color,
  FieldBoardObject,
  MarkupBoardObject,
  SVGBoard
} from 'wgo'
import type { Point } from 'wgo'
import type {
  GameSnapshot,
  StoneColor
} from '../types/go'

export class WgoBoardAdapter {
  private readonly board: SVGBoard
  private readonly resizeObserver: ResizeObserver

  constructor(
    element: HTMLElement,
    size: number,
    onPoint: (point: Point) => void
  ) {
    this.board = new SVGBoard(element, {
      size,
      coordinates: true,
      theme: {
        backgroundColor: '#b98a50',
        backgroundImage: '',
        font: '"Noto Serif SC", "Songti SC", serif',
        grid: {
          linesColor: '#4d351d',
          starColor: '#432d18'
        },
        coordinates: {
          color: '#3e2a17',
          bold: true
        },
        markupBlackColor: '#d9bb78',
        markupWhiteColor: '#4b321b',
        markupNoneColor: '#9f2f25'
      }
    })

    this.board.on('click', (_event: UIEvent, point: Point | null) => {
      if (point) {
        onPoint(point)
      }
    })

    this.resizeObserver = new ResizeObserver(() => {
      this.board.resize()
    })
    this.resizeObserver.observe(element)
  }

  sync(snapshot: GameSnapshot): void {
    if (this.board.getSize() !== inferBoardSize(snapshot)) {
      this.board.setSize(inferBoardSize(snapshot))
    }

    this.board.removeObject([...this.board.objects])

    const stones = snapshot.intersections
      .filter(point => point.color !== 'empty')
      .map(point => new FieldBoardObject(
        point.color === 'black' ? 'B' : 'W',
        point.x,
        point.y
      ))

    this.board.addObject(stones)

    for (const point of snapshot.deadPoints) {
      this.board.addObject(new FieldBoardObject('DD', point.x, point.y))
      this.board.addObject(new MarkupBoardObject(
        'MA',
        point.x,
        point.y,
        colorAt(snapshot, point.x, point.y)
      ))
    }

    if (snapshot.lastMove) {
      this.board.addObject(new MarkupBoardObject(
        'CR',
        snapshot.lastMove.x,
        snapshot.lastMove.y,
        toWgoColor(snapshot.lastMove.color)
      ))
    }
  }

  destroy(): void {
    this.resizeObserver.disconnect()
    this.board.element.replaceChildren()
  }
}

function inferBoardSize(snapshot: GameSnapshot): number {
  return Math.sqrt(snapshot.intersections.length)
}

function colorAt(snapshot: GameSnapshot, x: number, y: number): Color {
  const point = snapshot.intersections.find(item => item.x === x && item.y === y)
  return point?.color === 'black' ? Color.BLACK : Color.WHITE
}

function toWgoColor(color: StoneColor): Color {
  return color === 'black' ? Color.BLACK : Color.WHITE
}
