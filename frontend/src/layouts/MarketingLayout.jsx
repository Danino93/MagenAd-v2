import { Outlet } from 'react-router-dom';
import NavigationHebrew from '../components/Navigation';
import FooterHebrew from '../components/Footer';
import CookieConsent from '../components/CookieConsent';
import GlossarySidebar from '../components/GlossarySidebar';

/**
 * Layout עבור האתר השיווקי (Public Site)
 * כולל את הניווט העליון והפוטר, וביניהם התוכן המשתנה.
 */
const MarketingLayout = () => {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#00F0FF] selection:text-black font-sans">
      <NavigationHebrew />
      <main className="relative">
        <Outlet />
      </main>
      <FooterHebrew />
      <GlossarySidebar />
      <CookieConsent />
    </div>
  );
};

export default MarketingLayout;
