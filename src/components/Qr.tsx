import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/** Render a URL as a QR data-URL; regenerates whenever the blend (and so the URL) changes. */
export function useQrDataUrl(url: string, width = 512): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  useEffect(() => {
    let stale = false
    QRCode.toDataURL(url, {
      width,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#17171b', light: '#ffffff' },
    })
      .then((u) => {
        if (!stale) setDataUrl(u)
      })
      .catch(() => setDataUrl(null))
    return () => {
      stale = true
    }
  }, [url, width])
  return dataUrl
}

export function QrOverlay({
  url,
  title,
  onClose,
}: {
  url: string
  title: string
  onClose: () => void
}) {
  const dataUrl = useQrDataUrl(url)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="QR code for this setup"
      onClick={onClose}
    >
      <div
        className="bg-paper border-2 border-ink p-5 max-w-xs w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-lg font-semibold leading-tight">{title}</p>
        <p className="mt-1 text-[0.7rem] text-ink-2">
          Scan with a phone camera to open this exact setup.
        </p>
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR code linking to the ${title} setup`}
            className="w-full aspect-square mt-3 border border-rule bg-white"
          />
        ) : (
          <div className="w-full aspect-square mt-3 border border-rule bg-white" />
        )}
        <button className="btn mt-4 w-full justify-center" onClick={onClose} autoFocus>
          Close
        </button>
      </div>
    </div>
  )
}
