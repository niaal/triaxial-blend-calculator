import type {
  Blend,
  Corner,
  MeasurementConfig,
  TileCount,
} from '../types'
import { TILE_TO_N, TILE_COUNTS, totalTiles, type Cell } from './grid'

/** Kill float noise without disturbing scale-increment multiples. */
export function roundFloat(x: number): number {
  return Math.round(x * 1e6) / 1e6
}

export function roundToIncrement(x: number, increment: number): number {
  // Clean the quotient first so float noise (2.675/0.05 → 53.4999…) doesn't
  // flip a midpoint the wrong way.
  return roundFloat(Math.round(roundFloat(x / increment)) * increment)
}

/**
 * Brongniart: dry mass fraction of a slurry at specific gravity `sg` whose
 * dry material has density `d` (g/cm³).
 */
export function dryFraction(sg: number, d: number): number {
  return (d * (sg - 1)) / (sg * (d - 1))
}

/** Dry base weight contained in one portion. */
export function dryWeightOf(m: MeasurementConfig): number {
  if (m.portionMode === 'dry') return m.portionWeight
  return m.portionWeight * dryFraction(m.slurrySG ?? 1.45, m.materialDensity)
}

export type CornerDose = {
  /** percentage of dry base weight, derived from the integer component */
  pct: number
  /** grams of dry additive implied by pct */
  dryAdditive: number
  /** grams actually dispensed (dry powder or stock suspension) */
  dispensed: number
  /** dispensed, rounded to the scale increment — the number on the sheet */
  rounded: number
  /** the percentage the rounded weight actually delivers */
  effectivePct: number
}

export function doseFor(
  component: number,
  n: number,
  corner: Corner,
  dryWeight: number,
  scaleIncrement: number,
): CornerDose {
  const pct = (component / n) * corner.maxPercent
  const dryAdditive = (dryWeight * pct) / 100
  const dispensed = dryAdditive / corner.stockConcentration
  const rounded = roundToIncrement(dispensed, scaleIncrement)
  const effectivePct =
    dryWeight > 0
      ? ((rounded * corner.stockConcentration) / dryWeight) * 100
      : 0
  return { pct, dryAdditive, dispensed, rounded, effectivePct }
}

export function cellDoses(cell: Cell, blend: Blend): [CornerDose, CornerDose, CornerDose] {
  const n = TILE_TO_N[blend.grid.tileCount]
  const dryWeight = dryWeightOf(blend.measurement)
  const inc = blend.measurement.scaleIncrement
  const [a, b, c] = blend.corners
  return [
    doseFor(cell.i, n, a, dryWeight, inc),
    doseFor(cell.j, n, b, dryWeight, inc),
    doseFor(cell.k, n, c, dryWeight, inc),
  ]
}

/** Decimal places implied by the scale increment, for display. */
export function incDecimals(increment: number): number {
  const s = increment.toString()
  const dot = s.indexOf('.')
  return dot === -1 ? 0 : s.length - dot - 1
}

// ---------------------------------------------------------------------------
// Precision guard
// ---------------------------------------------------------------------------

export type GuardLevel = 'ok' | 'warn' | 'block'

/** Grams dispensed per grid step for one corner. */
export function stepSize(
  dryWeight: number,
  maxPercent: number,
  n: number,
  stockConcentration: number,
): number {
  return (dryWeight * (maxPercent / 100)) / n / stockConcentration
}

export function guardLevel(step: number, scaleIncrement: number): GuardLevel {
  // Block is strict (step === 3×inc clears it); warn is inclusive so the
  // spec's canonical case — 0.10 g steps on a 0.01 g scale — warns.
  const eps = 1e-9
  if (step < 3 * scaleIncrement - eps) return 'block'
  if (step <= 10 * scaleIncrement + eps) return 'warn'
  return 'ok'
}

export type Remedies = {
  /** smallest portion weight (in the current portion mode's units) that clears the block */
  minPortionWeight: number
  /** largest stock concentration that clears the block (dose from stock) */
  maxStockConcentration: number
  /** smallest corner max % that clears the block */
  minMaxPercent: number
  /** largest tile count that clears the block, if any */
  maxTileCount: TileCount | null
}

export function remediesFor(
  corner: Corner,
  m: MeasurementConfig,
  n: number,
): Remedies {
  const inc = m.scaleIncrement
  const target = 3 * inc // step must reach this to unblock
  const df =
    m.portionMode === 'slurry'
      ? dryFraction(m.slurrySG ?? 1.45, m.materialDensity)
      : 1
  const minDryWeight =
    (target * n * corner.stockConcentration * 100) / corner.maxPercent
  const dryWeight = dryWeightOf(m)
  const okTileCounts = TILE_COUNTS.filter(
    (t) =>
      stepSize(dryWeight, corner.maxPercent, TILE_TO_N[t], corner.stockConcentration) >=
      target,
  )
  return {
    minPortionWeight: roundFloat(minDryWeight / df),
    maxStockConcentration: roundFloat(
      (dryWeight * (corner.maxPercent / 100)) / n / target,
    ),
    minMaxPercent: roundFloat(
      (target * n * corner.stockConcentration * 100) / dryWeight,
    ),
    maxTileCount: okTileCounts.length ? okTileCounts[okTileCounts.length - 1] : null,
  }
}

// ---------------------------------------------------------------------------
// Consumption forecast
// ---------------------------------------------------------------------------

export type Forecast = {
  /** grams of dry base, including overage */
  baseTotalDry: number
  /** grams of slurry to scoop, including overage (slurry mode only) */
  baseTotalPortioned: number
  corners: Array<{
    /** grams of dry additive across the whole grid */
    dry: number
    /** grams of stock suspension to dispense, where stockConcentration < 1 */
    stockGrams: number | null
  }>
}

export function forecast(blend: Blend): Forecast {
  const n = TILE_TO_N[blend.grid.tileCount]
  const T = totalTiles(n)
  const m = blend.measurement
  const dryWeight = dryWeightOf(m)
  return {
    baseTotalDry: dryWeight * T * (1 + m.overage),
    baseTotalPortioned: m.portionWeight * T * (1 + m.overage),
    corners: blend.corners.map((c) => {
      // Each corner's components sum to exactly T/3 of the grid total in a
      // symmetric triaxial, hence the T/3 identity.
      const dry = ((dryWeight * (c.maxPercent / 100)) * T) / 3
      return {
        dry,
        stockGrams: c.stockConcentration < 1 ? dry / c.stockConcentration : null,
      }
    }),
  }
}
