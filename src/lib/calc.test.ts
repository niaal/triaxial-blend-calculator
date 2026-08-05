import { describe, it, expect } from 'vitest'
import { cellsFor, totalTiles, TILE_TO_N } from './grid'
import {
  dryFraction,
  dryWeightOf,
  doseFor,
  forecast,
  guardLevel,
  roundToIncrement,
  stepSize,
} from './calc'
import type { Blend, Corner } from '../types'

const corner = (over: Partial<Corner> = {}): Corner => ({
  materialId: 'chrome-oxide',
  maxPercent: 1,
  stockConcentration: 1,
  ...over,
})

const session = (over: Partial<Blend> = {}): Blend => ({
  name: 'test',
  base: { name: 'Leach 4321', zincBearing: false },
  atmosphere: 'ox',
  corners: [corner(), corner(), corner()],
  grid: { tileCount: 21 },
  measurement: {
    portionMode: 'dry',
    portionWeight: 100,
    materialDensity: 2.6,
    scaleIncrement: 0.01,
    overage: 0.15,
  },
  ...over,
})

describe('grid enumeration', () => {
  it('n=5 → 21 cells; first (5,0,0) tile 1; last (0,0,5) tile 21', () => {
    const cells = cellsFor(5)
    expect(cells).toHaveLength(21)
    expect(cells[0]).toMatchObject({ i: 5, j: 0, k: 0, tile: 1 })
    expect(cells[20]).toMatchObject({ i: 0, j: 0, k: 5, tile: 21 })
  })

  it('n=7 → 36 cells; tile 36 is (0,0,7)', () => {
    const cells = cellsFor(7)
    expect(cells).toHaveLength(36)
    const last = cells.find((c) => c.tile === 36)
    expect(last).toMatchObject({ i: 0, j: 0, k: 7 })
  })

  it('components always sum to n; tile numbers are 1..T with no gaps', () => {
    for (const n of Object.values(TILE_TO_N)) {
      const cells = cellsFor(n)
      expect(cells).toHaveLength(totalTiles(n))
      cells.forEach((c, idx) => {
        expect(c.i + c.j + c.k).toBe(n)
        expect(c.tile).toBe(idx + 1)
      })
    }
  })

  it('corner cells land where the spec says', () => {
    const cells = cellsFor(6)
    expect(cells.find((c) => c.tile === 1)).toMatchObject({ i: 6, j: 0, k: 0 }) // apex = pure A
    expect(cells.find((c) => c.r === 6 && c.p === 0)).toMatchObject({ j: 6 }) // bottom-left = pure B
    expect(cells.find((c) => c.r === 6 && c.p === 6)).toMatchObject({ k: 6 }) // bottom-right = pure C
  })
})

describe('consumption forecast', () => {
  it('n=5, dryWeight=100, max=1% → additive total 7.00 g', () => {
    const f = forecast(session())
    expect(f.corners[0].dry).toBeCloseTo(7.0, 10)
  })

  it('base total includes overage', () => {
    const f = forecast(session())
    expect(f.baseTotalDry).toBeCloseTo(100 * 21 * 1.15, 6)
  })

  it('reports stock grams when dosing from suspension', () => {
    const s = session()
    s.corners[0] = corner({ stockConcentration: 0.1 })
    const f = forecast(s)
    expect(f.corners[0].stockGrams).toBeCloseTo(70.0, 6)
    expect(f.corners[1].stockGrams).toBeNull()
  })
})

describe('slurry dry fraction', () => {
  it('SG 1.45, d 2.6 → 0.504 (±0.001)', () => {
    expect(dryFraction(1.45, 2.6)).toBeCloseTo(0.504, 3)
  })

  it('a 100 g slurry portion holds ~50 g dry base', () => {
    const s = session()
    s.measurement = { ...s.measurement, portionMode: 'slurry', slurrySG: 1.45 }
    expect(dryWeightOf(s.measurement)).toBeCloseTo(50.4, 1)
  })
})

describe('precision guard', () => {
  it('max 0.5%, n=5, dry 100 g, inc 0.01, stock 1.0 → step 0.10 g → warn, not block', () => {
    const step = stepSize(100, 0.5, 5, 1)
    expect(step).toBeCloseTo(0.1, 10)
    expect(guardLevel(step, 0.01)).toBe('warn')
  })

  it('same step on a 0.1 g scale → block', () => {
    expect(guardLevel(stepSize(100, 0.5, 5, 1), 0.1)).toBe('block')
  })

  it('dropping to a 10% stock clears it entirely', () => {
    const step = stepSize(100, 0.5, 5, 0.1)
    expect(step).toBeCloseTo(1.0, 10)
    expect(guardLevel(step, 0.01)).toBe('ok')
  })
})

describe('rounding', () => {
  it('every displayed weight is an exact multiple of the scale increment', () => {
    const s = session()
    s.corners[1] = corner({ maxPercent: 7.3, stockConcentration: 0.37 })
    for (const inc of [0.01, 0.02, 0.05, 0.1]) {
      for (const c of cellsFor(7)) {
        const dose = doseFor(c.j, 7, s.corners[1], 100, inc)
        const ratio = dose.rounded / inc
        expect(Math.abs(ratio - Math.round(ratio))).toBeLessThan(1e-6)
      }
    }
  })

  it('effective percentage reflects the rounded weight, not the target', () => {
    const dose = doseFor(1, 7, corner({ maxPercent: 1 }), 100, 0.05)
    // target: 1/7 % of 100 g = 0.1429 g → rounds to 0.15 g → 0.15%
    expect(dose.rounded).toBeCloseTo(0.15, 10)
    expect(dose.effectivePct).toBeCloseTo(0.15, 10)
  })

  it('roundToIncrement produces clean values', () => {
    expect(roundToIncrement(0.14285714, 0.01)).toBe(0.14)
    expect(roundToIncrement(2.675, 0.05)).toBe(2.7)
  })
})
