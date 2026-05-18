import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sendMessage, uploadForm16, getSession } from '../api/taxly'
import ChatBubble from '../components/ChatBubble'
import TypingIndicator from '../components/TypingIndicator'
import ProgressBar from '../components/ProgressBar'
import ChatInput from '../components/ChatInput'

const FIRST_MSG = "Hi! I'm Taxly. I'll help you file your income tax return in about 20 minutes — no forms, no jargon.\n\nLet's start: are you salaried, a freelancer, or do you have business income?"

export default function ChatPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([{ role: 'bot', text: FIRST_MSG }])
  const [loading, setLoading] = useState(false)
  const [questionNum, setQuestionNum] = useState(0)
  const [toast, setToast] = useState(null) // {msg, type}
  const bottomRef = useRef()

  // scroll to bottom on every new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Restore session
  useEffect(() => {
    async function restore() {
      try {
        const res = await getSession(sessionId)
        const data = res.data
        if (data.status === 'complete') {
          navigate(`/summary/${sessionId}`)
        } else if (data.status === 'in_progress' && data.messages && data.messages.length > 0) {
          const restoredMsgs = data.messages.map(m => ({
            role: m.role === 'model' ? 'bot' : 'user',
            text: m.parts[0]
          }))
          setMessages(restoredMsgs)
          setToast({ msg: "Welcome back! Continuing where you left off.", type: "success" })
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          setToast({ msg: "Couldn't restore session. Starting fresh.", type: "error" })
        }
      }
    }
    restore()
  }, [sessionId, navigate])

  // auto-dismiss toast
  useEffect(() => {
    if (toast && !toast.persistent) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  async function handleSend(text) {
    setMessages(m => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const res = await sendMessage(sessionId, text)
      setLoading(false)
      if (res.data.done) {
        setMessages(m => [...m, { role: 'bot', text: "I have everything I need! Calculating your tax now…" }])
        setTimeout(() => navigate(`/summary/${sessionId}`), 1400)
      } else {
        setMessages(m => [...m, { role: 'bot', text: res.data.message }])
        setQuestionNum(q => q + 1)
      }
    } catch {
      setLoading(false)
      setMessages(m => [...m, { role: 'bot', text: "Something went wrong. Please try again.", isError: true }])
    }
  }

  async function handleUpload(file) {
    setToast({ msg: 'Reading your Form 16…', type: 'success', persistent: true })
    try {
      await uploadForm16(sessionId, file)
      setToast({ msg: '✓ Form 16 read! Salary details pre-filled.', type: 'success' })
      setMessages(m => [...m, { role: 'bot', text: "I've pre-filled your salary details from Form 16. A few quick questions to fill in the rest — do you pay rent?" }])
    } catch (err) {
      if (err.response?.status === 422) {
        setToast({ msg: "Couldn't read Form 16 clearly. Please enter details manually.", type: 'error' })
      } else {
        setToast({ msg: 'Upload failed. Try again.', type: 'error' })
      }
    }
  }

  return (
    <div className="view active" id="chat">
      <div className="chat-header">
        <button className="chat-header-back" onClick={() => navigate('/')}>←</button>
        <div className="chat-header-info">
          <div className="chat-header-name">Taxly</div>
          <div className="chat-header-sub">Your tax assistant · Online</div>
        </div>
        <label className="chat-header-upload" style={{cursor:'pointer'}}>
          ↑ Form 16
          <input type="file" accept=".pdf" style={{display:'none'}}
            onChange={e => { handleUpload(e.target.files[0]); e.target.value=''; }} />
        </label>
      </div>

      <ProgressBar current={questionNum} total={12} />

      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}

      <div className="chat-msgs">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} isError={m.isError} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} onUpload={handleUpload} disabled={loading} />
    </div>
  )
}
