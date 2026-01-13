import LandingPageTemplate from '../../components/LandingPageTemplate';

function AgencyLP() {
  return (
    <LandingPageTemplate 
      seoTitle="פתרון Click Fraud לסוכנויות | MagenAd"
      seoDesc="הכלי הסודי של סוכנויות PPC מובילות. דוחות White Label, דשבורד מרוכז לכל הלקוחות, ושיפור תוצאות מיידי."
      headline={
        <>
          תפסיק להסביר ללקוחות <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#8338EC]">למה הלידים יקרים</span>
        </>
      }
      subheadline="הלקוחות שלך מתלוננים על טראפיק זבל? MagenAd מנקה את התנועה ומקפיצה את ה-ROI, כדי שתוכל להראות תוצאות מדהימות."
      painPoints={[
        { title: 'נטישת לקוחות', desc: 'לקוחות עוזבים כשהם מרגישים שהקמפיין לא עובד.' },
        { title: 'בזבוז זמן ידני', desc: 'לעבור על דוחות ולחסום IPs ידנית זה לא משתלם.' },
        { title: 'חוסר שקיפות', desc: 'קשה להוכיח ללקוח שעשית עבודה טובה בלי דוחות ברורים.' }
      ]}
      benefit={{ value: 'Multi-Client', label: 'דשבורד אחד לכל הלקוחות' }}
    />
  );
}

export default AgencyLP;
