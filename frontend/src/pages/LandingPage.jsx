import NavigationHebrew from '../components/Navigation';
import HeroHebrew from '../components/Hero';
import FeaturesHebrew from '../components/Features';
import CTASectionHebrew from '../components/CTASection';
import FooterHebrew from '../components/Footer';

function LandingPageHebrew() {
  return (
    <div className="bg-[var(--color-bg-primary)] min-h-screen" dir="rtl">
      <NavigationHebrew />
      <HeroHebrew />
      <FeaturesHebrew />
      <CTASectionHebrew />
      <FooterHebrew />
    </div>
  );
}

export default LandingPageHebrew;
