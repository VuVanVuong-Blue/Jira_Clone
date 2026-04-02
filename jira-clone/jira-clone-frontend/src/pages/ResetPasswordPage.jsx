import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const inputRefs = useRef([])
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!email) {
      addToast('Vui lòng gửi OTP trước', 'info')
      navigate('/forgot-password')
    }
  }, [email, navigate, addToast])

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(0, 1)
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpValue = otp.join('')
    if (otpValue.length < 6) { addToast('Vui lòng nhập đủ 6 số OTP', 'error'); return }
    if (password !== confirmPassword) { addToast('Mật khẩu không khớp!', 'error'); return }

    setLoading(true)
    try {
      const { ok, data } = await api.resetPassword(email, otpValue, password)
      if (ok) {
        addToast('Đã đặt lại mật khẩu thành công! 🎉', 'success')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        addToast(data.message || 'Lỗi khi đặt lại mật khẩu', 'error')
      }
    } catch { addToast('Lỗi kết nối server!', 'error') }
    setLoading(false)
  }

  const getStrength = (pw) => {
    if (!pw) return { color: '#DCDFE4', text: '', pct: '0%' }
    if (pw.length < 6) return { color: '#AE2A19', text: 'Yếu', pct: '33%' }
    if (pw.length < 10) return { color: '#F4AC00', text: 'Trung bình', pct: '66%' }
    return { color: '#1F845A', text: 'Mạnh', pct: '100%' }
  }

  const strength = getStrength(password)

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
        
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0', textAlign: 'center' }}>Đặt lại mật khẩu</h1>

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                value={digit}
                onChange={e => handleOtpChange(index, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(index, e)}
                style={{ width: '42px', height: '50px', backgroundColor: '#FFFFFF', border: '2px solid #DCDFE4', borderRadius: '4px', fontSize: '20px', fontWeight: 'bold', color: '#172B4D', textAlign: 'center', outline: 'none', transition: 'all 0.2s' }}
                onFocus={e => { e.target.style.borderColor = '#0C66E4'; e.target.style.backgroundColor = '#E9F2FF' }}
                onBlur={e => { e.target.style.borderColor = '#DCDFE4'; e.target.style.backgroundColor = '#FFFFFF' }}
              />
            ))}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Mật khẩu mới</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" required minLength={6} style={{ ...inputStyle, paddingRight: '36px' }} onFocus={e => e.target.style.borderColor = '#0C66E4'} onBlur={e => e.target.style.borderColor = '#DCDFE4'} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtnStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#626F86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Nhập lại mật khẩu mới</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" required minLength={6} style={{ ...inputStyle, paddingRight: '36px' }} onFocus={e => e.target.style.borderColor = '#0C66E4'} onBlur={e => e.target.style.borderColor = '#DCDFE4'} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtnStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#626F86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showConfirm ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          {password && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#DCDFE4', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: strength.pct, height: '100%', backgroundColor: strength.color, transition: 'all 0.3s ease' }}></div>
              </div>
              <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '11px', color: strength.color, fontWeight: 'bold' }}>
                {strength.text}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', height: '36px', backgroundColor: loading ? '#8590A2' : '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px' }}
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: '13px', color: '#0C66E4', textDecoration: 'none', fontWeight: '500' }}>
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
