import type { BaseGlaze, Interaction, Material } from '../types'

/**
 * Pairwise rules matched on family tags, so e.g. "cobalt + manganese" fires
 * whether the corner holds the carbonate or the oxide.
 */
export const INTERACTIONS: Interaction[] = [
  {
    families: ['chrome', 'tin'],
    effect:
      'Pink to crimson. Needs a calcium-rich base. Roughly 0.25–0.5% chrome against 5–8% tin. The main route to red at cone 10 oxidation.',
    severity: 'opportunity',
  },
  {
    families: ['cobalt', 'manganese'],
    effect: 'Violet.',
    severity: 'opportunity',
  },
  {
    families: ['cobalt', 'iron'],
    effect: 'Blue-black, muted.',
    severity: 'opportunity',
  },
  {
    families: ['iron', 'rutile'],
    effect: 'Variegated ochre and gold.',
    severity: 'opportunity',
  },
  {
    families: ['copper', 'tin'],
    effect: 'Opaque, muted green — the tin kills the depth.',
    severity: 'caution',
  },
  {
    families: ['copper', 'cobalt'],
    effect: 'Teal through turquoise.',
    severity: 'opportunity',
  },
  {
    families: ['titanium', 'iron'],
    effect: 'Crystalline gold-brown effects.',
    severity: 'opportunity',
  },
  {
    families: ['manganese', 'copper'],
    effect: 'Can push past 6% combined into blistering.',
    severity: 'caution',
  },
  {
    families: ['rutile', 'cobalt'],
    effect: 'Softens and breaks up the blue.',
    severity: 'opportunity',
  },
  {
    families: ['chrome', 'zinc'],
    effect: 'Dull brown — zinc kills chrome greens, same as a zinc-bearing base.',
    severity: 'caution',
  },
  {
    families: ['copper', 'lithium'],
    effect: 'Brighter, more turquoise coppers. Lithium adds flow — watch for running.',
    severity: 'opportunity',
  },
]

export type MatchedNote = {
  title: string
  effect: string
  severity: 'opportunity' | 'caution'
}

/**
 * Non-blocking notes for the current selection: every interaction rule whose
 * two families appear on two *different* corners, plus the chrome × zinc-base
 * caution keyed off the explicit base flag.
 */
export function matchedInteractions(
  cornerMaterials: Array<Material | undefined>,
  base: BaseGlaze,
): MatchedNote[] {
  const notes: MatchedNote[] = []
  const present = cornerMaterials.filter((m): m is Material => !!m)

  for (const rule of INTERACTIONS) {
    const [fa, fb] = rule.families
    const holdersA = present.filter((m) => m.families.includes(fa))
    const holdersB = present.filter((m) => m.families.includes(fb))
    const distinctPair = holdersA.some((a) => holdersB.some((b) => a !== b))
    if (distinctPair) {
      const nameOf = (f: string) =>
        present.find((m) => m.families.includes(f as never))?.name ?? f
      notes.push({
        title: `${nameOf(fa)} + ${nameOf(fb)}`,
        effect: rule.effect,
        severity: rule.severity,
      })
    }
  }

  if (base.zincBearing && present.some((m) => m.families.includes('chrome'))) {
    notes.push({
      title: `Chrome + zinc-bearing base (${base.name})`,
      effect:
        'Dull brown. Chrome greens need a zinc-free base — consider a different base or drop the chrome corner.',
      severity: 'caution',
    })
  }

  return notes
}
