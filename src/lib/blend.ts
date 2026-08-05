import type { Blend } from '../types'

/**
 * Hidden constants — deliberately not exposed in the UI to keep it simple.
 * materialDensity feeds the Brongniart dry-fraction calc in slurry mode;
 * overage pads the base forecast so nobody runs out mid-batch.
 */
export const DEFAULT_DENSITY = 2.6
export const DEFAULT_OVERAGE = 0.15

export function defaultBlend(): Blend {
  return {
    name: 'Chrome / tin / iron',
    base: {
      name: 'Leach 4321',
      recipe: '40 potash feldspar · 30 silica · 20 whiting · 10 kaolin',
      zincBearing: false,
    },
    corners: [
      { materialId: 'chrome-oxide', maxPercent: 1, stockConcentration: 1 },
      { materialId: 'tin-oxide', maxPercent: 8, stockConcentration: 1 },
      { materialId: 'red-iron-oxide', maxPercent: 8, stockConcentration: 1 },
    ],
    grid: { tileCount: 21 },
    measurement: {
      portionMode: 'dry',
      portionWeight: 100,
      slurrySG: 1.45,
      materialDensity: DEFAULT_DENSITY,
      scaleIncrement: 0.01,
      overage: DEFAULT_OVERAGE,
    },
  }
}
