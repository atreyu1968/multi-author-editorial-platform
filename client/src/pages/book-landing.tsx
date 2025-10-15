import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Star, ExternalLink, Calendar, BookOpen, Award, Quote, MapPin, Users, Newspaper, Image as ImageIcon, Music, Video } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Newsletter from "@/components/newsletter";
import { SEOHead, generateStructuredData } from "@/components/seo/seo-head";
import type { Book } from "@shared/schema";

// Helper functions for embedding
function getYouTubeEmbedUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let videoId = '';
    
    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
}

function getSpotifyEmbedUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('spotify.com')) {
      return url.replace('/playlist/', '/embed/playlist/').replace('/track/', '/embed/track/').replace('/album/', '/embed/album/');
    }
    return url;
  } catch {
    return url;
  }
}

export default function BookLanding() {
  const [match, params] = useRoute("/libro/:id");
  const bookId = params?.id;

  const { data: book, isLoading, error} = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !!bookId,
  });

  const { data: series } = useQuery<any>({
    queryKey: ["/api/series", book?.seriesId],
    enabled: !!book?.seriesId,
  });

  if (isLoading) {
    return (
      <div className="bg-background text-foreground font-sans">
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="bg-background text-foreground font-sans">
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Libro no encontrado</h1>
            <p className="text-muted-foreground mb-8">
              El libro que buscas no existe o ha sido eliminado.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPartOfSeries = book.seriesId && series;
  const heroImage = book.landingHeroImage || book.coverImage;
  const tagline = book.landingTagline || book.description;
  const synopsis = book.landingSynopsis || book.description;

  return (
    <div className="bg-background text-foreground font-sans">
      <SEOHead
        title={book.seoTitle || `${book.title}${book.genre ? ` - Novela ${book.genre}` : ''}`}
        description={book.seoDescription || synopsis || `Descubre "${book.title}", una fascinante novela${book.genre ? ` de ${book.genre.toLowerCase()}` : ''} que te mantendrá enganchado desde la primera página.`}
        keywords={book.seoKeywords ? book.seoKeywords.split(',').map(k => k.trim()) : [book.title, book.genre || '', "novela", "libro"].filter(Boolean)}
        ogType="book"
        ogImage={heroImage || undefined}
        ogImageAlt={`Portada de ${book.title}`}
        structuredData={generateStructuredData.book(book)}
      />
      
      <Navigation />
      
      <main className="min-h-screen">
        {/* Hero Section with Parallax Effect */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-background">
          {heroImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Book Cover */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl group-hover:blur-4xl transition-all duration-300 rounded-lg" />
                  <img
                    src={book.coverImage || heroImage || ""}
                    alt={`Portada de ${book.title}`}
                    className="relative w-80 h-auto rounded-lg shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
                    data-testid="book-cover"
                  />
                  {book.landingAwards && book.landingAwards.length > 0 && (
                    <div className="absolute -top-4 -right-4 bg-amber-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-bounce">
                      <Award className="h-5 w-5" />
                      <span className="font-semibold">Premio</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Info */}
              <div className="text-center lg:text-left">
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-4">
                    <Badge variant="secondary" className="text-base px-4 py-1" data-testid="book-genre">
                      {book.genre}
                    </Badge>
                    {isPartOfSeries && (
                      <Badge variant="outline" className="text-base px-4 py-1" data-testid="book-series">
                        {series.title} - Libro {book.orderInSeries}
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-5xl lg:text-6xl font-serif font-bold mb-6 text-primary" data-testid="book-title">
                    {book.title}
                  </h1>
                  
                  {tagline && (
                    <p className="text-2xl text-muted-foreground mb-8 font-light leading-relaxed">
                      {tagline}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  {book.amazonUrl && (
                    <Button asChild size="lg" className="text-lg px-8 py-6" data-testid="button-amazon">
                      <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-5 w-5" />
                        {book.landingCTA || "Comprar en Amazon"}
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" asChild size="lg" className="text-lg px-8 py-6" data-testid="button-preview">
                    <a href="#synopsis">
                      Ver más detalles
                    </a>
                  </Button>
                </div>

                {book.price && (
                  <div className="text-4xl font-bold text-primary mb-4">
                    ${book.price.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Synopsis Section */}
        <section id="synopsis" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-serif font-bold mb-8 text-center text-primary">
                Sinopsis
              </h2>
              <div className="prose prose-lg max-w-none leading-relaxed text-center">
                {synopsis ? (
                  <p className="text-xl whitespace-pre-line">{synopsis}</p>
                ) : (
                  <p className="text-xl text-muted-foreground">Sinopsis no disponible</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features/Highlights Section */}
        {book.landingFeatures && book.landingFeatures.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-serif font-bold mb-12 text-center text-primary">
                Lo que encontrarás en este libro
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {book.landingFeatures.map((feature, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-lg leading-relaxed">{feature}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Quotes Section */}
        {book.landingQuotes && book.landingQuotes.length > 0 && (
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-serif font-bold mb-12 text-center text-primary">
                Momentos memorables
              </h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {book.landingQuotes.map((quote, index) => (
                  <Card key={index} className="bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardContent className="p-8">
                      <Quote className="h-8 w-8 text-primary/40 mb-4" />
                      <p className="text-lg italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {book.landingGallery && book.landingGallery.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-serif font-bold mb-12 text-center text-primary">
                Galería
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {book.landingGallery.map((image, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-lg aspect-square">
                    <img
                      src={image}
                      alt={`Imagen ${index + 1} de ${book.title}`}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Awards Section */}
        {book.landingAwards && book.landingAwards.length > 0 && (
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-serif font-bold mb-12 text-center text-primary">
                Premios y Reconocimientos
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {book.landingAwards.map((award, index) => (
                  <Card key={index} className="text-center">
                    <CardContent className="p-6">
                      <Award className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold">{award}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        <Separator className="my-12" />

        {/* Promotional Content */}
        {((book.promoConceptMap && book.promoShowConceptMap) || 
          (book.promoFamilyTree && book.promoShowFamilyTree) || 
          (book.promoYoutubeBooktrailer && book.promoShowYoutubeBooktrailer) || 
          (book.promoSpotifyPlaylist && book.promoShowSpotifyPlaylist) || 
          (book.promoPressNotes && book.promoPressNotes.length > 0 && book.promoShowPressNotes) || 
          (book.promoAdditionalMedia && book.promoAdditionalMedia.length > 0 && book.promoShowAdditionalMedia)) && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <h2 className="text-4xl font-serif font-bold mb-12 text-center text-primary">
              Contenido Adicional
            </h2>
            
            <div className="space-y-8 max-w-6xl mx-auto">
              {/* YouTube Booktrailer - Full width embed */}
              {book.promoYoutubeBooktrailer && book.promoShowYoutubeBooktrailer && (
                <div className="w-full" data-testid="promo-youtube">
                  <h3 className="font-semibold text-2xl mb-4 flex items-center gap-2">
                    <Video className="h-6 w-6 text-primary" />
                    Booktrailer
                  </h3>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                      src={getYouTubeEmbedUrl(book.promoYoutubeBooktrailer)}
                      title="Booktrailer"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Spotify Playlist - Full width embed */}
              {book.promoSpotifyPlaylist && book.promoShowSpotifyPlaylist && (
                <div className="w-full" data-testid="promo-spotify">
                  <h3 className="font-semibold text-2xl mb-4 flex items-center gap-2">
                    <Music className="h-6 w-6 text-primary" />
                    Playlist de Lectura
                  </h3>
                  <iframe
                    className="w-full rounded-lg shadow-lg"
                    src={getSpotifyEmbedUrl(book.promoSpotifyPlaylist)}
                    height="352"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Other promotional content in grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Concept Map */}
                {book.promoConceptMap && book.promoShowConceptMap && (
                  <Card className="hover:shadow-lg transition-shadow" data-testid="promo-concept-map">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Mapa Conceptual</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Explora el mundo y los conceptos de la historia
                          </p>
                          <a 
                            href={book.promoConceptMap} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                          >
                            Ver mapa <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Family Tree */}
                {book.promoFamilyTree && book.promoShowFamilyTree && (
                  <Card className="hover:shadow-lg transition-shadow" data-testid="promo-family-tree">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Árbol Genealógico</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Descubre las relaciones entre los personajes
                          </p>
                          <a 
                            href={book.promoFamilyTree} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                          >
                            Ver árbol <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Press Notes */}
                {book.promoPressNotes && book.promoPressNotes.length > 0 && book.promoShowPressNotes && (
                  <Card className="hover:shadow-lg transition-shadow" data-testid="promo-press-notes">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Newspaper className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Notas de Prensa</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Lee reseñas y artículos sobre este libro
                          </p>
                          <div className="space-y-2">
                            {book.promoPressNotes.slice(0, 3).map((note, index) => (
                              <a 
                                key={index}
                                href={note} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                              >
                                Artículo {index + 1} <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Media */}
                {book.promoAdditionalMedia && book.promoAdditionalMedia.length > 0 && book.promoShowAdditionalMedia && (
                  <Card className="hover:shadow-lg transition-shadow" data-testid="promo-additional-media">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <ImageIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Material Gráfico</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Ilustraciones, mapas y material visual
                          </p>
                          <div className="space-y-2">
                            {book.promoAdditionalMedia.slice(0, 3).map((media, index) => (
                              <a 
                                key={index}
                                href={media} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                              >
                                Recurso {index + 1} <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        )}

        <Separator className="my-12" />

        {/* Series Information */}
        {isPartOfSeries && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-serif font-bold mb-6 text-primary">
                Parte de la serie: {series.title}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {series.description}
              </p>
              <Link href="/#series">
                <Button size="lg" variant="outline" className="text-lg">
                  Explorar toda la serie
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-serif font-bold mb-6">
              ¿Listo para sumergirte en esta historia?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Comienza tu aventura ahora y descubre por qué miles de lectores han quedado cautivados con esta historia.
            </p>
            {book.amazonUrl && (
              <Button asChild size="lg" variant="secondary" className="text-lg px-10 py-6">
                <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Comprar ahora
                </a>
              </Button>
            )}
          </div>
        </section>
      </main>

      <Newsletter />

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-primary mb-4">
              María González
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Autora bestseller especializada en romance, thriller y fantasía. 
              Creando historias que tocan el corazón desde 2012.
            </p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-amazon text-xl"></i>
              </a>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 María González. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
