import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sendMessage, uploadForm16, getSession } from '../api/taxly'
import ChatBubble from '../components/ChatBubble'
import TypingIndicator from '../components/TypingIndicator'
import ProgressBar from '../components/ProgressBar'
import ChatInput from '../components/ChatInput'
import { useToast } from '../components/ToastContext'

const FIRST_MSG = "Hi! I'm Taxly. I'll help you file your income tax return in about 20 minutes — no forms, no jargon.\n\nLet's start: are you salaried, a freelancer, or do you have business income?"

const TOTAL_QUESTIONS = 12

export default function ChatPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [messages, setMessages] = useState([{ role: 'bot', text: FIRST_MSG }])
  const [loading, setLoading] = useState(false)
  const [questionNum, setQuestionNum] = useState(0)
  const [uploadState, setUploadState] = useState(null) // null | 'uploading' | 'parsed' | 'error'
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const [backendDown, setBackendDown] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const bottomRef = useRef()
  const fileInputRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Session restore
  useEffect(() => {
    async function restore() {
      try {
        const res = await getSession(sessionId)
        const data = res.data
        if (data.status === 'complete') {
          navigate(`/summary/${sessionId}`)
          return
        }
        if (data.status === 'in_progress' && data.messages?.length > 0) {
          const restored = data.messages.map(m => ({
            role: m.role === 'model' ? 'bot' : 'user',
            text: Array.isArray(m.parts) ? m.parts[0] : m.parts
          }))
          setMessages(restored)
          setQuestionNum(Math.max(0, restored.filter(m => m.role === 'user').length - 1))
          setShowResumeBanner(true)
          setTimeout(() => setShowResumeBanner(false), 4000)
        }
      } catch (err) {
        if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
          setBackendDown(true)
        }
      }
    }
    restore()
  }, [sessionId, navigate])

  const handleSend = useCallback(async (text) => {
    setMessages(m => [...m, { role: 'user', text }])
    setLoading(true)
    setBackendDown(false)

    try {
      const res = await sendMessage(sessionId, text)
      setLoading(false)
      if (res.data.done) {
        setMessages(m => [...m, { role: 'bot', text: "I have everything I need! Calculating your tax now…" }])
        setTimeout(() => navigate(`/summary/${sessionId}`), 1400)
      } else {
        setMessages(m => [...m, { role: 'bot', text: res.data.message }])
        setQuestionNum(q => Math.min(q + 1, TOTAL_QUESTIONS))
      }
    } catch (err) {
      setLoading(false)
      const isNetwork = err.code === 'ERR_NETWORK' || !err.response
      if (isNetwork) {
        setBackendDown(true)
        setMessages(m => [...m, {
          role: 'bot',
          text: "I'm having trouble reaching the server right now. Your answers are saved locally — please try again in a moment or check your connection.",
          isError: true
        }])
      } else {
        setMessages(m => [...m, {
          role: 'bot',
          text: "Something went wrong on our end. Please try sending that again.",
          isError: true
        }])
      }
    }
  }, [sessionId, navigate])

  const handleUpload = useCallback(async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file (Form 16)')
      return
    }
    setUploadState('uploading')
    try {
      const res = await uploadForm16(sessionId, file)
      setUploadState('parsed')
      const name = res.data?.employee_name || 'your'
      const salary = res.data?.gross_salary
      toast.success('Form 16 parsed successfully!')
      setMessages(m => [...m, {
        role: 'bot',
        text: `✓ I've read ${name.toLowerCase() !== 'your' ? `${name}'s` : 'your'} Form 16${salary ? ` — gross salary ₹${salary.toLocaleString('en-IN')}` : ''}. A few quick follow-up questions to complete your deductions — do you pay rent?`
      }])
      setTimeout(() => setUploadState(null), 3000)
    } catch (err) {
      setUploadState('error')
      if (err.response?.status === 422) {
        toast.error("Couldn't parse Form 16. The PDF may be scanned or password-protected — please enter details manually.")
      } else if (err.code === 'ERR_NETWORK') {
        toast.error('Upload failed — server unreachable. You can still continue by answering questions manually.')
        setBackendDown(true)
      } else {
        toast.error('Upload failed. Try again or continue manually.')
      }
      setTimeout(() => setUploadState(null), 2500)
    }
  }, [sessionId, toast])

  const handleFileDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  return (
    <div
      className="chat-page-root"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleFileDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="drag-overlay">
          <div className="drag-overlay-inner">
            <span>📎</span>
            <p>Drop your Form 16 PDF here</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="chat-header">
        <button className="chat-header-back" onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <div className="chat-header-info">
          <img src="/logo-white.png" alt="Taxly" className="chat-header-logo" style={{ height: '34px' }} />
          <div className="chat-header-sub">Tax Assistant · {backendDown ? '⚠ Offline' : 'Online'}</div>
        </div>
        <label className="chat-upload-btn" title="Upload Form 16 PDF">
          {uploadState === 'uploading' ? '⏳ Reading…' :
           uploadState === 'parsed' ? '✓ Parsed' :
           uploadState === 'error' ? '✕ Error' :
           '↑ Upload Form 16'}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => { handleUpload(e.target.files[0]); e.target.value = '' }}
          />
        </label>
      </div>

      {/* Progress bar */}
      <ProgressBar current={questionNum} total={TOTAL_QUESTIONS} />

      {/* Backend-down banner */}
      {backendDown && (
        <div className="backend-down-banner">
          <span>⚠ Server unreachable</span>
          <span>Your session is saved. Answers will sync when the connection is restored.</span>
          <button onClick={() => { setBackendDown(false); toast.info('Retrying connection…') }}>Retry</button>
        </div>
      )}

      {/* Session resume banner */}
      {showResumeBanner && (
        <div className="resume-banner">
          👋 Welcome back! Continuing where you left off.
        </div>
      )}

      {/* Messages */}
      <div className="chat-msgs">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} isError={m.isError} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} onUpload={handleUpload} disabled={loading} />

      <style>{`
        .chat-page-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--paper, #F7F6F2);
          font-family: var(--sans, 'DM Sans', sans-serif);
          position: relative;
          overflow: hidden;
        }
        .drag-overlay {
          position: fixed;
          inset: 0;
          background: rgba(13,122,95,0.15);
          border: 3px dashed var(--green);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .drag-overlay-inner {
          background: #fff;
          border-radius: 20px;
          padding: 40px 60px;
          text-align: center;
        }
        .drag-overlay-inner span { font-size: 48px; display: block; margin-bottom: 12px; }
        .drag-overlay-inner p { font-size: 18px; font-weight: 600; color: var(--ink); }

        .chat-upload-btn {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          color: #fff;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .chat-upload-btn:hover { background: rgba(255,255,255,0.25); }

        .backend-down-banner {
          background: #FEF3C7;
          border-bottom: 1px solid #FCD34D;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13.5px;
          color: #78350F;
          flex-wrap: wrap;
        }
        .backend-down-banner span:first-child { font-weight: 700; }
        .backend-down-banner button {
          margin-left: auto;
          background: #D97706;
          color: #fff;
          border: none;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .resume-banner {
          background: var(--blue-light);
          color: var(--blue);
          text-align: center;
          padding: 10px 20px;
          font-size: 13.5px;
          font-weight: 600;
          border-bottom: 1px solid var(--blue-mid);
          animation: fadeDown 0.3s ease;
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chat-msgs {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </div>
  )
}
