# Triaxial Blend Calculator

A single-page, fully client-side app for ceramics students running triaxial glaze
tests: three additives blended over a constant base glaze (default Leach 4321),
producing a printable batch sheet and triangle chart.

The blend is **additives over a constant base** — not three glazes summing to
100%. Additive percentages are independent and never normalised.

**The URL is the only state.** Every edit syncs into the `?s=` parameter
(base64url JSON), so the address bar is always the share/save link. Nothing is
written to the device — no localStorage, no accounts, no profiles. "Copy link"
is the whole persistence story.

## Develop

```sh
npm install
npm run dev      # local dev server
npm test         # maths unit tests (grid, guard, forecast, rounding)
npm run build    # typecheck + production build (PWA, offline-capable)
```

## Deploy

Pushing to `main` builds and deploys to GitHub Pages via
`.github/workflows/deploy.yml`. In the repo settings, set **Pages → Source →
GitHub Actions** once. The Vite base path is `/triaxial-blend-calculator/`; if
the repo is renamed, update `base` in `vite.config.ts` to match.

## Where things live

- `src/lib/grid.ts` — cell enumeration as integer triples (i, j, k), tile numbering
- `src/lib/calc.ts` — doses, rounding, Brongniart dry fraction, precision guard, forecast
- `src/lib/share.ts` — URL encode/decode/sync (the persistence layer)
- `src/lib/blend.ts` — default blend + hidden constants (density 2.6, overage 15%)
- `src/data/materials.ts` — seed material library (colours, ranges, hazards, family tags)
- `src/data/interactions.ts` — pairwise interaction notes, matched on family tags
- `src/components/` — Setup / Triangle / Batch sheet screens + print artefacts
- `src/state/` — reducer store (URL-synced) and derived per-blend calculations

## Conventions that matter

- Cells are stored/derived as integer triples; percentages are always computed,
  never stored (floats drift).
- `stockConcentration` is w/w (g additive per g suspension); everything the
  student dispenses is weighed in grams — there are no volumes anywhere.
- The precision guard blocks *outputs* (sheet, chart weights, print), never inputs.
- Free-text fields are length-capped (recipe 240 chars) so links stay under
  ~1,000 characters — QR-able and safe in email/chat.
- Custom materials live on the corner (`materialId: 'custom'` + name + colour)
  so they travel in the link; they get no interaction notes.

## Deliberately out of v1

Results logging (photos/notes/defects), JSON/CSV import-export, saved sessions,
material density + overage inputs. The architecture leaves room for them (the
Corner/Blend model is unchanged from the fuller spec) but they are not built.
