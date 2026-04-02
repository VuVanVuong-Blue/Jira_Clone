import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email) { addToast('Vui lòng nhập email!', 'error'); return }
    setLoading(true)
    try {
      const { ok, data } = await api.sendOtp(email, 'reset_password')
      if (ok) {
        addToast('OTP đã gửi! Kiểm tra email 📧', 'success')
        navigate(`/reset-password?email=${encodeURIComponent(email)}`)
      } else {
        addToast(data.message || JSON.stringify(data.errors || data), 'error')
      }
    } catch { addToast('Lỗi kết nối server!', 'error') }
    setLoading(false)
  }

  const inputStyle = { width: '100%', height: '36px', backgroundColor: '#FFFFFF', border: '2px solid #DCDFE4', borderRadius: '4px', padding: '0 12px', fontSize: '14px', color: '#172B4D', outline: 'none', transition: 'border-color 0.2s' }
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#626F86', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }

  return (
    <div style={{ backgroundColor: '#F7F8F9', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <div style={{ width: '24px', height: '24px', backgroundColor: '#0C66E4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14l8-8 8 8"/></svg>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0C66E4' }}>Jira Clone</span>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', width: '400px', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(9,30,66,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0C66E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>

        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 16px 0', textAlign: 'center' }}>Quên mật khẩu?</h1>
        <p style={{ fontSize: '14px', color: '#626F86', margin: '0 0 24px 0', textAlign: 'center', maxWidth: '320px', lineHeight: '1.4' }}>
          Nhập email của bạn. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSendOtp} style={{ width: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" 
              required 
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#0C66E4'}
              onBlur={e => e.target.style.borderColor = '#DCDFE4'}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', height: '36px', backgroundColor: loading ? '#8590A2' : '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px' }}
          >
            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
          </button>
        </form>

        <Link to="/login" style={{ fontSize: '13px', color: '#0C66E4', textDecoration: 'none', fontWeight: '500' }}>
          ← Quay lại đăng nhập
        </Link>
      </div>
    </div>
  )
}
