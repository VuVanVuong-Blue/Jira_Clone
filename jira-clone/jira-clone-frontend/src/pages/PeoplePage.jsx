import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

export default function PeoplePage({ onLogout }) {
  const { addToast } = useToast()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async (query) => {
    setLoading(true)
    try {
      const res = await api.searchUsers(query || '')
      setUsers(res.data || [])
    } catch (e) {
      addToast('Không thể tải danh sách nhân sự', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (q) => {
    setSearchQuery(q)
    fetchUsers(q)
  }

  const getRoleStyle = (role) => {
    if (role === 'admin') return { bg: '#EAE6FF', color: '#403294' }
    return { bg: '#F1F2F4', color: '#626F86' }
  }

  const avatarColors = ['#0C66E4', '#1F845A', '#A54800', '#904EE2', '#626F86', '#00A3BF']

  return (
    <Layout onLogout={onLogout}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Nhân sự</h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '2px solid #DCDFE4', borderRadius: '4px', padding: '0 12px', height: '36px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#626F86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text" 
            placeholder="Tìm kiếm nhân sự..." 
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', marginLeft: '8px', fontSize: '14px', width: '100%' }} 
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#626F86' }}>Đang tải...</div>
      ) : (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DCDFE4', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', height: '40px', backgroundColor: '#F7F8F9', borderBottom: '1px solid #DCDFE4', alignItems: 'center', padding: '0 16px', fontSize: '12px', fontWeight: '600', color: '#8590A2', textTransform: 'uppercase' }}>
            <div style={{ flex: 2 }}>Tên</div>
            <div style={{ flex: 2 }}>Email</div>
            <div style={{ flex: 1 }}>Vai trò</div>
            <div style={{ flex: 1 }}>Ngày tham gia</div>
          </div>

          {users.map((u, i) => (
            <div key={u.id} style={{ display: 'flex', height: '56px', alignItems: 'center', padding: '0 16px', borderBottom: i === users.length - 1 ? 'none' : '1px solid #EBECF0' }}>
              
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: avatarColors[i % avatarColors.length], color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', overflow: 'hidden' }}>
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    u.fullName?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#172B4D' }}>{u.fullName}</span>
              </div>
              
              <div style={{ flex: 2, fontSize: '14px', color: '#626F86' }}>{u.email || '—'}</div>
              
              <div style={{ flex: 1 }}>
                <span style={{ backgroundColor: getRoleStyle(u.globalRole).bg, color: getRoleStyle(u.globalRole).color, fontSize: '12px', fontWeight: '600', padding: '2px 6px', borderRadius: '3px', textTransform: 'capitalize' }}>
                  {u.globalRole || 'user'}
                </span>
              </div>
              
              <div style={{ flex: 1, fontSize: '13px', color: '#626F86' }}>
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
              </div>

            </div>
          ))}
          
          {users.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8590A2', fontSize: '14px' }}>Không tìm thấy nhân sự nào.</div>
          )}
        </div>
      )}
    </Layout>
  )
}
