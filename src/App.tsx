import { useState } from 'react'
import { SetupScreen } from './components/SetupScreen'
import { TriangleScreen } from './components/TriangleScreen'
import { BatchSheetScreen } from './components/BatchSheetScreen'
import { PrintChart, PrintSheet } from './components/PrintSheets'
import { useStore } from './state/store'
import { shareUrlFor } from './lib/share'
import { QrOverlay } from './components/Qr'

const TABS = ['Setup', 'Triangle', 'Batch sheet'] as const
type Tab = (typeof TABS)[number]

function printAs(target: 'chart' | 'sheet') {
  document.documentElement.setAttribute('data-print', target)
  // let the attribute apply before the (blocking) print dialog opens
  requestAnimationFrame(() => {
    window.print()
    document.documentElement.removeAttribute('data-print')
  })
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Setup')
  const { blend, dispatch } = useStore()
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)

  async function copyLink() {
    // encode fresh rather than trusting the (debounced) address bar
    const url = shareUrlFor(blend)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <>
      <div id="app-root">
        <header className="border-b-2 border-ink bg-paper">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <h1 className="font-display text-xl font-semibold leading-none">
              Triaxial
              <span className="block font-sans text-[0.6rem] font-normal uppercase tracking-[0.18em] text-ink-2 mt-1">
                blend calculator · cone 10 ox
              </span>
            </h1>
            <div className="ml-auto flex items-center gap-1.5 no-print">
              <button className="btn btn-accent" onClick={copyLink}>
                {copied ? 'Link copied ✓' : 'Copy link'}
              </button>
              <button className="btn" onClick={() => setShowQr(true)}>
                QR code
              </button>
              <button
                className="btn btn-quiet"
                onClick={() => {
                  if (window.confirm('Start over with the default setup? Copy your link first if you want to keep this one.')) {
                    dispatch({ type: 'reset' })
                  }
                }}
              >
                Start over
              </button>
            </div>
          </div>
          <nav className="max-w-5xl mx-auto px-4 no-print" aria-label="Screens">
            <ul className="flex gap-1 -mb-px overflow-x-auto">
              {TABS.map((t) => (
                <li key={t}>
                  <button
                    className={`px-3 py-2 text-[0.78rem] uppercase tracking-wider border-b-2 whitespace-nowrap ${
                      tab === t
                        ? 'border-accent text-accent font-semibold'
                        : 'border-transparent text-ink-2 hover:text-ink'
                    }`}
                    aria-current={tab === t ? 'page' : undefined}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="pt-6">
          {tab === 'Setup' && <SetupScreen />}
          {tab === 'Triangle' && <TriangleScreen onPrint={() => printAs('chart')} />}
          {tab === 'Batch sheet' && <BatchSheetScreen onPrint={() => printAs('sheet')} />}
        </main>

        <footer className="max-w-5xl mx-auto px-4 py-6 text-[0.65rem] text-ink-2 no-print">
          Everything you set up lives in this page's web address — nothing is saved on this
          computer. To keep or share a setup, use “Copy link” and paste it anywhere: an email,
          a class doc, a bookmark.
        </footer>
      </div>

      {showQr && (
        <QrOverlay
          url={shareUrlFor(blend)}
          title={blend.name}
          onClose={() => setShowQr(false)}
        />
      )}

      <PrintChart />
      <PrintSheet />
    </>
  )
}
