import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { BookSeries, Book } from "@shared/schema";

export default function BookSeries() {
  const { data: series = [] } = useQuery<BookSeries[]>({
    queryKey: ["/api/book-series"]
  });

  const { data: allBooks = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"]
  });

  const getSeriesBooks = (seriesId: string) => {
    return allBooks.filter(book => book.seriesId === seriesId && book.isPublished);
  };

  if (series.length === 0) {
    return (
      <section id="series" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">Series de Libros</h2>
            <p className="text-xl text-muted-foreground">No hay series disponibles en este momento.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="series" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">Series de Libros</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explora las emocionantes series que han cautivado a miles de lectores alrededor del mundo.
          </p>
        </div>

        {series.filter(s => s.isActive).map((serie) => {
          const seriesBooks = getSeriesBooks(serie.id);
          
          return (
            <div key={serie.id} className="mb-20 last:mb-0" data-testid={`series-${serie.id}`}>
              <Card className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
                <div className="grid lg:grid-cols-2 gap-8 p-8 lg:p-12">
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
                        {seriesBooks.length} {seriesBooks.length === 1 ? 'libro' : 'libros'}
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
                    {seriesBooks.slice(0, 4).map((book) => (
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
  );
}
