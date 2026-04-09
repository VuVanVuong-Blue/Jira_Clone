import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { useUser } from './UserContext'
import CreateSpaceModal from './CreateSpaceModal'
import GlobalSearchDropdown from './GlobalSearchDropdown'
import NotificationItem from './NotificationItem'
import { useToast } from './Toast'

export default function Layout({ children, onLogout, projectId }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [spaces, setSpaces] = useState([])
  const [showCreateSpace, setShowCreateSpace] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Notification state
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const { user } = useUser() || {}
  const { addToast } = useToast()
  
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  useEffect(() => {
    fetchSpaces()
    fetchNotificationData()
    
    // Polling notifications every 15 seconds
    const interval = setInterval(fetchNotificationData, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotificationData = async () => {
    try {
      const countRes = await api.getUnreadCount()
      if (countRes.ok) setUnreadCount(countRes.data)
      
      if (showNotifications) {
        const listRes = await api.getNotifications()
        if (listRes.ok) setNotifications(listRes.data)
      }
    } catch (e) {
      console.error('Error fetching notifications', e)
    }
  }

  const handleToggleNotifications = () => {
    const newState = !showNotifications
    setShowNotifications(newState)
    if (newState) {
      fetchNotificationsList()
    }
  }

  const fetchNotificationsList = async () => {
    setLoadingNotifications(true)
    try {
      const res = await api.getNotifications()
      console.log('[Notifications] API response:', res.ok, res.data)
      if (res.ok) {
        setNotifications(res.data)
      } else {
        console.error('[Notifications] API error:', res.data)
      }
    } catch (e) {
      console.error('[Notifications] Exception:', e)
      addToast('Lỗi khi tải thông báo', 'error')
    }
    setLoadingNotifications(false)
  }

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      const countRes = await api.getUnreadCount()
      if (countRes.ok) setUnreadCount(countRes.data)
    } catch (e) { /* silent */ }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      addToast('Đã đánh dấu tất cả là đã đọc', 'success')
    } catch (e) {
      addToast('Thao tác thất bại', 'error')
    }
  }

  const handleNotificationAction = (id, status) => {
    // Tìm invitationId của thông báo vừa click
    const clickedNotification = notifications.find(n => n.id === id)
    const invitationId = clickedNotification ? clickedNotification.invitationId : null
    
    // Xóa tất cả thông báo liên quan đến invitationId này khỏi local state ngay lập tức
    if (invitationId) {
      setNotifications(prev => prev.filter(n => n.invitationId !== invitationId))
    } else {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }
    
    // Refresh cả count và list từ server cho chắc chắn
    fetchNotificationData()
    fetchNotificationsList()
  }

  const handleDeleteNotification = async (id) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id))
      await api.deleteNotification(id)
      const countRes = await api.getUnreadCount()
      if (countRes.ok) setUnreadCount(countRes.data)
    } catch (e) {
      addToast('Lỗi khi xóa thông báo', 'error')
    }
  }

  const fetchSpaces = async () => {
    const res = await api.getSpaces()
    if (res.ok) setSpaces(res.data)
  }

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible)
  }

  return (
    <div style={{ backgroundColor: '#F7F8F9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* FIXED HEADER */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #DCDFE4', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            id="hamburger-btn"
            onClick={toggleSidebar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F1F2F4'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#626F86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          
          <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginLeft: '8px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: '#0C66E4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14l8-8 8 8"/></svg>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0C66E4' }}>Jira Clone</span>
          </Link>
        </div>

        <div style={{ position: 'relative', width: '280px', transition: 'width 0.2s ease', zIndex: 110 }}>
          <div style={{ position: 'relative', width: '100%', height: '32px', backgroundColor: showSearchDropdown ? '#FFFFFF' : '#F1F2F4', border: showSearchDropdown ? '2px solid #4C9AFF' : '2px solid transparent', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 8px', transition: 'all 0.2s ease' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8590A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#172B4D', marginLeft: '8px', width: '100%' }} />
          </div>
          {showSearchDropdown && (
            <GlobalSearchDropdown 
              onClose={() => setShowSearchDropdown(false)} 
              searchTerm={searchTerm}
            />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ width: '32px', height: '32px', backgroundColor: '#0C66E4', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          
          
          <div style={{ position: 'relative' }}>
            <div 
              onClick={handleToggleNotifications}
              style={{ position: 'relative', cursor: 'pointer', padding: '6px', borderRadius: '50%', backgroundColor: showNotifications ? '#E9F2FF' : 'transparent', color: showNotifications ? '#0C66E4' : '#626F86', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = showNotifications ? '#E9F2FF' : '#F1F2F4'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = showNotifications ? '#E9F2FF' : 'transparent'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={unreadCount > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: '0px', right: '0px', minWidth: '18px', height: '18px', backgroundColor: '#E34935', color: 'white', borderRadius: '9px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>

            {showNotifications && (
              <div 
                id="notification-dropdown"
                style={{ position: 'absolute', top: '48px', right: '-8px', backgroundColor: '#FFFFFF', border: '1px solid #DCDFE4', borderRadius: '8px', boxShadow: '0 12px 24px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31)', width: '400px', zIndex: 120, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #EBECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF' }}>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#172B4D', fontFamily: 'Inter, sans-serif' }}>Thông báo</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#0C66E4', fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }} onMouseOver={e => e.target.style.backgroundColor = '#E9F2FF'} onMouseOut={e => e.target.style.backgroundColor = 'transparent'}>Đánh dấu tất cả đã đọc</button>
                  )}
                </div>

                <div style={{ overflowY: 'auto', flex: 1, minHeight: '200px', backgroundColor: '#F7F8F9' }}>
                  {loadingNotifications ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#626F86', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #E9F2FF', borderTop: '3px solid #0C66E4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Đang tải thông báo...
                    </div>
                  ) : notifications.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {notifications.map(n => (
                        <NotificationItem 
                          key={n.id} 
                          notification={n} 
                          onRead={handleMarkRead} 
                          onAction={handleNotificationAction} 
                          onDelete={handleDeleteNotification}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#E9F2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                         <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0C66E4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="18" y1="2" x2="22" y2="6"/><line x1="22" y1="2" x2="18" y2="6"/></svg>
                       </div>
                       <div style={{ fontSize: '18px', fontWeight: '600', color: '#172B4D', marginBottom: '8px' }}>Bạn đã cập nhật hết!</div>
                       <div style={{ fontSize: '14px', color: '#626F86', lineHeight: '1.5' }}>Khi có hoạt động mới, thông báo sẽ hiển thị ở đây để bạn dễ dàng theo dõi.</div>
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '12px', textAlign: 'center', backgroundColor: '#FFF', borderTop: '1px solid #EBECF0', boxShadow: '0 -2px 6px rgba(9,30,66,0.04)' }}>
                   <Link to="/notifications" onClick={() => setShowNotifications(false)} style={{ color: '#0C66E4', fontSize: '14px', fontWeight: '500', textDecoration: 'none', display: 'block', padding: '8px', borderRadius: '4px' }} onMouseOver={e => e.target.style.backgroundColor = '#E9F2FF'} onMouseOut={e => e.target.style.backgroundColor = 'transparent'}>Xem tất cả thông báo</Link>
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <div 
               onClick={() => setShowProfileMenu(!showProfileMenu)}
               style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0C66E4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', overflow: 'hidden' }}
               title={user?.fullName || 'Tài khoản'}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (user?.fullName || 'U').charAt(0).toUpperCase()
              )}
            </div>
            {showProfileMenu && (
              <div style={{ position: 'absolute', top: '40px', right: '0', backgroundColor: '#FFFFFF', border: '1px solid #DCDFE4', borderRadius: '4px', boxShadow: '0 4px 12px rgba(9,30,66,0.15)', width: '200px', padding: '8px 0', zIndex: 101 }}>
                <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', color: '#626F86', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  TÀI KHOẢN
                </div>
                <Link 
                  to="/profile" 
                  style={{ display: 'block', padding: '8px 16px', fontSize: '14px', color: '#172B4D', textDecoration: 'none' }} 
                  onClick={() => setShowProfileMenu(false)}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#F1F2F4'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Hồ sơ cá nhân
                </Link>
                <div style={{ height: '1px', backgroundColor: '#DCDFE4', margin: '4px 0' }}></div>
                <div 
                  onClick={() => { setShowProfileMenu(false); onLogout && onLogout(); }}
                  style={{ padding: '8px 16px', fontSize: '14px', color: '#DE350B', cursor: 'pointer' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#F1F2F4'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Đăng xuất
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* FIXED SIDEBAR */}
      <aside style={{ 
        position: 'fixed', 
        top: '56px', 
        left: 0, 
        bottom: 0, 
        width: isSidebarVisible ? '240px' : '0', 
        backgroundColor: '#FFFFFF', 
        borderRight: isSidebarVisible ? '1px solid #DCDFE4' : 'none', 
        zIndex: 90, 
        display: 'flex', 
        flexDirection: 'column',
        overflowX: 'hidden',
        transition: 'width 0.2s ease',
      }}>
        
        {projectId ? (
          <div style={{ padding: '8px', flex: 1, minWidth: '240px' }}>
            <div style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: '#0C66E4', borderRadius: '4px' }}></div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#172B4D' }}>Dự án {projectId}</div>
                <div style={{ fontSize: '11px', color: '#626F86' }}>Dự án phần mềm</div>
              </div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Link to={`/projects/${projectId}/board`} style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', backgroundColor: isActive(`/projects/${projectId}/board`) ? '#E9F2FF' : 'transparent', color: isActive(`/projects/${projectId}/board`) ? '#0C66E4' : '#172B4D', fontWeight: isActive(`/projects/${projectId}/board`) ? '600' : '400' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                <span style={{ fontSize: '14px' }}>Công việc (Board)</span>
              </Link>
              <Link to={`/projects/${projectId}/backlog`} style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', backgroundColor: isActive(`/projects/${projectId}/backlog`) ? '#E9F2FF' : 'transparent', color: isActive(`/projects/${projectId}/backlog`) ? '#0C66E4' : '#172B4D', fontWeight: isActive(`/projects/${projectId}/backlog`) ? '600' : '400' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                <span style={{ fontSize: '14px' }}>Backlog</span>
              </Link>
              <Link to={`/projects/${projectId}/reports`} style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', backgroundColor: isActive(`/projects/${projectId}/reports`) ? '#E9F2FF' : 'transparent', color: isActive(`/projects/${projectId}/reports`) ? '#0C66E4' : '#172B4D', fontWeight: isActive(`/projects/${projectId}/reports`) ? '600' : '400' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <span style={{ fontSize: '14px' }}>Báo cáo</span>
              </Link>
              <Link to={`/projects/${projectId}/timeline`} style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', backgroundColor: isActive(`/projects/${projectId}/timeline`) ? '#E9F2FF' : 'transparent', color: isActive(`/projects/${projectId}/timeline`) ? '#0C66E4' : '#172B4D', fontWeight: isActive(`/projects/${projectId}/timeline`) ? '600' : '400' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                <span style={{ fontSize: '14px' }}>Timeline (Gantt)</span>
              </Link>
              <Link to={`/projects/${projectId}/settings`} style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', backgroundColor: isActive(`/projects/${projectId}/settings`) ? '#E9F2FF' : 'transparent', color: isActive(`/projects/${projectId}/settings`) ? '#0C66E4' : '#172B4D', fontWeight: isActive(`/projects/${projectId}/settings`) ? '600' : '400' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1 2-2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span style={{ fontSize: '14px' }}>Cài đặt dự án</span>
              </Link>
            </nav>
          </div>
        ) : (
          <div style={{ padding: '8px', flex: 1, minWidth: '240px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Link to="/" style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', backgroundColor: isActive('/') ? '#E9F2FF' : 'transparent', color: isActive('/') ? '#0C66E4' : '#172B4D', fontWeight: isActive('/') ? '600' : '400' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span style={{ fontSize: '14px' }}>Trang chủ</span>
              </Link>

              <Link to="/projects" style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', backgroundColor: isActive('/projects') ? '#E9F2FF' : 'transparent', color: isActive('/projects') ? '#0C66E4' : '#172B4D', fontWeight: isActive('/projects') ? '600' : '400' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span style={{ fontSize: '14px' }}>Dự án</span>
              </Link>

              {/* SPACES SECTION */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                   <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#8590A2', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Spaces (Không gian)</div>
                   <button 
                     onClick={() => setShowCreateSpace(true)}
                     style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#626F86', padding: '2px', borderRadius: '3px' }}
                     onMouseOver={e => e.currentTarget.style.backgroundColor = '#F1F2F4'}
                     onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                     title="Tạo không gian mới"
                   >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                   </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {spaces.map(space => (
                    <div 
                      key={space.id} 
                      style={{ height: '32px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#F1F2F4'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '12px', height: '12px', backgroundColor: space.color, borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '13px', color: '#172B4D' }}>{space.name}</span>
                    </div>
                  ))}
                  
                  {spaces.length === 0 && (
                     <div style={{ padding: '8px 12px', fontSize: '12px', color: '#8590A2', fontStyle: 'italic' }}>
                       Chưa có không gian nào.
                     </div>
                  )}
                </div>
              </div>

              <Link to="/people" style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', backgroundColor: isActive('/people') ? '#E9F2FF' : 'transparent', color: isActive('/people') ? '#0C66E4' : '#172B4D', fontWeight: isActive('/people') ? '600' : '400' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span style={{ fontSize: '14px' }}>Nhân sự</span>
              </Link>

              <Link to="/roles" style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', backgroundColor: isActive('/roles') ? '#E9F2FF' : 'transparent', color: isActive('/roles') ? '#0C66E4' : '#172B4D', fontWeight: isActive('/roles') ? '600' : '400' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontSize: '14px' }}>Vai trò & Quyền</span>
                <span style={{ marginLeft: 'auto', backgroundColor: '#E9F2FF', color: '#0C66E4', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '3px' }}>Admin</span>
              </Link>
            </nav>

            <div style={{ marginTop: '24px', padding: '0 12px', minWidth: '240px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#8590A2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Yêu thích</div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '32px', cursor: 'pointer' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#0C66E4', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '13px', color: '#626F86' }}>Website Bán Hàng</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '32px', cursor: 'pointer' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#1F845A', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '13px', color: '#626F86' }}>App Mobile iOS</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid #DCDFE4', padding: '8px', minWidth: '240px' }}>
          <div style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#172B4D' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1 2-2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span style={{ fontSize: '14px' }}>Cài đặt</span>
          </div>
          <div style={{ height: '36px', borderRadius: '4px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#172B4D' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span style={{ fontSize: '14px' }}>Hỗ trợ</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ 
        paddingLeft: isSidebarVisible ? '240px' : '0', 
        paddingTop: '56px', 
        minHeight: '100vh', 
        boxSizing: 'border-box',
        transition: 'padding-left 0.2s ease'
      }}>
        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </main>

      {showCreateSpace && (
        <CreateSpaceModal 
          onClose={() => setShowCreateSpace(false)} 
          onSpaceCreated={(newSpace) => {
            setSpaces([...spaces, newSpace])
          }} 
        />
      )}
    </div>
  )
}
