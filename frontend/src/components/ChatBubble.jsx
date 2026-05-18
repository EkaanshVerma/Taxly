function parseText(text) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2,-2)}</strong>
      : <span key={i}>{part}</span>
  )
}

export default function ChatBubble({ role, text, isError }) {
  const time = new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', hour12:true})
  if (role === 'bot') return (
    <div className="msg-row">
      <div className="msg-avatar">T</div>
      <div>
        <div className={`bubble ${isError ? 'error' : 'bot'}`}>{parseText(text)}</div>
        <div className="bubble-time">{time}</div>
      </div>
    </div>
  )
  return (
    <div className="msg-row user">
      <div>
        <div className="bubble user">{text}</div>
        <div className="bubble-time" style={{textAlign:'right'}}>{time}</div>
      </div>
    </div>
  )
}
