import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { BookOpen, Users, ArrowRight, Sparkles, User, Heart, Star, Globe, Award, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EditorialNavigation from "@/components/editorial-navigation";
import { SEOHead, generateStructuredData } from "@/components/seo/seo-head";
import type { Author, EditorialSettings } from "@shared/schema";

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
  const { data: authors = [], isLoading: authorsLoading } = useQuery<Author[]>({
    queryKey: ["/api/authors"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings"],
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
    <div className="bg-background text-foreground font-sans">
      <SEOHead
        title={settings?.seoTitle || "Editorial - Descubre Nuevas Voces en Literatura"}
        description={settings?.seoDescription || "Bienvenido a nuestra editorial. Descubre talentosos autores y sus cautivadoras historias."}
        keywords={settings?.seoKeywords?.split(',').map(k => k.trim()) || ["editorial", "libros", "autores", "literatura"]}
        ogType="website"
        structuredData={generateStructuredData.website()}
      />
      <EditorialNavigation />
      
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              {settings?.heroTitle || "Descubre Historias que Transforman Vidas"}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              {settings?.heroSubtitle || "Una editorial comprometida con nuevas voces literarias."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                className="bg-accent text-accent-foreground px-8 py-4 text-lg font-semibold hover:bg-accent/90 transition-all transform hover:scale-105 shadow-xl"
                data-testid="button-explore-authors"
                onClick={() => setLocation('/autores')}
              >
                <Users className="h-5 w-5 mr-2" />
                {settings?.heroPrimaryButtonText || "Conocer Autores"}
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 text-lg font-semibold hover:bg-white/30 transition-all"
                data-testid="button-featured-authors"
                onClick={() => document.getElementById('autores-destacados')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {settings?.heroSecondaryButtonText || "Ver Destacados"}
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
                {settings?.offerSectionTitle || "¿Qué Ofrecemos?"}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {settings?.offerSectionDescription || "Somos más que una editorial, somos un puente entre grandes historias y lectores ávidos"}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center bg-card border border-border rounded-xl shadow-lg hover:shadow-2xl transition-all">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  {renderIcon(settings?.feature1Icon, "h-8 w-8 text-primary")}
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary mb-4">
                  {settings?.feature1Title || "Calidad Literaria"}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {settings?.feature1Description || "Seleccionamos cuidadosamente cada obra."}
                </p>
              </Card>
              
              <Card className="p-8 text-center bg-card border border-border rounded-xl shadow-lg hover:shadow-2xl transition-all">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  {renderIcon(settings?.feature2Icon, "h-8 w-8 text-primary")}
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary mb-4">
                  {settings?.feature2Title || "Autores Diversos"}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {settings?.feature2Description || "Promovemos voces únicas con perspectivas frescas."}
                </p>
              </Card>
              
              <Card className="p-8 text-center bg-card border border-border rounded-xl shadow-lg hover:shadow-2xl transition-all">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  {renderIcon(settings?.feature3Icon, "h-8 w-8 text-primary")}
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary mb-4">
                  {settings?.feature3Title || "Experiencia Única"}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {settings?.feature3Description || "Creamos conexiones significativas entre autores y lectores."}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Authors Section */}
      <section id="autores-destacados" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">
              {settings?.featuredSectionTitle || "Autores Destacados"}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {settings?.featuredSectionDescription || "Conoce a algunos de los talentosos escritores que forman parte de nuestra editorial"}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-xl text-muted-foreground">Cargando autores...</div>
            </div>
          ) : featuredAuthors.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                Próximamente agregaremos nuevos autores
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
                          alt={`Foto de ${author.name}`}
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
                        Ver perfil
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
                    Ver Todos los Autores
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
                Editorial
              </div>
              <p className="text-muted-foreground mb-4">
                {settings?.footerDescription || "Descubriendo nuevas voces en la literatura."}
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
              <h3 className="font-semibold text-primary mb-4">Enlaces Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/autores" className="text-muted-foreground hover:text-primary transition-colors">
                    Nuestros Autores
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors">
                    Admin
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-4">Contacto</h3>
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
            <p>{settings?.footerCopyright || "© 2024 Editorial. Todos los derechos reservados."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
