import { useStore } from '../state/store'
import { useDerived, fmt } from '../state/derived'
import { TriangleSVG } from './TriangleSVG'
import { CORNER_LABELS } from '../types'
import { shareUrlFor } from '../lib/share'
import { useQrDataUrl } from './Qr'

function PrintHeader({ subtitle }: { subtitle: string }) {
  const { blend } = useStore()
  const d = useDerived()
  const m = blend.measurement
  // every printout carries its own setup link — scan any old sheet to reopen it
  const qr = useQrDataUrl(shareUrlFor(blend), 256)
  return (
    <header
      style={{
        borderBottom: '2pt solid #111',
        marginBottom: '8pt',
        paddingBottom: '4pt',
        display: 'flex',
        gap: '8pt',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong style={{ fontSize: '14pt' }}>{blend.name}</strong>
          <span style={{ fontSize: '9pt' }}>{new Date().toLocaleDateString()}</span>
        </div>
        <div style={{ fontSize: '9pt', marginTop: '2pt' }}>
          {subtitle} · base {blend.base.name} · {m.portionWeight} g {m.portionMode} portion
          {m.portionMode === 'slurry' && ` (SG ${m.slurrySG} → ${fmt(d.dryWeight, 1)} g dry base)`} ·
          scale {m.scaleIncrement} g
        </div>
        <div style={{ fontSize: '9pt', marginTop: '2pt' }}>
          {([0, 1, 2] as const).map((i) => (
            <span key={i} style={{ marginRight: '12pt' }}>
              <strong>{CORNER_LABELS[i]}</strong> {d.cornerNames[i]} ≤{blend.corners[i].maxPercent}%
              {blend.corners[i].stockConcentration < 1 &&
                ` as ${Math.round(blend.corners[i].stockConcentration * 100)}% stock`}
            </span>
          ))}
        </div>
      </div>
      {qr && (
        <img
          src={qr}
          alt="QR code — scan to open this setup"
          style={{ width: '58pt', height: '58pt', flexShrink: 0 }}
        />
      )}
    </header>
  )
}

/** Print artefact 1 — the triangle chart, sized to lay physical tiles against. */
export function PrintChart() {
  const { blend } = useStore()
  const d = useDerived()
  if (d.anyBlocked) return null
  return (
    <div id="print-chart">
      <PrintHeader subtitle={`Triangle chart · ${blend.grid.tileCount} tiles`} />
      <TriangleSVG
        n={d.n}
        cells={d.cells}
        cornerColours={d.cornerColours}
        cornerLabels={d.cornerNames}
        dosesFor={d.dosesFor}
        forPrint
      />
      <p style={{ fontSize: '8pt', marginTop: '4pt' }}>
        A at apex, B bottom-left, C bottom-right. Tile numbers match the batch sheet; scratch
        each number into the tile before dipping.
      </p>
    </div>
  )
}

/** Print artefact 2 — the batch sheet with a tick column per tile. */
export function PrintSheet() {
  const { blend } = useStore()
  const d = useDerived()
  if (d.anyBlocked) return null
  const hazards = new Set(
    d.cornerMaterials.flatMap((m) => m?.hazards ?? []),
  )
  return (
    <div id="print-sheet">
      <PrintHeader subtitle={`Batch sheet · ${blend.grid.tileCount} tiles`} />
      {hazards.size > 0 && (
        <p style={{ fontSize: '8.5pt', border: '1pt solid #333', padding: '3pt 6pt', marginBottom: '6pt' }}>
          Hazards in this blend: {[...hazards].join(', ')}. Weigh dry colourants with a respirator
          on and the bench damp-wiped after.
        </p>
      )}
      <table className="print-table">
        <thead>
          <tr>
            <th>✓</th>
            <th>Tile</th>
            <th>i·j·k</th>
            {([0, 1, 2] as const).map((i) => (
              <th key={i}>
                {CORNER_LABELS[i]} {d.cornerNames[i]}
                <br />
                g{blend.corners[i].stockConcentration < 1 && ' (stock)'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {d.cells.map((cell) => {
            const doses = d.dosesFor(cell)
            return (
              <tr key={cell.tile}>
                <td>
                  <span className="tick-box" />
                </td>
                <td style={{ fontWeight: 700 }}>{cell.tile}</td>
                <td>
                  {cell.i}·{cell.j}·{cell.k}
                </td>
                {doses.map((dose, i) => (
                  <td key={i}>{fmt(dose.rounded, d.weightDecimals)}</td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p style={{ fontSize: '8pt', marginTop: '4pt' }}>
        Each weight is additive grams over one {blend.measurement.portionWeight} g{' '}
        {blend.measurement.portionMode} portion ({fmt(d.dryWeight, 1)} g dry base). Percentages
        never sum to 100 — they are independent additions over the same base.
      </p>
    </div>
  )
}
