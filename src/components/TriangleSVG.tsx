import { useMemo } from 'react'
import type { Cell } from '../lib/grid'
import type { CornerDose } from '../lib/calc'
import { blendCellColour, readableOn, towardPaper } from '../lib/colour'

const S = 100 // lattice spacing in viewBox units
const R = S / Math.sqrt(3) // hexagon circumradius (pointy-top, perfect tiling)
const ROW_H = (S * Math.sqrt(3)) / 2
const PAD_X = 12 // tight — every horizontal unit costs cell size on a phone
const PAD_Y = 44 // room for the corner tags above/below

type Props = {
  n: number
  cells: Cell[]
  cornerColours: [string, string, string]
  cornerLabels: [string, string, string]
  dosesFor: (cell: Cell) => [CornerDose, CornerDose, CornerDose]
  selectedTile?: number
  onSelectTile?: (tile: number) => void
  forPrint?: boolean
}

const PAPER = '#fafaf8'

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let t = 0; t < 6; t++) {
    const a = (Math.PI / 180) * (90 + 60 * t)
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}

export function TriangleSVG({
  n,
  cells,
  cornerColours,
  cornerLabels,
  dosesFor,
  selectedTile,
  onSelectTile,
  forPrint = false,
}: Props) {
  const width = n * S + 2 * R + 2 * PAD_X
  const height = n * ROW_H + 2 * R + 2 * PAD_Y + 20
  const cxTop = width / 2
  const yTop = PAD_Y + R + 14

  const centres = useMemo(
    () =>
      cells.map((c) => ({
        cell: c,
        x: cxTop + (c.p - c.r / 2) * S,
        y: yTop + c.r * ROW_H,
      })),
    [cells, cxTop, yTop],
  )

  // Print keeps big bare numbers (the chart is for laying tiles against);
  // on screen every cell always carries its three percentages.
  const numberSize = forPrint ? 34 : 22
  const pctSize = 13

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Triaxial grid, ${cells.length} tiles`}
      className="w-full h-auto select-none"
    >
      {/* corner annotations */}
      <CornerTag x={cxTop} y={yTop - R - 8} anchor="middle" label="A" name={cornerLabels[0]} colour={cornerColours[0]} />
      <CornerTag x={cxTop - (n / 2) * S - R} y={yTop + n * ROW_H + R + 16} anchor="start" label="B" name={cornerLabels[1]} colour={cornerColours[1]} />
      <CornerTag x={cxTop + (n / 2) * S + R} y={yTop + n * ROW_H + R + 16} anchor="end" label="C" name={cornerLabels[2]} colour={cornerColours[2]} />

      {centres.map(({ cell, x, y }) => {
        const blend = blendCellColour(cornerColours, cell.i, cell.j, cell.k, n)
        const fill = towardPaper(blend, PAPER, forPrint ? 0.78 : 0.5)
        const text = readableOn(fill)
        const doses = dosesFor(cell)
        const selected = selectedTile === cell.tile
        const label = `Tile ${cell.tile}: A ${doses[0].pct.toFixed(2)}%, B ${doses[1].pct.toFixed(2)}%, C ${doses[2].pct.toFixed(2)}%`
        const interactive = !!onSelectTile && !forPrint
        return (
          <g
            key={cell.tile}
            {...(interactive
              ? {
                  role: 'button',
                  tabIndex: 0,
                  'aria-label': label,
                  onClick: () => onSelectTile(cell.tile),
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectTile(cell.tile)
                    }
                  },
                  style: { cursor: 'pointer' },
                }
              : {})}
          >
            <polygon
              points={hexPoints(x, y, R * 0.94)}
              fill={fill}
              stroke={selected ? '#2b3fbd' : '#b9b8b1'}
              strokeWidth={selected ? 4 : 1.2}
            />
            {!forPrint ? (
              <>
                <text x={x} y={y - 16} textAnchor="middle" fontSize={numberSize} fontWeight={600} fill={text} fontFamily="inherit">
                  {cell.tile}
                </text>
                {doses.map((d, ci) => (
                  <text
                    key={ci}
                    x={x}
                    y={y + 2 + ci * (pctSize + 1.5)}
                    textAnchor="middle"
                    fontSize={pctSize}
                    fill={text}
                    opacity={0.85}
                    fontFamily="inherit"
                  >
                    {'ABC'[ci]} {d.pct.toFixed(2)}%
                  </text>
                ))}
              </>
            ) : (
              <text
                x={x}
                y={y + numberSize * 0.34}
                textAnchor="middle"
                fontSize={numberSize}
                fontWeight={600}
                fill={text}
                fontFamily="inherit"
              >
                {cell.tile}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function CornerTag({
  x,
  y,
  anchor,
  label,
  name,
  colour,
}: {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  label: string
  name: string
  colour: string
}) {
  // Swatch sits at a fixed offset so it never collides with variable-width text.
  const swatchX = anchor === 'middle' ? x - 8 : anchor === 'start' ? x : x - 16
  const swatchY = anchor === 'middle' ? y - 44 : y + 8
  return (
    <g fontFamily="inherit">
      <rect x={swatchX} y={swatchY} width="16" height="16" fill={colour} stroke="#17171b" strokeWidth="1" />
      <text x={x} y={y} textAnchor={anchor} fontSize="22" fontWeight={600} fill="#17171b">
        {label}
        <tspan fontSize="16" fill="#5b5b64">
          {'  '}
          {name}
        </tspan>
      </text>
    </g>
  )
}
