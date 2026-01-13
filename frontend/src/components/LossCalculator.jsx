import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { DollarSign, Flame, ArrowDown } from 'lucide-react';

function LossCalculator() {
  const [budget, setBudget] = useState(10000); // Default 10k ILS
  const [fraudRate, setFraudRate] = useState(20); // 20% Avg
  const controls = useAnimation();

  const wastedMoney = Math.round(budget * (fraudRate / 100));
  const savedWithUs = Math.round(wastedMoney * 0.95); // We save 95% of it

  useEffect(() => {
    controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.3 }
    });
  }, [budget, controls]);

  return (
    <section className="py-24 bg-[#0A0A0B] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8338EC]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[#00F0FF] font-mono mb-6">
            <Flame size={16} className="text-[#00F0FF]" />
            <span>בדיקת היתכנות כלכלית</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            כמה כסף אתם <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#8338EC] to-[#FF0055]">שורפים</span> בכל חודש?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            לפי מחקרים, בממוצע כ-20% מהתקציב שלכם הולך לקליקים לא חוקיים (בוטים, מתחרים, חוות קליקים).
            בואו נראה כמה זה יוצא בשקלים.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative">
          
          {/* Input Section */}
          <div className="mb-12">
            <label className="block text-gray-400 mb-4 text-lg font-medium">מה תקציב הפרסום החודשי שלכם? (בש״ח)</label>
            <div className="relative flex items-center mb-8">
               <span className="absolute right-6 text-2xl text-gray-500 font-bold">₪</span>
               <input 
                 type="number" 
                 value={budget}
                 onChange={(e) => setBudget(Number(e.target.value))}
                 className="w-full bg-[#0A0A0B] border border-white/10 rounded-2xl px-12 py-6 text-4xl md:text-5xl font-black text-white focus:outline-none focus:border-[#00F0FF] transition-colors"
               />
            </div>
            <input 
              type="range" 
              min="1000" 
              max="100000" 
              step="1000" 
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
              <span>₪1,000</span>
              <span>₪100,000+</span>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* The Loss */}
            <motion.div 
              animate={controls}
              className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 text-center relative overflow-hidden group"
            >
              <div className="text-sm text-red-500 font-bold mb-2 uppercase tracking-wider">כסף שנזרק לפח (חודשי)</div>
              <div className="text-4xl md:text-5xl font-black text-red-500">
                ₪{wastedMoney.toLocaleString()}
              </div>
              <div className="text-xs text-red-500/70 mt-2">
                בשנה אחת: ₪{(wastedMoney * 12).toLocaleString()}!
              </div>
            </motion.div>

            {/* The Savings */}
            <div className="bg-gradient-to-br from-[#00F0FF]/10 to-[#8338EC]/10 border border-[#00F0FF]/20 rounded-2xl p-6 text-center">
              <div className="text-sm text-[#00F0FF] font-bold mb-2 uppercase tracking-wider">חיסכון משוער עם MagenAd</div>
              <div className="text-4xl md:text-5xl font-black text-white">
                ₪{savedWithUs.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                זה כסף שנכנס ישר לרווח הנקי
              </div>
            </div>

          </div>

          {/* CTA In Card */}
          <div className="mt-10 text-center">
             <button className="btn-primary py-4 px-12 text-lg font-bold shadow-lg shadow-[#00F0FF]/20 hover:shadow-[#00F0FF]/40">
               תעצרו את הדימום עכשיו
             </button>
             <p className="text-xs text-gray-500 mt-4">
               * מבוסס על נתוני אמת. החיסכון עשוי להשתנות בהתאם לענף.
             </p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default LossCalculator;
