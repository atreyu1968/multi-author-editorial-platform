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
import { buildBackgroundStyle } from "@/lib/utils";
import type { Author, BookSeries, Book, Testimonial } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useUiText } from "@/contexts/ui-text-context";
import { useLocale } from "@/contexts/locale-context";
import { getAllLocalizedUrls } from "@/lib/localized-routes";

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useLocale();
  
  const { data: author, isLoading: authorLoading, error: authorError } = useQuery<Author>({
    queryKey: [`/api/authors/by-slug/${slug}`],
    enabled: !!slug,
  });

  // Get all series (they can have books from multiple authors now)
  const { data: allSeries = [], isLoading: seriesLoading } = useQuery<BookSeries[]>({
    queryKey: ["/api/book-series"],
  });

  const { data: standaloneBooks = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/books/standalone", { authorId: author?.id }],
    enabled: !!author?.id,
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials/published", { authorId: author?.id }],
    enabled: !!author?.id,
  });

  // Fetch books for each series and filter to show only series that have books from this author
  const seriesWithBooks = useQuery({
    queryKey: ["/api/books/series/all", { series: allSeries.map(s => s.id), authorId: author?.id }],
    queryFn: async () => {
      const results = await Promise.all(
        allSeries.map(async (s) => {
          const response = await fetch(`/api/books/series/${s.id}`);
          if (!response.ok) return { series: s, books: [] };
          const books: Book[] = await response.json();
          // Filter to show only books from this author
          const authorBooks = books.filter(book => book.authorId === author?.id);
          return { series: s, books: authorBooks };
        })
      );
      // Only return series that have at least one book from this author
      return results.filter(result => result.books.length > 0);
    },
    enabled: allSeries.length > 0 && !!author?.id,
  });

  // Load all UI texts
  const t = {
    loading: useUiText("author_page", "loading", "Cargando..."),
    errorNotFoundTitle: useUiText("author_page", "error_not_found_title", "Autor no encontrado"),
    errorNotFoundDesc: useUiText("author_page", "error_not_found_desc", "El autor que buscas no existe o ha sido eliminado."),
    buttonBackHome: useUiText("author_page", "button_back_home", "Volver al inicio"),
    seoSuffixAutor: useUiText("author_page", "seo_suffix_autor", "Autor"),
    seoKeywordAutor: useUiText("author_page", "seo_keyword_autor", "autor"),
    seoKeywordEscritor: useUiText("author_page", "seo_keyword_escritor", "escritor"),
    seoKeywordLibros: useUiText("author_page", "seo_keyword_libros", "libros"),
    buttonDownload: useUiText("author_page", "button_download", "Descarga Gratuita"),
    buttonBooks: useUiText("author_page", "button_books", "Ver Libros"),
    bioTitlePrefix: useUiText("author_page", "bio_title_prefix", "Sobre"),
    socialInstagram: useUiText("author_page", "social_instagram", "Instagram"),
    socialTwitter: useUiText("author_page", "social_twitter", "Twitter"),
    socialFacebook: useUiText("author_page", "social_facebook", "Facebook"),
    seriesTitle: useUiText("author_page", "series_title", "Series de Libros"),
    seriesDescPrefix: useUiText("author_page", "series_desc_prefix", "Explora las emocionantes series de"),
    seriesLibroSingular: useUiText("author_page", "series_libro_singular", "libro"),
    seriesLibroPlural: useUiText("author_page", "series_libro_plural", "libros"),
    buttonViewSeries: useUiText("author_page", "button_view_series", "Ver serie completa"),
    buttonAmazon: useUiText("author_page", "button_amazon", "Ver en Amazon"),
    standaloneTitle: useUiText("author_page", "standalone_title", "Libros Independientes"),
    standaloneDescPrefix: useUiText("author_page", "standalone_desc_prefix", "Historias completas y autoconclusivas de"),
    bookDefaultDesc: useUiText("author_page", "book_default_desc", "Una historia emocionante que no querrás dejar de leer."),
    buttonViewDetails: useUiText("author_page", "button_view_details", "Ver detalles"),
    buttonBuy: useUiText("author_page", "button_buy", "Comprar"),
    testimonialsTitle: useUiText("author_page", "testimonials_title", "Lo que Dicen los Lectores"),
    testimonialsDescPrefix: useUiText("author_page", "testimonials_desc_prefix", "Descubre qué dicen sobre los libros de"),
    footerQuickLinks: useUiText("author_page", "footer_quick_links", "Enlaces Rápidos"),
    footerBio: useUiText("author_page", "footer_bio", "Biografía"),
    footerSeries: useUiText("author_page", "footer_series", "Series"),
    footerBooks: useUiText("author_page", "footer_books", "Libros"),
    footerReviews: useUiText("author_page", "footer_reviews", "Reseñas"),
    footerContact: useUiText("author_page", "footer_contact", "Contacto"),
    footerRights: useUiText("author_page", "footer_rights", "Todos los derechos reservados."),
    altPhotoPrefix: useUiText("author_page", "alt_photo_prefix", "Foto de"),
    altPortraitPrefix: useUiText("author_page", "alt_portrait_prefix", "Retrato profesional de"),
    altBookCoverPrefix: useUiText("author_page", "alt_book_cover_prefix", "Portada del libro"),
    altProfilePhotoPrefix: useUiText("author_page", "alt_profile_photo_prefix", "Foto de perfil de"),
  };

  if (authorLoading) {
    return (
      <div className="bg-background text-foreground font-sans min-h-screen flex items-center justify-center">
        <div className="text-xl text-muted-foreground">{t.loading}</div>
      </div>
    );
  }

  if (authorError || !author) {
    return (
      <div className="bg-background text-foreground font-sans min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-serif font-bold text-primary mb-4">{t.errorNotFoundTitle}</h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t.errorNotFoundDesc}
          </p>
          <Link href="/">
            <Button data-testid="button-home">
              {t.buttonBackHome}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeSeries = (seriesWithBooks.data || []).filter((s: { series: BookSeries; books: Book[] }) => s.series.isActive !== false);
  const publishedStandaloneBooks = standaloneBooks.filter(b => b.isPublished);

  // Generate hreflang alternates for all languages
  const alternates = slug ? getAllLocalizedUrls('author', { slug }) : [];

  return (
    <DynamicTheme authorId={author.id}>
      <div className="bg-background text-foreground font-sans" style={buildBackgroundStyle({ imageUrl: author?.backgroundImageUrl, color: author?.backgroundColor })}>
        <SEOHead
          title={author.seoTitle || `${author.name} - ${t.seoSuffixAutor}`}
          description={author.seoDescription || author.bioParagraph1.substring(0, 160)}
          keywords={author.seoKeywords ? author.seoKeywords.split(',').map(k => k.trim()) : [t.seoKeywordAutor, t.seoKeywordEscritor, t.seoKeywordLibros, author.name]}
          alternates={alternates}
          ogType="website"
          ogLocale={locale.replace('-', '_')}
          ogImage={author.photo || undefined}
          structuredData={generateStructuredData.author({
            name: author.name,
            url: `/autor/${author.slug}`,
            image: author.photo || undefined,
          })}
        />
        <Navigation authorId={author.id} />

      {/* Hero Section */}
      <section id="inicio" className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            {author.photo && (
              <img 
                src={author.photo} 
                alt={`${t.altPhotoPrefix} ${author.name}`}
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
                {t.buttonDownload}
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 text-lg font-semibold hover:bg-white/30 transition-all"
                data-testid="button-books"
                onClick={() => document.getElementById('books')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                {t.buttonBooks}
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
                  {t.bioTitlePrefix} {author.name}
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
                        <i className="fab fa-instagram mr-2"></i>{t.socialInstagram}
                      </a>
                    </Button>
                  )}
                  {author.twitterUrl && (
                    <Button asChild variant="secondary" className="hover:bg-secondary/80" data-testid="button-twitter">
                      <a href={author.twitterUrl} target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-twitter mr-2"></i>{t.socialTwitter}
                      </a>
                    </Button>
                  )}
                  {author.facebookUrl && (
                    <Button asChild variant="secondary" className="hover:bg-secondary/80" data-testid="button-facebook">
                      <a href={author.facebookUrl} target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-facebook mr-2"></i>{t.socialFacebook}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <img 
                    src={author.photo || "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"} 
                    alt={`${t.altPortraitPrefix} ${author.name}`}
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
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">{t.seriesTitle}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.seriesDescPrefix} {author.name}
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
                            {publishedBooks.length} {publishedBooks.length === 1 ? t.seriesLibroSingular : t.seriesLibroPlural}
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
                              {t.buttonViewSeries}
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
                                {t.buttonAmazon}
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {publishedBooks.slice(0, 4).map((book: Book) => (
                          <div key={book.id} className="relative aspect-[2/3] rounded-lg shadow-lg overflow-hidden">
                            <img 
                              src={book.coverImage || "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450"} 
                              alt={`${t.altBookCoverPrefix} ${book.title}`}
                              className="w-full h-full object-cover" 
                              data-testid={`series-book-cover-${book.id}`}
                            />
                          </div>
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
        <section id="standalone" className="py-20 bg-muted/30" data-testid="section-standalone">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">{t.standaloneTitle}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.standaloneDescPrefix} {author.name}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedStandaloneBooks.map((book) => (
                <Card key={book.id} className="book-card bg-card rounded-xl shadow-lg border border-border overflow-hidden" data-testid={`standalone-book-${book.id}`}>
                  <div className="relative aspect-[2/3] bg-gradient-to-br from-primary/20 to-accent/20">
                    <img 
                      src={book.coverImage || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"} 
                      alt={`${t.altBookCoverPrefix} ${book.title}`}
                        className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-serif font-bold text-primary mb-3">
                      {book.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {book.description || t.bookDefaultDesc}
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
                          {t.buttonViewDetails}
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
                            {t.buttonBuy}
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
                {t.testimonialsTitle}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.testimonialsDescPrefix} {author.name}
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
                      alt={`${t.altProfilePhotoPrefix} ${testimonial.authorName}`}
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
              <h3 className="font-semibold text-primary mb-4">{t.footerQuickLinks}</h3>
              <ul className="space-y-2">
                <li><a href="#biografia" className="text-muted-foreground hover:text-primary transition-colors">{t.footerBio}</a></li>
                {activeSeries.length > 0 && <li><a href="#series" className="text-muted-foreground hover:text-primary transition-colors">{t.footerSeries}</a></li>}
                {publishedStandaloneBooks.length > 0 && <li><a href="#books" className="text-muted-foreground hover:text-primary transition-colors">{t.footerBooks}</a></li>}
                {testimonials.length > 0 && <li><a href="#testimonios" className="text-muted-foreground hover:text-primary transition-colors">{t.footerReviews}</a></li>}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-4">{t.footerContact}</h3>
              <ul className="space-y-2 text-muted-foreground">
                {author.email && <li><i className="fas fa-envelope mr-2"></i>{author.email}</li>}
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 {author.name}. {t.footerRights}</p>
          </div>
        </div>
      </footer>
      </div>
    </DynamicTheme>
  );
}
