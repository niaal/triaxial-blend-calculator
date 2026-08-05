export type TileCount = 21 | 28 | 36 | 45

export type Atmosphere = 'ox' | 'red'

export type Hazard = 'dust' | 'toxic' | 'fumes' | 'volatile' | 'not-food-safe'

/** Family tags used by the interaction-rule engine. */
export type Family =
  | 'chrome'
  | 'cobalt'
  | 'copper'
  | 'manganese'
  | 'iron'
  | 'rutile'
  | 'titanium'
  | 'tin'
  | 'zinc'
  | 'lithium'

export type Material = {
  id: string
  name: string
  form: 'carbonate' | 'oxide' | 'dioxide' | 'stain' | 'raw'
  recommendedMin: number
  recommendedMax: number
  defaultMax: number
  note?: string
  hazards: Hazard[]
  /** Approximate fired colour at cone 10 over a calcium-rich base — drives the axis tint. */
  firedColour: string
  families: Family[]
  /** Overrides applied when the blend is fired in reduction; unset fields fall through. */
  reduction?: Partial<
    Pick<
      Material,
      'note' | 'firedColour' | 'recommendedMin' | 'recommendedMax' | 'defaultMax'
    >
  >
}

export type BaseGlaze = {
  name: string
  recipe?: string
  /** Explicit flag; keys the chrome caution and the "ranges assume zinc-free" caveat. */
  zincBearing: boolean
}

export type Corner = {
  /** library material id, or 'custom' */
  materialId: string
  customName?: string
  /** fired-colour hex for custom materials (library colours come from seed data) */
  customColour?: string
  maxPercent: number
  /** w/w mass fraction, 0–1. 1.0 = dry powder; 0.1 = 10 g additive per 100 g suspension. */
  stockConcentration: number
}

export type GridConfig = {
  tileCount: TileCount
}

export type MeasurementConfig = {
  portionMode: 'dry' | 'slurry'
  portionWeight: number
  slurrySG?: number
  materialDensity: number
  scaleIncrement: number
  overage: number
}

/** The whole app state. Lives in the URL — nothing persists on the device. */
export type Blend = {
  name: string
  base: BaseGlaze
  atmosphere: Atmosphere
  corners: [Corner, Corner, Corner]
  grid: GridConfig
  measurement: MeasurementConfig
}

export type Interaction = {
  families: [Family, Family]
  effect: string
  severity: 'opportunity' | 'caution'
  /** Restrict a rule to one atmosphere; unset = applies in both. */
  atmosphere?: Atmosphere
}

export const CORNER_LABELS = ['A', 'B', 'C'] as const
