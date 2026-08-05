export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v =
    h.length === 3
      ? h.split('').map((c) => parseInt(c + c, 16))
      : [
          parseInt(h.slice(0, 2), 16),
          parseInt(h.slice(2, 4), 16),
          parseInt(h.slice(4, 6), 16),
        ]
  return [v[0] || 0, v[1] || 0, v[2] || 0]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) =>
    Math.max(0, Math.min(255, Math.round(x)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

const toLinear = (c: number) => Math.pow(c / 255, 2.2)
const fromLinear = (c: number) => Math.pow(c, 1 / 2.2) * 255

/**
 * Blend the three corner colours barycentrically by the cell's integer
 * components (gamma-corrected so mid-cells don't go muddy-grey).
 */
export function blendCellColour(
  cornerHexes: [string, string, string],
  i: number,
  j: number,
  k: number,
  n: number,
): string {
  const weights = [i / n, j / n, k / n]
  const rgbs = cornerHexes.map(hexToRgb)
  const out = [0, 1, 2].map((ch) =>
    fromLinear(
      weights.reduce((sum, w, ci) => sum + w * toLinear(rgbs[ci][ch]), 0),
    ),
  )
  return rgbToHex(out[0], out[1], out[2])
}

/** Mix a colour toward paper for the light preview tint. */
export function towardPaper(hex: string, paper: string, amount: number): string {
  const a = hexToRgb(hex)
  const p = hexToRgb(paper)
  return rgbToHex(
    a[0] + (p[0] - a[0]) * amount,
    a[1] + (p[1] - a[1]) * amount,
    a[2] + (p[2] - a[2]) * amount,
  )
}

/** WCAG-ish relative luminance, for picking readable text over a fill. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function readableOn(hex: string): string {
  return luminance(hex) > 0.45 ? '#16161a' : '#fafaf7'
}
