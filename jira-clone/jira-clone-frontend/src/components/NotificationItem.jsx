import React from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from './Toast'

export default function NotificationItem({ notification, onRead, onAction, onDelete }) {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [showX, setShowX] = React.useState(false)

  const isInvitation = notification.type === 'project_invitation'
  const isDeadlineReminder = notification.type === 'deadline_reminder'
// ... (lines truncated for thought, but I'll write the full replacement below)

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
        onAction(notification.id, 'ACCEPTED')
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
        onAction(notification.id, 'REJECTED')
      }
    } catch (e) {
      addToast('Lỗi kết nối', 'error')
    }
    setLoading(false)
  }

  const getMessage = () => {
    switch (notification.type) {
      case 'assigned':          return `đã giao [${notification.issueKey}] cho bạn`
      case 'mentioned':         return `đã nhắc đến bạn trong [${notification.issueKey}]`
      case 'status_changed':    return `đã cập nhật trạng thái [${notification.issueKey}]`
      case 'comment_added':     return `đã bình luận vào [${notification.issueKey}]`
      case 'project_invitation':return `đã mời bạn tham gia dự án "${notification.projectName}"`
      case 'deadline_reminder': return `Task [${notification.issueKey}] sắp hết hạn vào ngày mai! Hãy cập nhật tiến độ.`
      default: return 'đã cập nhật nội dung'
    }
  }

  return (
    <div 
      onClick={handleClick}
      onMouseEnter={() => setShowX(true)}
      onMouseLeave={() => setShowX(false)}
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
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        backgroundColor: isDeadlineReminder ? '#FFF0E6' : (isInvitation ? '#E3FCEF' : '#E9F2FF'),
        color: isDeadlineReminder ? '#DE350B' : (isInvitation ? '#006644' : '#0C66E4'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '15px', fontWeight: 'bold', flexShrink: 0,
        border: isDeadlineReminder ? '1px solid #DE350B20' : (isInvitation ? '1px solid #00664420' : '1px solid #0C66E420')
      }}>
        {isDeadlineReminder ? (
          // Icon đồng hồ cho deadline reminder
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        ) : notification.actorAvatarUrl ? (
          <img src={notification.actorAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        ) : isInvitation ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <polyline points="16 11 18 13 22 9"/>
          </svg>
        ) : (
          notification.actorName?.charAt(0)
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', color: '#172B4D', lineHeight: '1.5', paddingRight: '12px' }}>
          {/* Ẩn actorName khi là deadline_reminder (hệ thống tự gửi) */}
          {!isDeadlineReminder && notification.actorName && (
            <span style={{ fontWeight: '600' }}>{notification.actorName}</span>
          )}{!isDeadlineReminder && notification.actorName ? ' ' : ''}
          {isDeadlineReminder
            ? <span><span style={{ color: '#DE350B', fontWeight: '600' }}>⚠️ Nhắc hạn: </span>{getMessage()}</span>
            : getMessage()
          }
        </div>
        <div style={{ fontSize: '12px', color: '#626F86', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {new Date(notification.createdAt).toLocaleString('vi-VN')}
        </div>

        {isInvitation && (
          <div style={{ marginTop: '14px' }}>
            {notification.invitationStatus === 'ACCEPTED' || notification.isRead || notification.invitationStatus === 'REJECTED' ? (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '4px 12px', 
                backgroundColor: notification.invitationStatus === 'REJECTED' ? '#FFEBE6' : '#E3FCEF', 
                color: notification.invitationStatus === 'REJECTED' ? '#BF2600' : '#006644', 
                borderRadius: '4px', 
                fontSize: '12px', 
                fontWeight: '600' 
              }}>
                {notification.invitationStatus === 'REJECTED' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
                {notification.invitationStatus === 'REJECTED' ? 'Đã từ chối' : 'Đã chấp nhận'}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
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
        )}
      </div>
      {/* Delete Button (Visible on hover) */}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
        style={{ 
          position: 'absolute', 
          top: '12px', 
          right: '12px', 
          background: 'none', 
          border: 'none', 
          color: '#626F86', 
          cursor: 'pointer', 
          opacity: showX ? 1 : 0, 
          transition: 'opacity 0.2s',
          padding: '4px',
          borderRadius: '4px'
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = '#F1F2F4'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
        title="Xóa thông báo"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      {!notification.isRead && (
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0C66E4', flexShrink: 0, marginTop: '6px' }} />
      )}
    </div>
  )
}
