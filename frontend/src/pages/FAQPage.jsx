import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const faqs = [
  {
    q: 'האם השימוש ב-MagenAd בטוח לחשבון הגוגל שלי?',
    a: 'לחלוטין. MagenAd היא אפליקציה מאושרת (Google Partner) ומשתמשת ב-API הרשמי של גוגל כדי לבצע פעולות. אנחנו לא מבצעים שינויים בקמפיינים או במודעות עצמן, אלא רק מוסיפים כתובות IP חשודות לרשימת החסימות (IP Exclusion List) ברמת הקמפיין.'
  },
  {
    q: 'האם המערכת מאיטה את האתר שלי?',
    a: 'לא. בניגוד לפתרונות אחרים שדורשים התקנת סקריפטים כבדים, MagenAd עובדת בעיקר דרך ה-API של גוגל. אם תבחרו להתקין את פיקסל המעקב המשודרג שלנו (V2), הוא שוקל פחות מ-5KB ונטען בצורה אסינכרונית (Async), כך שאין שום השפעה על מהירות הטעינה.'
  },
  {
    q: 'מה קורה אם חסמתם בטעות לקוח אמיתי?',
    a: 'אנחנו נוקטים בגישה מחמירה של "עדיף לא לחסום מאשר לחסום בטעות". הסף שלנו לזיהוי הונאה הוא גבוה מאוד (99.9% וודאות). בנוסף, כל חסימה היא הפיכה - ניתן לראות בדשבורד בדיוק מי נחסם ולשחרר אותו בלחיצת כפתור אם תרצו.'
  },
  {
    q: 'האם זה עובד עם קמפיינים של Performance Max (PMax)?',
    a: 'כן, אבל במגבלות מסוימות שגוגל מציבה. ב-PMax לא ניתן לחסום IPs ברמת הקמפיין הבודד, ולכן אנחנו מבצעים את החסימה ברמת החשבון כולו (Account Level Exclusion), מה שמגן על כל הקמפיינים כולל PMax.'
  },
  {
    q: 'יש לי תקציב קטן, האם זה שווה לי?',
    a: 'דווקא בתקציבים קטנים כל שקל קובע. אם התקציב שלך הוא ₪3,000 בחודש ו-20% ממנו הולך לפח על בוטים, זרקת ₪600. המנוי שלנו עולה הרבה פחות מזה, כך שאתה מרוויח כסף מהיום הראשון.'
  },
  {
    q: 'האם אני חייב כרטיס אשראי לתקופת הניסיון?',
    a: 'לא. אתה יכול להירשם, לחבר את החשבון, ולראות את המערכת עובדת במשך 14 יום ללא שום התחייבות וללא אמצעי תשלום.'
  }
];

function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen" dir="rtl">
      <SEO 
        title="שאלות נפוצות | MagenAd"
        description="תשובות לכל השאלות שלכם: בטיחות החשבון, התקנה, מחירים, ותאימות ל-Google Ads."
        schema={schema}
      />
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6">שאלות נפוצות</h1>
          <p className="text-gray-400 text-lg">כל מה שרציתם לדעת על הגנת הונאות ולא העזתם לשאול</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-white/10 rounded-2xl bg-[#12121A] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-right hover:bg-white/5 transition-colors"
              >
                <span className="font-bold text-lg text-white">{faq.q}</span>
                <ChevronDown 
                  className={`text-gray-500 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-[#00F0FF]/10 to-[#8338EC]/10 border border-[#00F0FF]/20 text-center">
           <MessageCircle className="w-12 h-12 text-[#00F0FF] mx-auto mb-4" />
           <h3 className="text-2xl font-bold text-white mb-2">יש לכם שאלה נוספת?</h3>
           <p className="text-gray-400 mb-6">צוות התמיכה שלנו זמין בוואטסאפ לכל שאלה טכנית או מסחרית.</p>
           <a 
             href="https://wa.me/972500000000" // TODO: Add real number
             target="_blank"
             rel="noreferrer" 
             className="btn-outline inline-block px-8 py-3 rounded-xl border border-white hover:bg-white hover:text-black font-bold transition-all"
           >
             דברו איתנו בוואטסאפ
           </a>
        </div>

      </div>
    </div>
  );
}

export default FAQPage;
