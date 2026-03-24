import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

let toastId = 0
let confirmId = 0

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [promptDialog, setPromptDialog] = useState(null)

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastId
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => dismissToast(id), 3500)
  }, [dismissToast])

  const confirmAction = useCallback((message, options = {}) => {
    const id = ++confirmId

    return new Promise((resolve) => {
      setConfirmDialog({
        id,
        message,
        title: options.title || 'Please Confirm',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        tone: options.tone || 'primary',
        resolve,
      })
    })
  }, [])

  const promptAction = useCallback((message, options = {}) => {
    const id = ++confirmId

    return new Promise((resolve) => {
      setPromptDialog({
        id,
        message,
        title: options.title || 'Add Details',
        confirmLabel: options.confirmLabel || 'Save',
        cancelLabel: options.cancelLabel || 'Cancel',
        tone: options.tone || 'primary',
        placeholder: options.placeholder || '',
        initialValue: options.initialValue || '',
        resolve,
      })
    })
  }, [])

  const handleConfirmClose = useCallback((result) => {
    setConfirmDialog((current) => {
      if (current?.resolve) current.resolve(result)
      return null
    })
  }, [])

  const handlePromptClose = useCallback((result) => {
    setPromptDialog((current) => {
      if (current?.resolve) current.resolve(result)
      return null
    })
  }, [])

  const value = useMemo(
    () => ({ showToast, dismissToast, confirmAction, promptAction }),
    [showToast, dismissToast, confirmAction, promptAction]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {confirmDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md animate-slide-up rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">{confirmDialog.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{confirmDialog.message}</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="btn-secondary"
              >
                {confirmDialog.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={confirmDialog.tone === 'danger' ? 'btn-danger' : 'btn-primary'}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      {promptDialog && (
        <PromptModal
          dialog={promptDialog}
          onCancel={() => handlePromptClose(null)}
          onConfirm={(value) => handlePromptClose(value)}
        />
      )}
      <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-slide-up rounded-2xl border px-4 py-3 shadow-xl ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : toast.type === 'danger'
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : 'border-blue-200 bg-blue-50 text-blue-900'
            }`}
            role="alert"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded-full px-1 text-base leading-none opacity-70 transition hover:opacity-100"
                aria-label="Dismiss popup"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const PromptModal = ({ dialog, onCancel, onConfirm }) => {
  const [value, setValue] = useState(dialog.initialValue || '')

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg animate-slide-up rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-900">{dialog.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{dialog.message}</p>

        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={dialog.placeholder}
          rows={4}
          className="textarea-field mt-4"
          autoFocus
        />

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {dialog.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(value)}
            className={dialog.tone === 'danger' ? 'btn-danger' : 'btn-primary'}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
