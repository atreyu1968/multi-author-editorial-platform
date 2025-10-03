import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useUiText } from "@/contexts/ui-text-context";
import type { Book } from "@shared/schema";

export default function StandaloneBooks() {
  const standaloneTitle = useUiText("home", "standalone_title", "Libros Independientes");
  const standaloneSubtitle = useUiText("home", "standalone_subtitle", "Historias completas y autoconclusivas que puedes disfrutar como experiencias únicas.");
  
  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books/standalone"]
  });

  const publishedBooks = books.filter(book => book.isPublished);

  return (
    <section id="standalone" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">{standaloneTitle}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {standaloneSubtitle}
          </p>
        </div>

        {publishedBooks.length === 0 ? (
          <div className="text-center">
            <p className="text-xl text-muted-foreground">No hay libros independientes disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publishedBooks.map((book) => (
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
        )}
      </div>
    </section>
  );
}
