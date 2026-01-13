import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Zap, Crown, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Shield,
    price: { monthly: 49, yearly: 39 },
    desc: 'הגנה בסיסית לעסקים קטנים',
    features: [
      'עד 5,000 קליקים בחודש',
      'ניטור בזמן אמת',
      'חסימת IP אוטומטית',
      'דוחות שבועיים',
      'תמיכה במייל'
    ],
    notIncluded: ['הגנת מתחרים מתקדמת', 'Export ל-CSV', 'מנהל חשבון אישי'],
    color: 'text-gray-400',
    buttonVariant: 'btn-secondary',
    isPopular: false
  },
  {
    id: 'pro',
    name: 'Pro Protection',
    icon: Zap,
    price: { monthly: 149, yearly: 119 },
    desc: 'הבחירה המומלצת לעסקים בצמיחה',
    features: [
      'עד 50,000 קליקים בחודש',
      'כל מה שיש ב-Starter',
      'הגנת מתחרים אגרסיבית (A1-A3)',
      'חסימת רשתות תוכן (Display)',
      'דשבורד זמן אמת מלא',
      'Export ל-CSV / PDF',
      'תמיכה בוואטסאפ'
    ],
    notIncluded: ['מנהל חשבון אישי', 'API Access'],
    color: 'text-[#00F0FF]',
    buttonVariant: 'btn-primary',
    isPopular: true
  },
  {
    id: 'agency',
    name: 'Agency / Scale',
    icon: Crown,
    price: { monthly: 399, yearly: 319 },
    desc: 'לסוכנויות ומפרסמים גדולים',
    features: [
      'קליקים ללא הגבלה',
      'כל מה שיש ב-Pro',
      'ניהול משתמשים (Multi-user)',
      'API Access מלא',
      'White Label Reports',
      'מנהל חשבון אישי (VIP)',
      'SLA מובטח'
    ],
    notIncluded: [],
    color: 'text-[#8338EC]',
    buttonVariant: 'btn-secondary',
    isPopular: false
  }
];

function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen relative overflow-hidden" dir="rtl">
      <SEO 
        title="תוכניות ומחירים | MagenAd - החזר השקעה מהיום הראשון"
        description="בחרו את חבילת ההגנה המתאימה לעסק שלכם. התחילו ניסיון חינם ל-14 יום ללא התחייבות. חסכו עד 30% מתקציב הפרסום."
      />
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00F0FF]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#8338EC]/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-block mb-4 px-4 py-1 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] font-mono text-sm"
          >
            ROI חיובי מהיום הראשון
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-6"
          >
            תשלמו פחות, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#8338EC]">תקבלו יותר לקוחות</span>
          </motion.h1>
          
          <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.1 }}
             className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            קליק מזויף אחד עולה לכם בממוצע ₪15-₪50. <br />
            MagenAd עולה פחות מקליק אחד ביום.
          </motion.p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-gray-500'}`}>חודשי</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-16 h-8 bg-white/10 rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <div 
                className={`w-6 h-6 bg-[#00F0FF] rounded-full shadow-lg transition-transform duration-300 ${isYearly ? 'translate-x-[32px]' : 'translate-x-0'}`} // Adjusted translate logic for LTR/RTL toggle visually if needed, usually translate-x works standard even in RTL unless transformed
                style={{ transform: isYearly ? 'translateX(-32px)' : 'translateX(0)' }} // RTL fix: negative translate to move left
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-gray-500'}`}>
              שנתי <span className="text-[#00FFA3] text-xs font-bold">(חסוך 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                plan.isPopular 
                  ? 'bg-[#151520]/80 border-[#00F0FF] shadow-[0_0_40px_rgba(0,240,255,0.15)] transform md:-translate-y-4' 
                  : 'bg-[#12121A]/50 border-white/5 hover:border-white/20'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#00F0FF] to-[#0099FF] text-black text-xs font-bold rounded-full shadow-lg">
                  הכי משתלם
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-xl bg-white/5 ${plan.color}`}>
                  <plan.icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-gray-400">{plan.desc}</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    ${isYearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-gray-500">/ לחודש</span>
                </div>
                {isYearly && (
                  <div className="text-xs text-[#00FFA3] mt-2">
                    משולם שנתית (${plan.price.yearly * 12})
                  </div>
                )}
              </div>

              <Link
                to="/signup"
                className={`w-full flex items-center justify-center py-4 rounded-xl font-bold transition-all mb-8 ${
                  plan.buttonVariant === 'btn-primary' 
                    ? 'bg-gradient-to-r from-[#00F0FF] to-[#0099FF] text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-[1.02]' 
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                התחילו ניסיון חינם
              </Link>

              <div className="space-y-4">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check size={16} className="text-[#00FFA3] shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <X size={16} className="shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

            </motion.div>
          ))}
        </div>

        {/* Money Back Guarantee */}
        <div className="mt-20 text-center max-w-2xl mx-auto p-8 rounded-2xl bg-[#12121A] border border-white/5">
          <div className="w-12 h-12 rounded-full bg-[#00FFA3]/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="text-[#00FFA3]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">100% החזר כספי מובטח</h3>
          <p className="text-gray-400">
            נסו אותנו למשך 14 יום. לא חסכתם כסף? לא נחייב אתכם. 
            אנחנו כל כך בטוחים במוצר שלנו שאנחנו לוקחים את כל הסיכון עלינו.
          </p>
        </div>

      </div>
    </div>
  );
}

export default PricingPage;
