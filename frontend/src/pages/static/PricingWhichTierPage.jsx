import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import StaticPageLayout from '../../components/StaticPageLayout'

const QUESTIONS = [
  {
    id: 'income_sources',
    q: 'What are your sources of income this year?',
    options: [
      { label: 'Salary only', value: 'salary' },
      { label: 'Salary + freelance / side income', value: 'salary_freelance' },
      { label: 'Salary + capital gains (stocks / MF)', value: 'salary_cg' },
      { label: 'Rental income', value: 'rental' },
      { label: 'Foreign income or NRI', value: 'foreign' },
    ]
  },
  {
    id: 'deductions',
    q: 'Do you actively claim deductions?',
    options: [
      { label: 'Yes — PPF, ELSS, LIC, HRA etc.', value: 'yes_many' },
      { label: 'Only standard deduction', value: 'standard_only' },
      { label: 'Not sure', value: 'unsure' },
    ]
  },
  {
    id: 'complexity',
    q: 'Did anything unusual happen in your finances this year?',
    options: [
      { label: 'No, fairly straightforward', value: 'simple' },
      { label: 'Changed jobs / multiple Form 16s', value: 'job_change' },
      { label: 'Sold property, ESOPs, or crypto', value: 'complex_gains' },
      { label: 'Received foreign income or RSUs', value: 'foreign_income' },
    ]
  },
]

function recommend(answers) {
  if (answers.income_sources === 'foreign' || answers.complexity === 'foreign_income') {
    return { tier: 'Pro / NRI', price: '₹1,999', color: '#7C3AED', reason: 'You have foreign income, assets, or NRI status — this requires DTAA analysis, Schedule FA, and deep CA review.' }
  }
  if (answers.complexity === 'complex_gains' || answers.income_sources === 'salary_cg') {
    return { tier: 'Premium', price: '₹999', color: '#1B4FD8', reason: 'Capital gains, ESOPs, or property sale require ITR-2 filing and thorough CA review of Schedule CG.' }
  }
  if (answers.income_sources === 'salary_freelance' || answers.complexity === 'job_change') {
    return { tier: 'Premium', price: '₹999', color: '#1B4FD8', reason: 'Multiple income sources or employers add complexity. Premium gives you deeper CA verification.' }
  }
  if (answers.deductions === 'yes_many') {
    return { tier: 'Standard', price: '₹199', color: '#0D7A5F', reason: "You're salaried with good deductions. Standard filing covers your situation — our AI handles 80C/HRA automatically." }
  }
  return { tier: 'Standard', price: '₹199', color: '#0D7A5F', reason: 'Your situation is straightforward. Standard filing is the right choice — simple, fast, and CA-reviewed.' }
}

export default function PricingWhichTierPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)

  function pick(id, value) {
    const newAnswers = { ...answers, [id]: value }
    setAnswers(newAnswers)
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1)
    } else {
      setDone(true)
    }
  }

  const result = done ? recommend(answers) : null
  const progress = ((step) / QUESTIONS.length) * 100

  return (
    <StaticPageLayout title="Which Taxly tier do you need?">
      <p style={{ fontSize: 16, color: '#4A4F5C', textAlign: 'center', marginBottom: 40, lineHeight: 1.7 }}>
        Answer 3 quick questions and we'll tell you exactly which tier fits your situation.
      </p>

      {!done ? (
        <div style={s.quizWrap}>
          {/* Progress */}
          <div style={s.progressWrap}>
            <div style={{ ...s.progressBar, width: progress + '%' }} />
          </div>
          <div style={s.stepCount}>Question {step + 1} of {QUESTIONS.length}</div>

          <div style={s.questionCard}>
            <h2 style={s.question}>{QUESTIONS[step].q}</h2>
            <div style={s.options}>
              {QUESTIONS[step].options.map(opt => (
                <button key={opt.value} style={s.optBtn} onClick={() => pick(QUESTIONS[step].id, opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {step > 0 && (
            <button onClick={() => { setStep(s => s - 1) }} style={s.backBtn}>← Back</button>
          )}
        </div>
      ) : (
        <div style={s.resultWrap}>
          <div style={s.resultEmoji}>🎯</div>
          <h2 style={s.resultTitle}>We recommend:</h2>
          <div style={{ ...s.tierBadge, background: result.color }}>{result.tier}</div>
          <div style={s.tierPrice}>{result.price} / filing</div>
          <p style={s.tierReason}>{result.reason}</p>

          <div style={s.resultActions}>
            <Link to="/pricing" style={s.ctaBtn}>See full pricing →</Link>
            <Link to="/" style={s.ctaSecondary}>Start filing free</Link>
          </div>

          <button onClick={() => { setStep(0); setAnswers({}); setDone(false) }} style={s.retakeBtn}>
            Retake quiz
          </button>
        </div>
      )}
    </StaticPageLayout>
  )
}

const s = {
  quizWrap: { maxWidth: 560, margin: '0 auto' },
  progressWrap: { height: 4, background: '#E5E2D9', borderRadius: 999, marginBottom: 12, overflow: 'hidden' },
  progressBar: { height: '100%', background: '#0D7A5F', borderRadius: 999, transition: 'width 0.4s ease' },
  stepCount: { fontSize: 13, color: '#8A8FA3', textAlign: 'right', marginBottom: 24 },
  questionCard: { background: '#fff', border: '1px solid #E5E2D9', borderRadius: 20, padding: '36px 32px' },
  question: { fontSize: 20, fontWeight: 800, color: '#0D1117', marginBottom: 28, lineHeight: 1.3 },
  options: { display: 'flex', flexDirection: 'column', gap: 12 },
  optBtn: {
    background: '#F7F6F2', border: '1.5px solid #E5E2D9', borderRadius: 12, padding: '14px 20px',
    fontSize: 15, fontWeight: 500, color: '#0D1117', cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif',
  },
  backBtn: { background: 'none', border: 'none', color: '#8A8FA3', fontSize: 14, cursor: 'pointer', marginTop: 16, fontFamily: 'DM Sans, sans-serif' },
  resultWrap: { maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: '20px 0' },
  resultEmoji: { fontSize: 56, marginBottom: 16 },
  resultTitle: { fontSize: 18, fontWeight: 700, color: '#4A4F5C', marginBottom: 16 },
  tierBadge: { display: 'inline-block', color: '#fff', borderRadius: 12, padding: '12px 32px', fontSize: 24, fontWeight: 900, marginBottom: 8 },
  tierPrice: { fontSize: 22, fontWeight: 800, color: '#0D1117', marginBottom: 20, fontFamily: 'IBM Plex Mono, monospace' },
  tierReason: { fontSize: 16, color: '#4A4F5C', lineHeight: 1.7, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' },
  resultActions: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 },
  ctaBtn: { background: '#0D7A5F', color: '#fff', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' },
  ctaSecondary: { background: '#F7F6F2', border: '1px solid #E5E2D9', color: '#0D1117', borderRadius: 12, padding: '14px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-block' },
  retakeBtn: { background: 'none', border: 'none', color: '#8A8FA3', fontSize: 14, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'DM Sans, sans-serif' },
}
