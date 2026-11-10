import { useId } from 'react'
import { createPortal } from 'react-dom'

export default function UnsavedChangesPrompt({
  open,
  title = 'Unsaved changes',
  message,
  saveLabel = 'Save changes',
  saving = false,
  saveDisabled = false,
  onSave,
  onDiscard,
  onCancel,
}) {
  const titleId = useId()
  const messageId = useId()
  if (!open) return null

  return createPortal(
    <div className="no-print fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-5 shadow-2xl"
      >
        <h2 id={titleId} className="text-base font-semibold text-slate-900">{title}</h2>
        <p id={messageId} className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="button" className="secondary-button" onClick={onDiscard} disabled={saving}>Discard</button>
          <button type="button" className="primary-button" onClick={onSave} disabled={saving || saveDisabled}>
            {saving ? 'Saving…' : saveLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
