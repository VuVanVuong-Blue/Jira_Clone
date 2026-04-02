import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

export default function VerifyOtpPage({ onAuth }) {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [otp, setOtp] = useState(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(30)
  
  const inputRefs = useRef([])
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    // Focus ô đầu tiên khi mở trang
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    // Đếm ngược gửi lại OTP
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    // Tự động submit khi nhập đủ 6 số
    if (otp.every(char => char !== '') && !loading) {
      verifyOtpAction(otp.join(''))
    }
  }, [otp])

  const verifyOtpAction = async (otpCode) => {
    if (!email) {
      addToast('Không tìm thấy email cần xác thực!', 'error')
      return
    }
    setLoading(true)
    try {
      const { ok, data } = await api.verifyOtp(email, otpCode)
      if (ok) {
        addToast('Xác thực thành công! 🎉', 'success')
        data._authMethod = 'Email + OTP (Verified)'
        onAuth(data) // Token sẽ được nạp và App.jsx tự động redirect sang HomePage
      } else {
        addToast(data.message || 'Xác thực thất bại', 'error')
        // Xóa mã cũ để nhập lại
        setOtp(Array(6).fill(''))
        if (inputRefs.current[0]) inputRefs.current[0].focus()
      }
    } catch {
      addToast('Lỗi kết nối server!', 'error')
    }
    setLoading(false)
  }

  const handleChange = (e, index) => {
    const value = e.target.value
    // Chỉ cho phép nhập 1 chữ số
    if (value && !/^[0-9]$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Tự động nhảy sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6)
    if (!pastedData) return

    const newOtp = [...otp]
    for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)
    
    // Focus ô hợp lý
    if (pastedData.length < 6) {
        inputRefs.current[pastedData.length].focus()
    } else {
        inputRefs.current[5].blur()
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || !email) return
    setResending(true)
    try {
      const { ok, data } = await api.sendOtp(email, 'register')
      if (ok) {
        addToast('Đã gửi lại OTP! Kiểm tra email của bạn.', 'success')
        setCountdown(30)
      } else {
        addToast(data.message || 'Gửi lại thất bại', 'error')
      }
    } catch {
      addToast('Lỗi kết nối server!', 'error')
    }
    setResending(false)
  }

  return (
    <div style={{ backgroundColor: '#F7F8F9', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <div style={{ width: '24px', height: '24px', backgroundColor: '#0C66E4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14l8-8 8 8"/></svg>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0C66E4' }}>Jira Clone</span>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', width: '420px', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(9,30,66,0.15)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 14px 0', letterSpacing: '-0.01em' }}>Kiểm tra email của bạn</h1>
        <p style={{ fontSize: '14px', color: '#626F86', margin: '0 0 32px 0', lineHeight: '1.5' }}>
          Chúng tôi đã gửi mã 6 chữ số đến <br/>
          <strong style={{ color: '#172B4D' }}>{email || 'bạn'}</strong>
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' }} onPaste={handlePaste}>
          {otp.map((data, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={1}
              value={data}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={loading}
              style={{
                width: '48px',
                height: '56px',
                fontSize: '24px',
                fontWeight: '600',
                textAlign: 'center',
                color: '#172B4D',
                backgroundColor: '#FFFFFF',
                border: '2px solid #DFE1E6',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                ...(data ? { borderColor: '#4C9AFF', backgroundColor: '#E9F2FF' } : {})
              }}
              onFocus={e => {
                e.target.style.borderColor = '#0C66E4';
                e.target.style.boxShadow = '0 0 0 2px rgba(12, 102, 228, 0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = data ? '#4C9AFF' : '#DFE1E6';
                e.target.style.boxShadow = 'none';
              }}
            />
          ))}
        </div>

        <button 
          onClick={() => verifyOtpAction(otp.join(''))}
          disabled={loading || otp.join('').length < 6}
          style={{ width: '100%', height: '40px', backgroundColor: (loading || otp.join('').length < 6) ? '#8590A2' : '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: (loading || otp.join('').length < 6) ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', marginBottom: '24px' }}
        >
          {loading ? 'Đang xác thực...' : 'Xác thực'}
        </button>

        <div style={{ fontSize: '14px', color: '#626F86' }}>
          Chưa nhận được mã?{' '}
          <button 
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            style={{ background: 'none', border: 'none', color: countdown > 0 ? '#8590A2' : '#0C66E4', fontWeight: 'bold', cursor: countdown > 0 ? 'not-allowed' : 'pointer', padding: 0 }}
          >
            {countdown > 0 ? `Gửi lại (${countdown}s)` : 'Gửi lại'}
          </button>
        </div>

        <div style={{ marginTop: '24px' }}>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#0C66E4', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Quay lại đăng nhập
            </Link>
        </div>
      </div>
    </div>
  )
}
