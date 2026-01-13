import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0B]" dir="rtl">
      <SEO title="404 - עמוד לא נמצא" />
      
      {/* Background Noise */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="text-center relative z-10 px-6">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#8338EC] to-[#FF006E] mb-4 tracking-tighter relative">
          404
          <span className="absolute top-0 left-0 text-[#00F0FF] opacity-30 animate-pulse" style={{ transform: 'translateX(2px)' }}>404</span>
          <span className="absolute top-0 left-0 text-[#FF006E] opacity-30 animate-pulse" style={{ transform: 'translateX(-2px)' }}>404</span>
        </h1>
        
        <p className="text-2xl text-white font-bold mb-4">אופס! נראה שהלכתם לאיבוד במרחב הסייבר.</p>
        <p className="text-gray-400 mb-10 max-w-md mx-auto">
          העמוד שחיפשתם הוחלף ע"י בוטים, נחטף ע"י חייזרים, או פשוט לא קיים.
        </p>

        <Link 
          to="/"
          className="btn-primary inline-flex items-center gap-2"
        >
          חזרה לחוף מבטחים (דף הבית)
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
