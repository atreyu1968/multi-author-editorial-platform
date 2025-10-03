import { useQuery } from "@tanstack/react-query";
import { Download, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUiText } from "@/contexts/ui-text-context";
import type { Author, Book } from "@shared/schema";

export default function HeroSection() {
  const loadingText = useUiText("common", "loading", "Cargando...");
  
  const { data: author } = useQuery<Author>({
    queryKey: ["/api/author"]
  });

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"]
  });

  const featuredBooks = books.filter(book => book.isPublished).slice(0, 3);

  if (!author) {
    return <div className="hero-gradient h-96 flex items-center justify-center">
      <div className="text-white text-xl">{loadingText}</div>
    </div>;
  }

  return (
    <section id="inicio" className="hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
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
            >
              <Download className="h-5 w-5 mr-2" />
              Descarga Gratuita
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 text-lg font-semibold hover:bg-white/30 transition-all"
              data-testid="button-books"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Ver Libros
            </Button>
          </div>
          
          {/* Featured Books Preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {featuredBooks.map((book) => (
              <Card key={book.id} className="book-card bg-white/10 backdrop-blur-sm p-6 border border-white/20" data-testid={`book-card-${book.id}`}>
                <img 
                  src={book.coverImage || "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"} 
                  alt={`Portada del libro ${book.title}`}
                  className="w-32 h-48 mx-auto rounded-lg shadow-2xl mb-4 object-cover" 
                />
                <h3 className="text-xl font-serif font-semibold mb-2">{book.title}</h3>
                <p className="text-sm opacity-80">
                  {book.seriesId ? 'Serie' : 'Novela Independiente'}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
