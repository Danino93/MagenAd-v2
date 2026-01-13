import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';

function HeroHebrew() {
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-[#0A0A0B] text-white pt-20"
      dir="rtl"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Glowing Orbs */}
        <motion.div 
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#00F0FF]/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#7000FF]/20 rounded-full blur-[120px]" 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-right"
        >
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 backdrop-blur-sm mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]"></span>
            </span>
            <span className="text-sm font-medium text-[#00F0FF] tracking-wide">AI Security 2.0</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black leading-[1.1] mb-6 tracking-tight">
            תעצרו את <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#7000FF] to-[#FF0055]">
              הקליקים המזויפים
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed max-w-2xl">
            המערכת היחידה שחוסמת בוטים בזמן אמת עם <span className="text-white font-bold">דיוק של 99.9%</span>.
            החזירו את תקציב הפרסום שלכם למקום הנכון.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/signup"
              className="group relative px-8 py-4 bg-gradient-to-r from-[#00F0FF] via-[#8338EC] to-[#FF0055] text-white font-bold text-lg rounded-xl overflow-hidden text-center shadow-lg shadow-[#00F0FF]/20"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                התחילו חינם
                <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link
              to="/tools/scanner"
              className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00F0FF]/50 text-white font-medium text-lg rounded-xl transition-all backdrop-blur-md text-center flex items-center justify-center gap-2 group/scan"
            >
              <Shield className="w-5 h-5 text-[#00F0FF] group-hover/scan:rotate-12 transition-transform" />
              סריקה חינם לאתר
            </Link>
          </div>
          
          <div className="mt-12 flex items-center gap-8 text-sm text-gray-500 font-mono">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00F0FF]" />
              <span>SOC2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 space-x-reverse">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gray-700 border-2 border-[#0A0A0B]" />
                ))}
              </div>
              <span>100+ לקוחות</span>
            </div>
          </div>
        </motion.div>

        {/* 3D Visual */}
        <motion.div style={{ y: y1 }} className="relative hidden lg:block">
          <div className="relative w-full aspect-square max-w-[600px] mx-auto perspective-1000">
            {/* Floating Cards */}
            <motion.div
              animate={{ rotateY: [-5, 5, -5], rotateX: [5, -5, 5] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full preserve-3d"
            >
              {/* Main Shield Card */}
              <div className="absolute inset-0 bg-[rgba(20,20,30,0.6)] border border-white/20 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,240,255,0.1)] backdrop-blur-xl z-20 transform translate-z-20">
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  </div>
                  <div className="text-[#00F0FF] font-mono text-xs flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]"></span>
                    </span>
                    LIVE MONITORING
                  </div>
                </div>
                
                {/* Chart Mock */}
                <div className="space-y-4">
                    <div className="flex items-end justify-between h-40 gap-3 px-4">
                        {[40, 65, 30, 85, 50, 95, 20].map((h, i) => (
                            <motion.div 
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ duration: 1.5, delay: i * 0.1 }}
                                className="w-full bg-gradient-to-t from-[#00F0FF]/40 via-[#8338EC] to-[#FF0055] rounded-t-md relative group shadow-[0_0_20px_rgba(131,56,236,0.3)]"
                            > 
                              {/* Shine Effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 opacity-50" />
                              <div className="absolute top-0 w-full h-1 bg-[#FF0055] shadow-[0_0_15px_#FF0055]" />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-gray-400 text-xs mb-1">חסכנו החודש</div>
                        <div className="text-2xl font-bold font-mono text-[#00F0FF]">₪42,590</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-gray-400 text-xs mb-1">התקפות נחסמו</div>
                        <div className="text-2xl font-bold font-mono text-[#FF0055]">1,284</div>
                    </div>
                </div>
              </div>

              {/* Floating Element 1 - Malicious IP */}
              <motion.div 
                animate={{ y: [-20, 20, -20] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-12 top-20 bg-[#0A0A0B] border border-[#FF0055]/30 rounded-xl p-4 shadow-xl z-30 w-48"
              >
                <div className="flex items-center gap-3 text-[#FF0055] text-sm font-bold mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Malicious IP</span>
                </div>
                <div className="font-mono text-xs text-gray-400">192.168.1.1</div>
                <div className="text-xs text-[#FF0055] mt-1">Blocked Immediately</div>
              </motion.div>

              {/* Floating Element 2 - Savings */}
              <motion.div 
                animate={{ y: [20, -20, 20] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -left-12 bottom-32 bg-[#0A0A0B] border border-[#00F0FF]/30 rounded-xl p-4 shadow-xl z-30 w-48"
              >
                <div className="flex items-center gap-3 text-[#00F0FF] text-sm font-bold mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>ROI Increased</span>
                </div>
                <div className="text-2xl font-bold text-white">+24%</div>
                <div className="text-xs text-gray-400 mt-1">vs. last month</div>
              </motion.div>

            </motion.div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default HeroHebrew;