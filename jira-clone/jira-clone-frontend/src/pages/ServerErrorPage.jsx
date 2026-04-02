export default function ServerErrorPage() {
  const reload = () => window.location.reload()

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
        
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#DCDFE4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px', stroke: '#AE2A19' }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        
        <h1 style={{ fontSize: '80px', fontWeight: '900', color: '#DCDFE4', margin: '0 0 16px 0', lineHeight: '1' }}>500</h1>
        
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 16px 0' }}>Hệ thống đang gặp sự cố</h2>
        
        <p style={{ fontSize: '14px', color: '#626F86', margin: '0 0 32px 0', maxWidth: '400px' }}>
          Đã có lỗi xảy ra phía máy chủ hoặc máy chủ đang bảo trì. Vui lòng thử lại sau vài giây.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', alignItems: 'center' }}>
          <button onClick={reload} style={{ padding: '10px 24px', backgroundColor: '#0C66E4', color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s', width: '200px' }}>
            Thử lại
          </button>
          <div style={{ fontSize: '12px', color: '#8590A2' }}>
            Nếu lỗi tiếp diễn, liên hệ bộ phận hỗ trợ kĩ thuật.
          </div>
        </div>
      </div>
      
    </div>
  )
}
