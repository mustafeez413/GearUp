import PublicLayout from '../components/shared/PublicLayout';
import Hero from '../components/Hero';
import HomepageFeaturedSlider from '../components/ads/HomepageFeaturedSlider';
import IndustryFocus from '../components/IndustryFocus';
import HowItWorks from '../components/HowItWorks';
import MarketTransformation from '../components/MarketTransformation';

import GearUpTradeAdvisor from '../components/GearUpTradeAdvisor';
import TrustCredibility from '../components/TrustCredibility';
import CallToAction from '../components/CallToAction';
import { Factory, Package, Globe, Users } from 'lucide-react';

export default function Homepage() {
  return (
    <PublicLayout>
      <Hero />
      

      {/* Sponsored Campaigns Section */}
      <section className="w-full bg-[#020617] pt-16 pb-20 md:pt-28 md:pb-32 relative">
        {/* Decorative Grid and Gradients */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] z-0 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#0a0f1c] to-transparent pointer-events-none z-0" />
        
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 relative z-10">
          {/* Section Heading */}
          <div className="text-center mb-16 flex flex-col items-center">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-900 border border-slate-800 mb-6 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              <span className="text-slate-300 text-sm font-bold uppercase tracking-widest">Premium Showcase</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 tracking-tight px-2">
              Featured Campaigns
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed px-4">
              Featured opportunities from verified manufacturers. Discover world-class equipment and establish direct supply chain partnerships.
            </p>
          </div>

          {/* Premium Glassmorphism Container */}
          <div className="w-full rounded-[32px] overflow-hidden bg-slate-900/30 backdrop-blur-2xl border border-slate-700/50 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8)] relative group/container">
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none z-20" />
            
            {/* Embedded Carousel Component */}
            <div className="relative z-30">
              <HomepageFeaturedSlider />
            </div>
          </div>
        </div>
      </section>

      {/* Remaining Homepage Sections */}
      <IndustryFocus />
      <HowItWorks />
      <MarketTransformation />

      <GearUpTradeAdvisor />
      <TrustCredibility />
      <CallToAction />
    </PublicLayout>
  );
}
