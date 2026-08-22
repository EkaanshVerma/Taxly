import Hero from '../components/sections/Hero'
import TrustBar from '../components/sections/TrustBar'
import HowItWorks from '../components/sections/HowItWorks'
import DocumentIntelligence from '../components/sections/DocumentIntelligence'
import BankStatementAI from '../components/sections/BankStatementAI'
import PricingTiers from '../components/sections/PricingTiers'
import ForCAs from '../components/sections/ForCAs'
import ComparisonTable from '../components/sections/ComparisonTable'
import SecurityStrip from '../components/sections/SecurityStrip'
import Testimonials from '../components/sections/Testimonials'
import FAQ from '../components/sections/FAQ'
import ContactCTA from '../components/sections/ContactCTA'
import Footer from '../components/sections/Footer'
import './Home.css'

export default function Home() {
  return (
    <div className="home-page">
      <Hero />
      <TrustBar />
      <HowItWorks />
      <DocumentIntelligence />
      <BankStatementAI />
      <PricingTiers />
      <ForCAs />
      <ComparisonTable />
      <SecurityStrip />
      <Testimonials />
      <FAQ />
      <ContactCTA />
      <Footer />
    </div>
  )
}
