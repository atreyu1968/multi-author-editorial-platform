import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Author, SiteSettings, EditorialSettings } from "@shared/schema";
import { useUiText } from "@/contexts/ui-text-context";
import { useCart } from "@/contexts/CartContext";
import { useLocale } from "@/contexts/locale-context";
import SearchBar from "@/components/search-bar";

interface NavigationProps {
  authorId?: string;
}

export default function Navigation({ authorId }: NavigationProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { locale } = useLocale();
  
  const { data: author } = useQuery<Author>({
    queryKey: [`/api/authors/${authorId}`],
    enabled: !!authorId
  });
  
  const { data: settings = [] } = useQuery<SiteSettings[]>({
    queryKey: authorId ? ["/api/settings", { authorId }] : ["/api/settings"]
  });

  const { data: editorialSettings } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings"]
  });
  
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
  
  const logoUrl = settingsMap.logoUrl || "";
  
  const isCartEnabled = !!(editorialSettings?.paypalClientId);
  
  const navHome = useUiText("navigation", "home", "Inicio");
  const navSeries = useUiText("navigation", "series", "Series");
  const navBooks = useUiText("navigation", "books", "Libros");
  const navBio = useUiText("navigation", "bio", "Biografía");
  const navTestimonials = useUiText("navigation", "testimonials", "Reseñas");
  const commonLoading = useUiText("common", "loading", "Cargando...");

  const basePath = author?.slug ? `/${locale}/autor/${author.slug}` : "/";

  const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (basePath && basePath !== "/") {
      window.location.href = `${basePath}#${sectionId}`;
    }
  }, [basePath]);

  const handleMobileNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    scrollToSection(e, sectionId);
    setMobileMenuOpen(false);
  }, [scrollToSection]);

  return (
    <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={basePath}>
              {authorId && (
                <>
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={author?.name || "Logo"} 
                      className="h-10 object-contain"
                      data-testid="header-logo"
                    />
                  ) : (
                    <div className="text-2xl font-serif font-bold text-primary" data-testid="header-title">
                      {author?.name || commonLoading}
                    </div>
                  )}
                </>
              )}
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href={`${basePath}#inicio`} onClick={(e) => scrollToSection(e, 'inicio')} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-inicio">
              {navHome}
            </a>
            <a href={`${basePath}#series`} onClick={(e) => scrollToSection(e, 'series')} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-series">
              {navSeries}
            </a>
            <a href={`${basePath}#standalone`} onClick={(e) => scrollToSection(e, 'standalone')} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-standalone">
              {navBooks}
            </a>
            <a href={`${basePath}#biografia`} onClick={(e) => scrollToSection(e, 'biografia')} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-biografia">
              {navBio}
            </a>
            <a href={`${basePath}#testimonios`} onClick={(e) => scrollToSection(e, 'testimonios')} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-testimonios">
              {navTestimonials}
            </a>
            <div className="w-64">
              <SearchBar />
            </div>
            {isCartEnabled && (
              <Link href="/checkout" data-testid="link-cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      data-testid="badge-cart-count"
                    >
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted-foreground hover:text-primary"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-4 py-2 space-y-2">
            <div className="py-2">
              <SearchBar />
            </div>
            <a href={`${basePath}#inicio`} onClick={(e) => handleMobileNavClick(e, 'inicio')} className="block py-2 text-muted-foreground hover:text-primary cursor-pointer">
              {navHome}
            </a>
            <a href={`${basePath}#series`} onClick={(e) => handleMobileNavClick(e, 'series')} className="block py-2 text-muted-foreground hover:text-primary cursor-pointer">
              {navSeries}
            </a>
            <a href={`${basePath}#standalone`} onClick={(e) => handleMobileNavClick(e, 'standalone')} className="block py-2 text-muted-foreground hover:text-primary cursor-pointer">
              {navBooks}
            </a>
            <a href={`${basePath}#biografia`} onClick={(e) => handleMobileNavClick(e, 'biografia')} className="block py-2 text-muted-foreground hover:text-primary cursor-pointer">
              {navBio}
            </a>
            <a href={`${basePath}#testimonios`} onClick={(e) => handleMobileNavClick(e, 'testimonios')} className="block py-2 text-muted-foreground hover:text-primary cursor-pointer">
              {navTestimonials}
            </a>
            {isCartEnabled && (
              <Link href="/checkout" className="block w-full text-left py-2 text-primary" onClick={() => setMobileMenuOpen(false)} data-testid="link-cart-mobile">
                <div className="flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2 inline" />
                  Carrito
                  {totalItems > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      data-testid="badge-cart-count-mobile"
                    >
                      {totalItems}
                    </Badge>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
