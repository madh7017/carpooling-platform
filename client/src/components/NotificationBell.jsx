import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '@context/NotificationContext'

const formatTimeAgo = (value) => {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))

  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const NotificationBell = ({ onNavigate }) => {
  const { notifications, unreadCount, markAllAsRead, openNotification, clearNotifications } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const handleOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  const handleOpenNotification = (notification) => {
    openNotification(notification)
    setIsOpen(false)
    onNavigate?.()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
        aria-label="Open notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 17h5l-1.4-1.4a2 2 0 01-.6-1.42V11a6 6 0 10-12 0v3.18a2 2 0 01-.6 1.41L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={markAllAsRead} className="text-xs font-medium text-blue-700">
                Mark all read
              </button>
              <button type="button" onClick={clearNotifications} className="text-xs font-medium text-slate-500">
                Clear
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleOpenNotification(notification)}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 ${
                    notification.read ? 'bg-white' : 'bg-blue-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                    </div>
                    {!notification.read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{formatTimeAgo(notification.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
