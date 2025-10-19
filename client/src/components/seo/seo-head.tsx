import { useEffect } from "react";
import { localeToHreflang } from "@/lib/localized-routes";
import type { Locale } from "@/contexts/locale-context";

export interface AlternateLink {
  locale: Locale;
  url: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  canonicalUrl?: string;
  alternates?: AlternateLink[];
  ogType?: "website" | "article" | "book";
  ogImage?: string;
  ogImageAlt?: string;
  ogLocale?: string;
  articleAuthor?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleSection?: string;
  articleTags?: string[];
  structuredData?: object;
  faviconUrl?: string;
}

interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  defaultAuthor: string;
  defaultOgImage: string;
  twitterHandle?: string;
}

const seoConfig: SEOConfig = {
  siteName: "María González - Autora",
  siteUrl: "https://mariawriter.replit.app", // Update with actual domain
  defaultTitle: "María González - Autora de Novelas Románticas y Suspenso",
  defaultDescription: "Descubre las cautivadoras novelas de María González. Desde romances apasionados hasta misterios que te mantendrán despierto toda la noche. Explora mis series y libros independientes.",
  defaultKeywords: ["María González", "autora", "novelas", "romance", "suspenso", "libros", "ficción", "literatura"],
  defaultAuthor: "María González",
  defaultOgImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630",
  twitterHandle: "@MariaGonzalezAuthor"
};

export function SEOHead({
  title,
  description,
  keywords = [],
  author,
  canonicalUrl,
  alternates = [],
  ogType = "website",
  ogImage,
  ogImageAlt,
  ogLocale,
  articleAuthor,
  articlePublishedTime,
  articleModifiedTime,
  articleSection,
  articleTags = [],
  structuredData,
  faviconUrl
}: SEOProps) {
  const fullTitle = title 
    ? `${title} | ${seoConfig.siteName}`
    : seoConfig.defaultTitle;
  
  const metaDescription = description || seoConfig.defaultDescription;
  const metaKeywords = [...seoConfig.defaultKeywords, ...keywords].join(", ");
  const metaAuthor = author || seoConfig.defaultAuthor;
  const metaOgImage = ogImage || seoConfig.defaultOgImage;
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : seoConfig.siteUrl);

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Remove existing SEO meta tags
    const existingTags = document.querySelectorAll('meta[data-seo="true"]');
    existingTags.forEach(tag => tag.remove());

    // Remove static meta tags that might conflict (from index.html)
    const staticKeywords = document.querySelector('meta[name="keywords"]:not([data-seo="true"])');
    if (staticKeywords) staticKeywords.remove();
    
    const staticDescription = document.querySelector('meta[name="description"]:not([data-seo="true"])');
    if (staticDescription) staticDescription.remove();

    // Remove existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) existingCanonical.remove();

    // Remove existing hreflang links
    const existingHreflang = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingHreflang.forEach(link => link.remove());

    // Remove existing favicon
    const existingFavicon = document.querySelector('link[rel="icon"][data-seo="true"]');
    if (existingFavicon) existingFavicon.remove();

    // Remove existing structured data
    const existingStructuredData = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
    if (existingStructuredData) existingStructuredData.remove();

    // Create and append meta tags
    const metaTags = [
      { name: "description", content: metaDescription },
      { name: "keywords", content: metaKeywords },
      { name: "author", content: metaAuthor },
      { name: "robots", content: "index, follow" },
      
      // Open Graph tags
      { property: "og:title", content: title || seoConfig.defaultTitle },
      { property: "og:description", content: metaDescription },
      { property: "og:type", content: ogType },
      { property: "og:url", content: currentUrl },
      { property: "og:site_name", content: seoConfig.siteName },
      { property: "og:image", content: metaOgImage },
      { property: "og:image:alt", content: ogImageAlt || `${title || seoConfig.siteName} - Imagen destacada` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: ogLocale || "es_ES" },
      
      // Twitter Card tags
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title || seoConfig.defaultTitle },
      { name: "twitter:description", content: metaDescription },
      { name: "twitter:image", content: metaOgImage },
      { name: "twitter:image:alt", content: ogImageAlt || `${title || seoConfig.siteName} - Imagen destacada` },
    ];

    // Add Twitter handle if available
    if (seoConfig.twitterHandle) {
      metaTags.push({ name: "twitter:site", content: seoConfig.twitterHandle });
      metaTags.push({ name: "twitter:creator", content: seoConfig.twitterHandle });
    }

    // Add article-specific meta tags
    if (ogType === "article") {
      if (articleAuthor) {
        metaTags.push({ property: "article:author", content: articleAuthor });
      }
      if (articlePublishedTime) {
        metaTags.push({ property: "article:published_time", content: articlePublishedTime });
      }
      if (articleModifiedTime) {
        metaTags.push({ property: "article:modified_time", content: articleModifiedTime });
      }
      if (articleSection) {
        metaTags.push({ property: "article:section", content: articleSection });
      }
      articleTags.forEach(tag => {
        metaTags.push({ property: "article:tag", content: tag });
      });
    }

    // Add og:locale:alternate tags for each alternate language
    if (alternates.length > 0) {
      alternates.forEach(({ locale }) => {
        if (locale !== ogLocale?.replace('_', '-')) {
          metaTags.push({ 
            property: "og:locale:alternate", 
            content: locale.replace('-', '_')
          });
        }
      });
    }

    // Create and append meta elements
    metaTags.forEach(({ name, property, content }) => {
      const meta = document.createElement("meta");
      if (name) meta.setAttribute("name", name);
      if (property) meta.setAttribute("property", property);
      meta.setAttribute("content", content);
      meta.setAttribute("data-seo", "true");
      document.head.appendChild(meta);
    });

    // Add canonical link
    const canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", currentUrl);
    document.head.appendChild(canonical);

    // Add hreflang alternate links
    if (alternates.length > 0) {
      alternates.forEach(({ locale, url }) => {
        const hreflang = document.createElement("link");
        hreflang.setAttribute("rel", "alternate");
        hreflang.setAttribute("hreflang", localeToHreflang(locale));
        hreflang.setAttribute("href", url);
        document.head.appendChild(hreflang);
      });

      // Add x-default hreflang (usually pointing to default language)
      const defaultAlternate = alternates.find(alt => alt.locale === 'es-ES') || alternates[0];
      if (defaultAlternate) {
        const xDefault = document.createElement("link");
        xDefault.setAttribute("rel", "alternate");
        xDefault.setAttribute("hreflang", "x-default");
        xDefault.setAttribute("href", defaultAlternate.url);
        document.head.appendChild(xDefault);
      }
    }

    // Add favicon if provided
    if (faviconUrl) {
      const favicon = document.createElement("link");
      favicon.setAttribute("rel", "icon");
      favicon.setAttribute("type", "image/x-icon");
      favicon.setAttribute("href", faviconUrl);
      favicon.setAttribute("data-seo", "true");
      document.head.appendChild(favicon);
    }

    // Add structured data
    if (structuredData) {
      const script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-seo", "true");
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      const seoTags = document.querySelectorAll('meta[data-seo="true"]');
      seoTags.forEach(tag => tag.remove());
      
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) canonicalLink.remove();

      const hreflangLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
      hreflangLinks.forEach(link => link.remove());
      
      const faviconLink = document.querySelector('link[rel="icon"][data-seo="true"]');
      if (faviconLink) faviconLink.remove();
      
      const structuredDataScript = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
      if (structuredDataScript) structuredDataScript.remove();
    };
  }, [
    fullTitle,
    metaDescription,
    metaKeywords,
    metaAuthor,
    currentUrl,
    alternates,
    ogType,
    metaOgImage,
    ogImageAlt,
    ogLocale,
    articleAuthor,
    articlePublishedTime,
    articleModifiedTime,
    articleSection,
    articleTags,
    structuredData,
    title,
    faviconUrl
  ]);

  return null; // This component doesn't render anything visible
}

// Helper function to generate structured data for different page types
export const generateStructuredData = {
  author: (author: any) => ({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": author.name,
    "jobTitle": "Autora",
    "description": author.bio,
    "image": author.photo,
    "url": seoConfig.siteUrl,
    "sameAs": [
      author.twitterUrl,
      author.facebookUrl,
      author.instagramUrl,
      author.amazonUrl
    ].filter(Boolean)
  }),

  book: (book: any) => ({
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "author": {
      "@type": "Person",
      "name": seoConfig.defaultAuthor
    },
    "description": book.description,
    "genre": book.genre,
    "image": book.coverUrl,
    "url": `${seoConfig.siteUrl}/libro/${book.id}`,
    "datePublished": book.publicationDate,
    "inLanguage": "es",
    "offers": book.amazonUrl ? {
      "@type": "Offer",
      "url": book.amazonUrl,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Amazon"
      }
    } : undefined
  }),

  bookSeries: (series: any, books: any[]) => ({
    "@context": "https://schema.org",
    "@type": "BookSeries",
    "name": series.title,
    "description": series.description,
    "author": {
      "@type": "Person",
      "name": seoConfig.defaultAuthor
    },
    "numberOfItems": books.length,
    "genre": series.genre,
    "hasPart": books.map(book => ({
      "@type": "Book",
      "name": book.title,
      "position": book.orderInSeries,
      "url": `${seoConfig.siteUrl}/libro/${book.id}`
    }))
  }),

  article: (post: any) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "articleBody": post.content,
    "author": {
      "@type": "Person",
      "name": seoConfig.defaultAuthor
    },
    "publisher": {
      "@type": "Organization",
      "name": seoConfig.siteName,
      "logo": {
        "@type": "ImageObject",
        "url": seoConfig.defaultOgImage
      }
    },
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${seoConfig.siteUrl}/blog/${post.id}`
    },
    "image": {
      "@type": "ImageObject",
      "url": post.featuredImage || seoConfig.defaultOgImage,
      "width": 1200,
      "height": 630
    },
    "articleSection": post.category,
    "keywords": post.tags?.join(", ")
  }),

  website: () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": seoConfig.siteName,
    "url": seoConfig.siteUrl,
    "description": seoConfig.defaultDescription,
    "author": {
      "@type": "Person",
      "name": seoConfig.defaultAuthor
    },
    "inLanguage": "es",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${seoConfig.siteUrl}/buscar?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  })
};