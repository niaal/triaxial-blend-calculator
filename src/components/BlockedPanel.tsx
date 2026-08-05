import { useDerived, fmt } from '../state/derived'
import { useStore } from '../state/store'
import { RemedyList } from './CornerCard'
import { CORNER_LABELS } from '../types'

/**
 * Shown in place of any output (triangle weights, batch sheet, print, export)
 * while a corner fails the precision guard. Inputs stay editable; outputs
 * refuse to hand over unweighable numbers.
 */
export function BlockedPanel() {
  const { blend } = useStore()
  const d = useDerived()
  const blocked = ([0, 1, 2] as const).filter((i) => d.guards[i].level === 'block')

  return (
    <div className="max-w-xl mx-auto border-2 border-block bg-block-soft p-5" role="alert">
      <h2 className="font-display text-lg font-semibold text-block">
        Precision block — this sheet would ruin the firing
      </h2>
      <p className="mt-2 text-[0.8rem]">
        {blocked.length === 1 ? 'One corner steps' : `${blocked.length} corners step`} in amounts
        smaller than three increments of your {blend.measurement.scaleIncrement} g scale.
        Rounding would scramble neighbouring cells into near-identical tiles. Fix it here or on
        the Setup tab — outputs unlock the moment every corner clears.
      </p>
      <div className="mt-4 grid gap-4">
        {blocked.map((i) => (
          <div key={i} className="border border-block/40 bg-white p-3">
            <p className="text-[0.8rem] font-semibold">
              {CORNER_LABELS[i]} — {d.cornerNames[i]}: step {fmt(d.guards[i].step, 3)} g on a{' '}
              {blend.measurement.scaleIncrement} g scale
            </p>
            <RemedyList index={i} />
          </div>
        ))}
      </div>
    </div>
  )
}
