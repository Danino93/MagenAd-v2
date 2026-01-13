import { motion } from 'framer-motion';
import { MousePointer,  ShieldCheck,  Zap, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const steps = [
  {
    num: '01',
    title: 'מחברים את חשבון Google Ads',
    desc: 'התחברות מאובטחת בלחיצת כפתור אחת. אנחנו לא צריכים פרטי אשראי בשלב הזה, ואין פגיעה בביצועי הקמפיינים הקיימים.',
    icon: MousePointer,
    color: 'from-[#00D9FF] to-[#0099FF]'
  },
  {
    num: '02',
    title: 'המערכת לומדת את התנועה',
    desc: 'במשך 24-48 שעות, האלגוריתם שלנו מנתח את כל הקליקים בחשבון, בונה פרופיל התנהגות נורמלי ("Baseline"), ומזהה חריגות.',
    icon: Zap,
    color: 'from-[#8338EC] to-[#7000FF]'
  },
  {
    num: '03',
    title: 'חסימה אוטומטית בזמן אמת',
    desc: 'ברגע שזוהה בוט או מתחרה, אנחנו שולחים את ה-IP שלו לרשימת החסימות של גוגל תוך פחות מ-2 שניות. הכסף שלכם מפסיק לנזול.',
    icon: ShieldCheck,
    color: 'from-[#FF006E] to-[#FF0055]'
  }
];

function HowItWorksPage() {
  return (
    <div className="pt-32 pb-20 px-6 min-h-screen" dir="rtl">
       <SEO 
         title="איך זה עובד? | MagenAd - הגנה ב-3 שלבים"
         description="התקנה פשוטה של 2 דקות. מחברים את חשבון גוגל, המערכת לומדת את התנועה, ומתחילה לחסום בוטים באופן אוטומטי."
       />
       <div className="max-w-4xl mx-auto">
         
         <div className="text-center mb-20">
           <h1 className="text-5xl font-black mb-6">
             פשוט כמו <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#8338EC]">1, 2, 3</span>
           </h1>
           <p className="text-xl text-gray-400">
             בלי קוד, בלי התקנות מסובכות באתר, ובלי כאב ראש.
           </p>
         </div>

         <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-0 bottom-0 right-[40px] md:right-1/2 w-1 bg-gradient-to-b from-[#00F0FF] via-[#8338EC] to-[#FF006E] opacity-20" />

            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`relative flex flex-col md:flex-row gap-8 mb-24 ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}
              >
                  {/* Icon Bubble */}
                  <div className="relative z-10 shrink-0 w-20 h-20 rounded-2xl bg-[#12121A] border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                     <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-10`} />
                     <step.icon size={32} className="text-white relative z-20" />
                     <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm border-2 border-[#12121A]">
                       {step.num}
                     </div>
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 p-8 rounded-3xl bg-[#12121A]/50 border border-white/5 hover:border-white/10 transition-colors backdrop-blur-sm text-right`}>
                     <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                     <p className="text-gray-400 leading-relaxed text-lg">
                       {step.desc}
                     </p>
                  </div>

              </motion.div>
            ))}
         </div>

         <div className="text-center mt-20">
           <Link to="/signup" className="btn-primary inline-flex items-center gap-3 text-lg px-12 py-5 shadow-2xl shadow-[#00F0FF]/20">
             <Zap size={20} />
             אני רוצה להתחיל עכשיו
           </Link>
           <div className="mt-4 text-sm text-gray-500">
             ההתקנה לוקחת פחות מ-2 דקות
           </div>
         </div>

       </div>
    </div>
  );
}

export default HowItWorksPage;
