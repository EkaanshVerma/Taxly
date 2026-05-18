import { useRef } from 'react'

export default function ChatInput({ onSend, onUpload, disabled }) {
  const inputRef = useRef()

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const val = inputRef.current.value.trim()
    if (!val || disabled) return
    onSend(val)
    inputRef.current.value = ''
    inputRef.current.style.height = 'auto'
  }

  function autoResize(e) {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const isEmpty = () => !inputRef.current?.value.trim()

  return (
    <div className="chat-input-area">
      <div className="chat-input-row">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Type your answer…"
          rows={1}
          onKeyDown={handleKey}
          onInput={autoResize}
          disabled={disabled}
        />
        <button
          className="send-btn"
          onClick={submit}
          disabled={disabled}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
