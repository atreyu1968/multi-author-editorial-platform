import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Star, ExternalLink, Calendar, BookOpen, Award, Quote, MapPin, Users, Newspaper, Image as ImageIcon, Music, Video, ShoppingCart, Package, FileText } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Newsletter from "@/components/newsletter";
import { SEOHead, generateStructuredData } from "@/components/seo/seo-head";
import { buildBackgroundStyle } from "@/lib/utils";
import { formatPriceWithConversionSync } from "@shared/currency-service";
import type { Book, EditorialSettings, Author } from "@shared/schema";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useUiText } from "@/contexts/ui-text-context";
import { useLocale } from "@/contexts/locale-context";
import { getAllLocalizedUrls } from "@/lib/localized-routes";
import { SiInstagram, SiX, SiFacebook, SiAmazon } from "react-icons/si";
import { getTranslatedField } from "@shared/utils";

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
  // Match all localized book routes
  const [matchLibro, paramsLibro] = useRoute("/:locale/libro/:id"); // es-ES, it-IT
  const [matchBook, paramsBook] = useRoute("/:locale/book/:id"); // en-US
  const [matchLlibre, paramsLlibre] = useRoute("/:locale/llibre/:id"); // ca-ES
  const [matchLivre, paramsLivre] = useRoute("/:locale/livre/:id"); // fr-FR
  const [matchBuch, paramsBuch] = useRoute("/:locale/buch/:id"); // de-DE
  const [matchLivro, paramsLivro] = useRoute("/:locale/livro/:id"); // pt-PT
  
  const bookId = paramsLibro?.id || paramsBook?.id || paramsLlibre?.id || 
                 paramsLivre?.id || paramsBuch?.id || paramsLivro?.id;
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { locale, currency, exchangeRates } = useLocale();
  
  // Load all UI texts
  const t = {
    premio: useUiText("book_landing", "premio", "Premio"),
    productoDigital: useUiText("book_landing", "producto_digital", "Producto Digital"),
    fisico: useUiText("book_landing", "fisico", "Físico"),
    digital: useUiText("book_landing", "digital", "Digital"),
    formatosDigitales: useUiText("book_landing", "formatos_digitales", "Formatos Digitales:"),
    formatoDigital: useUiText("book_landing", "formato_digital", "Formato Digital"),
    anadiendo: useUiText("book_landing", "anadiendo", "Añadiendo..."),
    comprarAhora: useUiText("book_landing", "comprar_ahora", "Comprar ahora"),
    agotado: useUiText("book_landing", "agotado", "Agotado"),
    comprarAmazon: useUiText("book_landing", "comprar_amazon", "Comprar en Amazon"),
    verMasDetalles: useUiText("book_landing", "ver_mas_detalles", "Ver más detalles"),
    sinopsis: useUiText("book_landing", "sinopsis", "Sinopsis"),
    sinopsisNoDisponible: useUiText("book_landing", "sinopsis_no_disponible", "Sinopsis no disponible"),
    loQueEncontraras: useUiText("book_landing", "lo_que_encontraras", "Lo que encontrarás en este libro"),
    momentosMemo: useUiText("book_landing", "momentos_memorables", "Momentos memorables"),
    galeria: useUiText("book_landing", "galeria", "Galería"),
    premiosRecon: useUiText("book_landing", "premios_reconocimientos", "Premios y Reconocimientos"),
    contenidoAd: useUiText("book_landing", "contenido_adicional", "Contenido Adicional"),
    booktrailer: useUiText("book_landing", "booktrailer", "Booktrailer"),
    playlistLec: useUiText("book_landing", "playlist_lectura", "Playlist de Lectura"),
    mapaConcep: useUiText("book_landing", "mapa_conceptual", "Mapa Conceptual"),
    mapaConceptDesc: useUiText("book_landing", "mapa_conceptual_desc", "Explora el mundo y los conceptos de la historia"),
    verMapa: useUiText("book_landing", "ver_mapa", "Ver mapa"),
    arbolGen: useUiText("book_landing", "arbol_genealogico", "Árbol Genealógico"),
    arbolGenDesc: useUiText("book_landing", "arbol_genealogico_desc", "Descubre las relaciones entre los personajes"),
    verArbol: useUiText("book_landing", "ver_arbol", "Ver árbol"),
    notasPrensa: useUiText("book_landing", "notas_prensa", "Notas de Prensa"),
    notasPrenseDesc: useUiText("book_landing", "notas_prensa_desc", "Lee reseñas y artículos sobre este libro"),
    articulo: useUiText("book_landing", "articulo", "Artículo"),
    materialGraf: useUiText("book_landing", "material_grafico", "Material Gráfico"),
    materialGrafDesc: useUiText("book_landing", "material_grafico_desc", "Ilustraciones, mapas y material visual"),
    recurso: useUiText("book_landing", "recurso", "Recurso"),
    parteSerie: useUiText("book_landing", "parte_serie", "Parte de la serie:"),
    explorarSerie: useUiText("book_landing", "explorar_serie", "Explorar toda la serie"),
    listoSum: useUiText("book_landing", "listo_sumergirte", "¿Listo para sumergirte en esta historia?"),
    comienzaAv: useUiText("book_landing", "comienza_aventura", "Comienza tu aventura ahora y descubre por qué miles de lectores han quedado cautivados con esta historia."),
    libroNoEnc: useUiText("book_landing", "libro_no_encontrado", "Libro no encontrado"),
    libroNoExiste: useUiText("book_landing", "libro_no_existe", "El libro que buscas no existe o ha sido eliminado."),
    volverInicio: useUiText("book_landing", "volver_inicio", "Volver al inicio"),
    anadidoCarrito: useUiText("book_landing", "anadido_carrito", "¡Añadido al carrito!"),
    anadidoCarritoDesc: useUiText("book_landing", "anadido_carrito_desc", "ha sido añadido a tu carrito."),
    error: useUiText("book_landing", "error", "Error"),
    errorCarrito: useUiText("book_landing", "error_carrito", "No se pudo añadir el libro al carrito. Intenta de nuevo."),
    libro: useUiText("book_landing", "libro", "Libro"),
    embedBooktrailer: useUiText("book_landing", "embed_booktrailer", "Booktrailer"),
    seoTitleNovela: useUiText("book_landing", "seo_title_novela", "Novela"),
    seoDescPrefix: useUiText("book_landing", "seo_desc_prefix", "Descubre"),
    seoDescFascinante: useUiText("book_landing", "seo_desc_fascinante_novela", "una fascinante novela"),
    seoDescDeGenero: useUiText("book_landing", "seo_desc_de_genero", "de"),
    seoDescSuffix: useUiText("book_landing", "seo_desc_suffix", "que te mantendrá enganchado desde la primera página."),
    seoImageAltPortada: useUiText("book_landing", "seo_image_alt_portada", "Portada de"),
    galleryImageAltImagen: useUiText("book_landing", "gallery_image_alt_imagen", "Imagen"),
    galleryImageAltDe: useUiText("book_landing", "gallery_image_alt_de", "de"),
  };

  const { data: book, isLoading, error} = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !!bookId,
  });

  const { data: series } = useQuery<any>({
    queryKey: [`/api/series/${book?.seriesId}`],
    enabled: !!book?.seriesId,
  });

  const { data: settings } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings"],
  });

  const { data: author } = useQuery<Author>({
    queryKey: [`/api/authors/${book?.authorId}`],
    enabled: !!book?.authorId,
  });

  const { data: bookTranslations = [] } = useQuery<any[]>({
    queryKey: [`/api/books/${bookId}/translations`],
    enabled: !!bookId,
  });

  // Scroll to top when component mounts or bookId changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [bookId]);

  const handleAddToCart = async () => {
    if (!bookId) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart("book", bookId, 1);
      toast({
        title: t.anadidoCarrito,
        description: `"${book?.title}" ${t.anadidoCarritoDesc}`,
      });
    } catch (error) {
      toast({
        title: t.error,
        description: t.errorCarrito,
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

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
            <h1 className="text-4xl font-bold mb-4">{t.libroNoEnc}</h1>
            <p className="text-muted-foreground mb-8">
              {t.libroNoExiste}
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.volverInicio}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userLocale = navigator.language || 'es-ES';
  
  const translatedTitle = getTranslatedField(bookTranslations, 'title', userLocale, book?.title || '');
  const translatedDescription = getTranslatedField(bookTranslations, 'description', userLocale, book?.description || '');
  const translatedSeoTitle = getTranslatedField(bookTranslations, 'seoTitle', userLocale, book?.seoTitle || '');
  const translatedSeoDescription = getTranslatedField(bookTranslations, 'seoDescription', userLocale, book?.seoDescription || '');
  
  const isPartOfSeries = book.seriesId && series;
  const heroImage = book.landingHeroImage || book.coverImage;
  const tagline = book.landingTagline || translatedDescription;
  const synopsis = book.landingSynopsis || translatedDescription;

  // Generate hreflang alternates for all languages
  const alternates = bookId ? getAllLocalizedUrls('book', { id: bookId }) : [];

  return (
    <div className="bg-background text-foreground font-sans" style={buildBackgroundStyle({ imageUrl: book?.backgroundImageUrl, color: book?.backgroundColor })}>
      <SEOHead
        title={translatedSeoTitle || `${translatedTitle}${book.genre ? ` - ${t.seoTitleNovela} ${book.genre}` : ''}`}
        description={translatedSeoDescription || synopsis || `${t.seoDescPrefix} "${translatedTitle}", ${t.seoDescFascinante}${book.genre ? ` ${t.seoDescDeGenero} ${book.genre.toLowerCase()}` : ''} ${t.seoDescSuffix}`}
        keywords={book.seoKeywords ? book.seoKeywords.split(',').map(k => k.trim()) : [translatedTitle, book.genre || '', t.seoTitleNovela.toLowerCase(), t.libro.toLowerCase()].filter(Boolean)}
        alternates={alternates}
        ogType="book"
        ogLocale={locale.replace('-', '_')}
        ogImage={heroImage || undefined}
        ogImageAlt={`${t.seoImageAltPortada} ${translatedTitle}`}
        structuredData={generateStructuredData.book(book)}
      />
      
      <Navigation authorId={book.authorId} />
      
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
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12">
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-16 items-center">
              {/* Book Cover */}
              <div className="lg:col-span-2 flex justify-center order-1">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl group-hover:blur-4xl transition-all duration-300 rounded-lg" />
                  <img
                    src={book.coverImage || heroImage || ""}
                    alt={`${t.seoImageAltPortada} ${book.title}`}
                    className="relative w-64 md:w-80 lg:w-full max-w-sm h-auto rounded-lg shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
                    data-testid="book-cover"
                  />
                  {book.landingAwards && book.landingAwards.length > 0 && (
                    <div className="absolute -top-4 -right-4 bg-amber-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-bounce">
                      <Award className="h-5 w-5" />
                      <span className="font-semibold">{t.premio}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Info */}
              <div className="lg:col-span-3 text-center lg:text-left order-2">
                <div className="mb-6">
                  {/* Title first for better hierarchy */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 text-primary" data-testid="book-title">
                    {translatedTitle}
                  </h1>
                  
                  {tagline && (
                    <p className="text-xl md:text-2xl text-muted-foreground mb-6 font-light leading-relaxed">
                      {tagline}
                    </p>
                  )}

                  {/* Badges below title */}
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-4">
                    <Badge variant="secondary" className="text-sm md:text-base px-3 md:px-4 py-1" data-testid="book-genre">
                      {book.genre}
                    </Badge>
                    {isPartOfSeries && (
                      <Badge variant="outline" className="text-sm md:text-base px-3 md:px-4 py-1" data-testid="book-series">
                        {series.title} - {t.libro} {book.orderInSeries}
                      </Badge>
                    )}
                    {book.isDigitalProduct && (
                      <Badge variant="default" className="text-sm md:text-base px-3 md:px-4 py-1" data-testid="badge-digital-product">
                        {t.productoDigital}
                      </Badge>
                    )}
                  </div>

                  {book.directSaleEnabled && (
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-4">
                      {book.saleFormatPhysical && (
                        <Badge variant="outline" data-testid="badge-format-physical">
                          <Package className="h-3 w-3 mr-1" />
                          {t.fisico}
                        </Badge>
                      )}
                      {book.saleFormatDigital && (
                        <Badge variant="outline" data-testid="badge-format-digital">
                          <FileText className="h-3 w-3 mr-1" />
                          {t.digital}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {book.directSaleEnabled && book.directSalePrice !== null && book.directSalePrice !== undefined && exchangeRates && (
                  <div className="mb-6" data-testid={`text-price-${bookId}`}>
                    <div className="text-4xl font-bold text-primary">
                      {formatPriceWithConversionSync(
                        Math.round(book.directSalePrice * 100), // Convert to cents
                        currency,
                        locale,
                        exchangeRates
                      )}
                    </div>
                    {book.isDigitalProduct && book.digitalFiles && (
                      <div className="text-lg text-muted-foreground mt-2" data-testid="text-digital-format">
                        {(() => {
                          try {
                            const formats = JSON.parse(book.digitalFiles);
                            const availableFormats = Object.keys(formats).map(f => f.toUpperCase()).join(', ');
                            return `${t.formatosDigitales} ${availableFormats}`;
                          } catch {
                            return t.formatoDigital;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start mb-8">
                  {book.directSaleEnabled && book.directSaleStock !== null && book.directSaleStock !== undefined && book.directSaleStock > 0 ? (
                    <Button 
                      onClick={handleAddToCart} 
                      disabled={isAddingToCart}
                      size="lg" 
                      className="text-lg px-8 py-6" 
                      data-testid={`button-add-to-cart-${bookId}`}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {isAddingToCart ? t.anadiendo : t.comprarAhora}
                    </Button>
                  ) : book.directSaleEnabled && book.directSaleStock !== null && book.directSaleStock === 0 ? (
                    <Button 
                      disabled 
                      size="lg" 
                      variant="secondary"
                      className="text-lg px-8 py-6" 
                      data-testid={`button-out-of-stock-${bookId}`}
                    >
                      {t.agotado}
                    </Button>
                  ) : null}
                  
                  {book.amazonUrl && (
                    <Button asChild size="lg" variant={book.directSaleEnabled ? "outline" : "default"} className="text-lg px-8 py-6" data-testid="button-amazon">
                      <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-5 w-5" />
                        {book.landingCTA || t.comprarAmazon}
                      </a>
                    </Button>
                  )}
                  
                  {/* Additional Store Links */}
                  {book.storeLinks && (() => {
                    try {
                      const storeLinks = JSON.parse(book.storeLinks) as { name: string; url: string }[];
                      return storeLinks.map((link, index) => (
                        <Button 
                          key={index} 
                          asChild 
                          size="lg" 
                          variant={book.directSaleEnabled || book.amazonUrl ? "outline" : "default"} 
                          className="text-lg px-8 py-6" 
                          data-testid={`button-store-${index}`}
                        >
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-5 w-5" />
                            {link.name}
                          </a>
                        </Button>
                      ));
                    } catch (error) {
                      return null;
                    }
                  })()}
                  
                  <Button variant="outline" asChild size="lg" className="text-lg px-8 py-6" data-testid="button-preview">
                    <a href="#synopsis">
                      {t.verMasDetalles}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Synopsis Section */}
        <section id="synopsis" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-serif font-bold mb-8 text-center text-primary">
                {t.sinopsis}
              </h2>
              <div className="prose prose-lg max-w-none leading-relaxed text-center">
                {synopsis ? (
                  <p className="text-xl whitespace-pre-line">{synopsis}</p>
                ) : (
                  <p className="text-xl text-muted-foreground">{t.sinopsisNoDisponible}</p>
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
                {t.loQueEncontraras}
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
                {t.momentosMemo}
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
                {t.galeria}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {book.landingGallery.map((image, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-lg aspect-square">
                    <img
                      src={image}
                      alt={`${t.galleryImageAltImagen} ${index + 1} ${t.galleryImageAltDe} ${book.title}`}
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
                {t.premiosRecon}
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
              {t.contenidoAd}
            </h2>
            
            <div className="space-y-8 max-w-6xl mx-auto">
              {/* YouTube Booktrailer - Full width embed */}
              {book.promoYoutubeBooktrailer && book.promoShowYoutubeBooktrailer && (
                <div className="w-full" data-testid="promo-youtube">
                  <h3 className="font-semibold text-2xl mb-4 flex items-center gap-2">
                    <Video className="h-6 w-6 text-primary" />
                    {t.booktrailer}
                  </h3>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                      src={getYouTubeEmbedUrl(book.promoYoutubeBooktrailer)}
                      title={t.embedBooktrailer}
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
                    {t.playlistLec}
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
                          <h3 className="font-semibold text-lg mb-2">{t.mapaConcep}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {t.mapaConceptDesc}
                          </p>
                          <a 
                            href={book.promoConceptMap} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                          >
                            {t.verMapa} <ExternalLink className="h-3 w-3" />
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
                          <h3 className="font-semibold text-lg mb-2">{t.arbolGen}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {t.arbolGenDesc}
                          </p>
                          <a 
                            href={book.promoFamilyTree} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                          >
                            {t.verArbol} <ExternalLink className="h-3 w-3" />
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
                          <h3 className="font-semibold text-lg mb-2">{t.notasPrensa}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {t.notasPrenseDesc}
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
                                {t.articulo} {index + 1} <ExternalLink className="h-3 w-3" />
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
                          <h3 className="font-semibold text-lg mb-2">{t.materialGraf}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {t.materialGrafDesc}
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
                                {t.recurso} {index + 1} <ExternalLink className="h-3 w-3" />
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
                {t.parteSerie} {series.title}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {series.description}
              </p>
              <Link href={author?.slug ? `/autor/${author.slug}#series` : `/#series`}>
                <Button size="lg" variant="outline" className="text-lg">
                  {t.explorarSerie}
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-serif font-bold mb-6">
              {t.listoSum}
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              {t.comienzaAv}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {book.amazonUrl && (
                <Button asChild size="lg" variant="secondary" className="text-lg px-10 py-6">
                  <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    {t.comprarAhora}
                  </a>
                </Button>
              )}
              
              {/* Additional Store Links */}
              {book.storeLinks && (() => {
                try {
                  const storeLinks = JSON.parse(book.storeLinks) as { name: string; url: string }[];
                  return storeLinks.map((link, index) => (
                    <Button 
                      key={index} 
                      asChild 
                      size="lg" 
                      variant="secondary" 
                      className="text-lg px-10 py-6" 
                      data-testid={`button-cta-store-${index}`}
                    >
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-5 w-5" />
                        {link.name}
                      </a>
                    </Button>
                  ));
                } catch (error) {
                  return null;
                }
              })()}
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
              {author?.name || book.authorId}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              {author?.bioParagraph1 || ""}
            </p>
            {author?.slug && (
              <div className="mb-6">
                <Link href={`/autor/${author.slug}`}>
                  <Button variant="outline" size="sm">
                    Ver todos los libros
                  </Button>
                </Link>
              </div>
            )}
            <div className="flex justify-center space-x-4">
              {author?.instagramUrl && (
                <a href={author.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <SiInstagram className="text-xl" />
                </a>
              )}
              {author?.twitterUrl && (
                <a href={author.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <SiX className="text-xl" />
                </a>
              )}
              {author?.facebookUrl && (
                <a href={author.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <SiFacebook className="text-xl" />
                </a>
              )}
              {author?.amazonUrl && (
                <a href={author.amazonUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <SiAmazon className="text-xl" />
                </a>
              )}
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {author?.name || book.authorId}. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
