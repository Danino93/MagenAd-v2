import { useParams, Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { ArrowRight, Shield, Share2 } from 'lucide-react';
import { glossaryTerms } from '../../data/glossary';

function GlossaryTerm() {
  const { slug } = useParams();
  const term = glossaryTerms.find(t => t.slug === slug);

  if (!term) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">המושג לא נמצא</h1>
          <Link to="/glossary" className="text-[#00F0FF]">חזרה למילון</Link>
        </div>
      </div>
    );
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": term.title,
    "description": term.def,
    "inDefinedTermSet": "https://magenad.com/glossary"
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-[#0A0A0B] text-white" dir="rtl">
      <SEO 
        title={`${term.title} - מילון המושגים | MagenAd`}
        description={term.def}
        schema={schema}
      />

      <div className="max-w-3xl mx-auto">
        <Link to="/glossary" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors">
           <ArrowRight size={16} /> חזרה למילון
        </Link>
        
        <article className="bg-[#12121A] border border-white/10 rounded-3xl overflow-hidden p-8 md:p-12 shadow-2xl">
           <header className="mb-10 border-b border-white/5 pb-10">
              <div className="flex items-center gap-3 mb-4">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    term.risk === 'Critical' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                 }`}>
                   Risk Level: {term.risk}
                 </span>
                 <span className="text-gray-500 text-xs font-mono">Cyber Glossary</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black mb-6 text-white">{term.title}</h1>
              <p className="text-xl text-gray-300 leading-relaxed font-medium pl-4 border-r-4 border-[#00F0FF]">
                {term.def}
              </p>
           </header>
           
           <div className="prose prose-invert prose-lg max-w-none text-gray-300">
             {term.content}
           </div>

           <div className="mt-12 pt-8 border-t border-white/5 bg-[#0A0A0B]/50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                 <Shield className="text-[#00F0FF]" size={20} />
                 חוששים מ-{term.title}?
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                המערכת של MagenAd יודעת לזהות ולחסום את האיום הזה בזמן אמת.
              </p>
              <Link to="/signup" className="text-[#00F0FF] font-bold hover:underline">
                 התחילו הגנה חינם &larr;
              </Link>
           </div>
        </article>
      </div>
    </div>
  );
}

export default GlossaryTerm;
