import { Routes, Route } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/sections/HeroSection'
import FeatureSection from '@/sections/FeatureSection'
import BaziSection from '@/sections/BaziSection'
import YijingSection from '@/sections/YijingSection'
import TarotSection from '@/sections/TarotSection'
import PalmSection from '@/sections/PalmSection'
import AboutSection from '@/sections/AboutSection'
import ShareView from '@/components/share/ShareView'
import HistoryPage from '@/components/history/HistoryPage'
import './App.css'

function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureSection />
    </>
  )
}

function App() {
  return (
    <div className="relative flex min-h-screen flex-col text-inkstone">
      {/* 宇宙星空 + 宣纸纹理 + 柔和光效背景层 */}
      <div className="app-bg" aria-hidden="true" />
      <div className="relative z-0 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/bazi" element={<BaziSection />} />
            <Route path="/yijing" element={<YijingSection />} />
            <Route path="/tarot" element={<TarotSection />} />
            <Route path="/palm" element={<PalmSection />} />
            <Route path="/share" element={<ShareView />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/about" element={<AboutSection />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default App
