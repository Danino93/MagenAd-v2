import { Check, X, Minus } from 'lucide-react';

const ComparisonTable = () => {
  const features = [
    { name: 'חסימת בוטים בזמן אמת', magen: true, competitors: true, none: false },
    { name: 'תמיכה מלאה בעברית', magen: true, competitors: false, none: false },
    { name: 'ממשק מותאם לישראל', magen: true, competitors: false, none: false },
    { name: 'הגנה מקליקים של מתחרים', magen: true, competitors: true, none: false },
    { name: 'זיהוי דפוסי התנהגות (AI)', magen: true, competitors: true, none: false },
    { name: 'תשלום בשקלים (חשבונית מס)', magen: true, competitors: false, none: false },
    { name: 'מחיר התחלתי לחודש', magen: '₪149', competitors: '$59', none: '₪0' },
  ];

  return (
    <section className="py-24 bg-[#050507]">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            למה <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#8338EC] to-[#FF0055]">MagenAd</span>?
          </h2>
          <p className="text-gray-400 text-lg">
            ההשוואה מדברת בעד עצמה. אל תתפשרו על הגנה בינונית.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px] bg-[#12121A] rounded-3xl border border-white/5 p-8">
            <div className="grid grid-cols-4 gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="col-span-1 pt-8 text-lg font-bold text-gray-400">פיצ'ר</div>
              <div className="col-span-1 bg-gradient-to-br from-[#00F0FF]/10 to-[#8338EC]/10 rounded-2xl p-6 text-center border border-[#00F0FF]/30 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00F0FF] to-[#8338EC] text-white text-xs font-bold px-3 py-1 rounded-full">
                  הבחירה הנכונה
                </div>
                <div className="text-xl font-black text-white">MagenAd</div>
              </div>
              <div className="col-span-1 flex items-center justify-center font-bold text-gray-500 text-lg">
                המתחרים מחו״ל
              </div>
              <div className="col-span-1 flex items-center justify-center font-bold text-gray-600 text-lg">
                ללא הגנה
              </div>
            </div>

            <div className="space-y-6">
              {features.map((feature, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 items-center">
                  <div className="col-span-1 font-medium text-gray-300">{feature.name}</div>
                  
                  {/* MagenAd */}
                  <div className="col-span-1 flex justify-center text-[#00FFA3]">
                    {feature.magen === true ? <Check size={28} strokeWidth={3} /> : <span className="text-xl font-bold">{feature.magen}</span>}
                  </div>

                  {/* Competitors */}
                  <div className="col-span-1 flex justify-center text-gray-500">
                    {feature.competitors === true ? <Check size={24} /> : feature.competitors === false ? <X size={24} /> : <span>{feature.competitors}</span>}
                  </div>

                  {/* None */}
                  <div className="col-span-1 flex justify-center text-red-500/50">
                    {feature.none === true ? <Check size={24} /> : feature.none === false ? <Minus size={24} /> : <span>{feature.none}</span>}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default ComparisonTable;
