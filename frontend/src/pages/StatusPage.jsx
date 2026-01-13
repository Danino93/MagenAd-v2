import { motion } from 'framer-motion';
import { CheckCircle2, Activity, Server, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';

const systems = [
  { name: 'Real-time API', status: 'operational', uptime: '99.99%', latency: '45ms' },
  { name: 'AI Detection Engine', status: 'operational', uptime: '100%', latency: '120ms' },
  { name: 'Dashboard & Reporting', status: 'operational', uptime: '99.95%', latency: '80ms' },
  { name: 'Google Ads Sync', status: 'operational', uptime: '99.99%', latency: '210ms' },
];

function StatusPage() {
  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-[#0A0A0B] text-white" dir="rtl">
      <SEO 
        title="סטטוס מערכת (System Status) | MagenAd" 
        description="בדקו את מצב השרתים והשירותים של MagenAd בזמן אמת. שקיפות מלאה ללקוחותינו."
      />

      <div className="max-w-3xl mx-auto">
         
         {/* Header */}
         <div className="text-center mb-16">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-3 rounded-full mb-8"
            >
               <CheckCircle2 size={24} className="animate-pulse" />
               <span className="text-lg font-bold">כל המערכות תקינות</span>
            </motion.div>
            <h1 className="text-4xl font-black mb-4">MagenAd System Status</h1>
            <p className="text-gray-400">
               ניטור בזמן אמת של תשתיות ההגנה שלנו.
            </p>
         </div>

         {/* Grid */}
         <div className="grid gap-4 mb-16">
            {systems.map((sys, i) => (
               <motion.div 
                  key={sys.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#12121A] border border-white/5 p-6 rounded-xl flex items-center justify-between group hover:border-[#00F0FF]/30 transition-colors"
               >
                  <div className="flex items-center gap-4">
                     {sys.name === 'Real-time API' && <Activity className="text-gray-500 group-hover:text-[#00F0FF] transition-colors" />}
                     {sys.name === 'AI Detection Engine' && <ShieldCheck className="text-gray-500 group-hover:text-[#00F0FF] transition-colors" />}
                     {sys.name === 'Dashboard & Reporting' && <Server className="text-gray-500 group-hover:text-[#00F0FF] transition-colors" />}
                     {sys.name === 'Google Ads Sync' && <Activity className="text-gray-500 group-hover:text-[#00F0FF] transition-colors" />}
                     
                     <div>
                        <div className="font-bold text-lg">{sys.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">Latency: {sys.latency}</div>
                     </div>
                  </div>

                  <div className="text-right">
                     <div className="text-green-400 font-bold text-sm uppercase tracking-wider mb-1">Operational</div>
                     <div className="text-gray-600 text-xs">{sys.uptime} uptime</div>
                  </div>
               </motion.div>
            ))}
         </div>

         {/* Historical incidents */}
         <div className="border-t border-white/10 pt-12">
            <h3 className="text-xl font-bold mb-6">Past Incidents</h3>
            <div className="space-y-8">
               <div className="border-l-2 border-gray-800 pl-6 pb-2 relative">
                  <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-gray-600" />
                  <div className="text-sm text-gray-500 mb-1">Jan 10, 2024</div>
                  <div className="font-bold mb-2">Google Ads API Latency</div>
                  <p className="text-gray-400 text-sm">
                     זיהינו איטיות בתגובת ה-API של גוגל באזור אירופה. ההגנה לא נפגעה. הבעיה נפתרה תוך 14 דקות.
                  </p>
               </div>
               
               <div className="border-l-2 border-gray-800 pl-6 pb-2 relative">
                  <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-green-500" />
                  <div className="text-sm text-gray-500 mb-1">Jan 01, 2024</div>
                  <div className="font-bold mb-2">No incidents reported</div>
                  <p className="text-gray-400 text-sm">
                     מערכות MagenAd פעלו בצורה תקינה ללא תקלות.
                  </p>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}

export default StatusPage;
