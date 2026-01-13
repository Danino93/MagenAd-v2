import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Sparkles, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

function GlossarySidebar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sooner (~600px)
      if (window.scrollY > 600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -200, opacity: 0, rotate: -5 }}
          animate={{ x: 0, opacity: 1, rotate: 0 }}
          exit={{ x: -200, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed left-6 bottom-10 z-40 hidden lg:block font-sans"
        >
          <div className="relative group">
            
            {/* Dismiss Button */}
            <button 
              onClick={() => setIsDismissed(true)}
              className="absolute -top-3 -right-3 bg-[#0A0A0B] border border-white/20 text-gray-400 hover:text-white hover:border-red-500 hover:bg-red-500/20 p-1.5 rounded-full z-50 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
            >
              <X size={14} />
            </button>

            <Link 
              to="/glossary"
              className="block relative overflow-hidden bg-[#0A0A0B]/90 backdrop-blur-xl border border-[#00F0FF]/30 p-5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,240,255,0.3)] transition-all hover:scale-105 hover:border-[#00F0FF] group/card w-64"
            >
               {/* Background Gradient Animation */}
               <div className="absolute inset-0 bg-gradient-to-tr from-[#00F0FF]/10 to-transparent opacity-50 group-hover/card:opacity-80 transition-opacity" />
               <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#8338EC]/30 rounded-full blur-[40px] animate-pulse" />

               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#8338EC] flex items-center justify-center shadow-lg transform group-hover/card:rotate-12 transition-transform">
                        <Brain className="text-white w-6 h-6" />
                     </div>
                     <div>
                        <div className="text-[10px] font-bold text-[#00F0FF] tracking-wider uppercase mb-0.5">Cyber Intel</div>
                        <h4 className="text-white font-black text-lg leading-none">ידע זה כוח.</h4>
                     </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm leading-snug mb-4">
                    אל תיתן להם לדבר איתך "סינית". <br />
                    <span className="text-white font-bold">Botnet? Click Farm?</span> <br />
                    בוא תבין מי נגד מי.
                  </p>

                  <div className="flex items-center justify-between text-xs font-bold text-white bg-white/5 rounded-lg p-2 border border-white/10 group-hover/card:bg-[#00F0FF]/10 group-hover/card:border-[#00F0FF]/30 transition-colors">
                     <span>למילון המלא</span>
                     <ArrowRightIcon />
                  </div>
               </div>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

export default GlossarySidebar;
