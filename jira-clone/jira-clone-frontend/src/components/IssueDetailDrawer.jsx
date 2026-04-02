import React, { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { useToast } from './Toast'

const PRIORITY_MAP = {
  highest: { label: 'Cao nhất', color: '#AE2A19', icon: '⬆⬆' },
  high:    { label: 'Cao', color: '#E34935', icon: '⬆' },
  medium:  { label: 'Trung bình', color: '#F4AC00', icon: '⬛' },
  low:     { label: 'Thấp', color: '#0052CC', icon: '⬇' },
  lowest:  { label: 'Thấp nhất', color: '#4C9AFF', icon: '⬇⬇' },
}

const TYPE_MAP = {
  epic:    { label: 'Epic', color: '#904EE2', icon: '⚡' },
  story:   { label: 'Story', color: '#1F845A', icon: '📗' },
  task:    { label: 'Task', color: '#0C66E4', icon: '☑️' },
  bug:     { label: 'Bug', color: '#E34935', icon: '🐛' },
  subtask: { label: 'Sub-task', color: '#0C66E4', icon: '📎' },
}

export default function IssueDetailDrawer({ projectId, issueId, onClose, onIssueUpdated, statuses, onNavigate }) {
  const { addToast } = useToast()
  const [issue, setIssue] = useState(null)
  const [comments, setComments] = useState([])
  const [subtasks, setSubtasks] = useState([])
  const [attachments, setAttachments] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('comments')

  // Editable fields
  const [editingSummary, setEditingSummary] = useState(false)
  const [summaryDraft, setSummaryDraft] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState('')
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const [creatingSubtask, setCreatingSubtask] = useState(false)
  const [newSubtaskSummary, setNewSubtaskSummary] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState(null)
  const [editingSubtaskSummary, setEditingSubtaskSummary] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const drawerRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (issueId) fetchIssueData()
  }, [issueId])

  const fetchIssueData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        api.getIssue(issueId),
        api.getComments(issueId),
        api.getSubtasks(issueId),
        api.getAttachments(issueId),
        projectId ? api.getProjectMembers(projectId) : Promise.resolve({ ok: true, data: [] })
      ])
      
      const [issueRes, commentsRes, subtasksRes, attachRes, membersRes] = results.map(r => r.status === 'fulfilled' ? r.value : { ok: false, data: [] })

      if (issueRes.ok) {
        setIssue(issueRes.data)
        setSummaryDraft(issueRes.data.summary || '')
        setDescDraft(issueRes.data.description || '')
      }
      setComments(commentsRes.ok ? commentsRes.data : [])
      setSubtasks(subtasksRes.ok ? subtasksRes.data : [])
      setAttachments(attachRes.ok ? attachRes.data : [])
      if (membersRes.ok) setMembers(membersRes.data || [])
    } catch (e) {
      addToast('Không thể tải chi tiết công việc', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteIssue = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa công việc ${issue?.issueKey}?`)) return
    try {
      const res = await api.deleteIssue(issueId)
      if (res.ok) {
        addToast('Đã xóa công việc', 'success')
        onClose()
        if (onIssueUpdated) onIssueUpdated()
      } else {
        addToast(res.data?.message || 'Lỗi xóa công việc', 'error')
      }
    } catch (e) {
      addToast('Lỗi hệ thống khi xóa công việc', 'error')
    }
  }

  const handleUpdateField = async (fieldData) => {
    try {
      const res = await api.updateIssue(issueId, fieldData)
      setIssue(res.data)
      if (onIssueUpdated) onIssueUpdated({ ...issue, description: descDraft })
    } catch (e) {
      addToast('Cập nhật thất bại', 'error')
    }
  }

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Bạn có chắc muốn xóa sub-task này?')) return
    try {
      await api.deleteIssue(subtaskId)
      setSubtasks(subtasks.filter(s => s.id !== subtaskId))
      addToast('Đã xóa Sub-task', 'success')
    } catch (e) {
      addToast('Lỗi xóa Sub-task', 'error')
    }
  }

  const handleUpdateSubtaskStatus = async (subtaskId, newStatusId) => {
    try {
      const res = await api.updateIssue(subtaskId, { statusId: Number(newStatusId) })
      setSubtasks(subtasks.map(s => s.id === subtaskId ? res.data : s))
      addToast('Đã cập nhật trạng thái', 'success')
    } catch (e) {
      addToast('Lỗi cập nhật trạng thái', 'error')
    }
  }

  const handleSaveSubtaskSummary = async (subtaskId) => {
    if (!editingSubtaskSummary.trim()) return setEditingSubtaskId(null)
    const original = subtasks.find(s => s.id === subtaskId)
    if (original.summary === editingSubtaskSummary.trim()) return setEditingSubtaskId(null)
    
    try {
      const res = await api.updateIssue(subtaskId, { summary: editingSubtaskSummary.trim() })
      setSubtasks(subtasks.map(s => s.id === subtaskId ? res.data : s))
      setEditingSubtaskId(null)
    } catch (e) {
      addToast('Lỗi cập nhật', 'error')
    }
  }

  const handleCreateSubtask = async (e) => {
    if (e.key === 'Enter') {
      if (!newSubtaskSummary.trim()) return
      setCreatingSubtask(true)
      try {
        const payload = {
          projectId: Number(projectId),
          type: 'subtask',
          statusId: issue.statusId,
          summary: newSubtaskSummary,
          parentIssueId: Number(issueId)
        }
        const res = await api.createIssue(payload)
        if (res.ok) {
          setSubtasks([...subtasks, res.data])
          setNewSubtaskSummary('')
        } else {
          addToast('Lỗi tạo Sub-task', 'error')
        }
      } catch (e) {
        addToast('Lỗi API tạo Sub-task', 'error')
      } finally {
        setCreatingSubtask(false)
      }
    }
  }

  const handleSaveSummary = () => {
    if (summaryDraft.trim() && summaryDraft !== issue.summary) {
      handleUpdateField({ summary: summaryDraft.trim() })
    }
    setEditingSummary(false)
  }

  const handleSaveDescription = () => {
    if (descDraft !== (issue.description || '')) {
      handleUpdateField({ description: descDraft })
    }
    setEditingDesc(false)
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return
    setSendingComment(true)
    try {
      const res = await api.createComment({ issueId, content: newComment.trim() })
      setComments([...comments, res.data])
      setNewComment('')
    } catch (e) {
      addToast('Gửi bình luận thất bại', 'error')
    } finally {
      setSendingComment(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await api.uploadAttachment(issueId, file)
      if (res.ok) {
        // Cập nhật danh sách tệp đính kèm ngay lập tức
        setAttachments(prev => [res.data, ...prev])
        addToast('Tải tệp lên thành công', 'success')
      } else {
        addToast(res.data?.message || 'Lỗi khi tải tệp lên', 'error')
      }
    } catch (e) {
      addToast('Lỗi API tải tệp', 'error')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return '🖼️';
    if (['pdf'].includes(ext)) return '📄';
    if (['zip', 'rar'].includes(ext)) return '📦';
    return '📎';
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const now = new Date()
    const d = new Date(dateStr)
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    return `${Math.floor(diff / 86400)} ngày trước`
  }

  if (!issueId) return null

  const typeInfo = issue ? TYPE_MAP[issue.type?.toLowerCase()] || TYPE_MAP.task : TYPE_MAP.task
  const priorityInfo = issue ? PRIORITY_MAP[issue.priority?.toLowerCase()] || PRIORITY_MAP.medium : PRIORITY_MAP.medium

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)',
          zIndex: 900, transition: 'opacity 0.3s'
        }}
      />

      {/* Drawer */}
      <div ref={drawerRef} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '720px', maxWidth: '90vw',
        backgroundColor: '#FFFFFF',
        boxShadow: '-8px 0 24px rgba(9, 30, 66, 0.25)',
        zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.3s ease-out',
        overflowY: 'auto'
      }}>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#626F86' }}>
            Đang tải chi tiết...
          </div>
        ) : issue ? (
          <>
            {/* HEADER */}
            <div style={{ 
              padding: '16px 24px', borderBottom: '1px solid #DFE1E6',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{typeInfo.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: typeInfo.color }}>{issue.issueKey}</span>
              </div>
              
              {/* BREADCRUMBS / PARENT LINK */}
              {issue.parentIssueId && (
                <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#626F86' }}>
                  <span style={{ color: '#0052CC', cursor: 'pointer', fontWeight: '500' }} 
                        onClick={() => onNavigate && onNavigate(issue.parentIssueId)}
                        onMouseOver={e => e.target.style.textDecoration = 'underline'}
                        onMouseOut={e => e.target.style.textDecoration = 'none'}>
                    {issue.parentIssueKey}
                  </span>
                  <span>/</span>
                  <span style={{ fontWeight: '500' }}>Sub-task</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button 
                  onClick={handleDeleteIssue}
                  title="Xóa công việc" 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '4px', color: '#AE2A19' }} 
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#FFEBE6'} 
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
                <button onClick={onClose} title="Đóng" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#091E4214'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#42526E" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {/* BODY — 2-column layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* LEFT (main content) */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                
                {/* SUMMARY */}
                {editingSummary ? (
                  <input
                    autoFocus
                    value={summaryDraft}
                    onChange={e => setSummaryDraft(e.target.value)}
                    onBlur={handleSaveSummary}
                    onKeyDown={e => e.key === 'Enter' && handleSaveSummary()}
                    style={{ width: '100%', fontSize: '20px', fontWeight: '600', color: '#172B4D', border: '2px solid #4C9AFF', borderRadius: '3px', padding: '4px 8px', outline: 'none', marginBottom: '16px' }}
                  />
                ) : (
                  <h2 
                    onClick={() => setEditingSummary(true)} 
                    style={{ fontSize: '20px', fontWeight: '600', color: '#172B4D', margin: '0 0 16px', cursor: 'pointer', padding: '4px 8px', borderRadius: '3px', border: '2px solid transparent' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#DFE1E6'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    {issue.summary}
                  </h2>
                )}

                {/* DESCRIPTION */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#172B4D', marginBottom: '8px' }}>Mô tả</h4>
                  {editingDesc ? (
                    <div>
                      <textarea
                        autoFocus
                        value={descDraft}
                        onChange={e => setDescDraft(e.target.value)}
                        rows={6}
                        style={{ width: '100%', fontSize: '14px', color: '#172B4D', border: '2px solid #4C9AFF', borderRadius: '3px', padding: '8px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button onClick={handleSaveDescription} style={{ padding: '6px 12px', backgroundColor: '#0052CC', color: 'white', border: 'none', borderRadius: '3px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Lưu</button>
                        <button onClick={() => { setEditingDesc(false); setDescDraft(issue.description || '') }} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: '#42526E', border: 'none', borderRadius: '3px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingDesc(true)} 
                      style={{ fontSize: '14px', color: issue.description ? '#172B4D' : '#8590A2', lineHeight: '1.6', cursor: 'pointer', padding: '8px', borderRadius: '3px', border: '2px solid transparent', minHeight: '60px', backgroundColor: '#F4F5F7' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#DFE1E6'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      {issue.description || 'Nhấn để thêm mô tả...'}
                    </div>
                  )}
                </div>

                {/* SUBTASKS (Only show if NOT a subtask itself) */}
                {issue.type?.toLowerCase() !== 'subtask' && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#172B4D', marginBottom: '8px' }}>Sub-tasks</h4>
                    <div style={{ border: '1px solid #DFE1E6', borderRadius: '3px', backgroundColor: '#FFFFFF', padding: '8px' }}>
                      {subtasks.length > 0 ? (
                        subtasks.map((s, index) => (
                          <div key={s.id} 
                            style={{ 
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                              padding: '8px', borderTop: index === 0 ? 'none' : '1px solid #EBECF0',
                              position: 'relative'
                            }}
                            onMouseOver={e => {
                              const actions = e.currentTarget.querySelector('.subtask-actions');
                              if(actions) actions.style.opacity = '1';
                            }}
                            onMouseOut={e => {
                              const actions = e.currentTarget.querySelector('.subtask-actions');
                              if(actions) actions.style.opacity = '0';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, marginRight: '16px' }}>
                              <span style={{ fontSize: '14px', flexShrink: 0 }}>{TYPE_MAP.subtask.icon}</span>
                              <span style={{ fontSize: '14px', color: '#172B4D', fontWeight: '500', flexShrink: 0 }}>{s.issueKey}</span>
                              
                              {editingSubtaskId === s.id ? (
                                <input 
                                  autoFocus
                                  value={editingSubtaskSummary}
                                  onChange={e => setEditingSubtaskSummary(e.target.value)}
                                  onBlur={() => handleSaveSubtaskSummary(s.id)}
                                  onKeyDown={e => e.key === 'Enter' && handleSaveSubtaskSummary(s.id)}
                                  style={{ flex: 1, fontSize: '14px', padding: '2px 4px', border: '2px solid #4C9AFF', outline: 'none', borderRadius: '3px', width: '100%' }}
                                />
                              ) : (
                              <span 
                                  onClick={() => onNavigate ? onNavigate(s.id) : (setEditingSubtaskId(s.id), setEditingSubtaskSummary(s.summary))}
                                  style={{ 
                                    fontSize: '14px', color: '#0C66E4', cursor: 'pointer', 
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    textDecoration: 'none', fontWeight: '500'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                                  onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
                                  title="Nhấn để xem chi tiết sub-task"
                                >
                                  {s.summary}
                                </span>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              {/* Assignee Avatar for subtask */}
                              {s.assigneeAvatarUrl ? (
                                <img src={s.assigneeAvatarUrl} alt="assignee" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} title={s.assigneeName} />
                              ) : s.assigneeName ? (
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#626F86', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }} title={s.assigneeName}>
                                  {s.assigneeName.charAt(0).toUpperCase()}
                                </div>
                              ) : null}

                              <select 
                                value={s.statusId}
                                onChange={e => handleUpdateSubtaskStatus(s.id, e.target.value)}
                                style={{ fontSize: '12px', padding: '2px 4px', backgroundColor: '#DFE1E6', color: '#172B4D', borderRadius: '3px', fontWeight: 'bold', border: 'none', outline: 'none', cursor: 'pointer', maxWidth: '120px' }}
                              >
                                {(statuses || []).map(status => (
                                  <option key={status.id} value={status.id}>{status.name}</option>
                                ))}
                              </select>
                              
                              <div className="subtask-actions" style={{ display: 'flex', opacity: 0, transition: 'opacity 0.2s' }}>
                                <button 
                                  onClick={() => handleDeleteSubtask(s.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '3px', color: '#AE2A19', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Xóa sub-task"
                                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#FFEBE6'}
                                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '8px', fontSize: '14px', color: '#8590A2' }}>Chưa có sub-task nào.</div>
                      )}
                      
                      {/* Only show create input if current issue is a Task/Story/etc, not a Sub-task */}
                      <input 
                        placeholder="Nhập tên sub-task và ấn Enter..."
                        value={newSubtaskSummary}
                        onChange={e => setNewSubtaskSummary(e.target.value)}
                        onKeyDown={handleCreateSubtask}
                        disabled={creatingSubtask}
                        style={{ width: '100%', fontSize: '14px', marginTop: '8px', padding: '8px', border: '2px solid transparent', backgroundColor: '#F4F5F7', borderRadius: '3px', outline: 'none' }}
                        onFocus={e => { e.target.style.borderColor = '#4C9AFF'; e.target.style.backgroundColor = '#FFFFFF'; }}
                        onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = '#F4F5F7'; }}
                      />
                    </div>
                  </div>
                )}

                {/* ATTACHMENTS */}
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   style={{ display: 'none' }} 
                   onChange={handleFileUpload} 
                />
                {/* ATTACHMENTS */}
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   style={{ display: 'none' }} 
                   onChange={handleFileUpload} 
                />
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#172B4D', margin: 0 }}>Tệp đính kèm</h4>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      style={{ background: 'none', border: 'none', color: '#0C66E4', fontSize: '13px', fontWeight: '500', cursor: isUploading ? 'not-allowed' : 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                      onMouseOver={e => e.target.style.backgroundColor = '#E9F2FF'}
                      onMouseOut={e => e.target.style.backgroundColor = 'transparent'}
                    >
                      + Thêm tệp
                    </button>
                  </div>
                  <div style={{ border: '1px solid #DFE1E6', borderRadius: '3px', backgroundColor: '#F4F5F7', padding: '12px', minHeight: '40px' }}>
                    {attachments.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                        {attachments.map(att => (
                          <div key={att.id} style={{ backgroundColor: 'white', border: '1px solid #DFE1E6', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.borderColor = '#0052CC'}>
                            <div style={{ height: '60px', backgroundColor: '#F1F2F4', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                              {getFileIcon(att.fileName)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#172B4D', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.fileName}</div>
                            <div style={{ fontSize: '11px', color: '#626F86' }}>{Math.round((att.fileSize || 0) / 1024)} KB</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', fontSize: '14px', color: '#8590A2' }}>Kéo thả tệp vào đây hoặc nhấn Thêm tệp</div>
                    )}
                  </div>
                </div>

                {/* TABS: Comments / Activity */}
                <div style={{ borderBottom: '1px solid #DFE1E6', marginBottom: '16px', display: 'flex', gap: '0' }}>
                  {['comments', 'activity'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{ 
                        padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: activeTab === tab ? '2px solid #0C66E4' : '2px solid transparent',
                        color: activeTab === tab ? '#0C66E4' : '#626F86',
                        fontSize: '14px', fontWeight: activeTab === tab ? '600' : '400'
                      }}
                    >
                      {tab === 'comments' ? `Bình luận (${comments.length})` : 'Hoạt động'}
                    </button>
                  ))}
                </div>

                {activeTab === 'comments' && (
                  <div>
                    {/* New comment box */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0C66E4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, marginTop: '2px' }}>T</div>
                      <div style={{ flex: 1 }}>
                        <textarea
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder="Thêm bình luận..."
                          rows={3}
                          style={{ width: '100%', padding: '8px 12px', border: '2px solid #DFE1E6', borderRadius: '3px', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
                          onFocus={e => e.target.style.borderColor = '#4C9AFF'}
                          onBlur={e => e.target.style.borderColor = '#DFE1E6'}
                        />
                        {newComment.trim() && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button 
                              onClick={handleSendComment} 
                              disabled={sendingComment}
                              style={{ padding: '6px 12px', backgroundColor: '#0052CC', color: 'white', border: 'none', borderRadius: '3px', fontSize: '14px', fontWeight: '500', cursor: sendingComment ? 'not-allowed' : 'pointer', opacity: sendingComment ? 0.7 : 1 }}
                            >
                              {sendingComment ? 'Đang gửi...' : 'Lưu'}
                            </button>
                            <button onClick={() => setNewComment('')} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: '#42526E', border: 'none', borderRadius: '3px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Hủy</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comment list */}
                    {comments.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1F845A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden' }}>
                          {c.userAvatarUrl ? <img src={c.userAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.userFullName?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#172B4D' }}>{c.userFullName}</span>
                            <span style={{ fontSize: '12px', color: '#8590A2' }}>{timeAgo(c.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#172B4D', lineHeight: '1.5', backgroundColor: '#F4F5F7', padding: '8px 12px', borderRadius: '3px' }}>
                            {c.content}
                          </div>
                        </div>
                      </div>
                    ))}

                    {comments.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#8590A2', fontSize: '14px', padding: '24px 0' }}>
                        Chưa có bình luận nào. Hãy là người đầu tiên!
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div style={{ textAlign: 'center', color: '#8590A2', fontSize: '14px', padding: '24px 0' }}>
                    Tính năng lịch sử hoạt động đang được phát triển.
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR (detail fields) */}
              <div style={{ width: '240px', borderLeft: '1px solid #DFE1E6', padding: '24px 16px', overflowY: 'auto', backgroundColor: '#FAFBFC' }}>
                
                {/* Trạng thái */}
                <DetailField label="Trạng thái">
                  <select 
                    value={issue.statusId || ''} 
                    onChange={e => handleUpdateField({ statusId: Number(e.target.value) })}
                    style={selectStyle}
                  >
                    {(statuses || []).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </DetailField>

                {/* Loại */}
                <DetailField label="Loại">
                  <select
                    value={issue.type || ''}
                    onChange={e => handleUpdateField({ type: e.target.value })}
                    style={selectStyle}
                  >
                    {Object.entries(TYPE_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </DetailField>

                {/* Ưu tiên */}
                <DetailField label="Ưu tiên">
                  <select
                    value={issue.priority || ''}
                    onChange={e => handleUpdateField({ priority: e.target.value })}
                    style={selectStyle}
                  >
                    {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </DetailField>

                <hr style={{ border: 'none', borderTop: '1px solid #EBECF0', margin: '16px 0' }} />

                {/* Người giao */}
                <DetailField label="Người báo cáo">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#626F86', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', overflow: 'hidden' }}>
                      {issue.reporterAvatarUrl ? <img src={issue.reporterAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (issue.reporterName?.charAt(0).toUpperCase() || '?')}
                    </div>
                    <span style={{ fontSize: '14px', color: '#172B4D' }}>{issue.reporterName || 'Không rõ'}</span>
                  </div>
                </DetailField>

                {/* Người nhận */}
                <DetailField label="Người được giao">
                  <select
                    value={issue.assigneeId || ''}
                    onChange={e => handleUpdateField({ assigneeId: e.target.value ? Number(e.target.value) : null })}
                    style={selectStyle}
                  >
                    <option value="">Chưa giao</option>
                    {members.map(m => (
                      <option key={m.userId} value={m.userId}>{m.fullName}</option>
                    ))}
                  </select>
                </DetailField>

                <hr style={{ border: 'none', borderTop: '1px solid #EBECF0', margin: '16px 0' }} />

                {/* Ngày tạo */}
                <DetailField label="Ngày tạo">
                  <span style={{ fontSize: '13px', color: '#626F86' }}>{formatDate(issue.createdAt)}</span>
                </DetailField>

                {/* Ngày bắt đầu */}
                <DetailField label="Ngày bắt đầu">
                  <input
                    type="datetime-local"
                    value={issue.startDate ? issue.startDate.substring(0, 16) : ''}
                    onChange={e => {
                      const val = e.target.value;
                      handleUpdateField({ startDate: val ? val + ':00' : null });
                    }}
                    style={selectStyle}
                  />
                </DetailField>

                {/* Ngày hết hạn */}
                <DetailField label="Hạn chót">
                  <input
                    type="datetime-local"
                    value={issue.dueDate ? issue.dueDate.substring(0, 16) : ''}
                    onChange={e => {
                      const val = e.target.value;
                      handleUpdateField({ dueDate: val ? val + ':00' : null });
                    }}
                    style={selectStyle}
                  />
                </DetailField>

              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#AE2A19' }}>
            Không tìm thấy công việc này.
          </div>
        )}
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

// Sub-component for sidebar detail rows
function DetailField({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#5E6C84', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      {children}
    </div>
  )
}

const selectStyle = {
  width: '100%',
  padding: '6px 8px',
  border: '2px solid #DFE1E6',
  borderRadius: '3px',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#FFFFFF',
  color: '#172B4D',
  cursor: 'pointer',
  appearance: 'auto'
}
