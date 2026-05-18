export default function ProgressBar({ current, total }) {
  const pct = Math.min(8 + (current / total) * 88, 96)
  return (
    <div className="progress-wrap">
      <div className="progress-bar">
        <div className="progress-fill" style={{width: pct + '%'}} />
      </div>
      <div className="progress-label">
        {current < total ? `Question ${current + 1} of ${total}` : 'Almost done…'}
      </div>
    </div>
  )
}
