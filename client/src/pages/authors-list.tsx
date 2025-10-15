import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EditorialNavigation from "@/components/editorial-navigation";
import { SEOHead } from "@/components/seo/seo-head";
import type { Author } from "@shared/schema";

export default function AuthorsListPage() {
  const [, setLocation] = useLocation();
  const { data: authors = [], isLoading } = useQuery<Author[]>({
    queryKey: ["/api/authors"],
  });

  const activeAuthors = authors.filter(author => author.isActive);

  if (isLoading) {
    return (
      <div className="bg-background text-foreground font-sans min-h-screen">
        <EditorialNavigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="text-xl text-muted-foreground">Cargando autores...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground font-sans min-h-screen">
      <SEOHead
        title="Nuestros Autores - Editorial"
        description="Descubre los talentosos autores de nuestra editorial. Explora sus obras, biografías y conecta con sus historias únicas."
        keywords={["autores", "escritores", "editorial", "libros", "literatura"]}
        ogType="website"
      />
      <EditorialNavigation />
      
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              Nuestros <span className="text-accent">Autores</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              Conoce a los talentosos escritores que dan vida a historias inolvidables
            </p>
          </div>
        </div>
      </section>

      {/* Authors Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {activeAuthors.length === 0 ? (
            <div className="text-center py-20">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-serif font-bold text-primary mb-4">
                No hay autores disponibles
              </h2>
              <p className="text-muted-foreground">
                Próximamente agregaremos nuevos autores a nuestra editorial.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {activeAuthors.map((author) => (
                <Card 
                  key={author.id} 
                  className="bg-card rounded-xl shadow-lg border border-border overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
                  data-testid={`author-card-${author.id}`}
                >
                  <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20">
                    {author.photo ? (
                      <img 
                        src={author.photo} 
                        alt={`Foto de ${author.name}`}
                        className="w-full h-full object-cover"
                        data-testid={`author-photo-${author.id}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-24 w-24 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-serif font-bold text-primary mb-2" data-testid={`author-name-${author.id}`}>
                      {author.name}
                    </h3>
                    {author.heroTitle && (
                      <p className="text-muted-foreground mb-4 leading-relaxed" data-testid={`author-hero-title-${author.id}`}>
                        {author.heroTitle}
                      </p>
                    )}
                    <Button 
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                      data-testid={`button-view-author-${author.id}`}
                      onClick={() => setLocation(`/autor/${author.slug}`)}
                    >
                      Ver perfil
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12 mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-serif font-bold text-primary mb-4">
              Editorial
            </div>
            <p className="text-muted-foreground mb-4">
              Descubriendo nuevas voces en la literatura
            </p>
            <div className="border-t border-border mt-8 pt-8 text-muted-foreground">
              <p>&copy; 2024 Editorial. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
