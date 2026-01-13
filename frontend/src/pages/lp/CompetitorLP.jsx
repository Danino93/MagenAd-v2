import LandingPageTemplate from '../../components/LandingPageTemplate';

function CompetitorLP() {
  return (
    <LandingPageTemplate 
      seoTitle="חסום את המתחרים שלך בגוגל | MagenAd"
      seoDesc="המתחרים מקליקים לך על המודעות? MagenAd מזהה וחוסמת אותם בזמן אמת. נסה חינם."
      headline={
        <>
          המתחרים שלך <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0055] to-[#FF4D00]">גומרים לך</span> את התקציב
        </>
      }
      subheadline="בממוצע, 15% מהקליקים בקמפיין שלך מגיעים ממתחרים שמנסים להוריד לך את המודעה. תפסיק להיות פראייר."
      painPoints={[
        { title: 'קליקים חוזרים', desc: 'מתחרה שנכנס ויצא מהאתר שלך 10 פעמים ביום.' },
        { title: 'חוות קליקים', desc: 'שירותים זולים שמתחרים שוכרים כדי לחסל לך את התקציב.' },
        { title: 'פגיעה ב-Quality Score', desc: 'שיעור יציאה (Bounce Rate) גבוה הורס לך את הדירוג בגוגל.' }
      ]}
      benefit={{ value: '30%', label: 'חיסכון ממוצע בתקציב' }}
    />
  );
}

export default CompetitorLP;
