import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, MapPin, Send, CheckCircle } from 'lucide-react';
import SEO from '../components/SEO';

function ContactPage() {
  const [formState, setFormState] = useState('idle'); // idle, submitting, success

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormState('submitting');
    // Simulate API call
    setTimeout(() => {
      setFormState('success');
    }, 1500);
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen relative overflow-hidden" dir="rtl">
      <SEO 
        title="צרו קשר | MagenAd - הגנת סייבר למפרסמים" 
        description="דברו עם צוות המומחים שלנו. התאמה אישית לסוכנויות ומפרסמים גדולים. תמיכה 24/7 בוואטסאפ ובמייל."
      />

       {/* Background Decor */}
       <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00F0FF]/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#8338EC]/5 rounded-full blur-[100px]" />
       </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 relative z-10">
        
        {/* Contact Info (Right Side in RTL) */}
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black mb-6 text-white"
          >
            בואו נדבר <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#8338EC] to-[#FF0055]">ביזנס</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 mb-12 leading-relaxed"
          >
            הצוות שלנו זמין עבורכם לכל שאלה. <br />
            החל מהתקנה טכנית ועד בניית אסטרטגיית הגנה מותאמת אישית.
          </motion.p>

          <div className="space-y-8">
            <ContactItem 
              icon={MessageCircle} 
              title="וואטסאפ (זמינות מיידית)" 
              value="050-000-0000" 
              link="https://wa.me/972500000000"
              color="text-[#00FFA3]"
              delay={0.2}
            />
            <ContactItem 
              icon={Mail} 
              title="אימייל" 
              value="support@magenad.com" 
              link="mailto:support@magenad.com"
              color="text-[#00D9FF]"
              delay={0.3}
            />
            <ContactItem 
              icon={MapPin} 
              title="משרדים" 
              value="שד' רוטשילד 22, תל אביב" 
              link="#"
              color="text-[#8338EC]"
              delay={0.4}
            />
          </div>
        </div>

        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#12121A] border border-white/5 p-8 rounded-3xl relative overflow-hidden"
        >
          {formState === 'success' ? (
             <div className="h-full flex flex-col items-center justify-center text-center p-10">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-[#00FFA3]/20 rounded-full flex items-center justify-center mb-6 text-[#00FFA3]"
                >
                  <CheckCircle size={40} />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">הודעתך נשלחה!</h3>
                <p className="text-gray-400">נחזור אליך תוך שעות ספורות.</p>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <InputGroup label="שם מלא" type="text" placeholder="ישראל ישראלי" required />
                <InputGroup label="שם החברה" type="text" placeholder="החברה בע״מ" />
              </div>
              
              <InputGroup label="אימייל" type="email" placeholder="name@company.com" required />
              <InputGroup label="טלפון" type="tel" placeholder="050..." required />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">מה התקציב החודשי שלך בגוגל?</label>
                <select className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF] focus:outline-none focus:ring-1 focus:ring-[#00F0FF]/50 transition-all">
                  <option>עד ₪10,000</option>
                  <option>₪10,000 - ₪50,000</option>
                  <option>₪50,000 - ₪200,000</option>
                  <option>מעל ₪200,000 (Enterprise)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">הודעה</label>
                <textarea 
                  rows={4}
                  className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF] focus:outline-none focus:ring-1 focus:ring-[#00F0FF]/50 transition-all resize-none"
                  placeholder="ספר לנו קצת על האתגרים שלך..."
                />
              </div>

              <button 
                type="submit"
                disabled={formState === 'submitting'}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2 group"
              >
                {formState === 'submitting' ? (
                  <span className="animate-pulse">שולח...</span>
                ) : (
                  <>
                    <span>שליחת הודעה</span>
                    <Send size={18} className="group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>

      </div>
    </div>
  );
}

const ContactItem = ({ icon: Icon, title, value, link, color, delay }) => (
  <motion.a 
    href={link}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white/5 transition-colors group"
  >
    <div className={`w-14 h-14 rounded-2xl bg-[#12121A] border border-white/10 flex items-center justify-center ${color} shadow-lg group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <div>
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-lg font-bold text-white group-hover:text-[#00F0FF] transition-colors">{value}</div>
    </div>
  </motion.a>
);

const InputGroup = ({ label, type, placeholder, required }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-400">{label}</label>
    <input 
      type={type} 
      required={required}
      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF] focus:outline-none focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
      placeholder={placeholder}
    />
  </div>
);

export default ContactPage;
