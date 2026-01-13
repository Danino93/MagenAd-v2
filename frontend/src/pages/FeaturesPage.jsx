import { motion } from 'framer-motion';
import { 
  Zap, Clock, Calendar, BarChart2, Activity, 
  Moon, MousePointer, Globe, ShieldAlert, 
  Lock, AlertOctagon, TrendingUp 
} from 'lucide-react';

const rules = [
  {
    id: 'A1',
    icon: Zap,
    title: 'הקלקות חוזרות מהירות',
    desc: 'זיהוי מיידי של אותו מקור שמקליק מספר פעמים בתוך דקות בודדות.',
    severity: 'High',
    color: 'text-[#FF0055]'
  },
  {
    id: 'A2',
    icon: Clock,
    title: 'חלון זמן קצר',
    desc: 'חסימת מקורות שמייצרים דפוס קליקים חשוד בטווח של 10 דקות.',
    severity: 'Medium',
    color: 'text-[#00D9FF]'
  },
  {
    id: 'A3',
    icon: Calendar,
    title: 'חזרתיות יומית',
    desc: 'זיהוי משתמשים שחוזרים יום אחרי יום רק כדי לבזבז תקציב.',
    severity: 'Medium',
    color: 'text-[#00D9FF]'
  },
  {
    id: 'B1',
    icon: TrendingUp,
    title: 'זינוק בנפח חשבון',
    desc: 'זיהוי אנומליה כאשר יש קפיצה לא מוסברת בסך הקליקים בחשבון.',
    severity: 'Medium',
    color: 'text-[#8338EC]'
  },
  {
    id: 'B2',
    icon: BarChart2,
    title: 'זינוק בקמפיין',
    desc: 'התראה כשרק קמפיין ספציפי מותקף בפתאומיות.',
    severity: 'Medium',
    color: 'text-[#8338EC]'
  },
  {
    id: 'B3',
    icon: Activity,
    title: 'מתקפת בזק (Micro-Burst)',
    desc: 'זיהוי נחילי בוטים שתוקפים בעוצמה לפרק זמן קצר מאוד.',
    severity: 'High',
    color: 'text-[#FF0055]'
  },
  {
    id: 'C1',
    icon: Moon,
    title: 'פעילות בשעות חריגות',
    desc: 'ניטור קליקים באמצע הלילה או בזמנים לא הגיונייים לעסק.',
    severity: 'Low',
    color: 'text-[#00FFA3]'
  },
  {
    id: 'C2',
    icon: ShieldAlert,
    title: 'מתקפת לילה',
    desc: 'שילוב של התקפת בזק יחד עם שעות לילה - סבירות גבוהה להונאה.',
    severity: 'High',
    color: 'text-[#FF0055]'
  },
  {
    id: 'D1',
    icon: Globe,
    title: 'רשת חריגה',
    desc: 'זיהוי תנועה שמגיעה מרשתות תוכן (Display) באיכות ירודה.',
    severity: 'Medium',
    color: 'text-[#00D9FF]'
  },
  {
    id: 'E1',
    icon: AlertOctagon,
    title: 'הצלבת חוקים',
    desc: 'מנגנון חכם שמזהה כשמספר נורות אדומות נדלקות במקביל.',
    severity: 'Critical',
    color: 'text-[#FF4D00]'
  },
  {
    id: 'E2',
    icon: Lock,
    title: 'ציון חשוד (Suspicious Score)',
    desc: 'אלגוריתם המחשב ציון סיכון לכל קליק על בסיס היסטוריה.',
    severity: 'High',
    color: 'text-[#FF0055]'
  },
  {
    id: 'F1',
    icon: MousePointer,
    title: 'הגבלת קצב (Rate Limit)',
    desc: 'מנגנון למניעת הצפת דיווחים ושמירה על יציבות המערכת.',
    severity: 'System',
    color: 'text-[#6b7199]'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

import SEO from '../components/SEO';

function FeaturesPage() {
  return (
    <div className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
      <SEO 
        title="12 חוקי ההגנה של MagenAd | זיהוי קליקים מזויפים"
        description="המערכת המתקדמת ביותר לזיהוי הונאות קליקים. 12 שכבות של הגנה הכוללות חוקי תדירות, זיהוי בוטים, וניטור בזמן אמת."
      />
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0A0A0B] to-transparent z-10" />
         <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-[#00F0FF]/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-block mb-4 px-4 py-1 rounded-full bg-[#8338EC]/20 border border-[#8338EC]/50 text-[#8338EC] font-mono text-sm"
          >
            MagenAd Detection Engine™
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-6"
          >
            12 שכבות של <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#8338EC]">הגנה</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            המערכת שלנו לא סתם מנחשת. היא משתמשת ב-12 חוקים דטרמיניסטיים ואלגוריתמים לומדים כדי להבטיח זיהוי מדויק של הונאות.
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {rules.map((rule) => (
            <motion.div 
              key={rule.id}
              variants={item}
              className="group relative bg-[#12121A] border border-white/5 hover:border-[#00F0FF]/30 rounded-2xl p-8 hover:-translate-y-2 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${rule.color}`}>
                <rule.icon size={24} />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-white">{rule.title}</h3>
                <span className="font-mono text-xs text-gray-500 opacity-50">{rule.id}</span>
              </div>
              
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                {rule.desc}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <span className={`text-xs font-bold px-3 py-1 rounded-full bg-white/5 ${rule.color.replace('text', 'bg')}/10 ${rule.color}`}>
                  {rule.severity}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default FeaturesPage;
