import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { getApiUrl } from '@api/api'

const NotificationContext = createContext(null)
const MAX_NOTIFICATIONS = 25

const getStorageKey = (userId) => `notifications:${userId}`

const createNotificationFromEvent = (eventType, payload, user) => {
  const routeByBooking = payload?.bookingId ? '/my-bookings' : null
  const isRideOwner = Boolean(payload?.driverId && user?.id === payload.driverId)
  const routeByRide = isRideOwner ? '/dashboard' : '/my-bookings'

  switch (eventType) {
    case 'booking_created':
      return {
        title: isRideOwner ? 'New booking received' : 'Booking confirmed',
        message: isRideOwner
          ? 'A passenger booked seats on your ride.'
          : 'Your ride booking was confirmed successfully.',
        href: isRideOwner ? '/dashboard' : '/my-bookings',
      }
    case 'booking_cancelled':
      return {
        title: 'Booking cancelled',
        message: isRideOwner
          ? 'A passenger cancelled their booking.'
          : 'Your booking was cancelled.',
        href: routeByBooking || routeByRide,
      }
    case 'checkin_update':
      return {
        title: 'Safety check-in',
        message: isRideOwner
          ? 'A passenger shared a new safety check-in.'
          : 'Your latest safety check-in was recorded.',
        href: routeByBooking || '/my-bookings',
      }
    case 'ride_update':
      return {
        title: payload?.status === 'completed' ? 'Ride completed' : 'Ride status changed',
        message:
          payload?.status === 'completed'
            ? 'A ride you are part of has been marked as completed.'
            : payload?.status === 'cancelled'
              ? 'A ride you are part of has been cancelled.'
              : `Ride updated to ${payload?.status || 'a new status'}.`,
        href: routeByRide,
      }
    case 'chat_message':
      return {
        title: 'New chat message',
        message: payload?.message?.message || 'You received a new message.',
        href: routeByBooking || '/my-bookings',
      }
    case 'support_request':
      return {
        title: 'New support request',
        message: payload?.subject
          ? `${payload.subject} needs admin review.`
          : 'A new support request needs admin review.',
        href: '/admin',
      }
    default:
      return {
        title: 'New update',
        message: 'Something changed in your account.',
        href: '/dashboard',
      }
  }
}

const shouldNotifyUser = (eventType, payload, user) => {
  if (!user?.id) return true

  switch (eventType) {
    case 'chat_message':
      return payload?.message?.sender !== user.id
    case 'booking_created':
      return payload?.passengerId !== user.id
    case 'booking_cancelled':
      return payload?.passengerId !== user.id
    case 'checkin_update':
      return payload?.passengerId !== user.id
    case 'ride_update':
      return payload?.driverId !== user.id
    case 'support_request':
      return Boolean(user?.isAdmin) && payload?.userId !== user.id
    default:
      return true
  }
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      return
    }

    const stored = localStorage.getItem(getStorageKey(user.id))
    setNotifications(stored ? JSON.parse(stored) : [])
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    localStorage.setItem(getStorageKey(user.id), JSON.stringify(notifications))
  }, [notifications, user?.id])

  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('Notification' in window)) return
    if (window.Notification.permission === 'default') {
      window.Notification.requestPermission().catch(() => {})
    }
  }, [user])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!user || !token) return undefined

    const source = new EventSource(getApiUrl(`/stream?token=${encodeURIComponent(token)}`))

    const handleIncomingEvent = (eventType) => (event) => {
      const payload = JSON.parse(event.data)
      if (!shouldNotifyUser(eventType, payload, user)) return

      const meta = createNotificationFromEvent(eventType, payload, user)

      if (eventType === 'support_request') {
        window.dispatchEvent(new Event('support-badge-refresh'))
      }

      const nextNotification = {
        id: `${eventType}:${payload.bookingId || payload.rideId || Date.now()}:${Date.now()}`,
        eventType,
        createdAt: new Date().toISOString(),
        read: false,
        ...meta,
      }

      setNotifications((prev) => [nextNotification, ...prev].slice(0, MAX_NOTIFICATIONS))

      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        window.Notification.permission === 'granted' &&
        document.visibilityState !== 'visible'
      ) {
        const browserNotification = new window.Notification(meta.title, { body: meta.message })
        browserNotification.onclick = () => {
          window.focus()
          navigate(meta.href)
          browserNotification.close()
        }
      }
    }

    const listeners = ['booking_created', 'booking_cancelled', 'checkin_update', 'ride_update', 'chat_message', 'support_request']

    listeners.forEach((eventType) => {
      source.addEventListener(eventType, handleIncomingEvent(eventType))
    })

    return () => source.close()
  }, [navigate, user])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }

  const openNotification = (notification) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
    )
    if (notification.href) {
      navigate(notification.href)
    }
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        openNotification,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
