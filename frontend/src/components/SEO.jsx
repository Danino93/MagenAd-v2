import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image = '/og-image.jpg', // TODO: Add real OG image later
  url = 'https://magenad.com',
  schema
}) => {
  const siteTitle = 'MagenAd | הגנה מפני הונאות קליקים בגוגל';
  const fullTitle = title ? `${title} | MagenAd` : siteTitle;
  const defaultDesc = 'הפסיקו לשלם על קליקים מזויפים. MagenAd חוסמת בוטים ומתחרים בזמן אמת וחוסכת לכם עד 30% מתקציב הפרסום ב-Google Ads.';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDesc} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="he_IL" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description || defaultDesc} />
      <meta property="twitter:description" content={description || defaultDesc} />
      <meta property="twitter:image" content={image} />

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
