import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, ExternalLink, Calendar, BookOpen } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Newsletter from "@/components/newsletter";
import { SEOHead, generateStructuredData } from "@/components/seo/seo-head";
import SharedFooter from "@/components/shared-footer";
import type { Book } from "@shared/schema";

export default function BookDetail() {
  const [match, params] = useRoute("/libro/:id");
  const bookId = params?.id;

  const { data: book, isLoading, error } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !!bookId,
  });

  const { data: series } = useQuery<any>({
    queryKey: [`/api/series/${book?.seriesId}`],
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

  return (
    <div className="bg-background text-foreground font-sans">
      <SEOHead
        title={`${book.title} - Novela ${book.genre}`}
        description={book.description || `Descubre "${book.title}", una fascinante novela de ${book.genre.toLowerCase()} que te mantendrá enganchado desde la primera página.`}
        keywords={[book.title, book.genre, "novela", "libro", "María González"]}
        ogType="book"
        ogImage={book.coverImage || undefined}
        ogImageAlt={`Portada de ${book.title}`}
        structuredData={generateStructuredData.book(book)}
      />
      
      <Navigation />
      
      <main className="min-h-screen">
        {/* Back Navigation */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link href="/">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a todos los libros
            </Button>
          </Link>
        </div>

        {/* Book Header */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Book Cover */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <img
                  src={book.coverImage || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600'}
                  alt={`Portada de ${book.title}`}
                  className="w-80 h-auto rounded-lg shadow-2xl"
                  data-testid="book-cover"
                />
              </div>
            </div>

            {/* Book Info */}
            <div>
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" data-testid="book-genre">
                    {book.genre}
                  </Badge>
                  {isPartOfSeries && (
                    <Badge variant="outline" data-testid="book-series">
                      {series.title} - Libro {book.orderInSeries}
                    </Badge>
                  )}
                  {book.isComingSoon && (
                    <Badge className="bg-blue-600 text-white" data-testid="badge-coming-soon">
                      Próximamente
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4 text-primary" data-testid="book-title">
                  {book.title}
                </h1>
                
                <p className="text-xl text-muted-foreground mb-6 font-light">
                  por María González
                </p>
              </div>



              <p className="text-lg leading-relaxed mb-8" data-testid="book-description">
                {book.description}
              </p>

              {/* Purchase Links */}
              <div className="flex flex-col sm:flex-row gap-4">
                {book.isComingSoon ? (
                  <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-6 py-4" data-testid="coming-soon-notice">
                    <p className="text-blue-700 dark:text-blue-300 font-medium">Este libro estará disponible próximamente. ¡Mantente atento!</p>
                  </div>
                ) : book.amazonUrl ? (
                  <Button asChild size="lg" data-testid="button-amazon">
                    <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Comprar en Amazon
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Series Information (if applicable) */}
        {isPartOfSeries && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-serif font-bold mb-6 text-primary">
                Parte de la serie: {series.title}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {series.description}
              </p>
              <Link href="/#series">
                <Button variant="outline">
                  Explorar toda la serie
                </Button>
              </Link>
            </div>
          </section>
        )}
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
        </div>
      </footer>
      <SharedFooter />
    </div>
  );
}