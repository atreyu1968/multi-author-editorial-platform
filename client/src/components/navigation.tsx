import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, Settings, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Author, SiteSettings } from "@shared/schema";
import { useUiText } from "@/contexts/ui-text-context";
import { useCart } from "@/contexts/CartContext";
import { LanguageSelector } from "@/components/language-selector";
import SearchBar from "@/components/search-bar";

interface NavigationProps {
  authorId?: string;
}

export default function Navigation({ authorId }: NavigationProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  
  const { data: author } = useQuery<Author>({
    queryKey: [`/api/authors/${authorId}`],
    enabled: !!authorId
  });
  
  const { data: settings = [] } = useQuery<SiteSettings[]>({
    queryKey: authorId ? ["/api/settings", { authorId }] : ["/api/settings"]
  });
  
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
  
  const logoUrl = settingsMap.logoUrl || "";
  
  const navHome = useUiText("navigation", "home", "Inicio");
  const navSeries = useUiText("navigation", "series", "Series");
  const navBooks = useUiText("navigation", "books", "Libros");
  const navBio = useUiText("navigation", "bio", "Biografía");
  const navTestimonials = useUiText("navigation", "testimonials", "Reseñas");
  const navAdmin = useUiText("navigation", "admin", "Admin");
  const navAdminPanel = useUiText("navigation", "admin_panel", "Panel Admin");
  const commonLoading = useUiText("common", "loading", "Cargando...");

  // Build base path for navigation links
  const basePath = author?.slug ? `/autor/${author.slug}` : "/";

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
            <a href="#inicio" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-inicio">
              {navHome}
            </a>
            <a href="#series" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-series">
              {navSeries}
            </a>
            <a href="#standalone" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-standalone">
              {navBooks}
            </a>
            <a href="#biografia" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-biografia">
              {navBio}
            </a>
            <a href="#testimonios" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-testimonios">
              {navTestimonials}
            </a>
            <div className="w-64">
              <SearchBar />
            </div>
            <LanguageSelector />
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
            <Link href="/auth">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-admin">
                <Settings className="h-4 w-4 mr-2" />
                {navAdmin}
              </Button>
            </Link>
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
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-4 py-2 space-y-2">
            <div className="py-2">
              <SearchBar />
            </div>
            <a href="#inicio" className="block py-2 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
              {navHome}
            </a>
            <a href="#series" className="block py-2 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
              {navSeries}
            </a>
            <a href="#standalone" className="block py-2 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
              {navBooks}
            </a>
            <a href="#biografia" className="block py-2 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
              {navBio}
            </a>
            <a href="#testimonios" className="block py-2 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
              {navTestimonials}
            </a>
            <div className="py-2">
              <LanguageSelector />
            </div>
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
            <Link href="/auth" className="block w-full text-left py-2 text-primary" onClick={() => setMobileMenuOpen(false)}>
              <Settings className="h-4 w-4 mr-2 inline" />
              {navAdminPanel}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
