import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, BookOpen, Users, Sparkles, MapPin, Newspaper, Image as ImageIcon, Music, Video } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Newsletter from "@/components/newsletter";
import { SEOHead, generateStructuredData } from "@/components/seo/seo-head";
import { buildBackgroundStyle } from "@/lib/utils";
import type { BookSeries, Book } from "@shared/schema";

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

export default function SeriesLanding() {
  const [match, params] = useRoute("/serie/:id");
  const seriesId = params?.id;

  const { data: series, isLoading: seriesLoading, error: seriesError } = useQuery<BookSeries>({
    queryKey: ["/api/book-series", seriesId],
    enabled: !!seriesId,
  });

  const { data: books = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/books/series", seriesId],
    enabled: !!seriesId,
  });

  const isLoading = seriesLoading || booksLoading;

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

  if (seriesError || !series) {
    return (
      <div className="bg-background text-foreground font-sans">
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Serie no encontrada</h1>
            <p className="text-muted-foreground mb-8">
              La serie que buscas no existe o ha sido eliminada.
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

  const heroImage = series.landingHeroImage || books[0]?.coverImage;
  const tagline = series.landingTagline || series.description;
  const sortedBooks = [...books].sort((a, b) => (a.orderInSeries || 0) - (b.orderInSeries || 0));

  return (
    <div className="bg-background text-foreground font-sans" style={buildBackgroundStyle({ imageUrl: series?.backgroundImageUrl, color: series?.backgroundColor })}>
      <SEOHead
        title={`${series.title} - Serie de ${series.genre}`}
        description={series.description}
        keywords={[series.title, series.genre, "serie de libros", "María González"]}
        ogType="website"
        ogImage={heroImage || undefined}
        ogImageAlt={`Banner de ${series.title}`}
        structuredData={generateStructuredData.bookSeries(series, sortedBooks)}
      />
      
      <Navigation />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-background">
          {heroImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <Badge variant="secondary" className="text-lg px-6 py-2 mb-6">
              {series.genre}
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-serif font-bold mb-6 text-primary" data-testid="series-title">
              {series.title}
            </h1>
            
            {tagline && (
              <p className="text-2xl lg:text-3xl text-muted-foreground mb-8 max-w-4xl mx-auto font-light leading-relaxed">
                {tagline}
              </p>
            )}

            <div className="flex items-center justify-center gap-8 text-xl text-muted-foreground mb-12">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                <span>{sortedBooks.length} {sortedBooks.length === 1 ? 'libro' : 'libros'}</span>
              </div>
              <span className="text-3xl">•</span>
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                <span>Serie completa</span>
              </div>
            </div>

            {series.amazonUrl && (
              <Button asChild size="lg" className="text-lg px-10 py-6">
                <a href={series.amazonUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Ver serie en Amazon
                </a>
              </Button>
            )}
          </div>
        </section>

        {/* Description Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-serif font-bold mb-8 text-primary">
                Sobre la serie
              </h2>
              <p className="text-xl leading-relaxed text-muted-foreground">
                {series.description}
              </p>
            </div>
          </div>
        </section>

        {/* World Description Section */}
        {series.landingWorldDescription && (
          <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl font-serif font-bold mb-8 text-center text-primary">
                  El mundo de {series.title}
                </h2>
                <div className="prose prose-lg max-w-none leading-relaxed">
                  <p className="text-xl text-center">{series.landingWorldDescription}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Characters Section */}
        {series.landingCharacters && (
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-8">
                  <Users className="h-8 w-8 text-primary" />
                  <h2 className="text-4xl font-serif font-bold text-primary">
                    Personajes principales
                  </h2>
                </div>
                <div className="bg-card p-8 rounded-lg shadow-lg">
                  <p className="text-lg leading-relaxed">{series.landingCharacters}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Themes Section */}
        {series.landingThemes && series.landingThemes.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-serif font-bold mb-12 text-center text-primary">
                Temas principales
              </h2>
              <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                {series.landingThemes.map((theme, index) => (
                  <Badge key={index} variant="outline" className="text-lg px-6 py-3">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}

        <Separator className="my-12" />

        {/* Books in Series Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-serif font-bold mb-4 text-center text-primary">
              Libros de la serie
            </h2>
            {series.landingReadingOrder && (
              <p className="text-xl text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
                {series.landingReadingOrder}
              </p>
            )}
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {sortedBooks.map((book, index) => (
                <Card key={book.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                  <div className="relative">
                    {book.coverImage && (
                      <img
                        src={book.coverImage}
                        alt={`Portada de ${book.title}`}
                        className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="text-lg px-4 py-2">
                        Libro {book.orderInSeries || index + 1}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif">{book.title}</CardTitle>
                    {book.description && (
                      <CardDescription className="line-clamp-3 text-base">
                        {book.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardFooter className="flex gap-2">
                    <Link href={`/libro/${book.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Ver detalles
                      </Button>
                    </Link>
                    {book.amazonUrl && (
                      <Button asChild className="flex-1">
                        <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Comprar
                        </a>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Promotional Content */}
        {((series.promoConceptMap && series.promoShowConceptMap) || 
          (series.promoFamilyTree && series.promoShowFamilyTree) || 
          (series.promoYoutubeBooktrailer && series.promoShowYoutubeBooktrailer) || 
          (series.promoSpotifyPlaylist && series.promoShowSpotifyPlaylist) || 
          (series.promoPressNotes && series.promoPressNotes.length > 0 && series.promoShowPressNotes) || 
          (series.promoAdditionalMedia && series.promoAdditionalMedia.length > 0 && series.promoShowAdditionalMedia)) && (
          <>
            <Separator className="my-12" />
            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <h2 className="text-4xl font-serif font-bold mb-12 text-center text-primary">
                Contenido Adicional
              </h2>
              
              <div className="space-y-8 max-w-6xl mx-auto">
                {/* YouTube Booktrailer Embed */}
                {series.promoYoutubeBooktrailer && series.promoShowYoutubeBooktrailer && (
                  <div className="w-full" data-testid="promo-youtube-series">
                    <h3 className="text-2xl font-semibold mb-4 text-center">Booktrailer</h3>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                        src={getYouTubeEmbedUrl(series.promoYoutubeBooktrailer)}
                        title="YouTube Booktrailer"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Spotify Playlist Embed */}
                {series.promoSpotifyPlaylist && series.promoShowSpotifyPlaylist && (
                  <div className="w-full" data-testid="promo-spotify-series">
                    <h3 className="text-2xl font-semibold mb-4 text-center">Playlist de Lectura</h3>
                    <iframe
                      className="w-full rounded-lg shadow-lg"
                      src={getSpotifyEmbedUrl(series.promoSpotifyPlaylist)}
                      height="352"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Grid for other promotional content */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Concept Map */}
                  {series.promoConceptMap && series.promoShowConceptMap && (
                    <Card className="hover:shadow-lg transition-shadow" data-testid="promo-concept-map-series">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <MapPin className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">Mapa Conceptual</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              Explora el mundo y los conceptos de la serie
                            </p>
                            <a 
                              href={series.promoConceptMap} 
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
                  {series.promoFamilyTree && series.promoShowFamilyTree && (
                    <Card className="hover:shadow-lg transition-shadow" data-testid="promo-family-tree-series">
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
                              href={series.promoFamilyTree} 
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
                  {series.promoPressNotes && series.promoPressNotes.length > 0 && series.promoShowPressNotes && (
                    <Card className="hover:shadow-lg transition-shadow" data-testid="promo-press-notes-series">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Newspaper className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">Notas de Prensa</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              Lee reseñas y artículos sobre la serie
                            </p>
                            <div className="space-y-2">
                              {series.promoPressNotes.slice(0, 3).map((note, index) => (
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
                  {series.promoAdditionalMedia && series.promoAdditionalMedia.length > 0 && series.promoShowAdditionalMedia && (
                    <Card className="hover:shadow-lg transition-shadow" data-testid="promo-additional-media-series">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <ImageIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">Material Gráfico</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              Ilustraciones, mapas y material visual de la serie
                            </p>
                            <div className="space-y-2">
                              {series.promoAdditionalMedia.slice(0, 3).map((media, index) => (
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
            <Separator className="my-12" />
          </>
        )}

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-serif font-bold mb-6">
              ¿Listo para comenzar la aventura?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Sumérgete en el mundo de {series.title} y descubre por qué esta serie ha cautivado a miles de lectores.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {sortedBooks[0] && (
                <Link href={`/libro/${sortedBooks[0].id}`}>
                  <Button size="lg" variant="secondary" className="text-lg px-10 py-6">
                    Comenzar con el Libro 1
                  </Button>
                </Link>
              )}
              {series.amazonUrl && (
                <Button asChild size="lg" variant="outline" className="text-lg px-10 py-6 bg-white/10 hover:bg-white/20">
                  <a href={series.amazonUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Ver serie completa
                  </a>
                </Button>
              )}
            </div>
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
