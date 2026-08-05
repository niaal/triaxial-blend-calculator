import { useStore } from '../state/store'
import { useDerived, fmt } from '../state/derived'
import { BlockedPanel } from './BlockedPanel'
import { CORNER_LABELS } from '../types'

export function BatchSheetScreen({ onPrint }: { onPrint: () => void }) {
  const { blend } = useStore()
  const d = useDerived()

  if (d.anyBlocked) return <BlockedPanel />

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <p className="text-[0.75rem] text-ink-2">
          {fmt(d.dryWeight, 1)} g dry base per portion
          {blend.measurement.portionMode === 'slurry' &&
            ` (${blend.measurement.portionWeight} g slurry at SG ${blend.measurement.slurrySG})`}
          {' · '}weights are additive grams per tile
        </p>
        <span className="flex-1" />
        <button className="btn" onClick={onPrint}>
          Print sheet
        </button>
      </div>

      <div className="overflow-x-auto border border-rule bg-white">
        <table className="w-full text-[0.8rem] min-w-[560px]">
          <thead>
            <tr className="bg-paper-2 text-[0.62rem] uppercase tracking-wider text-ink-2">
              <th className="px-2 py-2 text-center font-semibold">Tile</th>
              <th className="px-2 py-2 text-center font-normal">i·j·k</th>
              {([0, 1, 2] as const).map((i) => (
                <th key={`p${i}`} className="px-2 py-2 text-right font-normal">
                  {CORNER_LABELS[i]} %
                </th>
              ))}
              {([0, 1, 2] as const).map((i) => (
                <th key={`w${i}`} className="px-2 py-2 text-right font-semibold text-ink">
                  {d.cornerNames[i]} g
                  {blend.corners[i].stockConcentration < 1 && (
                    <span className="block font-normal text-ink-2">
                      as {Math.round(blend.corners[i].stockConcentration * 100)}% stock
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.cells.map((cell) => {
              const doses = d.dosesFor(cell)
              return (
                <tr key={cell.tile} className="border-t border-rule odd:bg-white even:bg-paper">
                  <td className="px-2 py-1 text-center font-semibold">{cell.tile}</td>
                  <td className="px-2 py-1 text-center text-ink-2">
                    {cell.i}·{cell.j}·{cell.k}
                  </td>
                  {doses.map((dose, i) => (
                    <td key={`p${i}`} className="px-2 py-1 text-right text-ink-2">
                      {fmt(dose.pct, 2)}
                    </td>
                  ))}
                  {doses.map((dose, i) => (
                    <td key={`w${i}`} className="px-2 py-1 text-right font-semibold">
                      {fmt(dose.rounded, d.weightDecimals)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
