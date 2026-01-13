import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function NavigationHebrew() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { name: 'תכונות', path: '/features' },
    { name: 'איך זה עובד', path: '/how-it-works' },
    { name: 'מחירים', path: '/pricing' },
    { name: 'בלוג', path: '/blog' },
    { name: 'שאלות נפוצות', path: '/faq' },
    { name: 'אודות', path: '/about' },
    { name: 'צור קשר', path: '/contact' }
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'glass-strong border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF] via-[#8338EC] to-[#FF006E] flex items-center justify-center font-bold text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
            </div>
            
            <span className="text-xl font-bold text-white tracking-tight">
              MagenAd
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`text-sm font-medium transition-colors relative group ${
                  location.pathname === link.path 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{link.name}</span>
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#00F0FF] transition-all duration-300 ${
                  location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {token ? (
              <button
                onClick={() => navigate('/app/dashboard')}
                className="btn-primary py-2 px-5 text-sm"
              >
                לוח הבקרה
              </button>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="hidden md:block text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  התחברות
                </Link>
                <Link 
                  to="/signup"
                  className="btn-primary py-2 px-5 text-sm shadow-[#00F0FF]/20"
                >
                  התחילו חינם
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavigationHebrew;