import { useStore } from '../state/store'
import { useDerived, fmt } from '../state/derived'
import { TILE_COUNTS } from '../lib/grid'
import type { TileCount } from '../types'
import { NumField } from './fields'
import { CornerCard } from './CornerCard'

export function SetupScreen() {
  const { blend, dispatch } = useStore()
  const d = useDerived()
  const m = blend.measurement
  const slurry = m.portionMode === 'slurry'

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16 grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-10 min-w-0">
        {/* 01 — test + base */}
        <section aria-labelledby="sec-base">
          <h2 id="sec-base" className="section-label">
            <span className="num">01</span> Test &amp; base glaze
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="blend-name">Test name</label>
              <input
                id="blend-name"
                className="input"
                maxLength={60}
                value={blend.name}
                onChange={(e) => dispatch({ type: 'rename', name: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="base-name">Base glaze</label>
              <input
                id="base-name"
                className="input"
                maxLength={60}
                value={blend.base.name}
                onChange={(e) => dispatch({ type: 'update-base', base: { name: e.target.value } })}
              />
            </div>
            <div className="sm:col-span-2">
              <span className="field-label">Firing</span>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Kiln atmosphere">
                {([['ox', 'Cone 10 oxidation'], ['red', 'Cone 10 reduction']] as const).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      className="chip"
                      aria-pressed={blend.atmosphere === value}
                      onClick={() => dispatch({ type: 'set-atmosphere', atmosphere: value })}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
              <p className="mt-1 text-[0.65rem] text-ink-2">
                Changes the guidance, not the maths — ranges, notes, colours and interaction
                flags follow the kiln.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="base-recipe">Base recipe (optional, prints on the sheet)</label>
              <input
                id="base-recipe"
                className="input"
                maxLength={240}
                value={blend.base.recipe ?? ''}
                onChange={(e) => dispatch({ type: 'update-base', base: { recipe: e.target.value } })}
              />
            </div>
            <label className="flex items-center gap-2 text-[0.8rem] sm:col-span-2">
              <input
                type="checkbox"
                checked={blend.base.zincBearing}
                onChange={(e) => dispatch({ type: 'update-base', base: { zincBearing: e.target.checked } })}
              />
              Base contains zinc
              <span className="text-ink-2 text-[0.7rem]">(4321 is zinc-free — this flags chrome cautions)</span>
            </label>
          </div>
        </section>

        {/* 02 — portion & scale */}
        <section aria-labelledby="sec-portion">
          <h2 id="sec-portion" className="section-label">
            <span className="num">02</span> Portion &amp; scale
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="field-label">Portion mode</span>
              <div className="flex gap-1" role="group" aria-label="Portion mode">
                {(['dry', 'slurry'] as const).map((mode) => (
                  <button
                    key={mode}
                    className="chip"
                    aria-pressed={m.portionMode === mode}
                    onClick={() => dispatch({ type: 'update-measurement', measurement: { portionMode: mode } })}
                  >
                    {mode === 'dry' ? 'Dry powder' : 'Wet slurry'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="portion-weight">
                Portion per tile {slurry ? '(wet)' : '(dry)'}
              </label>
              <NumField
                id="portion-weight"
                value={m.portionWeight}
                min={1}
                onCommit={(v) => dispatch({ type: 'update-measurement', measurement: { portionWeight: v } })}
                suffix="g"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="scale-inc">Scale reads to</label>
              <select
                id="scale-inc"
                className="input"
                value={String(m.scaleIncrement)}
                onChange={(e) =>
                  dispatch({ type: 'update-measurement', measurement: { scaleIncrement: parseFloat(e.target.value) } })
                }
              >
                {[0.001, 0.01, 0.05, 0.1, 1].map((v) => (
                  <option key={v} value={v}>{v} g</option>
                ))}
              </select>
            </div>
            {slurry && (
              <div>
                <label className="field-label" htmlFor="slurry-sg">Slurry specific gravity</label>
                <NumField
                  id="slurry-sg"
                  value={m.slurrySG ?? 1.45}
                  min={1.01}
                  max={2.5}
                  step={0.01}
                  onCommit={(v) => dispatch({ type: 'update-measurement', measurement: { slurrySG: v } })}
                />
              </div>
            )}
          </div>
          {slurry && (
            <p className="mt-4 border-l-4 border-accent bg-accent-soft px-3 py-2 text-[0.85rem]">
              A {fmt(m.portionWeight, 0)} g slurry portion at SG {fmt(m.slurrySG ?? 1.45, 2)} holds{' '}
              <strong className="text-accent">{fmt(d.dryWeight, 1)} g of dry base</strong> — all additive
              percentages are taken against that dry weight.
            </p>
          )}
        </section>

        {/* 03 — grid */}
        <section aria-labelledby="sec-grid">
          <h2 id="sec-grid" className="section-label">
            <span className="num">03</span> Grid
          </h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tile count">
            {TILE_COUNTS.map((t) => (
              <button
                key={t}
                className="chip"
                aria-pressed={blend.grid.tileCount === t}
                onClick={() => dispatch({ type: 'update-grid', grid: { tileCount: t as TileCount } })}
              >
                {t} tiles
              </button>
            ))}
          </div>
        </section>

        {/* 04 — corners */}
        <section aria-labelledby="sec-corners">
          <h2 id="sec-corners" className="section-label">
            <span className="num">04</span> Corners
            <span className="normal-case tracking-normal font-normal text-[0.68rem]">
              ranges assume a calcium-rich, zinc-free base at cone 10{' '}
              {blend.atmosphere === 'red' ? 'reduction' : 'oxidation'}
            </span>
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {([0, 1, 2] as const).map((idx) => (
              <CornerCard key={idx} index={idx} />
            ))}
          </div>
        </section>
      </div>

      {/* side rail: interactions + forecast */}
      <aside className="grid gap-10 content-start">
        <section aria-labelledby="sec-notes">
          <h2 id="sec-notes" className="section-label">
            <span className="num">05</span> Interactions
          </h2>
          {d.notes.length === 0 ? (
            <p className="text-[0.78rem] text-ink-2">
              No known interactions between the selected corners. Pairs like chrome + tin
              (pink) or cobalt + rutile (broken blue) will be flagged here.
            </p>
          ) : (
            <ul className="grid gap-2">
              {d.notes.map((note, i) => (
                <li
                  key={i}
                  className={`border-l-4 px-3 py-2 text-[0.78rem] ${
                    note.severity === 'opportunity'
                      ? 'border-good bg-good-soft'
                      : 'border-warn bg-warn-soft'
                  }`}
                >
                  <span className="block font-semibold text-[0.68rem] uppercase tracking-wider">
                    {note.severity} — {note.title}
                  </span>
                  {note.effect}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="sec-forecast">
          <h2 id="sec-forecast" className="section-label">
            <span className="num">06</span> You will need
          </h2>
          <table className="w-full text-[0.8rem]">
            <tbody>
              <tr className="border-b border-rule">
                <td className="py-1.5 pr-2">
                  Base ({blend.base.name}), dry
                  <span className="block text-[0.65rem] text-ink-2">
                    {d.T} tiles, incl. 15% spare
                  </span>
                </td>
                <td className="py-1.5 text-right font-semibold whitespace-nowrap">
                  {fmt(d.totals.baseTotalDry, 0)} g
                </td>
              </tr>
              {slurry && (
                <tr className="border-b border-rule">
                  <td className="py-1.5 pr-2">Slurry to portion out</td>
                  <td className="py-1.5 text-right font-semibold whitespace-nowrap">
                    {fmt(d.totals.baseTotalPortioned, 0)} g
                  </td>
                </tr>
              )}
              {d.totals.corners.map((c, i) => (
                <tr key={i} className="border-b border-rule">
                  <td className="py-1.5 pr-2">
                    {'ABC'[i]} — {d.cornerNames[i]}
                    {c.stockGrams !== null && (
                      <span className="block text-[0.65rem] text-ink-2">
                        as {Math.round(blend.corners[i].stockConcentration * 100)}% stock:{' '}
                        {fmt(c.stockGrams, 1)} g
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 text-right font-semibold whitespace-nowrap">
                    {fmt(c.dry, 2)} g dry
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </aside>
    </div>
  )
}
