import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('magenad_cookie_consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('magenad_cookie_consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 pointer-events-none"
        >
          <div className="bg-[#12121A]/90 backdrop-blur-xl border border-[#00F0FF]/20 p-6 rounded-2xl shadow-2xl pointer-events-auto relative overflow-hidden">
            {/* Glowing Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00F0FF] to-[#8338EC]" />

            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#00F0FF]/10 rounded-xl text-[#00F0FF]">
                <Cookie size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">אנחנו משתמשים בעוגיות 🍪</h4>
                <p className="text-sm text-gray-400 leading-snug mb-4">
                  לא כדי לרגל אחריך, אלא כדי לצוד בוטים ולשפר את המערכת.
                  מבטיחים שזה טעים.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleAccept}
                    className="bg-[#00F0FF] hover:bg-[#00D9FF] text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    מקובל עליי
                  </button>
                  <button 
                    onClick={() => setIsVisible(false)}
                    className="text-gray-500 hover:text-white text-sm font-medium px-2 py-2 transition-colors"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CookieConsent;
