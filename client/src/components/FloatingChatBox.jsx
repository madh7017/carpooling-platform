import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const FloatingChatBox = ({
  isOpen,
  title,
  subtitle,
  messages,
  currentUserRole,
  messageDraft,
  onDraftChange,
  onSend,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 animate-slide-up sm:bottom-6 sm:right-6">
      <div className="rounded-t-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Live Chat</p>
            <h3 className="mt-1 text-lg font-bold">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-blue-50">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
            aria-label="Close chat"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-h-[24rem] min-h-[18rem] overflow-y-auto bg-slate-50 px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[14rem] items-center justify-center text-center text-sm text-slate-500">
            Start the conversation for this ride.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwnMessage = msg.senderRole === currentUserRole

              return (
                <div key={msg._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      isOwnMessage
                        ? 'rounded-br-md bg-blue-600 text-white'
                        : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    <p className={`text-[11px] font-semibold uppercase tracking-wide ${isOwnMessage ? 'text-blue-100' : 'text-slate-400'}`}>
                      {msg.senderRole}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="flex items-end gap-2">
          <input
            className="input-field"
            placeholder="Type your message"
            value={messageDraft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
          />
          <button className="btn-primary btn-sm shrink-0" onClick={onSend}>
            Send
          </button>
        </div>
      </div>
    </div>
    ,
    document.body
  )
}

export default FloatingChatBox
