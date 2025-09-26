import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { Author } from "@shared/schema";

export default function AuthorBio() {
  const { data: author } = useQuery<Author>({
    queryKey: ["/api/author"]
  });

  if (!author) {
    return (
      <section id="biografia" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-xl text-muted-foreground">Cargando biografía...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="biografia" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-8">
                Conoce a la Autora
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
                  alt={`Retrato profesional de ${author.name}, autora bestseller`}
                  className="rounded-2xl shadow-2xl w-full max-w-md mx-auto object-cover" 
                  data-testid="author-photo"
                />
                <div className="absolute -bottom-6 -right-6 bg-accent text-accent-foreground px-6 py-3 rounded-xl shadow-lg">
                  <div className="text-center">
                    <div className="font-bold text-xl">20+</div>
                    <div className="text-sm">Libros Publicados</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
