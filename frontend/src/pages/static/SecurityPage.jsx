import React from 'react'
import StaticPageLayout from '../../components/StaticPageLayout'

export default function SecurityPage() {
  return (
    <StaticPageLayout title="Bank-Grade Security & Data Handling">
      <h2>Your financial data is yours. We just parse it.</h2>
      <p>
        At Taxly, we handle sensitive financial information. We believe in total transparency regarding how your data is collected, parsed, and secured.
      </p>

      <h3>Account Aggregator vs. Raw PDF Uploads</h3>
      <p>
        We offer two ways to analyze your bank statements:
      </p>
      <ul>
        <li><strong>Account Aggregator (Recommended):</strong> We use RBI-regulated Account Aggregators to fetch a read-only, encrypted stream of your transactions. This is the most secure method, requiring no file uploads and no password sharing.</li>
        <li><strong>Raw PDF Upload:</strong> If you prefer manual uploads, you can provide password-protected PDFs. Our system processes them purely in memory.</li>
      </ul>

      <h3>What happens after parsing? (Data Retention)</h3>
      <p>
        <strong>Raw files are discarded immediately.</strong> Once our AI has extracted the transaction rows required for tax calculation, the original PDF file is permanently deleted from our servers. We do not store raw bank statements.
      </p>

      <h3>Data Masking: What CAs Can See</h3>
      <p>
        Our reviewing Chartered Accountants need to see your transactions to verify your tax filing. However, we employ strict data masking:
      </p>
      <ul>
        <li><strong>Masked Counterparties:</strong> Transactions irrelevant to your tax filing (e.g., Swiggy, Zomato, local grocery stores) are aggregated and their exact counterparties are masked from the CA's view.</li>
        <li><strong>Highlighted Relevant Data:</strong> CAs only see the full details of transactions flagged by the AI as tax-relevant (e.g., salaries, mutual fund investments, insurance premiums).</li>
      </ul>

      <h3>Encryption at Rest and in Transit</h3>
      <p>
        All parsed transaction data stored in our database is encrypted at rest using AES-256. All data transmitted between your browser and our servers is encrypted in transit using TLS 1.3.
      </p>
    </StaticPageLayout>
  )
}
