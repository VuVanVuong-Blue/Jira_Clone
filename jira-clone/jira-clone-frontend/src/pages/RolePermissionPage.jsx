import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'

const RESOURCE_LABELS = {
  PROJECT: 'Project',
  ISSUE: 'Issue',
  COMMENT: 'Comment',
  SPRINT: 'Sprint',
  MEMBER: 'Member',
  SETTINGS: 'Settings'
}

const ACTION_LABELS = {
  VIEW: 'Xem',
  CREATE: 'Tạo',
  EDIT: 'Sửa',
  DELETE: 'Xóa'
}

export default function RolePermissionPage({ onLogout }) {
  const [roles, setRoles] = useState([])
  const [activeRole, setActiveRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRole, setNewRole] = useState({ name: '', description: '' })
  const [selectedPerms, setSelectedPerms] = useState({}) // { 'RESOURCE_ACTION': true }

  const fetchRoles = async () => {
    setLoading(true)
    const res = await api.getRoles()
    if (res.ok) {
      setRoles(res.data)
      if (res.data.length > 0 && !activeRole) {
        handleSelectRole(res.data[0])
      } else if (activeRole) {
        const updatedActive = res.data.find(r => r.id === activeRole.id)
        if (updatedActive) handleSelectRole(updatedActive)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleSelectRole = (role) => {
    setActiveRole(role)
    const perms = {}
    role.permissions?.forEach(p => {
      perms[`${p.resource}_${p.action}`] = true
    })
    setSelectedPerms(perms)
  }

  const togglePermission = (resource, action) => {
    const key = `${resource}_${action}`
    setSelectedPerms(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleCreateRole = async () => {
    if (!newRole.name) return
    const res = await api.createRole(newRole)
    if (res.ok) {
      setShowCreateModal(false)
      setNewRole({ name: '', description: '' })
      fetchRoles()
    }
  }

  const handleSaveChanges = async () => {
    if (!activeRole) return
    setSaving(true)
    
    // Convert selectedPerms back to required format
    const permissions = []
    Object.keys(selectedPerms).forEach(key => {
      if (selectedPerms[key]) {
        const [resource, action] = key.split('_')
        permissions.push({ resource, action })
      }
    })

    const res = await api.updateRole(activeRole.id, {
      name: activeRole.name,
      description: activeRole.description,
      permissions
    })

    if (res.ok) {
      alert('Đã lưu thay đổi thành công!')
      fetchRoles()
    } else {
      alert('Lỗi: ' + (res.data.message || 'Không thể lưu thay đổi'))
    }
    setSaving(false)
  }

  const handleDeleteRole = async (e, roleId) => {
    e.stopPropagation()
    if (window.confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      const res = await api.deleteRole(roleId)
      if (res.ok) {
        if (activeRole?.id === roleId) setActiveRole(null)
        fetchRoles()
      } else {
        alert(res.data.message || 'Lỗi khi xóa vai trò')
      }
    }
  }

  if (loading && roles.length === 0) {
    return <Layout onLogout={onLogout}><div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div></Layout>
  }

  return (
    <Layout onLogout={onLogout}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Vai trò & Quyền</h1>
      
      <div style={{ display: 'flex', gap: '32px' }}>
        
        {/* Left Column: Roles List */}
        <div style={{ width: '280px', backgroundColor: '#FFFFFF', border: '1px solid #DCDFE4', borderRadius: '8px', padding: '16px', alignSelf: 'flex-start' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#8590A2', textTransform: 'uppercase', marginBottom: '12px' }}>
            Danh sách vai trò
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            {roles.map(r => (
              <div 
                key={r.id}
                onClick={() => handleSelectRole(r)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '10px 12px', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  backgroundColor: activeRole?.id === r.id ? '#E9F2FF' : 'transparent', 
                  color: activeRole?.id === r.id ? '#0C66E4' : '#172B4D', 
                  fontWeight: activeRole?.id === r.id ? '600' : '500',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => { if (activeRole?.id !== r.id) e.currentTarget.style.backgroundColor = '#F4F5F7' }}
                onMouseOut={(e) => { if (activeRole?.id !== r.id) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{r.name}</span>
                  {r.isSystemDefault && <span style={{ fontSize: '10px', color: '#626F86', fontStyle: 'italic' }}>Mặc định hệ thống</span>}
                </div>
                {!r.isSystemDefault && (
                  <button 
                    onClick={(e) => handleDeleteRole(e, r.id)}
                    style={{ border: 'none', background: 'none', color: '#626F86', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={() => setShowCreateModal(true)}
            style={{ width: '100%', height: '36px', backgroundColor: '#FFFFFF', border: '1px solid #DCDFE4', borderRadius: '4px', color: '#172B4D', fontSize: '14px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
          >
            + Tạo vai trò mới
          </button>
        </div>

        {/* Right Column: Permission Matrix */}
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #DCDFE4', borderRadius: '8px', padding: '32px' }}>
          {activeRole ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 8px 0' }}>Phân quyền: {activeRole.name}</h2>
                  <p style={{ fontSize: '14px', color: '#626F86', margin: 0 }}>{activeRole.description || 'Chọn các quyền mà vai trò này được phép thực hiện trong hệ thống.'}</p>
                </div>
                
                <button 
                  onClick={handleSaveChanges}
                  disabled={saving}
                  style={{ 
                    height: '36px', 
                    padding: '0 20px', 
                    backgroundColor: '#0C66E4', 
                    color: '#FFFFFF', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>

              <div style={{ border: '1px solid #DCDFE4', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', backgroundColor: '#F7F8F9', borderBottom: '1px solid #DCDFE4', padding: '12px 16px', fontSize: '12px', fontWeight: 'bold', color: '#626F86', textTransform: 'uppercase' }}>
                  <div style={{ flex: 2 }}>Module</div>
                  {Object.keys(ACTION_LABELS).map(a => <div key={a} style={{ flex: 1, textAlign: 'center' }}>{ACTION_LABELS[a]}</div>)}
                </div>
                
                {Object.keys(RESOURCE_LABELS).map((resKey, i) => (
                  <div key={resKey} style={{ display: 'flex', borderBottom: i === Object.keys(RESOURCE_LABELS).length - 1 ? 'none' : '1px solid #EBECF0', padding: '16px', alignItems: 'center' }}>
                    <div style={{ flex: 2, fontSize: '14px', fontWeight: '600', color: '#172B4D' }}>{RESOURCE_LABELS[resKey]}</div>
                    {Object.keys(ACTION_LABELS).map(actKey => (
                      <div key={actKey} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={!!selectedPerms[`${resKey}_${actKey}`]}
                          onChange={() => togglePermission(resKey, actKey)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#626F86' }}>
              Chọn một vai trò từ bên trái để chỉnh sửa quyền hạn.
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', width: '400px', borderRadius: '8px', padding: '32px', boxShadow: '0 20px 66px 0 rgba(9,30,66,0.25)' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', color: '#172B4D' }}>Tạo vai trò mới</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#44546F', marginBottom: '4px' }}>Tên vai trò *</label>
              <input 
                type="text" 
                value={newRole.name} 
                onChange={e => setNewRole({...newRole, name: e.target.value})}
                placeholder="VD: Scrum Master"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DCDFE4', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#44546F', marginBottom: '4px' }}>Mô tả</label>
              <textarea 
                value={newRole.description} 
                onChange={e => setNewRole({...newRole, description: e.target.value})}
                placeholder="Mô tả mục đích của vai trò này..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DCDFE4', borderRadius: '4px', boxSizing: 'border-box', height: '80px', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ height: '36px', padding: '0 16px', backgroundColor: 'transparent', border: 'none', color: '#44546F', fontWeight: '600', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button 
                onClick={handleCreateRole}
                style={{ height: '36px', padding: '0 20px', backgroundColor: '#0C66E4', border: 'none', color: '#FFFFFF', fontWeight: '600', borderRadius: '4px', cursor: 'pointer' }}
              >
                Tạo mới
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
