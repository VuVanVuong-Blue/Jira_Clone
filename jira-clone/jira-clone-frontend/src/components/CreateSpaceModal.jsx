import React, { useState } from 'react'
import { api } from '../services/api'
import { useToast } from './Toast'

export default function CreateSpaceModal({ onClose, onSpaceCreated }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0C66E4')
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)

  const colors = [
    '#0C66E4', // Blue
    '#1F845A', // Green
    '#A54800', // Brown
    '#AE2A19', // Red
    '#6E5DC6', // Purple
    '#F4AC00', // Yellow
    '#00A3BF', // Cyan
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name) return addToast('Vui lòng điền tên không gian', 'warning')
    
    setLoading(true)
    try {
      const res = await api.createSpace({ name, color })
      addToast('Tạo không gian thành công', 'success')
      if (onSpaceCreated) onSpaceCreated(res.data)
      onClose()
    } catch (err) {
      addToast('Tạo không gian thất bại', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '8px', width: '450px',
        boxShadow: '0 8px 16px -4px rgba(9,30,66,0.25)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #DFE1E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#172B4D', margin: 0 }}>Tạo không gian làm việc</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '3px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#42526E" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#5E6C84', marginBottom: '8px' }}>Tên không gian *</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Team Backend, Dự án Marketing..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '3px', border: '2px solid #DFE1E6', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#4C9AFF'}
              onBlur={e => e.target.style.borderColor = '#DFE1E6'}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#5E6C84', marginBottom: '8px' }}>Chọn màu chủ đạo</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {colors.map(c => (
                <div 
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ 
                    width: '32px', height: '32px', backgroundColor: c, borderRadius: '4px', cursor: 'pointer',
                    border: color === c ? '2px solid #172B4D' : '2px solid transparent',
                    boxSizing: 'border-box', transition: 'transform 0.1s'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '3px', border: 'none', backgroundColor: '#F1F2F4', color: '#42526E', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
              Hủy bỏ
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 20px', borderRadius: '3px', border: 'none', backgroundColor: '#0052CC', color: 'white', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: '14px' }}>
              {loading ? 'Đang tạo...' : 'Tạo không gian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
