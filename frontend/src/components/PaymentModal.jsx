import { useState } from 'react'
import { generateXml } from '../api/taxly'
import { useToast } from './ToastContext'

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy'

export default function PaymentModal({ sessionId, amount, onSuccess, onClose }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('confirm') // 'confirm' | 'processing' | 'done'

  async function handlePay() {
    setLoading(true)
    setStep('processing')

    // Razorpay integration
    if (window.Razorpay) {
      const options = {
        key: RAZORPAY_KEY,
        amount: amount * 100, // paise
        currency: 'INR',
        name: 'Taxly',
        description: 'ITR Filing AY 2025–26',
        image: '/logo-white.png',
        notes: { session_id: sessionId },
        prefill: {},
        theme: { color: '#0D7A5F' },
        handler: async function (response) {
          // payment success → generate XML
          try {
            const res = await generateXml(sessionId, {
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id
            })
            const blob = new Blob([res.data], { type: 'application/xml' })
            setStep('done')
            onSuccess(blob)
          } catch (err) {
            toast.error('Payment succeeded but XML generation failed. Our team will contact you.')
            setLoading(false)
            setStep('confirm')
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
            setStep('confirm')
          }
        }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } else {
      // Razorpay not loaded — mock flow for dev
      setTimeout(async () => {
        try {
          const res = await generateXml(sessionId, { taxpayer: {} })
          const blob = new Blob([res.data], { type: 'application/xml' })
          setStep('done')
          onSuccess(blob)
        } catch {
          // Still let them know it worked in mock
          const mockXml = `<?xml version="1.0"?><ITR><Header>TAXLY_MOCK_AY2526</Header></ITR>`
          const blob = new Blob([mockXml], { type: 'application/xml' })
          setStep('done')
          onSuccess(blob)
        }
      }, 1800)
    }
  }

  return (
    <div className="pay-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pay-modal">
        {step === 'done' ? (
          <div className="pay-done">
            <div className="pay-done-check">✓</div>
            <h2>Payment Successful!</h2>
            <p>Your ITR XML is ready to download.</p>
          </div>
        ) : (
          <>
            <button className="pay-modal-close" onClick={onClose}>✕</button>
            <div className="pay-modal-logo">🏦</div>
            <h2 className="pay-modal-title">Complete your filing</h2>
            <p className="pay-modal-sub">
              Pay once and get your ITR XML ready to upload on the Income Tax portal.
            </p>

            <div className="pay-breakdown">
              <div className="pay-row">
                <span>ITR filing fee</span>
                <span>₹423</span>
              </div>
              <div className="pay-row">
                <span>GST (18%)</span>
                <span>₹76</span>
              </div>
              <div className="pay-row pay-total">
                <span>Total</span>
                <span>₹{amount}</span>
              </div>
            </div>

            <div className="pay-features">
              <div className="pay-feat">✓ Instant XML download</div>
              <div className="pay-feat">✓ 7-day revision support</div>
              <div className="pay-feat">✓ CA review included</div>
            </div>

            <button
              className="pay-confirm-btn"
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? (
                <span className="pay-spinner" />
              ) : (
                `Pay ₹${amount} securely`
              )}
            </button>
            <p className="pay-secure-note">🔒 Powered by Razorpay · 256-bit SSL</p>
          </>
        )}
      </div>

      <style>{`
        .pay-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 9000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        .pay-modal {
          background: #fff;
          border-radius: 24px;
          padding: 36px 32px 28px;
          width: 100%; max-width: 420px;
          position: relative;
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          animation: payIn 0.25s ease;
        }
        @keyframes payIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: none; }
        }
        .pay-modal-close {
          position: absolute; top: 16px; right: 16px;
          background: #f1f5f9; border: none;
          width: 32px; height: 32px;
          border-radius: 50%;
          font-size: 14px;
          cursor: pointer; color: #64748b;
        }
        .pay-modal-logo { font-size: 36px; margin-bottom: 12px; }
        .pay-modal-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
        .pay-modal-sub { font-size: 14px; color: #64748b; margin-bottom: 20px; line-height: 1.5; }
        .pay-breakdown {
          background: #F7F6F2;
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 18px;
        }
        .pay-row {
          display: flex; justify-content: space-between;
          font-size: 14px; color: #475569;
          padding: 5px 0;
        }
        .pay-total {
          border-top: 1px solid #e2e8f0;
          margin-top: 8px; padding-top: 10px;
          font-weight: 700; font-size: 16px; color: #0f172a;
        }
        .pay-features {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px;
        }
        .pay-feat {
          background: #DCFCE7; color: #166534;
          font-size: 12.5px; font-weight: 600;
          padding: 4px 12px; border-radius: 999px;
        }
        .pay-confirm-btn {
          width: 100%;
          background: linear-gradient(135deg, #0D7A5F, #0b6a50);
          color: #fff; border: none;
          padding: 16px; border-radius: 14px;
          font-size: 16px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          min-height: 54px;
          box-shadow: 0 4px 18px rgba(13,122,95,0.3);
          transition: opacity 0.15s;
        }
        .pay-confirm-btn:hover { opacity: 0.9; }
        .pay-confirm-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .pay-spinner {
          width: 22px; height: 22px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-secure-note { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 12px; }
        .pay-done {
          text-align: center; padding: 16px 0 8px;
        }
        .pay-done-check {
          width: 64px; height: 64px;
          background: #DCFCE7;
          color: #16a34a;
          border-radius: 50%;
          font-size: 28px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
        .pay-done h2 { font-size: 22px; color: #0f172a; margin-bottom: 8px; }
        .pay-done p { font-size: 14px; color: #64748b; }
      `}</style>
    </div>
  )
}
