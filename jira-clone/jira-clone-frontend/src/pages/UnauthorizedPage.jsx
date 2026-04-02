import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <div style={{ backgroundColor: '#F7F8F9', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Logo only */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #DCDFE4', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
        <div style={{ width: '24px', height: '24px', backgroundColor: '#0C66E4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14l8-8 8 8"/></svg>
        </div>
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0C66E4', marginLeft: '8px' }}>Jira Clone</span>
      </header>

      <div style={{ textAlign: 'center', marginTop: '56px' }}>
        
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#DCDFE4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px', stroke: '#8590A2' }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        
        <h1 style={{ fontSize: '80px', fontWeight: '900', color: '#DCDFE4', margin: '0 0 16px 0', lineHeight: '1' }}>403</h1>
        
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 16px 0' }}>Bạn không có quyền truy cập</h2>
        
        <p style={{ fontSize: '14px', color: '#626F86', margin: '0 0 32px 0', maxWidth: '400px' }}>
          Bạn cần cấp quyền hoặc liên hệ quản trị viên (Admin) để có thể xem tài nguyên này.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/" style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none', borderRadius: '4px', transition: 'background 0.2s' }}>
            ← Quay về trang chủ
          </Link>
          <button style={{ padding: '10px 24px', backgroundColor: '#FFFFFF', color: '#172B4D', fontSize: '14px', fontWeight: 'bold', border: '1px solid #DCDFE4', borderRadius: '4px', cursor: 'pointer' }}>
            Liên hệ Admin
          </button>
        </div>
      </div>
      
    </div>
  )
}
