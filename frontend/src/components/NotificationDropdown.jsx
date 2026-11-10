import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  X,
  AlertTriangle,
  Sparkles,
  FileCheck2,
  UserCheck,
  RotateCcw,
  ExternalLink,
  Info,
} from 'lucide-react'

// Initial default realistic echocardiography notifications
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'critical',
    category: 'Critical Clinical Alert',
    title: 'Severe Calcified Aortic Stenosis Detected',
    message:
      'Ms. Rekha Mehta Reddy (Adult Echo): AVA 0.8 cm², Mean Gradient 44 mmHg. Immediate cardiology review required.',
    time: '8 mins ago',
    read: false,
    link: '/patients',
    patientName: 'Ms. Rekha Mehta Reddy',
    badge: 'Critical',
  },
  {
    id: 'notif-2',
    type: 'ai',
    category: 'AI Detection Alert',
    title: 'Small Ostium Secundum ASD Detected',
    message:
      'Master Reyansh Hegde (Pediatric Echo): 4.2 mm ASD with left-to-right shunt flagged by echoAI model with 92% confidence.',
    time: '25 mins ago',
    read: false,
    link: '/patients',
    patientName: 'Master Reyansh Hegde',
    badge: 'AI Insight',
  },
  {
    id: 'notif-3',
    type: 'report',
    category: 'Report Sign-off Request',
    title: 'Echo Report Ready for Digital Signature',
    message:
      'Baby of Kiara Iyer (Pediatric Echo): VSD measurements finalized by sonographer. Awaiting final review & doctor sign-off.',
    time: '45 mins ago',
    read: false,
    link: '/reports',
    patientName: 'Baby of Kiara Iyer',
    badge: 'Sign-off',
  },
  {
    id: 'notif-4',
    type: 'patient',
    category: 'Appointment Scheduled',
    title: 'New Fetal Echo Scheduled',
    message:
      'Baby 444 bbb registered under Referral Dr. K. Ramesh for complete fetal cardiac anatomical survey.',
    time: '2 hours ago',
    read: true,
    link: '/patients',
    patientName: 'Baby 444 bbb',
    badge: 'New Patient',
  },
]

const STORAGE_KEY = 'echoai_notifications_list'

export default function NotificationDropdown() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('unread') // 'unread' | 'all'
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load notifications from storage', e)
    }
    return INITIAL_NOTIFICATIONS
  })

  const dropdownRef = useRef(null)

  // Save to localStorage whenever notifications change
  const saveNotifications = (newList) => {
    setNotifications(newList)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList))
      window.dispatchEvent(new Event('notifications_updated'))
    } catch (e) {
      console.error('Failed to save notifications', e)
    }
  }

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length
  const displayedNotifications =
    activeTab === 'unread' ? notifications.filter((n) => !n.read) : notifications

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Mark single notification as read (and remove from unread view)
  const handleMarkAsRead = (id, e) => {
    if (e) e.stopPropagation()
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    saveNotifications(updated)
  }

  // Dismiss / delete single notification
  const handleRemove = (id, e) => {
    if (e) e.stopPropagation()
    const updated = notifications.filter((n) => n.id !== id)
    saveNotifications(updated)
  }

  // Click on a notification item: marks as read, reduces badge count, and navigates
  const handleNotificationClick = (item) => {
    if (!item.read) {
      handleMarkAsRead(item.id)
    }
    setIsOpen(false)
    if (item.link) {
      navigate(item.link)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = (e) => {
    if (e) e.stopPropagation()
    const updated = notifications.map((n) => ({ ...n, read: true }))
    saveNotifications(updated)
  }

  // Clear all notifications
  const handleClearAll = (e) => {
    if (e) e.stopPropagation()
    saveNotifications([])
  }

  // Reset to initial demo notifications
  const handleResetNotifications = (e) => {
    if (e) e.stopPropagation()
    saveNotifications(INITIAL_NOTIFICATIONS)
  }

  // Get badge & icon for notification type
  const getTypeConfig = (type) => {
    switch (type) {
      case 'critical':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-50 text-red-600 border border-red-200/80',
          badgeClass: 'bg-red-100 text-red-700 border-red-200',
        }
      case 'ai':
        return {
          icon: Sparkles,
          iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/80',
          badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        }
      case 'report':
        return {
          icon: FileCheck2,
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/80',
          badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
        }
      case 'patient':
        return {
          icon: UserCheck,
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80',
          badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        }
      default:
        return {
          icon: Info,
          iconBg: 'bg-slate-50 text-slate-600 border border-slate-200/80',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        }
    }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="notification-bell-button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-150 focus:outline-none ${
          isOpen
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20 shadow-xs'
            : 'bg-white border-slate-200/80 text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-800'
        }`}
        title={`Notifications (${unreadCount} unread) - Click to view`}
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white shadow-xs animate-in zoom-in"
            title={`${unreadCount} unread notifications`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2.5 w-[380px] sm:w-[420px] max-w-[92vw] origin-top-right rounded-2xl bg-white border border-slate-200/90 shadow-2xl z-50 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Notifications</span>
                {unreadCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                    {unreadCount} unread
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                    All caught up
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#0f5449] hover:bg-[#e6f4f1] transition"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                    title="Clear all notifications"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeTab === 'unread'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Notifications ({notifications.length})
              </button>
            </div>
          </div>

          {/* Notifications List Container */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                  <BellOff className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                  {activeTab === 'unread'
                    ? 'All notifications have been read or dismissed.'
                    : 'You have cleared all alerts from the notification bell.'}
                </p>
                <button
                  type="button"
                  onClick={handleResetNotifications}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Restore demo notifications</span>
                </button>
              </div>
            ) : (
              displayedNotifications.map((item) => {
                const typeConfig = getTypeConfig(item.type)
                const IconComponent = typeConfig.icon

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative flex items-start gap-3 p-3.5 cursor-pointer transition-colors duration-150 ${
                      !item.read
                        ? 'bg-white hover:bg-slate-50/80'
                        : 'bg-slate-50/40 hover:bg-slate-100/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Unread indicator bar or dot */}
                    {!item.read && (
                      <span
                        className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-red-200"
                        title="Unread"
                      />
                    )}

                    {/* Icon Avatar */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeConfig.iconBg}`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>

                    {/* Text Body */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold border ${typeConfig.badgeClass}`}
                        >
                          {item.badge}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.time}
                        </span>
                      </div>

                      <h4
                        className={`text-xs font-bold leading-tight ${
                          !item.read ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </h4>

                      <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {item.link && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#0f5449] hover:underline">
                          <span>View patient & scan</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    {/* Actions on hover */}
                    <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                      {!item.read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Mark as read (removes from unread)"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleRemove(item.id, e)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 transition opacity-60 group-hover:opacity-100"
                        title="Dismiss notification"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium">
              Click notification to open scan & mark read
            </span>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleResetNotifications}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                title="Reset notifications to initial state"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
