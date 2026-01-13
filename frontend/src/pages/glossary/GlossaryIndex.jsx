import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { Search, ArrowLeft } from 'lucide-react';
import { glossaryTerms } from '../../data/glossary';

function GlossaryIndex() {
  const [filter, setFilter] = useState('');

  const filteredTerms = glossaryTerms.filter(t => t.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-[#0A0A0B] text-white" dir="rtl">
      <SEO 
        title="מילון מושגי סייבר ופרסום דיגיטלי | MagenAd" 
        description="כל המושגים שחייבים להכיר בעולם ה-PPC ואבטחת המידע. מה זה Click Fraud? מי אלו הבוטים? ואיך נזהרים?"
      />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
           <h1 className="text-4xl md:text-5xl font-black mb-6">
             Cyber Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#8338EC] to-[#FF0055]">Glossary</span>
           </h1>
           <p className="text-gray-400 text-lg">
             הידע הוא כוח. למדו את השפה של התוקפים כדי לדעת איך להתגונן.
           </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-16">
           <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#00F0FF]">
              <Search size={20} />
           </div>
           <input 
             type="text" 
             placeholder="חפש מושג..." 
             value={filter}
             onChange={(e) => setFilter(e.target.value)}
             className="w-full bg-[#12121A] border border-white/10 rounded-2xl py-4 pr-12 pl-6 text-white focus:outline-none focus:border-[#00F0FF] transition-all"
           />
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-6">
           {filteredTerms.map((term) => (
             <Link 
               key={term.slug} 
               to={`/glossary/${term.slug}`}
               className="group bg-[#12121A] border border-white/5 rounded-2xl p-6 hover:border-[#00F0FF]/30 transition-all hover:-translate-y-1 block"
             >
               <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[#00F0FF] transition-colors">{term.title}</h3>
               <p className="text-gray-400 text-sm mb-4 line-clamp-2">{term.desc}</p>
               <div className="flex items-center gap-2 text-xs font-bold text-[#8338EC] group-hover:text-[#00F0FF]">
                  קרא עוד <ArrowLeft size={14} />
               </div>
             </Link>
           ))}
        </div>
      </div>
    </div>
  );
}

export default GlossaryIndex;
