import {
  Color,
  FieldBoardObject,
  MarkupBoardObject,
  SVG_SHADOWS,
  SVGBoard
} from 'wgo'
import type { Point } from 'wgo'
import type {
  GameSnapshot,
  StoneColor
} from '../types/go'

export class WgoBoardAdapter {
  private readonly board: SVGBoard
  private readonly grainElement: SVGRectElement
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
    this.grainElement = this.createGrainElement()
    this.placeGrainBelowStones()

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

    this.placeGrainBelowStones()

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

  private createGrainElement(): SVGRectElement {
    const patternId = `board-grain-${Math.random().toString(36).slice(2)}`
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern')
    const grainLine = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')

    pattern.setAttribute('id', patternId)
    pattern.setAttribute('width', '2.4')
    pattern.setAttribute('height', '0.72')
    pattern.setAttribute('patternUnits', 'userSpaceOnUse')
    pattern.setAttribute('patternTransform', 'rotate(3)')

    grainLine.setAttribute('d', 'M 0 0.36 C 0.6 0.28, 1.2 0.44, 2.4 0.34')
    grainLine.setAttribute('fill', 'none')
    grainLine.setAttribute('stroke', '#4f2a0e')
    grainLine.setAttribute('stroke-width', '0.035')
    grainLine.setAttribute('stroke-opacity', '0.1')

    pattern.appendChild(grainLine)
    this.board.defsElement.appendChild(pattern)

    rect.setAttribute('fill', `url(#${patternId})`)
    rect.setAttribute('pointer-events', 'none')
    rect.style.mixBlendMode = 'multiply'
    return rect
  }

  private placeGrainBelowStones(): void {
    const size = this.board.getSize()
    this.grainElement.setAttribute('x', '-1')
    this.grainElement.setAttribute('y', '-1')
    this.grainElement.setAttribute('width', String(size + 2))
    this.grainElement.setAttribute('height', String(size + 2))
    this.board.svgElement.insertBefore(
      this.grainElement,
      this.board.contexts[SVG_SHADOWS]
    )
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
