export default function LoadingScreen() {
  return (
    <div style={{ backgroundColor: '#F7F8F9', position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', zIndex: 9999 }}>
      
      <div style={{ width: '48px', height: '48px', backgroundColor: '#0C66E4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 'bold' }}>J</span>
      </div>
      
      <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#172B4D', marginTop: '14px', letterSpacing: '-0.01em' }}>
        Jira Clone
      </div>
      
      <div style={{ width: '160px', height: '3px', backgroundColor: '#DCDFE4', borderRadius: '2px', marginTop: '20px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ 
          position: 'absolute', 
          width: '60px', 
          height: '100%', 
          backgroundColor: '#0C66E4', 
          borderRadius: '2px',
          animation: 'slideRight 1s ease-in-out infinite'
        }}></div>
      </div>
      
      <style>{`
        @keyframes slideRight {
          0% { left: -60px; }
          100% { left: 160px; }
        }
      `}</style>
    </div>
  )
}
