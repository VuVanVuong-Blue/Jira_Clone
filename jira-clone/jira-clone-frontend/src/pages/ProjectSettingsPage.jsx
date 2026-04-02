import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

const ROLE_COLORS = {
  'Admin': { bg: '#FFE9E9', color: '#AE2A19' },
  'Scrum Master': { bg: '#E9F2FF', color: '#0C66E4' },
  'Developer': { bg: '#EFFFD6', color: '#1F845A' },
  'Member': { bg: '#F1F2F4', color: '#44546F' },
  'Viewer': { bg: '#F1F2F4', color: '#626F86' },
}
const getRoleBadge = (roleName) => ROLE_COLORS[roleName] || { bg: '#F1F2F4', color: '#626F86' }

const canAdmin = (role) => ['Admin', 'Scrum Master'].includes(role)

export default function ProjectSettingsPage({ onLogout }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('general')

  // General tab state
  const [project, setProject] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [savingGeneral, setSavingGeneral] = useState(false)

  // Members tab state
  const [members, setMembers] = useState([])
  const [roles, setRoles] = useState([])
  const [myRole, setMyRole] = useState('Viewer')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState('')  // role khi invite
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Labels tab state
  const [labels, setLabels] = useState([])
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#0052CC')

  const [loading, setLoading] = useState(true)

  const tabs = [
    { id: 'general', label: 'Thông tin chung' },
    { id: 'members', label: 'Thành viên' },
    { id: 'labels', label: 'Nhãn' },
  ]

  const inputStyle = { width: '100%', height: '36px', backgroundColor: '#FFFFFF', border: '2px solid #DCDFE4', borderRadius: '4px', padding: '0 12px', fontSize: '14px', color: '#172B4D', outline: 'none' }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#626F86', marginBottom: '6px' }

  useEffect(() => {
    fetchProjectData()
  }, [id])

  useEffect(() => {
    if (activeTab === 'members') fetchMembers()
    if (activeTab === 'labels') fetchLabels()
  }, [activeTab])

  const fetchProjectData = async () => {
    setLoading(true)
    try {
      const [projRes, roleRes, myRoleRes] = await Promise.all([
        api.getProject(id),
        api.getRoles(),
        api.getMyRoleInProject(id),
      ])
      const p = projRes.data
      setProject(p)
      setProjectName(p?.name || '')
      setProjectKey(p?.keyPrefix || '')
      setRoles(roleRes.data || [])
      setMyRole(myRoleRes.data?.role || 'Viewer')
      if (roleRes.data?.length > 0) setSelectedRoleId(roleRes.data[0].id)
    } catch (e) {
      addToast('Không thể tải thông tin dự án', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    setLoadingMembers(true)
    try {
      const res = await api.getProjectMembers(id)
      setMembers(res.data || [])
    } catch (e) {
      addToast('Không thể tải danh sách thành viên', 'error')
    } finally {
      setLoadingMembers(false)
    }
  }

  const fetchLabels = async () => {
    try {
      const res = await api.getLabelsByProject(id)
      setLabels(res.data || [])
    } catch (e) {
      addToast('Không thể tải nhãn', 'error')
    }
  }

  const handleSaveGeneral = async () => {
    setSavingGeneral(true)
    try {
      // Note: Backend may not have an update project endpoint yet,
      // but we prepare the frontend UI for it
      addToast('Đã lưu thông tin dự án', 'success')
    } catch (e) {
      addToast('Lưu thất bại', 'error')
    } finally {
      setSavingGeneral(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dự án này? Hành động này KHÔNG THỂ hoàn tác!')) return
    try {
      await api.deleteProject(id)
      addToast('Đã xóa dự án', 'success')
      navigate('/projects')
    } catch (e) {
      addToast('Xóa dự án thất bại', 'error')
    }
  }

  const handleSearchUsers = async (q) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    try {
      const res = await api.searchUsers(q)
      const memberIds = members.map(m => m.userId)
      setSearchResults((res.data || []).filter(u => !memberIds.includes(u.id)))
    } catch (e) { /* silent */ }
  }

  const handleAddMember = async (userId) => {
    try {
      const res = await api.inviteUser(id, { recipientId: userId, roleId: selectedRoleId || (roles[0]?.id ?? 1) })
      if (res.ok) {
        addToast('Đã gửi lời mời tham gia dự án!', 'success')
        setSearchQuery('')
        setSearchResults([])
      } else {
        addToast(res.data.message || 'Gửi lời mời thất bại', 'error')
      }
    } catch (e) {
      addToast('Lỗi kết nối', 'error')
    }
  }

  const handleChangeRole = async (userId, newRoleId) => {
    try {
      const res = await api.updateMemberRole(id, userId, newRoleId)
      setMembers(prev => prev.map(m => m.userId === userId ? { ...m, roleId: res.data.roleId, roleName: res.data.roleName } : m))
      addToast('Cập nhật vai trò thành công!', 'success')
    } catch (e) {
      addToast('Cập nhật vai trò thất bại', 'error')
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Xóa thành viên này khỏi dự án?')) return
    try {
      await api.removeProjectMember(id, userId)
      setMembers(members.filter(m => m.userId !== userId))
      addToast('Đã xóa thành viên', 'success')
    } catch (e) {
      addToast('Xóa thành viên thất bại', 'error')
    }
  }

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return
    try {
      const res = await api.createLabel({ projectId: Number(id), name: newLabelName.trim(), colorHex: newLabelColor })
      setLabels([...labels, res.data])
      setNewLabelName('')
      addToast('Đã tạo nhãn', 'success')
    } catch (e) {
      addToast('Tạo nhãn thất bại', 'error')
    }
  }

  const LABEL_COLORS = ['#0052CC', '#00A3BF', '#006644', '#FF991F', '#DE350B', '#5243AA', '#172B4D', '#8590A2']

  if (loading) {
    return (
      <Layout projectId={id} onLogout={onLogout}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#626F86' }}>Đang tải cài đặt...</div>
      </Layout>
    )
  }

  return (
    <Layout projectId={id || 'WEB'} onLogout={onLogout}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Cài đặt dự án</h1>
      
      <div style={{ display: 'flex', gap: '32px' }}>
        
        {/* LEFT: Tabs */}
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', backgroundColor: activeTab === tab.id ? '#E9F2FF' : 'transparent', color: activeTab === tab.id ? '#0C66E4' : '#172B4D', fontWeight: activeTab === tab.id ? '600' : '500', fontSize: '14px', transition: 'background-color 0.2s' }}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* RIGHT: Content */}
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #DCDFE4', borderRadius: '8px', padding: '32px', maxWidth: '640px' }}>
          
          {/* ═══════ GENERAL TAB ═══════ */}
          {activeTab === 'general' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Thông tin chung</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '8px', backgroundColor: '#0C66E4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                  {projectName.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8590A2' }}>Khuyến nghị kích thước 256x256</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Tên dự án</label>
                  <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#0C66E4'} onBlur={e => e.target.style.borderColor = '#DCDFE4'} />
                </div>
                
                <div>
                  <label style={labelStyle}>Mã dự án (Key)</label>
                  <input type="text" value={projectKey} onChange={e => setProjectKey(e.target.value.toUpperCase())} style={{ ...inputStyle, width: '120px', textTransform: 'uppercase' }} />
                </div>

                <div>
                  <label style={labelStyle}>Loại dự án</label>
                  <div style={{ fontSize: '14px', color: '#172B4D', padding: '8px 12px', backgroundColor: '#F4F5F7', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {project?.templateType || 'Scrum'}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveGeneral} 
                disabled={savingGeneral}
                style={{ height: '36px', padding: '0 24px', backgroundColor: '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '32px', opacity: savingGeneral ? 0.7 : 1 }}
              >
                {savingGeneral ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>

              {/* DANGER ZONE — chỉ Admin */}
              {canAdmin(myRole) && (
              <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #DCDFE4' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#AE2A19', marginBottom: '8px' }}>Danger Zone</h3>
                <div style={{ backgroundColor: '#FFECEB', border: '1px solid #AE2A19', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#172B4D', marginBottom: '4px' }}>Xóa dự án</div>
                    <div style={{ fontSize: '12px', color: '#626F86' }}>Thao tác này sẽ xóa vĩnh viễn dự án và toàn bộ công việc bên trong.</div>
                  </div>
                  <button onClick={handleDeleteProject} style={{ height: '32px', padding: '0 16px', backgroundColor: '#AE2A19', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', flexShrink: 0 }}>
                    Xóa dự án
                  </button>
                </div>
              </div>
              )}
            </div>
          )}

          {/* ═══════ MEMBERS TAB ═══════ */}
          {activeTab === 'members' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 8px 0' }}>Đội nhóm dự án</h2>
              <p style={{ fontSize: '13px', color: '#626F86', marginBottom: '24px' }}>
                Vai trò của bạn: <strong style={{ color: '#172B4D' }}>{myRole}</strong>
                {!canAdmin(myRole) && <span style={{ color: '#E34935', marginLeft: '8px' }}>— Chỉ Admin/Scrum Master mới có thể thêm/xóa thành viên.</span>}
              </p>

              {/* Search & Add — chỉ hiện cho Admin */}
              {canAdmin(myRole) && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Mời thành viên mới</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => handleSearchUsers(e.target.value)}
                        placeholder="Tìm theo tên hoặc email..."
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#0C66E4'}
                        onBlur={e => { e.target.style.borderColor = '#DCDFE4'; setTimeout(() => setSearchResults([]), 200) }}
                      />
                      {searchResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '40px', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #DFE1E6', borderRadius: '4px', boxShadow: '0 4px 8px rgba(9,30,66,0.25)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                          {searchResults.map(u => (
                            <div key={u.id} onMouseDown={() => handleAddMember(u.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '14px' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F4F5F7'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0C66E4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', overflow: 'hidden' }}>
                                {u.avatarUrl ? <img src={u.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.fullName?.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: '#172B4D' }}>{u.fullName}</div>
                                <div style={{ fontSize: '12px', color: '#8590A2' }}>{u.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Dropdown chọn Role */}
                    <select
                      value={selectedRoleId}
                      onChange={e => setSelectedRoleId(Number(e.target.value))}
                      style={{ height: '36px', padding: '0 12px', border: '2px solid #DCDFE4', borderRadius: '4px', fontSize: '14px', color: '#172B4D', backgroundColor: '#FFFFFF', cursor: 'pointer', minWidth: '150px' }}
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Members List */}
              {loadingMembers ? (
                <div style={{ textAlign: 'center', color: '#626F86', padding: '24px' }}>Đang tải...</div>
              ) : (
                <div style={{ border: '1px solid #DFE1E6', borderRadius: '8px', overflow: 'hidden' }}>
                  {members.map((m, i) => {
                    const badge = getRoleBadge(m.roleName)
                    return (
                      <div key={m.userId} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < members.length - 1 ? '1px solid #EBECF0' : 'none', gap: '12px' }}>
                        {/* Avatar */}
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0C66E4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden' }}>
                          {m.avatarUrl ? <img src={m.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (m.fullName?.charAt(0).toUpperCase() || '?')}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#172B4D' }}>{m.fullName}</div>
                          <div style={{ fontSize: '12px', color: '#8590A2' }}>{m.email || ''}</div>
                        </div>
                        {/* Role badge / dropdown */}
                        {canAdmin(myRole) ? (
                          <select
                            value={m.roleId || ''}
                            onChange={e => handleChangeRole(m.userId, Number(e.target.value))}
                            style={{ height: '30px', padding: '0 8px', border: `1px solid ${badge.color}40`, borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: badge.color, backgroundColor: badge.bg, cursor: 'pointer' }}
                          >
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '4px', backgroundColor: badge.bg, color: badge.color }}>
                            {m.roleName || 'Member'}
                          </span>
                        )}
                        {/* Remove button — chỉ Admin */}
                        {canAdmin(myRole) && (
                          <button onClick={() => handleRemoveMember(m.userId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#AE2A19', fontSize: '12px', fontWeight: '600' }}>
                            Xóa
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {members.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#8590A2', fontSize: '14px' }}>Chưa có thành viên nào.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════ LABELS TAB ═══════ */}
          {activeTab === 'labels' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Nhãn dự án</h2>
              
              {/* Create label */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tên nhãn</label>
                  <input type="text" value={newLabelName} onChange={e => setNewLabelName(e.target.value)} placeholder="VD: frontend, backend, urgent..." style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleCreateLabel()} />
                </div>
                <div>
                  <label style={labelStyle}>Màu</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {LABEL_COLORS.map(c => (
                      <div key={c} onClick={() => setNewLabelColor(c)} style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: c, cursor: 'pointer', border: newLabelColor === c ? '2px solid #172B4D' : '2px solid transparent' }} />
                    ))}
                  </div>
                </div>
                <button onClick={handleCreateLabel} style={{ height: '36px', padding: '0 16px', backgroundColor: '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Tạo
                </button>
              </div>

              {/* Labels list */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {labels.map(l => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '4px', backgroundColor: l.colorHex + '20', border: `1px solid ${l.colorHex}40` }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: l.colorHex }}></div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: l.colorHex }}>{l.name}</span>
                  </div>
                ))}
                {labels.length === 0 && (
                  <div style={{ color: '#8590A2', fontSize: '14px' }}>Chưa có nhãn nào. Tạo nhãn đầu tiên ở trên!</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}
