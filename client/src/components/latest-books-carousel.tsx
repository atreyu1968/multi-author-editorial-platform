import { useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Book } from "@shared/schema";

interface LatestBooksCarouselProps {
  books: Book[];
}

export function LatestBooksCarousel({ books }: LatestBooksCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 }
    }
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // Auto-scroll every 5 seconds
    const autoScroll = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(autoScroll);
  }, [emblaApi]);

  if (!books || books.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%]"
              data-testid={`carousel-book-${book.id}`}
            >
              <Card className="bg-card rounded-xl shadow-lg border border-border overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 h-full">
                <div className="relative aspect-[2/3] bg-gradient-to-br from-primary/20 to-accent/20">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={`Portada de ${book.title}`}
                      className="w-full h-full object-cover"
                      data-testid={`carousel-book-cover-${book.id}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                  {book.publicationDate && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      {new Date(book.publicationDate).getFullYear()}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3
                    className="text-lg font-serif font-bold text-primary mb-2 line-clamp-2"
                    data-testid={`carousel-book-title-${book.id}`}
                  >
                    {book.title}
                  </h3>
                  {book.genre && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {book.genre}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    data-testid={`button-view-book-${book.id}`}
                    onClick={() => window.location.href = `/libro/${book.id}`}
                  >
                    Ver Detalles
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {books.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background/90 backdrop-blur-sm shadow-lg hover:bg-background z-10"
            onClick={scrollPrev}
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background/90 backdrop-blur-sm shadow-lg hover:bg-background z-10"
            onClick={scrollNext}
            data-testid="button-carousel-next"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
}
