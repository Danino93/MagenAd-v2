import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, Copy, Code } from 'lucide-react';
import SEO from '../../components/SEO';

function TrustBadgeGenerator() {
  const [theme, setTheme] = useState('dark'); // dark, light
  const [lang, setLang] = useState('he'); // he, en
  const [size, setSize] = useState('medium'); // small, medium, large
  const [copied, setCopied] = useState(false);

  // Calculate badge dimensions
  const getScale = () => {
    if (size === 'small') return 0.8;
    if (size === 'large') return 1.2;
    return 1;
  };

  const badgeCode = `<!-- Protected by MagenAd -->
<a href="https://magenad.com" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;">
  <div style="background:${theme === 'dark' ? '#0A0A0B' : '#FFFFFF'};border:1px solid ${theme === 'dark' ? '#333' : '#eee'};border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="width:8px;height:8px;background:#00FFA3;border-radius:50%;box-shadow:0 0 8px #00FFA3;"></div>
    <div style="display:flex;flex-direction:column;">
      <span style="font-size:10px;color:${theme === 'dark' ? '#888' : '#666'};font-weight:600;line-height:1;">${lang === 'he' ? 'מוגן ע"י' : 'Protected by'}</span>
      <span style="font-size:14px;color:${theme === 'dark' ? '#FFF' : '#000'};font-weight:800;letter-spacing:0.5px;">MagenAd</span>
    </div>
  </div>
</a>
<!-- End MagenAd Badge -->`;

  const handleCopy = () => {
    navigator.clipboard.writeText(badgeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-[#0A0A0B] text-white" dir="rtl">
      <SEO 
        title="דרישת תו איכות לאתר (Trust Badge) | MagenAd" 
        description="צרו תווית הגנה רשמית לאתר שלכם. שדרו אמינות, הרתיעו מתחרים, והראו ללקוחות שהמידע שלהם מוגן."
      />

      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
        
        {/* Left: Controls */}
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] text-sm font-bold mb-6 border border-[#00F0FF]/20">
              <Shield size={14} />
              <span>Trust Builder V1.0</span>
           </div>
           
           <h1 className="text-4xl md:text-5xl font-black mb-6">
             הפכו את ההגנה <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#8338EC] to-[#FF0055]">לסמל סטטוס</span>
           </h1>
           
           <p className="text-gray-400 text-lg mb-10">
             הוסיפו את תו האיכות של MagenAd לאתר שלכם. מחקרים מראים שתווי אבטחה מגדילים את אחוזי ההמרה ב-14% בממוצע.
           </p>

           <div className="bg-[#12121A] border border-white/10 rounded-2xl p-8 space-y-8">
              
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3">סגנון עיצוב</label>
                <div className="flex gap-4">
                  {['dark', 'light'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        theme === t 
                          ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF]' 
                          : 'border-white/10 hover:bg-white/5 text-gray-400'
                      }`}
                    >
                      {t === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      {theme === t && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3">שפה</label>
                <div className="flex gap-4">
                  {['he', 'en'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        lang === l 
                          ? 'bg-[#8338EC]/10 border-[#8338EC] text-[#8338EC]' 
                          : 'border-white/10 hover:bg-white/5 text-gray-400'
                      }`}
                    >
                      {l === 'he' ? 'עברית' : 'English'}
                      {lang === l && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>

           </div>
        </div>

        {/* Right: Preview & Code */}
        <div className="lg:sticky lg:top-32 space-y-8">
           
           {/* Live Preview */}
           <div className="bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[#0F0F13] border border-white/10 rounded-3xl p-12 flex items-center justify-center min-h-[300px] relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
              
              <motion.div 
                 layout
                 className="relative z-10 cursor-default"
                 style={{ transform: `scale(${getScale()})` }}
                 initial={false}
              >
                  {/* Badge Render */}
                  <div className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg border shadow-xl transition-colors duration-300
                    ${theme === 'dark' ? 'bg-[#0A0A0B] border-[#333]' : 'bg-white border-gray-200'}
                  `}>
                     <div className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] shadow-[0_0_10px_#00FFA3] animate-pulse" />
                     <div className="flex flex-col leading-none">
                        <span className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                           {lang === 'he' ? 'מוגן ע"י' : 'Protected by'}
                        </span>
                        <span className={`text-sm font-black tracking-wide ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                           MagenAd
                        </span>
                     </div>
                  </div>
              </motion.div>

              <div className="absolute bottom-4 right-4 text-xs text-gray-600 font-mono">
                 Live Preview
              </div>
           </div>

           {/* Code Snippet */}
           <div className="bg-[#12121A] border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
                 <div className="flex items-center gap-2 text-gray-400 text-xs font-mono">
                    <Code size={14} />
                    <span>Embed Code</span>
                 </div>
                 <button 
                   onClick={handleCopy}
                   className="text-xs flex items-center gap-1.5 text-[#00F0FF] hover:text-white transition-colors"
                 >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'הועתק!' : 'העתק קוד'}
                 </button>
              </div>
              <div className="p-4 overflow-x-auto">
                 <pre className="text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {badgeCode}
                 </pre>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}

export default TrustBadgeGenerator;
