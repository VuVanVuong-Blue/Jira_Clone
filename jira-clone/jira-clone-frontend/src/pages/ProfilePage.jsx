import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'
import { useToast } from '../components/Toast'
import { useUser } from '../components/UserContext'

export default function ProfilePage({ auth, onLogout }) {
  const [activeTab, setActiveTab] = useState('basic')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()
  const { user, updateUser } = useUser() || {}
  
  const fileInputRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addToast('Ảnh không được vượt quá 2MB', 'warning')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setAvatarFile(file)
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return
    
    setUploadingAvatar(true)
    try {
      // Convert to base64 data URL to store as avatarUrl
      const base64 = await fileToBase64(avatarFile)
      
      const res = await api.updateProfile({ 
        fullName: profile?.fullName || user?.fullName || '', 
        avatarUrl: base64 
      })
      if (res.ok) {
        addToast('Đã cập nhật ảnh đại diện', 'success')
        // Sync to UserContext so header updates immediately
        if (updateUser) updateUser({ avatarUrl: base64 })
        setAvatarFile(null)
      } else {
        addToast('Cập nhật ảnh thất bại', 'error')
      }
    } catch (err) {
      addToast('Lỗi khi tải ảnh lên', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // State for security tab
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    api.getMe()
      .then(res => {
        setProfile(res.data)
        // If user has an existing avatar, show it
        if (res.data?.avatarUrl) {
          setAvatarPreview(res.data.avatarUrl)
        }
      })
      .catch(err => {
        addToast('Không thể tải thông tin cá nhân', 'error')
      })
      .finally(() => setLoading(false))
  }, [addToast])

  const handleUpdateProfile = async () => {
    try {
      const updateData = { fullName: profile.fullName }
      const res = await api.updateProfile(updateData)
      if (res.ok) {
        addToast('Đã lưu thay đổi hồ sơ', 'success')
        // Update UserContext so header shows new name
        if (updateUser) updateUser({ fullName: profile.fullName })
      } else {
        addToast('Cập nhật thất bại', 'error')
      }
    } catch (e) {
      addToast('Cập nhật thất bại', 'error')
    }
  }

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return addToast('Vui lòng nhập đầy đủ thông tin', 'warning')
    try {
      await api.changePassword({ oldPassword, newPassword })
      addToast('Đã đổi mật khẩu thành công', 'success')
      setOldPassword('')
      setNewPassword('')
    } catch (e) {
      addToast(e.response?.data?.message || 'Không thể đổi mật khẩu. Hãy kiểm tra lại mật khẩu cũ.', 'error')
    }
  }

  const tabs = [
    { id: 'basic', label: 'Thông tin cơ bản' },
    { id: 'security', label: 'Bảo mật' },
    { id: 'social', label: 'Tài khoản liên kết' },
    { id: 'notifications', label: 'Thông báo' },
  ]

  const inputStyle = { width: '100%', height: '36px', backgroundColor: '#FFFFFF', border: '2px solid #DCDFE4', borderRadius: '4px', padding: '0 12px', fontSize: '14px', color: '#172B4D', outline: 'none' }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#626F86', marginBottom: '6px' }

  return (
    <Layout onLogout={onLogout}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Hồ sơ cá nhân</h1>
      
      <div style={{ display: 'flex', gap: '32px' }}>
        
        {/* Left Column: Tabs */}
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', backgroundColor: activeTab === tab.id ? '#E9F2FF' : 'transparent', color: activeTab === tab.id ? '#0C66E4' : '#172B4D', fontWeight: activeTab === tab.id ? '600' : '500', fontSize: '14px' }}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Right Column: Form */}
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #DCDFE4', borderRadius: '8px', padding: '32px', maxWidth: '600px', minHeight: '400px' }}>
          
          {loading ? (
            <div>Đang tải...</div>
          ) : activeTab === 'basic' ? (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Thông tin cơ bản</h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#0C66E4', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', overflow: 'hidden' }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/gif" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleAvatarChange} 
                  />
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    style={{ height: '32px', padding: '0 12px', backgroundColor: '#F1F2F4', color: '#172B4D', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px', marginRight: '8px' }}>
                    Thay đổi ảnh
                  </button>
                  {avatarFile && (
                    <button 
                      onClick={uploadAvatar}
                      disabled={uploadingAvatar}
                      style={{ height: '32px', padding: '0 12px', backgroundColor: '#1F845A', color: 'white', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px', opacity: uploadingAvatar ? 0.7 : 1 }}>
                      {uploadingAvatar ? 'Đang lưu...' : 'Lưu ảnh mới'}
                    </button>
                  )}
                  <div style={{ fontSize: '12px', color: '#8590A2' }}>JPG, GIF or PNG. Max size 2MB.</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Họ và tên</label>
                  <input type="text" value={profile?.fullName || ''} onChange={e => setProfile({...profile, fullName: e.target.value})} style={inputStyle} onFocus={e => e.target.style.borderColor = '#0C66E4'} onBlur={e => e.target.style.borderColor = '#DCDFE4'} />
                </div>

                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={profile?.email || ''} readOnly style={{ ...inputStyle, backgroundColor: '#F7F8F9', color: '#8590A2', cursor: 'not-allowed' }} />
                  <div style={{ fontSize: '12px', color: '#8590A2', marginTop: '4px' }}>Email cannot be changed.</div>
                </div>

                <div>
                  <label style={labelStyle}>Vai trò</label>
                  <input type="text" value={profile?.globalRole || 'user'} readOnly style={{ ...inputStyle, backgroundColor: '#F7F8F9', color: '#8590A2', cursor: 'not-allowed' }} />
                </div>
              </div>

              <button onClick={handleUpdateProfile} style={{ height: '36px', padding: '0 24px', backgroundColor: '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '32px' }}>
                Lưu thay đổi
              </button>
            </>
          ) : activeTab === 'security' ? (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Đổi mật khẩu</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Mật khẩu cũ</label>
                  <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#0C66E4'} onBlur={e => e.target.style.borderColor = '#DCDFE4'} />
                </div>
                <div>
                  <label style={labelStyle}>Mật khẩu mới</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#0C66E4'} onBlur={e => e.target.style.borderColor = '#DCDFE4'} />
                </div>
                <div>
                  <button onClick={handleChangePassword} style={{ height: '36px', padding: '0 24px', backgroundColor: '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '16px' }}>
                    Cập nhật mật khẩu
                  </button>
                </div>
              </div>
            </>
          ) : activeTab === 'social' ? (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Tài khoản liên kết</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #DCDFE4', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#EA4335', color: '#FFF', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>G</div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#172B4D', fontSize: '14px' }}>Google</div>
                      <div style={{ fontSize: '12px', color: '#8590A2' }}>Đã kết nối với google_account@gmail.com</div>
                    </div>
                  </div>
                  <button style={{ height: '32px', padding: '0 12px', backgroundColor: 'transparent', color: '#626F86', fontSize: '14px', fontWeight: '600', border: '1px solid #DCDFE4', borderRadius: '4px', cursor: 'pointer' }}>
                    Ngắt kết nối
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #DCDFE4', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#24292E', color: '#FFF', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>GH</div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#172B4D', fontSize: '14px' }}>GitHub</div>
                      <div style={{ fontSize: '12px', color: '#8590A2' }}>Chưa kết nối</div>
                    </div>
                  </div>
                  <button style={{ height: '32px', padding: '0 12px', backgroundColor: '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Kết nối
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #DCDFE4', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#00A4EF', color: '#FFF', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>MS</div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#172B4D', fontSize: '14px' }}>Microsoft</div>
                      <div style={{ fontSize: '12px', color: '#8590A2' }}>Chưa kết nối</div>
                    </div>
                  </div>
                  <button style={{ height: '32px', padding: '0 12px', backgroundColor: '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Kết nối
                  </button>
                </div>
              </div>
            </>
          ) : activeTab === 'notifications' ? (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Cài đặt thông báo</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#172B4D', marginBottom: '12px' }}>Thông báo qua Email</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#172B4D' }}>
                      <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      Khi có người giao công việc (Assign) cho tôi
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#172B4D' }}>
                      <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      Khi có người bình luận vào thẻ công việc của tôi
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#172B4D' }}>
                      <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      Báo cáo tóm tắt công việc hàng tuần
                    </label>
                  </div>
                </div>
                <div style={{ height: '1px', backgroundColor: '#DCDFE4', margin: '8px 0' }}></div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#172B4D', marginBottom: '12px' }}>Thông báo Trình duyệt</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#172B4D' }}>
                      <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      Bật thông báo đẩy (Push Notifications)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#172B4D' }}>
                      <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      Âm thanh thông báo
                    </label>
                  </div>
                </div>
                <button style={{ height: '36px', padding: '0 24px', backgroundColor: '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '16px', width: 'fit-content' }}>
                  Lưu cấu hình
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: '#626F86', fontSize: '14px' }}>Mục {tabs.find(t=>t.id===activeTab).label} đang thi công...</div>
          )}

        </div>

      </div>
    </Layout>
  )
}
