import { useStore } from '../state/store'
import { useDerived, fmt } from '../state/derived'
import { MATERIALS } from '../data/materials'
import { NumField } from './fields'
import { CORNER_LABELS } from '../types'
import type { Corner } from '../types'

export function CornerCard({ index }: { index: 0 | 1 | 2 }) {
  const { blend, dispatch } = useStore()
  const d = useDerived()
  const corner = blend.corners[index]
  const material = d.cornerMaterials[index]
  const guard = d.guards[index]
  const inc = blend.measurement.scaleIncrement
  const label = CORNER_LABELS[index]
  const isCustom = corner.materialId === 'custom'

  const update = (patch: Partial<Corner>) =>
    dispatch({ type: 'update-corner', index, corner: patch })

  const stockPct = Math.round(corner.stockConcentration * 100)

  return (
    <div className="border border-rule bg-white flex flex-col">
      <div
        className="h-2"
        style={{ background: d.cornerColours[index] }}
        aria-hidden="true"
      />
      <div className="p-3 grid gap-3">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-xl font-semibold">{label}</span>
          {material?.hazards.length ? (
            <span className="flex gap-1 flex-wrap justify-end">
              {material.hazards.map((h) => (
                <span key={h} className="hazard">{h}</span>
              ))}
            </span>
          ) : null}
        </div>

        <div>
          <label className="field-label" htmlFor={`mat-${index}`}>Material</label>
          <select
            id={`mat-${index}`}
            className="input"
            value={corner.materialId}
            onChange={(e) => {
              const id = e.target.value
              if (id === 'custom') {
                update({ materialId: 'custom', customName: corner.customName ?? '' })
                return
              }
              const mat = MATERIALS.find((m) => m.id === id)
              update({ materialId: id, maxPercent: mat?.defaultMax ?? corner.maxPercent })
            }}
          >
            {MATERIALS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
            <option value="custom">Something else…</option>
          </select>
          {material?.note && (
            <p className="mt-1 text-[0.65rem] text-ink-2">{material.note}</p>
          )}
        </div>

        {isCustom && (
          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <div>
              <label className="field-label" htmlFor={`custom-name-${index}`}>Material name</label>
              <input
                id={`custom-name-${index}`}
                className="input"
                maxLength={40}
                placeholder="e.g. Mason 6600 black"
                value={corner.customName ?? ''}
                onChange={(e) => update({ customName: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label" htmlFor={`custom-colour-${index}`}>Colour</label>
              <input
                id={`custom-colour-${index}`}
                type="color"
                className="input h-9 w-14 p-1"
                value={corner.customColour ?? '#9b968c'}
                onChange={(e) => update({ customColour: e.target.value })}
              />
            </div>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor={`max-${index}`}>
            Max % (at the {label} corner)
          </label>
          <NumField
            id={`max-${index}`}
            value={corner.maxPercent}
            min={0.01}
            step={0.05}
            onCommit={(v) => update({ maxPercent: v })}
          />
          {material && (
            <p className="mt-1 text-[0.65rem] text-ink-2">
              recommended {material.recommendedMin}–{material.recommendedMax}%
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor={`stock-${index}`}>Dispensed as</label>
          <select
            id={`stock-${index}`}
            className="input"
            value={corner.stockConcentration === 1 ? 'dry' : corner.stockConcentration === 0.1 ? 'stock10' : 'other'}
            onChange={(e) => {
              if (e.target.value === 'dry') update({ stockConcentration: 1 })
              else if (e.target.value === 'stock10') update({ stockConcentration: 0.1 })
            }}
          >
            <option value="dry">Dry powder</option>
            <option value="stock10">10% stock suspension (by weight)</option>
            {corner.stockConcentration !== 1 && corner.stockConcentration !== 0.1 && (
              <option value="other">{stockPct}% stock suspension</option>
            )}
          </select>
          {corner.stockConcentration < 1 && (
            <p className="mt-1 text-[0.65rem] text-ink-2">
              Mix {stockPct} g {d.cornerNames[index]} into water to make 100 g of stock.
              Keep it stirred — it settles.
            </p>
          )}
        </div>

        {/* live step readout */}
        <div
          className={`border px-2.5 py-2 text-[0.75rem] ${
            guard.level === 'block'
              ? 'border-block bg-block-soft'
              : guard.level === 'warn'
                ? 'border-warn bg-warn-soft'
                : 'border-rule bg-paper'
          }`}
          role={guard.level === 'block' ? 'alert' : undefined}
        >
          <div className="flex justify-between items-baseline">
            <span className="uppercase tracking-wider text-[0.62rem]">step per cell</span>
            <strong>{fmt(guard.step, 3)} g</strong>
          </div>
          <div className="flex justify-between items-baseline text-ink-2 text-[0.65rem]">
            <span>scale reads to</span>
            <span>{inc} g</span>
          </div>
          {guard.level !== 'ok' && (
            <p className="mt-1.5 font-semibold text-[0.7rem]">
              {guard.level === 'block'
                ? 'Blocked — steps are smaller than 3 scale increments; rounding would scramble the blend.'
                : 'Marginal — steps are under 10 scale increments; expect visible rounding.'}
            </p>
          )}
          {guard.level === 'block' && <RemedyList index={index} />}
        </div>
      </div>
    </div>
  )
}

export function RemedyList({ index }: { index: 0 | 1 | 2 }) {
  const { blend, dispatch } = useStore()
  const d = useDerived()
  const r = d.guards[index].remedies
  const slurry = blend.measurement.portionMode === 'slurry'
  const portionFix = Math.ceil(r.minPortionWeight / 5) * 5
  const maxFix = Math.ceil(r.minMaxPercent * 10) / 10

  return (
    <ol className="mt-1.5 grid gap-1 list-decimal list-inside text-[0.68rem]">
      <li>
        <button
          className="underline underline-offset-2 hover:text-accent"
          onClick={() =>
            dispatch({ type: 'update-measurement', measurement: { portionWeight: portionFix } })
          }
        >
          Raise portion to {portionFix} g {slurry ? 'slurry' : 'dry'}
        </button>
      </li>
      <li>
        <button
          className="underline underline-offset-2 hover:text-accent"
          onClick={() => dispatch({ type: 'update-corner', index, corner: { stockConcentration: 0.1 } })}
        >
          Dose from a 10% stock suspension
        </button>
      </li>
      <li>
        <button
          className="underline underline-offset-2 hover:text-accent"
          onClick={() => dispatch({ type: 'update-corner', index, corner: { maxPercent: maxFix } })}
        >
          Raise corner max to {maxFix}%
        </button>
      </li>
      {r.maxTileCount !== null && r.maxTileCount < blend.grid.tileCount && (
        <li>
          <button
            className="underline underline-offset-2 hover:text-accent"
            onClick={() => dispatch({ type: 'update-grid', grid: { tileCount: r.maxTileCount! } })}
          >
            Drop to {r.maxTileCount} tiles
          </button>
        </li>
      )}
    </ol>
  )
}
