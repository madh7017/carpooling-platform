import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const DEFAULT_WIDTH = 384
const DEFAULT_HEIGHT = 520
const MIN_WIDTH = 320
const MIN_HEIGHT = 360
const VIEWPORT_MARGIN = 16
const KEYBOARD_STEP = 20
const FAST_KEYBOARD_STEP = 60

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const getViewportBounds = () => ({
  width: typeof window === 'undefined' ? DEFAULT_WIDTH + VIEWPORT_MARGIN * 2 : window.innerWidth,
  height: typeof window === 'undefined' ? DEFAULT_HEIGHT + VIEWPORT_MARGIN * 2 : window.innerHeight,
})

const clampSize = (size, viewport) => ({
  width: clamp(size.width, MIN_WIDTH, Math.max(MIN_WIDTH, viewport.width - VIEWPORT_MARGIN * 2)),
  height: clamp(size.height, MIN_HEIGHT, Math.max(MIN_HEIGHT, viewport.height - VIEWPORT_MARGIN * 2)),
})

const clampPosition = (position, size, viewport) => ({
  x: clamp(position.x, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, viewport.width - size.width - VIEWPORT_MARGIN)),
  y: clamp(position.y, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, viewport.height - size.height - VIEWPORT_MARGIN)),
})

const getDefaultLayout = () => {
  const viewport = getViewportBounds()
  const size = clampSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }, viewport)

  return {
    size,
    position: {
      x: Math.max(VIEWPORT_MARGIN, viewport.width - size.width - VIEWPORT_MARGIN),
      y: Math.max(VIEWPORT_MARGIN, viewport.height - size.height - VIEWPORT_MARGIN),
    },
  }
}

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
  const [{ position, size }, setLayout] = useState(() => getDefaultLayout())
  const dragStateRef = useRef(null)
  const resizeStateRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return undefined

    const handleViewportChange = () => {
      const viewport = getViewportBounds()

      setLayout((current) => {
        const nextSize = clampSize(current.size, viewport)
        const nextPosition = clampPosition(current.position, nextSize, viewport)
        return { position: nextPosition, size: nextSize }
      })
    }

    handleViewportChange()
    window.addEventListener('resize', handleViewportChange)
    return () => window.removeEventListener('resize', handleViewportChange)
  }, [mounted])

  useEffect(() => {
    if (!mounted) return undefined

    const handlePointerMove = (event) => {
      if (dragStateRef.current) {
        const viewport = getViewportBounds()
        const nextPosition = clampPosition(
          {
            x: dragStateRef.current.startPosition.x + (event.clientX - dragStateRef.current.pointerStart.x),
            y: dragStateRef.current.startPosition.y + (event.clientY - dragStateRef.current.pointerStart.y),
          },
          size,
          viewport
        )

        setLayout((current) => ({ ...current, position: nextPosition }))
      }

      if (resizeStateRef.current) {
        const viewport = getViewportBounds()
        const nextSize = clampSize(
          {
            width: resizeStateRef.current.startSize.width + (event.clientX - resizeStateRef.current.pointerStart.x),
            height: resizeStateRef.current.startSize.height + (event.clientY - resizeStateRef.current.pointerStart.y),
          },
          viewport
        )

        const nextPosition = clampPosition(position, nextSize, viewport)
        setLayout({ position: nextPosition, size: nextSize })
      }
    }

    const stopInteractions = () => {
      dragStateRef.current = null
      resizeStateRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopInteractions)
    window.addEventListener('pointercancel', stopInteractions)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopInteractions)
      window.removeEventListener('pointercancel', stopInteractions)
    }
  }, [mounted, position, size])

  const moveBy = (deltaX, deltaY) => {
    const viewport = getViewportBounds()
    setLayout((current) => {
      const nextPosition = clampPosition(
        {
          x: current.position.x + deltaX,
          y: current.position.y + deltaY,
        },
        current.size,
        viewport
      )

      return { ...current, position: nextPosition }
    })
  }

  const resizeBy = (deltaWidth, deltaHeight) => {
    const viewport = getViewportBounds()
    setLayout((current) => {
      const nextSize = clampSize(
        {
          width: current.size.width + deltaWidth,
          height: current.size.height + deltaHeight,
        },
        viewport
      )

      const nextPosition = clampPosition(current.position, nextSize, viewport)
      return { position: nextPosition, size: nextSize }
    })
  }

  const handleDragStart = (event) => {
    if (event.target.closest('button, input, textarea, select, a')) return

    dragStateRef.current = {
      pointerStart: { x: event.clientX, y: event.clientY },
      startPosition: position,
    }
  }

  const handleResizeStart = (event) => {
    event.preventDefault()
    event.stopPropagation()

    resizeStateRef.current = {
      pointerStart: { x: event.clientX, y: event.clientY },
      startSize: size,
    }
  }

  const handleDragKeyDown = (event) => {
    const step = event.shiftKey ? FAST_KEYBOARD_STEP : KEYBOARD_STEP

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveBy(-step, 0)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveBy(step, 0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveBy(0, -step)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveBy(0, step)
    }
  }

  const handleResizeKeyDown = (event) => {
    const step = event.shiftKey ? FAST_KEYBOARD_STEP : KEYBOARD_STEP

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      resizeBy(-step, 0)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      resizeBy(step, 0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      resizeBy(0, -step)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      resizeBy(0, step)
    }
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      className="fixed z-40 flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 animate-slide-up"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
        maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
      }}
      role="dialog"
      aria-modal="false"
      aria-label={`Chat with ${title}`}
    >
      <div
        className="cursor-move rounded-t-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-4 py-4 text-white touch-none select-none"
        onPointerDown={handleDragStart}
        onKeyDown={handleDragKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Drag chat window"
        aria-describedby="chat-window-drag-help"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Live Chat</p>
            <h3 className="mt-1 text-lg font-bold">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-blue-50">{subtitle}</p>}
            <p id="chat-window-drag-help" className="sr-only">
              Drag this header to move the chat window. Use arrow keys to move it. Hold shift for larger steps.
            </p>
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

      <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
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
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-wide ${
                        isOwnMessage ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
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

      <button
        type="button"
        className="absolute bottom-1 right-1 h-8 w-8 cursor-se-resize rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
        onPointerDown={handleResizeStart}
        onKeyDown={handleResizeKeyDown}
        aria-label="Resize chat window"
        aria-describedby="chat-window-resize-help"
      >
        <svg className="mx-auto h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 11L11 5M8 11L11 8M11 11L11 11.01" strokeLinecap="round" />
        </svg>
        <span id="chat-window-resize-help" className="sr-only">
          Drag to resize the chat window. Use arrow keys to resize it. Hold shift for larger steps.
        </span>
      </button>
    </div>,
    document.body
  )
}

export default FloatingChatBox
