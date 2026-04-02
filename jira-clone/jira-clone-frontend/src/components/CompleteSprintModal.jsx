import React, { useState } from 'react'
import { api } from '../services/api'
import { useToast } from './Toast'

export default function CompleteSprintModal({ sprint, issues, statuses, futureSprints, onClose, onCompleted }) {
  const { addToast } = useToast()
  
  const [destinationSprintId, setDestinationSprintId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Danh mục status: xác định status category xem là done hay chưa
  // Dựa vào statuses của backend, category là 'done' hoặc 'todo', 'in_progress'
  const isIssueDone = (issue) => {
    const statusObj = statuses.find(s => s.id === issue.statusId) || statuses.find(s => s.name === issue.statusName)
    return statusObj && statusObj.category === 'done'
  }

  const completedIssues = issues.filter(isIssueDone)
  const incompleteIssues = issues.filter(i => !isIssueDone(i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        destinationSprintId: destinationSprintId ? Number(destinationSprintId) : null
      }
      const res = await api.completeSprint(sprint.id, payload)
      if (res.ok) {
        addToast('Hoàn thành Sprint thành công', 'success')
        onCompleted()
      } else {
        addToast(res.data?.message || 'Lỗi khi đóng Sprint', 'error')
      }
    } catch (err) {
      addToast('Lỗi khi đóng Sprint', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const modalStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(9, 30, 66, 0.54)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  }

  return (
    <div style={modalStyle} onClick={onClose}>
      <div 
        style={{ width: '480px', backgroundColor: '#FFFFFF', borderRadius: '3px', boxShadow: '0 8px 16px -4px rgba(9,30,66,0.25)', display: 'flex', flexDirection: 'column' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EBECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#172B4D', margin: 0 }}>Hoàn thành Sprint: {sprint?.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B778C' }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ fontSize: '14px', color: '#172B4D' }}>
            <p style={{ margin: '0 0 8px 0' }}>Sprint này chứa:</p>
            <ul style={{ margin: 0, paddingLeft: '24px', color: '#6B778C' }}>
              <li><strong>{completedIssues.length}</strong> issue đã hoàn thành</li>
              <li><strong>{incompleteIssues.length}</strong> issue chưa hoàn thành</li>
            </ul>
          </div>

          {incompleteIssues.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#626F86', marginBottom: '8px' }}>
                Di chuyển các issue chưa hoàn thành xuống:
              </label>
              <select 
                value={destinationSprintId} 
                onChange={e => setDestinationSprintId(e.target.value)}
                style={{ width: '100%', height: '36px', border: '2px solid #DFE1E6', borderRadius: '3px', padding: '0 8px', fontSize: '14px', outline: 'none', backgroundColor: '#FAFBFC' }}
              >
                <option value="">-- Backlog --</option>
                {futureSprints.map(fs => (
                  <option key={fs.id} value={fs.id}>{fs.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ padding: '0 12px', height: '32px', background: 'none', border: 'none', color: '#42526E', fontWeight: '500', cursor: 'pointer', borderRadius: '3px' }}>
              Hủy
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '0 12px', height: '32px', backgroundColor: '#0052CC', color: 'white', border: 'none', fontWeight: '500', cursor: 'pointer', borderRadius: '3px', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Đang lưu...' : 'Hoàn thành Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
