import { useState } from 'react'
import { useStore } from '../state/store'
import { useDerived, fmt } from '../state/derived'
import { TriangleSVG } from './TriangleSVG'
import { BlockedPanel } from './BlockedPanel'
import { CORNER_LABELS } from '../types'

export function TriangleScreen({ onPrint }: { onPrint: () => void }) {
  const { blend } = useStore()
  const d = useDerived()
  const [selected, setSelected] = useState<number | undefined>()

  if (d.anyBlocked) return <BlockedPanel />

  const selectedCell = selected ? d.cells.find((c) => c.tile === selected) : undefined

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <p className="text-[0.72rem] text-ink-2">
          Tap a cell for its weights · A apex, B bottom-left, C bottom-right
        </p>
        <span className="flex-1" />
        <button className="btn" onClick={onPrint}>
          Print chart
        </button>
      </div>

      {/* the triangle's top corners are empty space — the detail panel insets
          there so cell → weights never needs a scroll. Negative margin lets
          the chart bleed to the viewport edge on phones. */}
      <div className="relative -mx-3 sm:mx-0">
        <TriangleSVG
          n={d.n}
          cells={d.cells}
          cornerColours={d.cornerColours}
          cornerLabels={[
            `${d.cornerNames[0]} ≤${blend.corners[0].maxPercent}%`,
            `${d.cornerNames[1]} ≤${blend.corners[1].maxPercent}%`,
            `${d.cornerNames[2]} ≤${blend.corners[2].maxPercent}%`,
          ]}
          dosesFor={d.dosesFor}
          selectedTile={selected}
          onSelectTile={(t) => setSelected(t === selected ? undefined : t)}
        />

        {selectedCell && (
          <div
            className="fixed bottom-3 left-3 right-3 z-20 sm:absolute sm:top-0 sm:left-0 sm:bottom-auto sm:right-auto sm:w-[13.5rem] border border-ink bg-white/95 backdrop-blur-sm p-2.5 text-[0.72rem] shadow-[3px_3px_0_rgba(23,23,27,0.12)]"
            aria-live="polite"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-base font-semibold leading-none">
                Tile {selectedCell.tile}
              </span>
              <span className="text-ink-2 text-[0.62rem]">
                {selectedCell.i}·{selectedCell.j}·{selectedCell.k}
              </span>
              <button
                className="text-ink-2 hover:text-ink px-1 -mr-1 leading-none text-base"
                aria-label="Close tile details"
                onClick={() => setSelected(undefined)}
              >
                ×
              </button>
            </div>
            <table className="w-full mt-1.5">
              <tbody>
                {d.dosesFor(selectedCell).map((dose, i) => (
                  <tr key={i} className="border-t border-rule">
                    <td className="py-1 pr-1">
                      <span
                        className="inline-block w-2.5 h-2.5 mr-1.5 border border-ink align-middle"
                        style={{ background: d.cornerColours[i] }}
                        aria-hidden="true"
                      />
                      {CORNER_LABELS[i]}
                    </td>
                    <td className="py-1 text-right text-ink-2 whitespace-nowrap">
                      {fmt(dose.pct, 2)}%
                    </td>
                    <td className="py-1 text-right font-semibold whitespace-nowrap">
                      {fmt(dose.rounded, d.weightDecimals)} g
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-[0.6rem] text-ink-2">
              per {fmt(d.dryWeight, 1)} g dry base
              {blend.corners.some((c) => c.stockConcentration < 1) && ' · stock weights'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
