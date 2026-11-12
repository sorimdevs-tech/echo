import { useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * MediaPrintPreview — renders a clinical-quality image print preview.
 *
 * Props:
 *   images       – array of URL strings (null/undefined slots render as "Unassigned frame")
 *   title        – freeform layout title (e.g. template name)
 *   columns      – grid column count (1–4)
 *   rows         – optional rows per printed page; 0/omitted keeps one flowing page
 *   imageWidth   – optional maximum image width in pixels
 *   imageHeight  – optional maximum image height in pixels
 *   patientId    – e.g. "TM0012026"
 *   patientName  – formatted display name
 *   visitId      – visit identifier
 *   visitDate    – formatted visit date string
 *   onClose      – callback to dismiss the preview
 */
export default function MediaPrintPreview({
  images = [],
  title = 'Selected images',
  columns = 1,
  rows = 0,
  imageWidth,
  imageHeight,
  onClose,
  patientId,
  patientName,
  visitId,
  visitDate,
}) {
  const [loaded, setLoaded] = useState(new Set())
  const [failed, setFailed] = useState(false)

  const safeImages = Array.isArray(images) ? images : []
  const safeColumns = Math.max(1, Math.min(4, Number(columns) || 1))
  const safeRows = Number(rows) > 0 ? Math.max(1, Math.min(6, Number(rows))) : 0
  const pageSize = safeRows ? safeRows * safeColumns : Math.max(1, safeImages.length)
  const pages = []
  for (let start = 0; start < safeImages.length; start += pageSize) {
    pages.push(safeImages.slice(start, start + pageSize))
  }
  if (!pages.length) pages.push([])

  const nonBlank = safeImages.filter(Boolean)
  const allLoaded = !failed && loaded.size === new Set(nonBlank).size && nonBlank.length > 0
  const imageStyle = {
    width: '100%',
    maxWidth: imageWidth ? `${imageWidth}px` : '100%',
    maxHeight: imageHeight ? `${imageHeight}px` : '220mm',
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto',
  }

  const content = (
    <div
      className="clinical-preview fixed inset-0 z-[100] overflow-auto bg-slate-800 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image print preview"
    >
      <div className="no-print mx-auto mb-3 flex max-w-4xl flex-wrap gap-3 items-center">
        <button
          type="button"
          className="primary-button"
          disabled={!allLoaded}
          onClick={() => window.print()}
        >
          Print / Save PDF
        </button>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close print preview
        </button>
        {failed && (
          <p role="alert" className="bg-white p-2 text-red-700">
            An image failed to load. Close and refresh before printing.
          </p>
        )}
        {!failed && nonBlank.length > 0 && !allLoaded && (
          <p className="text-slate-300 text-sm">Loading images…</p>
        )}
      </div>

      {pages.map((pageImages, pageIndex) => (
        <article key={pageIndex} className="clinical-print clinical-print-page mx-auto mb-4 max-w-4xl bg-white p-8">
          {/* Use a div, not a header: the global print stylesheet hides header elements. */}
          <div className="clinical-print-meta mb-4 border-b border-slate-300 pb-3 text-sm text-slate-700">
            <div className="mb-2 flex items-start justify-between gap-4">
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
              {pages.length > 1 && (
                <p className="whitespace-nowrap text-xs font-medium">Page {pageIndex + 1} of {pages.length}</p>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              <div className="flex gap-2"><dt className="font-semibold">Patient</dt><dd>{patientName || 'Not recorded'}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold">Patient ID</dt><dd>{patientId || 'Not recorded'}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold">Visit</dt><dd>{visitId || 'Not recorded'}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold">Visit date</dt><dd>{visitDate || 'Not recorded'}</dd></div>
            </dl>
          </div>

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}
          >
            {pageImages.map((url, index) => (
              <figure key={`${pageIndex}-${index}`} className="clinical-print-frame" style={{ breakInside: 'avoid' }}>
                {url ? (
                  <img
                    src={url}
                    alt={`Image ${pageIndex * pageSize + index + 1}`}
                    style={imageStyle}
                    onLoad={() => setLoaded(current => new Set([...current, url]))}
                    onError={() => setFailed(true)}
                  />
                ) : (
                  <p className="border p-4 text-slate-500">Unassigned frame</p>
                )}
              </figure>
            ))}
          </div>
        </article>
      ))}
    </div>
  )

  return createPortal(content, document.body)
}
