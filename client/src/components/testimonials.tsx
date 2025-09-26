import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Testimonial } from "@shared/schema";

export default function Testimonials() {
  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials/published"]
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonialsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / testimonialsPerPage);

  useEffect(() => {
    if (testimonials.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalPages, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  if (testimonials.length === 0) {
    return (
      <section id="testimonios" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">
              Lo que Dicen los Lectores
            </h2>
            <p className="text-xl text-muted-foreground">No hay testimonios disponibles en este momento.</p>
          </div>
        </div>
      </section>
    );
  }

  const getCurrentTestimonials = () => {
    const start = currentIndex * testimonialsPerPage;
    const end = start + testimonialsPerPage;
    return testimonials.slice(start, end);
  };

  return (
    <section id="testimonios" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">
            Lo que Dicen los Lectores
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Miles de lectores han disfrutado de las historias de María. Descubre qué dicen sobre sus libros.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {Array.from({ length: totalPages }).map((_, pageIndex) => {
                const pageTestimonials = testimonials.slice(
                  pageIndex * testimonialsPerPage,
                  (pageIndex + 1) * testimonialsPerPage
                );
                
                return (
                  <div key={pageIndex} className="w-full flex-shrink-0 px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {pageTestimonials.map((testimonial) => (
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
                              alt={`Foto de perfil de ${testimonial.authorName}`}
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
                );
              })}
            </div>
          </div>

          {/* Navigation buttons */}
          {totalPages > 1 && (
            <>
              <Button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90"
                size="icon"
                data-testid="button-prev-testimonial"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90"
                size="icon"
                data-testid="button-next-testimonial"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Carousel dots */}
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                    data-testid={`dot-testimonial-${index}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
