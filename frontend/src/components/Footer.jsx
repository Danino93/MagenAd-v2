import { Link } from 'react-router-dom';
import { Shield, Mail, MapPin, Phone } from 'lucide-react';

function FooterHebrew() {
  return (
    <footer className="bg-[#050507] border-t border-white/5 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Newsletter / Cyber Alerts */}
        <div className="border-b border-white/10 pb-12 mb-12">
           <div className="max-w-2xl">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                 <Shield className="text-[#FF0055]" />
                 קבלו התראות סייבר בזמן אמת
              </h3>
              <p className="text-gray-400 mb-6">
                 הצטרפו ל-5,000+ משווקים שמקבלים עדכונים על מתקפות הונאה חדשות וטכניקות הגנה.
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                 <input 
                   type="email" 
                   placeholder="האימייל שלך..." 
                   className="bg-[#12121A] border border-white/10 rounded-xl px-4 py-3 flex-1 text-white focus:border-[#00F0FF] outline-none"
                 />
                 <button className="bg-[#00F0FF] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#00D9FF] transition-colors">
                    הרשמה
                 </button>
              </form>
           </div>
        </div>

        <div className="grid md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D9FF] to-[#8338EC] flex items-center justify-center text-white">
                <Shield size={16} fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-white">MagenAd</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              הפלטפורמה המתקדמת בישראל להגנה מפני הונאות קליקים (Click Fraud).
              חוסכים לכם עד 30% מתקציב הפרסום בגוגל.
            </p>
            <div className="flex gap-4">
              {/* Social Icons Placeholder */}
              <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#00F0FF]/20 flex items-center justify-center transition-colors cursor-pointer">
                <span className="text-xs">Li</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#8338EC]/20 flex items-center justify-center transition-colors cursor-pointer">
                <span className="text-xs">Fb</span>
              </div>
            </div>
          </div>

          {/* מוצר */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">מוצר</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/features" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  פיצ'רים
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  מחירים
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  איך זה עובד
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  שאלות נפוצות
                </Link>
              </li>
              <li>
                <Link to="/tools/scanner" className="text-[#00FFA3] hover:text-white hover:translate-x-1 inline-block transition-all flex items-center gap-2">
                   <Shield size={14} /> סורק אבטחה (חינם)
                </Link>
              </li>
              <li>
                <Link to="/tools/badge" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  Trust Badge Generator
                </Link>
              </li>
              <li>
                <Link to="/status" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Status Page
                </Link>
              </li>
              <li>
                <Link to="/glossary" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  מילון מושגים
                </Link>
              </li>
            </ul>
          </div>

          {/* חברה */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">חברה</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  אודות
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  צור קשר
                </Link>
              </li>
               <li>
                <Link to="/blog" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  בלוג
                </Link>
              </li>
            </ul>
          </div>

          {/* משפטי */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">משפטי</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/privacy" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  מדיניות פרטיות
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all">
                  תנאי שימוש
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} MagenAd AI Ltd. כל הזכויות שמורות.
          </div>
          <div className="flex gap-6">
            <span>Made in Tel Aviv 🇮🇱</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterHebrew;
