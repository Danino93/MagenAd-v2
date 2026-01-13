import HeroHebrew from '../components/Hero';
import LiveAttackMap from '../components/LiveAttackMap';
import FeaturesHebrew from '../components/Features';
import CTASectionHebrew from '../components/CTASection';
import SEO from '../components/SEO';
import LossCalculator from '../components/LossCalculator';
import ComparisonTable from '../components/ComparisonTable';


function LandingPageHebrew() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "MagenAd",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "ILS"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "120"
    },
    "description": "המערכת המתקדמת בישראל למניעת הונאות קליקים בגוגל. הגנה בזמן אמת ע\"י AI."
  };

  return (
    <>
      <SEO 
        title="הגנה מפני הונאות קליקים בגוגל (Click Fraud)" 
        description=" MagenAd חוסמת בוטים, מתחרים וקליקים מזויפים בזמן אמת. חסכו עד 30% מתקציב הפרסום שלכם ב-Google Ads. נסו חינם ל-14 יום."
        schema={schema}
      />
      <HeroHebrew />
      <LiveAttackMap />
      <LossCalculator />
      <FeaturesHebrew />
      <ComparisonTable />
      <CTASectionHebrew />
    </>
  );
}

export default LandingPageHebrew;
