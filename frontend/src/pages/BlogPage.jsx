import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const posts = [
  {
    id: 1,
    title: 'איך לזהות אם המתחרים שלך מקליקים לך על המודעות?',
    excerpt: 'המדריך המלא לזיהוי הונאות קליקים ב-2026. כל הסימנים המחשידים שאתם צריכים לחפש בדוחות של גוגל.',
    category: 'Cyber Intelligence',
    author: 'דניאל כהן',
    date: '10 ינואר, 2026',
    readTime: '5 דק׳ קריאה',
    featured: true,
    color: 'border-[#00F0FF]'
  },
  {
    id: 2,
    title: 'השינוי החדש ב-Performance Max שחושף אתכם להתקפות',
    excerpt: 'גוגל שינו את האלגוריתם, והבוטים חוגגים. הנה מה שצריך לעשות כדי להגן על הקמפיינים שלכם.',
    category: 'Google Ads Updates',
    author: 'שרה לוי',
    date: '08 ינואר, 2026',
    readTime: '3 דק׳ קריאה',
    featured: false,
    color: 'border-[#8338EC]'
  },
  {
    id: 3,
    title: 'מחקר: כמה כסף עסקים בישראל מפסידים על בוטים?',
    excerpt: 'הנתונים נחשפים: 1 מתוך 4 קליקים בישראל הוא מזויף. בדקנו 500 חשבונות והתוצאות מפתיעות.',
    category: 'Data & Research',
    author: 'צוות MagenAd',
    date: '05 ינואר, 2026',
    readTime: '8 דק׳ קריאה',
    featured: false,
    color: 'border-[#FF006E]'
  },
  {
    id: 4,
    title: '5 דרכים לחסום כתובות IP באופן ידני',
    excerpt: 'למי שעדיין רוצה לעבוד קשה: המדריך הידני לחסימת כתובות. (ספוילר: זה לוקח המון זמן).',
    category: 'Guides',
    author: 'דניאל כהן',
    date: '01 ינואר, 2026',
    readTime: '4 דק׳ קריאה',
    featured: false,
    color: 'border-[#00FFA3]'
  }
];

function BlogPage() {
  return (
    <div className="pt-32 pb-20 px-6 min-h-screen" dir="rtl">
      <SEO 
        title="בלוג ומאמרים | MagenAd" 
        description="תובנות, מחקרים ומדריכים מעולם ה-Click Fraud Protection. הישארו מעודכנים בשיטות ההונאה החדשות ואיך להתגונן מפניהן."
      />

      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16">
           <h1 className="text-5xl font-black mb-4">Cyber Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#8338EC] to-[#FF0055]">Hub</span></h1>
           <p className="text-gray-400">חדשות, עדכונים ומידע קריטי להגנה על תקציב הפרסום שלכם.</p>
        </header>

        {/* Featured Post */}
        {posts.filter(p => p.featured).map(post => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 relative group"
          >
             <Link to="#" className="block">
               <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/20 to-[#8338EC]/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative bg-[#12121A] border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden hover:border-[#00F0FF]/50 transition-colors">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                           <span className="bg-[#00F0FF]/10 text-[#00F0FF] px-3 py-1 rounded-full text-xs font-bold font-mono border border-[#00F0FF]/20">
                             {post.category}
                           </span>
                           <span className="text-gray-500 text-sm flex items-center gap-1">
                             <Calendar size={14} /> {post.date}
                           </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:text-[#00F0FF] transition-colors">
                          {post.title}
                        </h2>
                        <p className="text-gray-400 text-lg mb-6 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                           <div className="flex items-center gap-2 text-sm text-gray-400">
                             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                               <User size={14} />
                             </div>
                             {post.author}
                           </div>
                           <span className="flex items-center gap-2 text-[#00F0FF] font-bold">
                             קרא עוד <ArrowLeft size={16} />
                           </span>
                        </div>
                     </div>
                     {/* Random decorative image/shape instead of real image for now */}
                     <div className="w-full md:w-1/3 aspect-video bg-gradient-to-br from-[#1A1A24] to-[#0A0A0B] rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <Tag size={48} className="text-white/10" />
                     </div>
                  </div>
               </div>
             </Link>
          </motion.div>
        ))}

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-8">
           {posts.filter(p => !p.featured).map((post, i) => (
             <motion.div
               key={post.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="group"
             >
                <Link to="#" className="block h-full">
                  <div className={`h-full bg-[#12121A] border border-white/5 rounded-2xl p-6 hover:-translate-y-2 transition-transform duration-300 hover:border-l-4 ${post.color.replace('border-', 'hover:border-l-')}`}>
                     <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs font-bold ${post.color.replace('border-', 'text-')}`}>
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-500">{post.readTime}</span>
                     </div>
                     <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gray-200">
                       {post.title}
                     </h3>
                     <p className="text-sm text-gray-400 mb-6 line-clamp-3">
                       {post.excerpt}
                     </p>
                     <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto pt-4 border-t border-white/5">
                        <Calendar size={12} /> {post.date}
                     </div>
                  </div>
                </Link>
             </motion.div>
           ))}
        </div>

      </div>
    </div>
  );
}

export default BlogPage;
