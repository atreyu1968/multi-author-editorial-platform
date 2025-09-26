import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import BookSeries from "@/components/book-series";
import StandaloneBooks from "@/components/standalone-books";
import AuthorBio from "@/components/author-bio";
import Testimonials from "@/components/testimonials";
import Newsletter from "@/components/newsletter";
import { SEOHead, generateStructuredData } from "@/components/seo/seo-head";

export default function Home() {
  return (
    <div className="bg-background text-foreground font-sans">
      <SEOHead
        title="María González - Autora de Novelas Románticas y Suspenso"
        description="Descubre las cautivadoras novelas de María González. Desde romances apasionados hasta misterios que te mantendrán despierto toda la noche. Explora mis series y libros independientes."
        keywords={["novelas románticas", "thriller", "suspenso", "ficción", "bestseller", "autora española"]}
        ogType="website"
        structuredData={generateStructuredData.website()}
      />
      <Navigation />
      <HeroSection />
      <BookSeries />
      <StandaloneBooks />
      <AuthorBio />
      <Testimonials />
      <Newsletter />
      
      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-serif font-bold text-primary mb-4">
                María González
              </div>
              <p className="text-muted-foreground mb-4">
                Autora bestseller especializada en romance, thriller y fantasía. 
                Creando historias que tocan el corazón desde 2012.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-instagram">
                  <i className="fab fa-instagram text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-twitter">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-facebook">
                  <i className="fab fa-facebook text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-amazon">
                  <i className="fab fa-amazon text-xl"></i>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-4">Enlaces Rápidos</h3>
              <ul className="space-y-2">
                <li><a href="#series" className="text-muted-foreground hover:text-primary transition-colors">Series de Libros</a></li>
                <li><a href="#standalone" className="text-muted-foreground hover:text-primary transition-colors">Libros Independientes</a></li>
                <li><a href="#biografia" className="text-muted-foreground hover:text-primary transition-colors">Biografía</a></li>
                <li><a href="#testimonios" className="text-muted-foreground hover:text-primary transition-colors">Reseñas</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-4">Contacto</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><i className="fas fa-envelope mr-2"></i>info@mariagonzalez.com</li>
                <li><i className="fas fa-phone mr-2"></i>+34 600 123 456</li>
                <li><i className="fas fa-map-marker-alt mr-2"></i>Barcelona, España</li>
              </ul>
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
