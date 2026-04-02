import React from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from './Toast'

export default function NotificationItem({ notification, onRead, onAction }) {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = React.useState(false)

  const isInvitation = notification.type === 'project_invitation'

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id)
    
    if (!isInvitation && notification.issueId) {
      navigate(`/projects/board?issueId=${notification.issueId}`)
    }
  }

  const handleAccept = async (e) => {
    e.stopPropagation()
    setLoading(true)
    try {
      const res = await api.acceptInvitation(notification.invitationId)
      if (res.ok) {
        addToast('Đã chấp nhận lời mời tham gia dự án!', 'success')
        onAction(notification.id)
      } else {
        addToast(res.data.message || 'Lỗi khi chấp nhận lời mời', 'error')
      }
    } catch (e) {
      addToast('Lỗi kết nối', 'error')
    }
    setLoading(false)
  }

  const handleReject = async (e) => {
    e.stopPropagation()
    setLoading(true)
    try {
      const res = await api.rejectInvitation(notification.invitationId)
      if (res.ok) {
        addToast('Đã từ chối lời mời', 'info')
        onAction(notification.id)
      }
    } catch (e) {
      addToast('Lỗi kết nối', 'error')
    }
    setLoading(false)
  }

  const getMessage = () => {
    switch (notification.type) {
      case 'assigned': return `đã giao [${notification.issueKey}] cho bạn`
      case 'mentioned': return `đã nhắc đến bạn trong [${notification.issueKey}]`
      case 'status_changed': return `đã cập nhật trạng thái [${notification.issueKey}]`
      case 'comment_added': return `đã bình luận vào [${notification.issueKey}]`
      case 'project_invitation': return `đã mời bạn tham gia dự án "${notification.projectName}"`
      default: return 'đã cập nhật nội dung'
    }
  }

  return (
    <div 
      onClick={handleClick}
      style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid #EBECF0', 
        backgroundColor: notification.isRead ? '#FFFFFF' : '#F3F8FF',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        gap: '16px',
        position: 'relative'
      }}
      onMouseOver={e => e.currentTarget.style.backgroundColor = notification.isRead ? '#F7F8F9' : '#E9F2FF'}
      onMouseOut={e => e.currentTarget.style.backgroundColor = notification.isRead ? '#FFFFFF' : '#F3F8FF'}
    >
      {!notification.isRead && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: '#0C66E4' }} />
      )}
      
      {/* Avatar / Icon */}
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: isInvitation ? '#E3FCEF' : '#E9F2FF', color: isInvitation ? '#006644' : '#0C66E4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 'bold', flexShrink: 0, border: isInvitation ? '1px solid #00664420' : '1px solid #0C66E420' }}>
        {notification.actorAvatarUrl ? <img src={notification.actorAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (isInvitation ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> : notification.actorName?.charAt(0))}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', color: '#172B4D', lineHeight: '1.5', paddingRight: '12px' }}>
          <span style={{ fontWeight: '600' }}>{notification.actorName}</span> {getMessage()}
        </div>
        <div style={{ fontSize: '12px', color: '#626F86', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {new Date(notification.createdAt).toLocaleString('vi-VN')}
        </div>

        {isInvitation && !notification.isRead && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button 
              onClick={handleAccept}
              disabled={loading}
              style={{ padding: '6px 16px', backgroundColor: '#0C66E4', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
              onMouseOver={e => !loading && (e.currentTarget.style.backgroundColor = '#0052CC')}
              onMouseOut={e => !loading && (e.currentTarget.style.backgroundColor = '#0C66E4')}
            >
              {loading ? 'Đang xử lý...' : 'Chấp nhận'}
            </button>
            <button 
              onClick={handleReject}
              disabled={loading}
              style={{ padding: '6px 16px', backgroundColor: 'transparent', color: '#44546F', border: '1px solid #DCDFE4', borderRadius: '4px', fontSize: '13px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}
              onMouseOver={e => !loading && (e.currentTarget.style.backgroundColor = '#F1F2F4')}
              onMouseOut={e => !loading && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Từ chối
            </button>
          </div>
        )}
      </div>
      {!notification.isRead && (
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0C66E4', flexShrink: 0, marginTop: '6px' }} />
      )}
    </div>
  )
}
