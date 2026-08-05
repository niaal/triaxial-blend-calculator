import type { Blend } from '../types'
import { defaultBlend, DEFAULT_DENSITY, DEFAULT_OVERAGE } from './blend'

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeBlend(blend: Blend): string {
  return toBase64Url(JSON.stringify(blend))
}

export function decodeBlend(param: string): Blend | null {
  try {
    const parsed = JSON.parse(fromBase64Url(param))
    if (
      !parsed ||
      !Array.isArray(parsed.corners) ||
      parsed.corners.length !== 3 ||
      !parsed.grid ||
      !parsed.measurement ||
      !parsed.base
    ) {
      return null
    }
    // merge over defaults so links from older versions keep working
    const d = defaultBlend()
    return {
      name: typeof parsed.name === 'string' ? parsed.name : d.name,
      base: { ...d.base, ...parsed.base },
      corners: parsed.corners,
      grid: parsed.grid,
      measurement: {
        ...d.measurement,
        ...parsed.measurement,
        materialDensity: DEFAULT_DENSITY,
        overage: DEFAULT_OVERAGE,
      },
    }
  } catch {
    return null
  }
}

/** Read the blend out of the address bar, or fall back to the default. */
export function blendFromUrl(): Blend {
  const param = new URLSearchParams(window.location.search).get('s')
  if (param) {
    const decoded = decodeBlend(param)
    if (decoded) return decoded
  }
  return defaultBlend()
}

/**
 * Keep the address bar in sync so the URL *is* the saved state — copying it
 * at any moment captures the current setup.
 */
export function syncBlendToUrl(blend: Blend): void {
  const url = `${window.location.pathname}?s=${encodeBlend(blend)}`
  window.history.replaceState(null, '', url)
}

/** Canonical absolute link for the current blend (fresh, not the debounced address bar). */
export function shareUrlFor(blend: Blend): string {
  return `${window.location.origin}${window.location.pathname}?s=${encodeBlend(blend)}`
}
