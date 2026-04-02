import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useToast } from './Toast'

export default function EditSprintModal({ sprint, onClose, onUpdated }) {
  const { addToast } = useToast()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (sprint) {
      setName(sprint.name || '')
      setStartDate(sprint.startDate ? sprint.startDate.substring(0, 16) : '')
      setEndDate(sprint.endDate ? sprint.endDate.substring(0, 16) : '')
    }
  }, [sprint])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      const payload = {
        name,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null
      }
      const res = await api.updateSprint(sprint.id, payload)
      if (res.ok) {
        addToast('Cập nhật Sprint thành công', 'success')
        onUpdated(res.data)
      } else {
        addToast(res.data?.message || 'Lỗi khi cập nhật Sprint', 'error')
      }
    } catch (e) {
      addToast('Lỗi khi cập nhật Sprint', 'error')
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
        style={{ width: '400px', backgroundColor: '#FFFFFF', borderRadius: '3px', boxShadow: '0 8px 16px -4px rgba(9,30,66,0.25)', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EBECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#172B4D', margin: 0 }}>Chỉnh sửa Sprint: {sprint?.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B778C' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#626F86', marginBottom: '4px' }}>Tên Sprint *</label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', height: '36px', border: '2px solid #DFE1E6', borderRadius: '3px', padding: '0 8px', fontSize: '14px', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#4C9AFF'}
              onBlur={e => e.target.style.borderColor = '#DFE1E6'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#626F86', marginBottom: '4px' }}>Ngày bắt đầu</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', height: '36px', border: '2px solid #DFE1E6', borderRadius: '3px', padding: '0 8px', fontSize: '14px', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#4C9AFF'}
              onBlur={e => e.target.style.borderColor = '#DFE1E6'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#626F86', marginBottom: '4px' }}>Ngày kết thúc</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', height: '36px', border: '2px solid #DFE1E6', borderRadius: '3px', padding: '0 8px', fontSize: '14px', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#4C9AFF'}
              onBlur={e => e.target.style.borderColor = '#DFE1E6'}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '0 12px', height: '32px', background: 'none', border: 'none', color: '#42526E', fontWeight: '500', cursor: 'pointer', borderRadius: '3px' }}>
              Hủy
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '0 12px', height: '32px', backgroundColor: '#0052CC', color: 'white', border: 'none', fontWeight: '500', cursor: 'pointer', borderRadius: '3px', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
