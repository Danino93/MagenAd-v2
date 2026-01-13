import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertCircle, Map as MapIcon } from 'lucide-react';

// Simulated attack data
const countries = [
  { id: 'CN', name: 'China', x: 80, y: 30 },
  { id: 'RU', name: 'Russia', x: 75, y: 20 },
  { id: 'BR', name: 'Brazil', x: 30, y: 70 },
  { id: 'US', name: 'USA', x: 20, y: 30 },
  { id: 'IN', name: 'India', x: 70, y: 45 },
  { id: 'DE', name: 'Germany', x: 55, y: 25 },
];

function LiveAttackMap() {
  const [attacks, setAttacks] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const source = countries[Math.floor(Math.random() * countries.length)];
      const id = Date.now();
      
      // Add visual attack
      setAttacks(prev => [...prev.slice(-4), { ...source, id }]);
      
      // Add log entry
      const ip = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.*.*`;
      setLogs(prev => [{
        id,
        msg: `Threat Blocked: ${ip}`,
        country: source.name,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 5)]);

    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-[#0A0A0B] overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content */}
        <div>
          <div className="flex items-center gap-2 text-[#FF0055] font-mono mb-4 animate-pulse">
            <AlertCircle size={16} />
            <span>LIVE THREAT MONITOR</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
            האיומים לא עוצרים, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#8338EC] to-[#FF0055]">גם ההגנה שלנו לא.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            בכל רגע נתון, האלגוריתמים שלנו מנטרים מיליוני קליקים ברחבי העולם.
            אנחנו מזהים דפוסי הונאה בזמן אמת וחוסמים אותם לפני שהם מבזבזים לכם אגורה.
          </p>

          {/* Live Logs */}
          <div className="bg-[#12121A] border border-white/10 rounded-2xl p-6 font-mono text-sm h-[300px] overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#12121A] to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#12121A] to-transparent z-10" />
            
            <div className="space-y-3">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-between items-center text-gray-400 border-b border-white/5 pb-2"
                  >
                    <div className="flex items-center gap-3">
                       <Shield size={14} className="text-[#00FFA3]" />
                       <span className="text-[#00FFA3]">BLOCKED</span>
                       <span>{log.msg}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <span>{log.country}</span>
                      <span>{log.time}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Visualization (Map) */}
        <div className="relative h-[400px] bg-[#12121A]/30 rounded-3xl border border-white/5 p-8 flex items-center justify-center">
           {/* Abstract Map Grid */}
           <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[size:2rem_2rem] rounded-3xl" />
           
           <div className="relative w-full h-full">
              {/* Central Shield (The User) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                 <div className="w-20 h-20 bg-[#00D9FF]/10 rounded-full flex items-center justify-center animate-pulse border border-[#00D9FF]/30">
                    <Shield size={40} className="text-[#00D9FF]" />
                 </div>
                 {/* Radar Effect */}
                 <div className="absolute inset-0 border border-[#00D9FF]/20 rounded-full animate-ping" />
              </div>

              {/* Threat Lines */}
              <AnimatePresence>
                {attacks.map((attack) => (
                   <motion.div
                     key={attack.id}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 pointer-events-none"
                   >
                      {/* Connection Line */}
                      <svg className="absolute inset-0 w-full h-full overflow-visible">
                        <motion.line
                          x1={`${attack.x}%`}
                          y1={`${attack.y}%`}
                          x2="50%"
                          y2="50%"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5 }}
                          stroke="#FF0055"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="opacity-30"
                        />
                      </svg>

                      {/* Source Blip */}
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.5, 0] }}
                        className="absolute w-3 h-3 bg-[#FF0055] rounded-full shadow-[0_0_10px_#FF0055]"
                        style={{ left: `${attack.x}%`, top: `${attack.y}%` }}
                      />
                   </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>

      </div>
    </section>
  );
}

export default LiveAttackMap;
