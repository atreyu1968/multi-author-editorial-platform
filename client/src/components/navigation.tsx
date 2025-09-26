import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="text-2xl font-serif font-bold text-primary">
              María González
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#inicio" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-inicio">
              Inicio
            </a>
            <a href="#series" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-series">
              Series
            </a>
            <a href="#standalone" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-standalone">
              Libros
            </a>
            <a href="#biografia" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-biografia">
              Biografía
            </a>
            <a href="#testimonios" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-testimonios">
              Reseñas
            </a>
            <Link href="/admin">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-admin">
                <Settings className="h-4 w-4 mr-2" />
                Admin
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
            <a href="#inicio" className="block py-2 text-muted-foreground hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              Inicio
            </a>
            <a href="#series" className="block py-2 text-muted-foreground hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              Series
            </a>
            <a href="#standalone" className="block py-2 text-muted-foreground hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              Libros
            </a>
            <a href="#biografia" className="block py-2 text-muted-foreground hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              Biografía
            </a>
            <a href="#testimonios" className="block py-2 text-muted-foreground hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              Reseñas
            </a>
            <Link href="/admin" className="block w-full text-left py-2 text-primary" onClick={() => setMobileMenuOpen(false)}>
              <Settings className="h-4 w-4 mr-2 inline" />
              Panel Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
