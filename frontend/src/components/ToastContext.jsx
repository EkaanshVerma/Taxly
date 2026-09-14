import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg, type }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast])
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast])
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast])
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-pill toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '✕'}
              {t.type === 'warning' && '⚠'}
              {t.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-msg">{t.msg}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)}>×</button>
          </div>
        ))}
      </div>

      <style>{`
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 380px;
          pointer-events: none;
        }
        .toast-pill {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 12px;
          font-family: var(--sans, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          color: #fff;
        }
        .toast-success { background: #0D7A5F; }
        .toast-error { background: #B91C1C; }
        .toast-warning { background: #D97706; }
        .toast-info { background: #1B4FD8; }
        .toast-icon { font-weight: 700; font-size: 15px; }
        .toast-msg { flex: 1; line-height: 1.4; }
        .toast-close {
          background: none; border: none; color: rgba(255,255,255,0.7);
          font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1;
        }
        .toast-close:hover { color: #fff; }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      success: (m) => console.log('Toast:', m),
      error: (m) => console.error('Toast:', m),
      info: (m) => console.log('Toast:', m),
      warning: (m) => console.warn('Toast:', m),
    }
  }
  return context
}
