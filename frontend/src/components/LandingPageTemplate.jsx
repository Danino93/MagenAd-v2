import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Check, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

/**
 * Reusable Landing Page Template for PPC/SEO campaigns.
 * Removes global Navigation/Footer to increase conversion focus (Squeeze Page).
 */
function LandingPageTemplate({ 
  headline, 
  subheadline, 
  heroImage, 
  painPoints = [], 
  benefit, 
  seoTitle, 
  seoDesc 
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans" dir="rtl">
      <SEO title={seoTitle} description={seoDesc} />
      
      {/* Sticky Header (Simple) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <Link to="/" className="flex items-center gap-2 font-bold text-xl group">
              <Shield className="text-[#00F0FF] group-hover:text-[#8338EC] transition-colors" /> 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:from-[#00F0FF] group-hover:to-[#8338EC] transition-all">MagenAd</span>
           </Link>
           <Link to="/signup" className="btn-primary py-2 px-6 text-sm font-bold shadow-[#00F0FF]/20">
             נסו חינם עכשיו
           </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
         <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-block px-4 py-1 rounded-full bg-[#FF0055]/10 text-[#FF0055] font-mono mb-6 border border-[#FF0055]/20"
            >
              הגנת סייבר למפרסמים
            </motion.div>
            <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="text-5xl md:text-7xl font-black mb-8 leading-tight"
            >
              {headline}
            </motion.h1>
            <motion.p 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
            >
              {subheadline}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
               <Link to="/signup" className="btn-primary py-4 px-8 text-xl font-bold w-full sm:w-auto flex items-center justify-center gap-2">
                 התחילו הגנה מיידית <ArrowLeft />
               </Link>
               <span className="text-sm text-gray-500">14 יום ניסיון ללא אשראי</span>
            </motion.div>
         </div>

         {/* Hero Visual Abstract */}
         <div className="absolute top-0 left-0 right-0 h-[800px] pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0F1433_0%,#0A0A0B_70%)]" />
         </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 bg-[#12121A] border-y border-white/5">
         <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
               <div>
                  <h3 className="text-3xl font-bold mb-8">למה אתם מפסידים כסף?</h3>
                  <div className="space-y-6">
                     {painPoints.map((point, i) => (
                       <div key={i} className="flex gap-4">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                             <ArrowLeft size={16} className="rotate-45" />
                          </div>
                          <div>
                             <h4 className="font-bold text-lg mb-1">{point.title}</h4>
                             <p className="text-gray-400 text-sm">{point.desc}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="bg-[#0A0A0B] rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                  {/* Abstract Graph */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:20px_20px]" />
                  <div className="relative z-10 text-center">
                     <div className="text-6xl font-black text-white mb-2">{benefit.value}</div>
                     <div className="text-[#00FFA3] font-bold">{benefit.label}</div>
                  </div>
               </div>
            </div>
         </div>
      </section>
      
      {/* Footer Simple */}
      <footer className="py-10 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} MagenAd. כל הזכויות שמורות.</p>
        <div className="mt-4 flex justify-center gap-4">
           <Link to="/privacy" className="hover:text-white">פרטיות</Link>
           <Link to="/terms" className="hover:text-white">תנאים</Link>
        </div>
      </footer>

    </div>
  );
}

export default LandingPageTemplate;
