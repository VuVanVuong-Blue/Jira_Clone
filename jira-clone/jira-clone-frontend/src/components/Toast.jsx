import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

const TOAST_STYLES = {
  success: { bg: '#1F845A', icon: '✓', label: 'Thành công' },
  error:   { bg: '#AE2A19', icon: '✕', label: 'Lỗi' },
  warning: { bg: '#A54800', icon: '!', label: 'Cảnh báo' },
  info:    { bg: '#0C66E4', icon: 'i', label: 'Thông báo' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 9999
      }}>
        {toasts.map(t => {
          const style = TOAST_STYLES[t.type] || TOAST_STYLES.info
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              backgroundColor: style.bg, color: '#FFFFFF',
              padding: '12px 16px', borderRadius: '6px', minWidth: '280px', maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              animation: 'slideIn 0.25s ease',
              fontSize: '14px', fontWeight: '500'
            }}>
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 'bold', flexShrink: 0
              }}>{style.icon}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <button onClick={() => removeToast(t.id)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer', fontSize: '16px', padding: '0 4px', lineHeight: 1
              }}>×</button>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }`}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
