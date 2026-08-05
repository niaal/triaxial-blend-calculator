import type { TileCount } from '../types'

export const TILE_TO_N: Record<TileCount, number> = {
  21: 5,
  28: 6,
  36: 7,
  45: 8,
}

export const TILE_COUNTS: TileCount[] = [21, 28, 36, 45]

export type Cell = {
  /** corner A component */
  i: number
  /** corner B component */
  j: number
  /** corner C component */
  k: number
  r: number
  p: number
  tile: number
}

export function totalTiles(n: number): number {
  return ((n + 1) * (n + 2)) / 2
}

/**
 * Enumerate cells as integer triples. Rows r = 0..n top to bottom, row r has
 * r+1 cells p = 0..r left to right. i + j + k = n always. Percentages are
 * derived from these integers at display time, never stored.
 */
export function cellsFor(n: number): Cell[] {
  const cells: Cell[] = []
  for (let r = 0; r <= n; r++) {
    for (let p = 0; p <= r; p++) {
      cells.push({
        i: n - r,
        j: r - p,
        k: p,
        r,
        p,
        tile: (r * (r + 1)) / 2 + p + 1,
      })
    }
  }
  return cells
}
