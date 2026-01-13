import { motion } from 'framer-motion';
import { Shield, Users, Code, Heart } from 'lucide-react';
import SEO from '../components/SEO';

function AboutPage() {
  return (
    <div className="pt-32 pb-20 px-6 min-h-screen" dir="rtl">
      <SEO 
        title="אודות MagenAd | נבנה עלי ידי משווקים למען משווקים"
        description="הסיפור מאחורי MagenAd - הצוות הישראלי שנלחם בהונאות הקליקים כדי להציל את תקציבי הפרסום שלכם."
      />
      <div className="max-w-4xl mx-auto">
        
        {/* Intro */}
        <div className="text-center mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-8"
          >
            אנחנו בונים את <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#8338EC]">כיפת הברזל</span> של השיווק
          </motion.h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            MagenAd נולדה מתוך כאב שכולנו מכירים: לראות את תקציב הפרסום נשרף על כלום.
            אנחנו צוות של מפתחים ומשווקים מתל אביב שהחליטו לשים לזה סוף.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-24">
          {[
            { label: 'קליקים נותחו', val: '50M+', icon: Code },
            { label: 'כסף שנחסך', val: '₪12M+', icon: Shield },
            { label: 'לקוחות מרוצים', val: '200+', icon: Users },
            { label: 'קפה שנשתה', val: '∞', icon: Heart },
          ].map((stat, i) => (
            <motion.div 
               key={i}
               initial={{ opacity: 0, scale: 0.8 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className="p-6 rounded-2xl bg-[#12121A] border border-white/5 text-center group hover:border-[#00F0FF]/30 transition-colors"
            >
               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-[#00F0FF] group-hover:scale-110 transition-transform">
                 <stat.icon size={20} />
               </div>
               <div className="text-3xl font-bold text-white mb-1 font-mono">{stat.val}</div>
               <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Story Section */}
        <div className="prose prose-lg prose-invert mx-auto text-gray-300">
           <h3 className="text-3xl font-bold text-white mb-6">למה הקמנו את MagenAd?</h3>
           <p className="mb-6">
             לפני שנתיים, הרצנו קמפיין עבור לקוח בתחום עריכת הדין. התקציב היה גבוה (50,000 ש"ח בחודש), והקליקים זרמו כמו מים. 
             אבל הטלפון? דממה.
           </p>
           <p className="mb-6">
             כשצללנו ללוגים, חשכו עינינו. גילינו ש-40% מהתנועה הגיעה מאותה כתובת IP ב-Data Center בפתח תקווה. 
             מישהו כתב סקריפט פשוט שגמר לנו את התקציב כל בוקר ב-9:00 בדיוק.
           </p>
           <p>
             הבנו שהכלים הקיימים בשוק הם מסורבלים, יקרים (בדולרים), ולא מתאימים לשוק הישראלי.
             אז בנינו את MagenAd: <strong>מערכת חכמה, מהירה, דוברת עברית, שלא דורשת תואר במדעי המחשב כדי להפעיל.</strong>
           </p>
        </div>

      </div>
    </div>
  );
}

export default AboutPage;
