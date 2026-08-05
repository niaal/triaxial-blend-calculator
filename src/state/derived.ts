import { useMemo } from 'react'
import { useStore } from './store'
import { findMaterial } from '../data/materials'
import { matchedInteractions } from '../data/interactions'
import {
  cellDoses,
  dryWeightOf,
  forecast,
  guardLevel,
  incDecimals,
  remediesFor,
  stepSize,
} from '../lib/calc'
import type { CornerDose, GuardLevel, Remedies } from '../lib/calc'
import { TILE_TO_N, cellsFor, totalTiles } from '../lib/grid'
import type { Cell } from '../lib/grid'
import type { Material } from '../types'

export type CornerGuard = {
  step: number
  level: GuardLevel
  remedies: Remedies
}

export type Derived = {
  n: number
  T: number
  cells: Cell[]
  dryWeight: number
  cornerMaterials: [Material | undefined, Material | undefined, Material | undefined]
  cornerNames: [string, string, string]
  cornerColours: [string, string, string]
  guards: [CornerGuard, CornerGuard, CornerGuard]
  anyBlocked: boolean
  notes: ReturnType<typeof matchedInteractions>
  totals: ReturnType<typeof forecast>
  dosesFor: (cell: Cell) => [CornerDose, CornerDose, CornerDose]
  weightDecimals: number
}

const FALLBACK_COLOUR = '#9b968c'

export function useDerived(): Derived {
  const { blend } = useStore()
  return useMemo(() => {
    const n = TILE_TO_N[blend.grid.tileCount]
    const dryWeight = dryWeightOf(blend.measurement)
    const cornerMaterials = blend.corners.map((c) =>
      findMaterial(c.materialId),
    ) as Derived['cornerMaterials']
    const guards = blend.corners.map((c) => {
      const step = stepSize(dryWeight, c.maxPercent, n, c.stockConcentration)
      return {
        step,
        level: guardLevel(step, blend.measurement.scaleIncrement),
        remedies: remediesFor(c, blend.measurement, n),
      }
    }) as Derived['guards']
    return {
      n,
      T: totalTiles(n),
      cells: cellsFor(n),
      dryWeight,
      cornerMaterials,
      cornerNames: blend.corners.map(
        (c, i) =>
          (c.materialId === 'custom' ? c.customName : cornerMaterials[i]?.name) ||
          'Custom',
      ) as Derived['cornerNames'],
      cornerColours: blend.corners.map(
        (c, i) =>
          (c.materialId === 'custom'
            ? c.customColour
            : cornerMaterials[i]?.firedColour) ?? FALLBACK_COLOUR,
      ) as Derived['cornerColours'],
      guards,
      anyBlocked: guards.some((g) => g.level === 'block'),
      notes: matchedInteractions(cornerMaterials, blend.base),
      totals: forecast(blend),
      dosesFor: (cell) => cellDoses(cell, blend),
      weightDecimals: incDecimals(blend.measurement.scaleIncrement),
    }
  }, [blend])
}

export function fmt(x: number, decimals: number): string {
  return x.toFixed(decimals)
}
