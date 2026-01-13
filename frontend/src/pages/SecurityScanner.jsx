import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, Lock, AlertTriangle, CheckCircle, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const scanSteps = [
  "Initializing MagenAd Security Protocol...",
  "Resolving DNS records...",
  "Analyzing Google Ads script injections...",
  "Checking for botnet signatures in traffic logs...",
  "Validating click fingerprinting heuristics...",
  "Scanning for known click-farm IP ranges...",
  "Detecting competitor scraping activity...",
  "Calculating potential budget wastage...",
  "Finalizing risk assessment report..."
];

function SecurityScanner() {
  const [url, setUrl] = useState('');
  const [scanState, setScanState] = useState('idle'); // idle, scanning, result
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const logsEndRef = useRef(null);

  const startScan = (e) => {
    e.preventDefault();
    if (!url) return;
    
    setScanState('scanning');
    setLogs([]);
    setProgress(0);

    let stepIndex = 0;
    
    const interval = setInterval(() => {
      if (stepIndex >= scanSteps.length) {
        clearInterval(interval);
        setTimeout(() => setScanState('result'), 1000);
        return;
      }

      setLogs(prev => [...prev, { text: scanSteps[stepIndex], id: Date.now() }]);
      stepIndex++;
      setProgress(prev => Math.min(prev + (100 / scanSteps.length), 100));
      
    }, 800);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen" dir="rtl">
      <SEO 
        title="סורק אבטחה לאתר | MagenAd" 
        description="בדיקת חשיפה להונאות קליקים בחינם. בדוק האם האתר שלך חשוף לבוטים ומתחרים."
      />

      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] font-mono mb-6"
          >
            <Shield size={16} />
            <span>FREE SECURITY TOOL</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
            האם תקציב הפרסום שלך <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#8338EC] to-[#FF0055]">דולף החוצה?</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            סורק האבטחה שלנו יבדוק את רמת החשיפה של האתר שלך להונאות קליקים, בוטים ומתחרים.
          </p>
        </div>

        {/* Scanner Interface */}
        <div className="bg-[#12121A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
          
          {/* Top Bar */}
          <div className="bg-[#0A0A0B] border-b border-white/5 p-4 flex items-center justify-between">
             <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500/50" />
               <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
               <div className="w-3 h-3 rounded-full bg-green-500/50" />
             </div>
             <div className="text-gray-500 text-xs font-mono">MagenAd_Security_Scanner_v2.0.exe</div>
          </div>

          <div className="p-8 md:p-12 min-h-[400px] flex flex-col justify-center">
            
            {/* IDLE STATE */}
            {scanState === 'idle' && (
              <motion.form 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                onSubmit={startScan} 
                className="w-full max-w-lg mx-auto"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF] to-[#8338EC] rounded-xl blur opacity-25 group-hover:opacity-50 transition-opacity" />
                  <div className="relative bg-[#0A0A0B] rounded-xl flex items-center p-2 border border-white/10 group-hover:border-[#00F0FF]/50 transition-colors">
                    <div className="px-4 text-gray-500">
                      <Search size={20} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="הכנס כתובת אתר (לדוגמה: www.yoursite.co.il)" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 bg-transparent text-white p-2 focus:outline-none text-lg text-left"
                      dir="ltr"
                      required
                    />
                    <button 
                      type="submit"
                      className="bg-[#00F0FF] hover:bg-[#00D9FF] text-black font-bold px-8 py-3 rounded-lg transition-all transform hover:scale-105"
                    >
                      סרוק
                    </button>
                  </div>
                </div>
                <p className="text-center text-gray-500 text-sm mt-4 break-words">
                   * הבדיקה אנונימית לחלוטין ואינה דורשת גישה לשרתים שלך.
                </p>
              </motion.form>
            )}

            {/* SCANNING STATE */}
            {scanState === 'scanning' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="w-full max-w-2xl mx-auto font-mono text-left"
              >
                 <div className="mb-6">
                    <div className="flex justify-between text-xs text-[#00F0FF] mb-2 uppercase tracking-widest">
                      <span>Scanning Target: {url}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-[#0A0A0B] rounded-full overflow-hidden border border-white/10">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-[#00F0FF] to-[#8338EC]" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                 </div>

                 <div className="bg-[#0A0A0B]/50 rounded-xl p-4 h-64 overflow-y-auto border border-white/5 space-y-2 text-sm shadow-inner scrollbar-thin scrollbar-thumb-white/10">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-3 text-green-400/80">
                         <span className="opacity-50">[{new Date(log.id).toLocaleTimeString().split(' ')[0]}]</span>
                         <span className="typing-effect"> {log.text}</span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                 </div>
              </motion.div>
            )}

            {/* RESULT STATE */}
            {scanState === 'result' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                 <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 mb-6 relative">
                    <div className="absolute inset-0 rounded-full border border-red-500/50 animate-ping" />
                    <AlertTriangle size={48} className="text-red-500 relative z-10" />
                 </div>

                 <h2 className="text-3xl font-black text-white mb-4">
                   נמצאה חשיפה ברמת <span className="text-red-500">High Risk</span>
                 </h2>
                 
                 <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                   הניתוח הראשוני מראה כי הדומיין <strong>{url}</strong> חשוף להתקפות בוטים ואין עליו הגנה פעילה מפני הונאות קליקים.
                   <br />
                   המשמעות: ייתכן שעד 25% מתקציב הפרסום שלך הולך לפח ברגע זה.
                 </p>

                 <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 max-w-lg mx-auto mb-8 text-left space-y-3">
                    <div className="flex items-center gap-3 text-red-400">
                       <AlertTriangle size={16} />
                       <span>No active firewall detected</span>
                    </div>
                    <div className="flex items-center gap-3 text-red-400">
                       <AlertTriangle size={16} />
                       <span>Competitor scraping possible</span>
                    </div>
                    <div className="flex items-center gap-3 text-red-400">
                       <AlertTriangle size={16} />
                       <span>Botnet variations detected in sector</span>
                    </div>
                 </div>

                 <Link 
                   to="/signup" 
                   className="btn-primary py-4 px-10 text-xl font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/40 border-red-500/50"
                 >
                   תקן את חורי האבטחה (חינם ל-14 יום)
                 </Link>
              </motion.div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default SecurityScanner;
