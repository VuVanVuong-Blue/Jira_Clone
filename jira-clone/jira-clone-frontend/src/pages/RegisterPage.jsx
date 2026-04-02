import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { GoogleIcon, triggerGoogleLogin } from '../components/GoogleLogin'
import { useToast } from '../components/Toast'

export default function RegisterPage({ onAuth }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) { addToast('Mật khẩu không khớp!', 'error'); return }

    setLoading(true)
    try {
      const { ok, data } = await api.register(name, email, password)
      if (ok) {
        addToast('Đăng ký thành công! Vui lòng kiểm tra email.', 'success')
        // Chuyển hướng sang trang xác thực OTP thay vì log in luôn
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`)
      } else {
        addToast(data.message || JSON.stringify(data.errors || data), 'error')
      }
    } catch { addToast('Lỗi kết nối server!', 'error') }
    setLoading(false)
  }

  const handleGoogle = () => {
    triggerGoogleLogin(
      async (idToken) => {
        addToast('Đang xác thực với Google...', 'info')
        const { ok, data } = await api.googleLogin(idToken)
        if (ok) {
          addToast('Đăng ký Google thành công! 🎉', 'success')
          data._authMethod = 'Google OAuth2'
          onAuth(data)
        } else {
          addToast(data.message || 'Google login thất bại', 'error')
        }
      },
      (msg) => addToast(msg, 'info')
    )
  }

  const inputStyle = { width: '100%', height: '36px', backgroundColor: '#FFFFFF', border: '2px solid #DCDFE4', borderRadius: '4px', padding: '0 12px', fontSize: '14px', color: '#172B4D', outline: 'none', transition: 'border-color 0.2s' }
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#626F86', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }
  const eyeBtnStyle = { position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }

  return (
    <div style={{ backgroundColor: '#F7F8F9', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <div style={{ width: '24px', height: '24px', backgroundColor: '#0C66E4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14l8-8 8 8"/></svg>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0C66E4' }}>Jira Clone</span>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', width: '400px', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(9,30,66,0.15)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 14px 0', letterSpacing: '-0.01em' }}>Tạo tài khoản</h1>
        <p style={{ fontSize: '14px', color: '#626F86', margin: '0 0 24px 0' }}>Điền thông tin để tạo tài khoản mới.</p>

        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Họ và tên</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" required style={inputStyle} onFocus={e => e.target.style.borderColor = '#0C66E4'} onBlur={e => e.target.style.borderColor = '#DCDFE4'} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required style={inputStyle} onFocus={e => e.target.style.borderColor = '#0C66E4'} onBlur={e => e.target.style.borderColor = '#DCDFE4'} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={{ ...inputStyle, paddingRight: '36px' }} onFocus={e => e.target.style.borderColor = '#0C66E4'} onBlur={e => e.target.style.borderColor = '#DCDFE4'} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtnStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#626F86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Nhập lại mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={{ ...inputStyle, paddingRight: '36px' }} onFocus={e => e.target.style.borderColor = '#0C66E4'} onBlur={e => e.target.style.borderColor = '#DCDFE4'} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtnStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#626F86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showConfirm ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} style={{ width: '100%', height: '36px', backgroundColor: loading ? '#8590A2' : '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', marginTop: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#DCDFE4' }}></div>
          <span style={{ fontSize: '12px', color: '#8590A2' }}>hoặc</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#DCDFE4' }}></div>
        </div>
        
        <button onClick={handleGoogle} style={{ width: '100%', height: '36px', backgroundColor: '#FFFFFF', border: '1px solid #DCDFE4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', color: '#172B4D', fontWeight: '500', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.backgroundColor = '#F1F2F4'} onMouseOut={e => e.target.style.backgroundColor = '#FFFFFF'}>
          <GoogleIcon /> Tiếp tục với Google
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#626F86' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: '#0C66E4', fontWeight: 'bold', textDecoration: 'none' }}>Đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}
