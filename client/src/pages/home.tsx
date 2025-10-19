import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { BookOpen, Users, ArrowRight, Sparkles, User, Heart, Star, Globe, Award, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EditorialNavigation from "@/components/editorial-navigation";
import { SEOHead, generateStructuredData } from "@/components/seo/seo-head";
import { buildBackgroundStyle } from "@/lib/utils";
import { LatestBooksCarousel } from "@/components/latest-books-carousel";
import { useUiText } from "@/contexts/ui-text-context";
import { useLocale } from "@/contexts/locale-context";
import { getAllLocalizedUrls } from "@/lib/localized-routes";
import type { Author, EditorialSettings, Book } from "@shared/schema";

// Icon mapping for dynamic feature icons
const iconMap: Record<string, any> = {
  BookOpen,
  Users,
  Sparkles,
  Heart,
  Star,
  Globe,
  Award,
  TrendingUp,
  Zap,
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { locale } = useLocale();
  
  // Generate hreflang alternates for all languages
  const alternates = getAllLocalizedUrls('home');
  
  // Load all UI texts
  const t = {
    seoTitleEditorial: useUiText("homepage", "seo_title_editorial", "Editorial"),
    seoTitleSuffix: useUiText("homepage", "seo_title_suffix", "Descubre Nuevas Voces en Literatura"),
    seoDescPrefix: useUiText("homepage", "seo_desc_prefix", "Bienvenido a"),
    seoDescSuffix: useUiText("homepage", "seo_desc_suffix", "Descubre talentosos autores y sus cautivadoras historias."),
    seoKeywordEditorial: useUiText("homepage", "seo_keyword_editorial", "editorial"),
    seoKeywordLibros: useUiText("homepage", "seo_keyword_libros", "libros"),
    seoKeywordAutores: useUiText("homepage", "seo_keyword_autores", "autores"),
    seoKeywordLiteratura: useUiText("homepage", "seo_keyword_literatura", "literatura"),
    heroTitleDefault: useUiText("homepage", "hero_title_default", "Descubre Historias que Transforman Vidas"),
    heroSubtitleDefault: useUiText("homepage", "hero_subtitle_default", "Una editorial comprometida con nuevas voces literarias."),
    heroPrimaryButtonDefault: useUiText("homepage", "hero_primary_button_default", "Conocer Autores"),
    heroSecondaryButtonDefault: useUiText("homepage", "hero_secondary_button_default", "Ver Destacados"),
    offerTitleDefault: useUiText("homepage", "offer_title_default", "¿Qué Ofrecemos?"),
    offerDescDefault: useUiText("homepage", "offer_desc_default", "Somos más que una editorial, somos un puente entre grandes historias y lectores ávidos"),
    feature1TitleDefault: useUiText("homepage", "feature1_title_default", "Calidad Literaria"),
    feature1DescDefault: useUiText("homepage", "feature1_desc_default", "Seleccionamos cuidadosamente cada obra."),
    feature2TitleDefault: useUiText("homepage", "feature2_title_default", "Autores Diversos"),
    feature2DescDefault: useUiText("homepage", "feature2_desc_default", "Promovemos voces únicas con perspectivas frescas."),
    feature3TitleDefault: useUiText("homepage", "feature3_title_default", "Experiencia Única"),
    feature3DescDefault: useUiText("homepage", "feature3_desc_default", "Creamos conexiones significativas entre autores y lectores."),
    featuredTitleDefault: useUiText("homepage", "featured_title_default", "Autores Destacados"),
    featuredDescDefault: useUiText("homepage", "featured_desc_default", "Conoce a algunos de los talentosos escritores que forman parte de nuestra editorial"),
    footerDescDefault: useUiText("homepage", "footer_desc_default", "Descubriendo nuevas voces en la literatura."),
    footerCopyrightDefault: useUiText("homepage", "footer_copyright_default", "© 2024 Editorial. Todos los derechos reservados."),
    latestPublicationsTitle: useUiText("homepage", "latest_publications_title", "Últimas Publicaciones"),
    latestPublicationsDesc: useUiText("homepage", "latest_publications_desc", "Descubre nuestros libros más recientes y sumérgete en nuevas historias"),
    loadingPublications: useUiText("homepage", "loading_publications", "Cargando publicaciones..."),
    loadingAuthors: useUiText("homepage", "loading_authors", "Cargando autores..."),
    emptyAuthorsSoon: useUiText("homepage", "empty_authors_soon", "Próximamente agregaremos nuevos autores"),
    altAuthorPhoto: useUiText("homepage", "alt_author_photo", "Foto de"),
    altEditorialLogo: useUiText("homepage", "alt_editorial_logo", "Logo Editorial"),
    footerQuickLinks: useUiText("homepage", "footer_quick_links", "Enlaces Rápidos"),
    footerContact: useUiText("homepage", "footer_contact", "Contacto"),
    footerLinkHome: useUiText("homepage", "footer_link_home", "Inicio"),
    footerLinkAuthors: useUiText("homepage", "footer_link_authors", "Nuestros Autores"),
    footerLinkAdmin: useUiText("homepage", "footer_link_admin", "Admin"),
    buttonViewProfile: useUiText("homepage", "button_view_profile", "Ver perfil"),
    buttonViewAllAuthors: useUiText("homepage", "button_view_all_authors", "Ver Todos los Autores"),
  };
  
  const { data: authors = [], isLoading: authorsLoading } = useQuery<Author[]>({
    queryKey: ["/api/authors"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings"],
  });

  const { data: latestBooks = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/books/latest"],
  });

  const activeAuthors = authors.filter(author => author.isActive);
  const featuredAuthors = activeAuthors.slice(0, 4);

  const isLoading = authorsLoading || settingsLoading;

  // Helper function to render icon
  const renderIcon = (iconName: string | undefined, className: string = "h-8 w-8") => {
    if (!iconName) return <BookOpen className={className} />;
    const IconComponent = iconMap[iconName] || BookOpen;
    return <IconComponent className={className} />;
  };

  return (
    <div className="bg-background text-foreground font-sans" style={buildBackgroundStyle({ imageUrl: settings?.backgroundImageUrl, color: settings?.backgroundColor })}>
      <SEOHead
        title={settings?.seoTitle || `${settings?.name || t.seoTitleEditorial} - ${t.seoTitleSuffix}`}
        description={settings?.seoDescription || `${t.seoDescPrefix} ${settings?.name || t.seoTitleEditorial}. ${t.seoDescSuffix}`}
        keywords={settings?.seoKeywords?.split(',').map(k => k.trim()) || [t.seoKeywordEditorial, t.seoKeywordLibros, t.seoKeywordAutores, t.seoKeywordLiteratura]}
        alternates={alternates}
        ogType="website"
        ogLocale={locale.replace('-', '_')}
        structuredData={generateStructuredData.website()}
        faviconUrl={settings?.faviconUrl || undefined}
      />
      <EditorialNavigation />
      
      {/* Hero Section */}
      <section id="inicio" className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              {settings?.heroTitle || t.heroTitleDefault}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              {settings?.heroSubtitle || t.heroSubtitleDefault}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                className="bg-accent text-accent-foreground px-8 py-4 text-lg font-semibold hover:bg-accent/90 transition-all transform hover:scale-105 shadow-xl"
                data-testid="button-explore-authors"
                onClick={() => setLocation('/autores')}
              >
                <Users className="h-5 w-5 mr-2" />
                {settings?.heroPrimaryButtonText || t.heroPrimaryButtonDefault}
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 text-lg font-semibold hover:bg-white/30 transition-all"
                data-testid="button-featured-authors"
                onClick={() => document.getElementById('autores-destacados')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {settings?.heroSecondaryButtonText || t.heroSecondaryButtonDefault}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">
                {settings?.offerSectionTitle || t.offerTitleDefault}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {settings?.offerSectionDescription || t.offerDescDefault}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center bg-card border border-border rounded-xl shadow-lg hover:shadow-2xl transition-all">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  {renderIcon(settings?.feature1Icon, "h-8 w-8 text-primary")}
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary mb-4">
                  {settings?.feature1Title || t.feature1TitleDefault}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {settings?.feature1Description || t.feature1DescDefault}
                </p>
              </Card>
              
              <Card className="p-8 text-center bg-card border border-border rounded-xl shadow-lg hover:shadow-2xl transition-all">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  {renderIcon(settings?.feature2Icon, "h-8 w-8 text-primary")}
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary mb-4">
                  {settings?.feature2Title || t.feature2TitleDefault}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {settings?.feature2Description || t.feature2DescDefault}
                </p>
              </Card>
              
              <Card className="p-8 text-center bg-card border border-border rounded-xl shadow-lg hover:shadow-2xl transition-all">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  {renderIcon(settings?.feature3Icon, "h-8 w-8 text-primary")}
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary mb-4">
                  {settings?.feature3Title || t.feature3TitleDefault}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {settings?.feature3Description || t.feature3DescDefault}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Publications Carousel */}
      {latestBooks.length > 0 && (
        <section id="standalone" className="py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">
                {t.latestPublicationsTitle}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.latestPublicationsDesc}
              </p>
            </div>
            
            <div className="max-w-7xl mx-auto">
              {booksLoading ? (
                <div className="text-center py-12">
                  <div className="text-xl text-muted-foreground">{t.loadingPublications}</div>
                </div>
              ) : (
                <LatestBooksCarousel books={latestBooks} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Authors Section */}
      <section id="autores-destacados" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">
              {settings?.featuredSectionTitle || t.featuredTitleDefault}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {settings?.featuredSectionDescription || t.featuredDescDefault}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-xl text-muted-foreground">{t.loadingAuthors}</div>
            </div>
          ) : featuredAuthors.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                {t.emptyAuthorsSoon}
              </p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-12">
                {featuredAuthors.map((author) => (
                  <Card 
                    key={author.id} 
                    className="bg-card rounded-xl shadow-lg border border-border overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
                    data-testid={`featured-author-${author.id}`}
                  >
                    <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20">
                      {author.photo ? (
                        <img 
                          src={author.photo} 
                          alt={`${t.altAuthorPhoto} ${author.name}`}
                          className="w-full h-full object-cover"
                          data-testid={`featured-author-photo-${author.id}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-24 w-24 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-serif font-bold text-primary mb-2" data-testid={`featured-author-name-${author.id}`}>
                        {author.name}
                      </h3>
                      {author.heroTitle && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {author.heroTitle}
                        </p>
                      )}
                      <Button 
                        variant="outline"
                        className="w-full transition-all"
                        data-testid={`button-view-featured-${author.id}`}
                        onClick={() => setLocation(`/autor/${author.slug}`)}
                      >
                        {t.buttonViewProfile}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {activeAuthors.length > 4 && (
                <div className="text-center">
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 text-lg font-semibold transition-all transform hover:scale-105"
                    data-testid="button-view-all-authors"
                    onClick={() => setLocation('/autores')}
                  >
                    {t.buttonViewAllAuthors}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-serif font-bold text-primary mb-4">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt={t.altEditorialLogo} className="h-10 object-contain" />
                ) : (
                  settings?.name || t.seoTitleEditorial
                )}
              </div>
              <p className="text-muted-foreground mb-4">
                {settings?.footerDescription || t.footerDescDefault}
              </p>
              <div className="flex space-x-4">
                {settings?.footerInstagramUrl && (
                  <a href={settings.footerInstagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-instagram">
                    <i className="fab fa-instagram text-xl"></i>
                  </a>
                )}
                {settings?.footerTwitterUrl && (
                  <a href={settings.footerTwitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-twitter">
                    <i className="fab fa-twitter text-xl"></i>
                  </a>
                )}
                {settings?.footerFacebookUrl && (
                  <a href={settings.footerFacebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-facebook">
                    <i className="fab fa-facebook text-xl"></i>
                  </a>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-4">{t.footerQuickLinks}</h3>
              <ul className="space-y-2">
                {settings?.footerQuickLinks && settings.footerQuickLinks.length > 0 ? (
                  settings.footerQuickLinks.map((linkStr, index) => {
                    const [label, url] = linkStr.split('|');
                    return label && url ? (
                      <li key={index}>
                        <Link href={url.trim()} className="text-muted-foreground hover:text-primary transition-colors">
                          {label.trim()}
                        </Link>
                      </li>
                    ) : null;
                  })
                ) : (
                  <>
                    <li>
                      <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                        {t.footerLinkHome}
                      </Link>
                    </li>
                    <li>
                      <Link href="/autores" className="text-muted-foreground hover:text-primary transition-colors">
                        {t.footerLinkAuthors}
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors">
                        {t.footerLinkAdmin}
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-4">{t.footerContact}</h3>
              <ul className="space-y-2 text-muted-foreground">
                {settings?.footerEmail && (
                  <li><i className="fas fa-envelope mr-2"></i>{settings.footerEmail}</li>
                )}
                {settings?.footerLocation && (
                  <li><i className="fas fa-map-marker-alt mr-2"></i>{settings.footerLocation}</li>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>{settings?.footerCopyright || t.footerCopyrightDefault}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
