import { Routes, Route } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/sections/HeroSection'
import FeatureSection from '@/sections/FeatureSection'
import BaziSection from '@/sections/BaziSection'
import YijingSection from '@/sections/YijingSection'
import AboutSection from '@/sections/AboutSection'
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
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bazi" element={<BaziSection />} />
          <Route path="/yijing" element={<YijingSection />} />
          <Route path="/about" element={<AboutSection />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
