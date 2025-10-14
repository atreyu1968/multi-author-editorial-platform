import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Download, BookOpen, ShoppingCart, ArrowRight, Star, Gift, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Newsletter from "@/components/newsletter";
import { SEOHead, generateStructuredData } from "@/components/seo/seo-head";
import { DynamicTheme } from "@/components/dynamic-theme";
import type { Author, BookSeries, Book, Testimonial } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: author, isLoading: authorLoading, error: authorError } = useQuery<Author>({
    queryKey: ["/api/authors/by-slug", slug],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/authors/by-slug/${slug}`);
      if (!response.ok) {
        throw new Error("Author not found");
      }
      return response.json();
    },
    enabled: !!slug,
  });

  const { data: series = [], isLoading: seriesLoading } = useQuery<BookSeries[]>({
    queryKey: ["/api/book-series", { authorId: author?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/book-series?authorId=${author?.id}`);
      if (!response.ok) throw new Error("Failed to fetch series");
      return response.json();
    },
    enabled: !!author?.id,
  });

  const { data: standaloneBooks = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/books/standalone", { authorId: author?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/books/standalone?authorId=${author?.id}`);
      if (!response.ok) throw new Error("Failed to fetch books");
      return response.json();
    },
    enabled: !!author?.id,
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials/published", { authorId: author?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/testimonials/published?authorId=${author?.id}`);
      if (!response.ok) throw new Error("Failed to fetch testimonials");
      return response.json();
    },
    enabled: !!author?.id,
  });

  // Fetch books for each series
  const seriesWithBooks = useQuery({
    queryKey: ["/api/books/series/all", { series: series.map(s => s.id) }],
    queryFn: async () => {
      const results = await Promise.all(
        series.map(async (s) => {
          const response = await fetch(`/api/books/series/${s.id}`);
          if (!response.ok) return { series: s, books: [] };
          const books = await response.json();
          return { series: s, books };
        })
      );
      return results;
    },
    enabled: series.length > 0,
  });

  if (authorLoading) {
    return (
      <div className="bg-background text-foreground font-sans min-h-screen flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (authorError || !author) {
    return (
      <div className="bg-background text-foreground font-sans min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-serif font-bold text-primary mb-4">Autor no encontrado</h1>
          <p className="text-xl text-muted-foreground mb-8">
            El autor que buscas no existe o ha sido eliminado.
          </p>
          <Link href="/">
            <Button data-testid="button-home">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeSeries = series.filter(s => s.isActive);
  const publishedStandaloneBooks = standaloneBooks.filter(b => b.isPublished);

  return (
    <DynamicTheme authorId={author.id}>
      <div className="bg-background text-foreground font-sans">
        <SEOHead
          title={`${author.name} - Autor`}
          description={author.bioParagraph1.substring(0, 160)}
          keywords={["autor", "escritor", "libros", author.name]}
          ogType="website"
          ogImage={author.photo || undefined}
          structuredData={generateStructuredData.author({
            name: author.name,
            url: `/autor/${author.slug}`,
            image: author.photo || undefined,
          })}
        />
        <Navigation authorId={author.id} />

      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            {author.photo && (
              <img 
                src={author.photo} 
                alt={`Foto de ${author.name}`}
                className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4 border-white/30 shadow-2xl"
                data-testid="author-hero-photo"
              />
            )}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              {author.heroTitle.split(' ').slice(0, 2).join(' ')}<br />
              <span className="text-accent">{author.heroTitle.split(' ').slice(2).join(' ')}</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              {author.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                className="bg-accent text-accent-foreground px-8 py-4 text-lg font-semibold hover:bg-accent/90 transition-all transform hover:scale-105 shadow-xl"
                data-testid="button-download"
                onClick={() => document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Download className="h-5 w-5 mr-2" />
                Descarga Gratuita
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 text-lg font-semibold hover:bg-white/30 transition-all"
                data-testid="button-books"
                onClick={() => document.getElementById('books')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Ver Libros
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Biography Section */}
      <section id="biografia" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-8">
                  Sobre {author.name}
                </h2>
                <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed space-y-6">
                  <p data-testid="bio-paragraph-1">{author.bioParagraph1}</p>
                  <p data-testid="bio-paragraph-2">{author.bioParagraph2}</p>
                  <p data-testid="bio-paragraph-3">{author.bioParagraph3}</p>
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  {author.instagramUrl && (
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-instagram">
                      <a href={author.instagramUrl} target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-instagram mr-2"></i>Instagram
                      </a>
                    </Button>
                  )}
                  {author.twitterUrl && (
                    <Button asChild variant="secondary" className="hover:bg-secondary/80" data-testid="button-twitter">
                      <a href={author.twitterUrl} target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-twitter mr-2"></i>Twitter
                      </a>
                    </Button>
                  )}
                  {author.facebookUrl && (
                    <Button asChild variant="secondary" className="hover:bg-secondary/80" data-testid="button-facebook">
                      <a href={author.facebookUrl} target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-facebook mr-2"></i>Facebook
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <img 
                    src={author.photo || "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"} 
                    alt={`Retrato profesional de ${author.name}`}
                    className="rounded-2xl shadow-2xl w-full max-w-md mx-auto object-cover" 
                    data-testid="author-bio-photo"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Series Section */}
      {activeSeries.length > 0 && (
        <section id="series" className="py-20" data-testid="section-series">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">Series de Libros</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Explora las emocionantes series de {author.name}
              </p>
            </div>

            {seriesWithBooks.data?.map(({ series: serie, books }) => {
              const publishedBooks = books.filter((b: Book) => b.isPublished);
              
              return (
                <div key={serie.id} className="mb-20 last:mb-0" data-testid={`series-${serie.id}`}>
                  <Card className="rounded-2xl shadow-xl overflow-hidden border border-border relative">
                    {serie.cardBackgroundImage && (
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={serie.cardBackgroundImage} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-transparent"></div>
                      </div>
                    )}
                    
                    <div className={`grid lg:grid-cols-2 gap-8 p-8 lg:p-12 relative z-10 ${!serie.cardBackgroundImage ? 'bg-card' : ''}`}>
                      <div>
                        <h3 className="text-3xl font-serif font-bold text-primary mb-4">
                          {serie.title}
                        </h3>
                        <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                          {serie.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-6">
                          <Badge className="bg-accent/20 text-accent-foreground">{serie.genre}</Badge>
                          <Badge className="bg-accent/20 text-accent-foreground">
                            {publishedBooks.length} {publishedBooks.length === 1 ? 'libro' : 'libros'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Link href={`/serie/${serie.id}`}>
                            <Button 
                              variant="outline"
                              className="transition-all transform hover:scale-105"
                              data-testid={`button-view-series-${serie.id}`}
                            >
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Ver serie completa
                            </Button>
                          </Link>
                          {serie.amazonUrl && (
                            <Button 
                              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all transform hover:scale-105"
                              asChild
                              data-testid={`button-amazon-${serie.id}`}
                            >
                              <a href={serie.amazonUrl} target="_blank" rel="noopener noreferrer">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Ver en Amazon
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {publishedBooks.slice(0, 4).map((book: Book) => (
                          <img 
                            key={book.id}
                            src={book.coverImage || "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450"} 
                            alt={`Portada del libro ${book.title}`}
                            className="w-full h-64 object-cover rounded-lg shadow-lg" 
                            data-testid={`series-book-cover-${book.id}`}
                          />
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Standalone Books Section */}
      {publishedStandaloneBooks.length > 0 && (
        <section id="books" className="py-20 bg-muted/30" data-testid="section-standalone">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">Libros Independientes</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Historias completas y autoconclusivas de {author.name}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedStandaloneBooks.map((book) => (
                <Card key={book.id} className="book-card bg-card rounded-xl shadow-lg border border-border overflow-hidden" data-testid={`standalone-book-${book.id}`}>
                  <img 
                    src={book.coverImage || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"} 
                    alt={`Portada del libro ${book.title}`}
                    className="w-full h-80 object-cover" 
                  />
                  <div className="p-6">
                    <h3 className="text-2xl font-serif font-bold text-primary mb-3">
                      {book.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {book.description || "Una historia emocionante que no querrás dejar de leer."}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <Badge className="bg-accent/20 text-accent-foreground">{book.genre}</Badge>
                      {book.price && (
                        <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">
                          €{book.price.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/libro/${book.id}`}>
                        <Button 
                          variant="outline"
                          className="w-full transition-all transform hover:scale-105"
                          data-testid={`button-view-book-${book.id}`}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Ver detalles
                        </Button>
                      </Link>
                      {book.amazonUrl && (
                        <Button 
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          asChild
                          data-testid={`button-buy-${book.id}`}
                        >
                          <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Comprar
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section id="testimonios" className="py-20" data-testid="section-testimonials">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">
                Lo que Dicen los Lectores
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Descubre qué dicen sobre los libros de {author.name}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.slice(0, 6).map((testimonial) => (
                <Card key={testimonial.id} className="testimonial-card bg-card p-6 shadow-lg border border-border" data-testid={`testimonial-${testimonial.id}`}>
                  <div className="flex items-center mb-4">
                    <div className="flex text-accent mr-2">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{testimonial.rating}.0</span>
                  </div>
                  <p className="text-muted-foreground mb-4 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.authorPhoto || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                      alt={`Foto de perfil de ${testimonial.authorName}`}
                      className="w-12 h-12 rounded-full mr-3 object-cover" 
                    />
                    <div>
                      <div className="font-semibold">{testimonial.authorName}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.authorType}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section id="newsletter">
        <Newsletter authorId={author.id} />
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-serif font-bold text-primary mb-4">
                {author.name}
              </div>
              <p className="text-muted-foreground mb-4">
                {author.heroSubtitle}
              </p>
              <div className="flex space-x-4">
                {author.instagramUrl && (
                  <a href={author.instagramUrl} className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-instagram" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-instagram text-xl"></i>
                  </a>
                )}
                {author.twitterUrl && (
                  <a href={author.twitterUrl} className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-twitter" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-twitter text-xl"></i>
                  </a>
                )}
                {author.facebookUrl && (
                  <a href={author.facebookUrl} className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-facebook" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-facebook text-xl"></i>
                  </a>
                )}
                {author.amazonUrl && (
                  <a href={author.amazonUrl} className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-amazon" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-amazon text-xl"></i>
                  </a>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-4">Enlaces Rápidos</h3>
              <ul className="space-y-2">
                <li><a href="#biografia" className="text-muted-foreground hover:text-primary transition-colors">Biografía</a></li>
                {activeSeries.length > 0 && <li><a href="#series" className="text-muted-foreground hover:text-primary transition-colors">Series</a></li>}
                {publishedStandaloneBooks.length > 0 && <li><a href="#books" className="text-muted-foreground hover:text-primary transition-colors">Libros</a></li>}
                {testimonials.length > 0 && <li><a href="#testimonios" className="text-muted-foreground hover:text-primary transition-colors">Reseñas</a></li>}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-4">Contacto</h3>
              <ul className="space-y-2 text-muted-foreground">
                {author.email && <li><i className="fas fa-envelope mr-2"></i>{author.email}</li>}
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 {author.name}. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
      </div>
    </DynamicTheme>
  );
}
