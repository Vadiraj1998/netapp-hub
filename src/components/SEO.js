import { Helmet } from 'react-helmet-async'

const BASE_URL = 'https://vadiraj.dev'

export default function SEO({
  title,
  description,
  keywords  = '',
  canonical,
  ogTitle,
  ogDescription,
  ogType    = 'website',
  twitterCard  = 'summary',
}) {
  const fullCanonical = canonical ? `${BASE_URL}${canonical}` : BASE_URL
  const resolvedOgTitle = ogTitle || title
  const resolvedOgDesc  = ogDescription || description

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description"  content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author"       content="Vadiraj" />
      <meta name="robots"       content="index, follow" />
      <link rel="canonical"     href={fullCanonical} />

      {/* Open Graph */}
      <meta property="og:title"       content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDesc} />
      <meta property="og:url"         content={fullCanonical} />
      <meta property="og:type"        content={ogType} />

      {/* Twitter */}
      <meta name="twitter:card"        content={twitterCard} />
      <meta name="twitter:title"       content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDesc} />
    </Helmet>
  )
}