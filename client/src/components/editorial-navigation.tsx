import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiText } from "@/contexts/ui-text-context";
import { useQuery } from "@tanstack/react-query";
import type { EditorialSettings } from "@shared/schema";

export default function EditorialNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  
  const navHome = useUiText("navigation", "editorial_home", "Inicio");
  const navPublications = useUiText("navigation", "publications", "Publicaciones");
  const navAuthors = useUiText("navigation", "authors", "Autores");
  const navAdmin = useUiText("navigation", "admin", "Admin");

  const { data: settings } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings"],
  });

  // Check if we're on the home page (exact match only, including locale-prefixed versions and trailing slashes)
  const normalizedLocation = location.endsWith('/') && location.length > 1 ? location.slice(0, -1) : location;
  const isHomePage = normalizedLocation === "/" || 
    normalizedLocation === "/es-ES" || normalizedLocation === "/en-US" || 
    normalizedLocation === "/ca-ES" || normalizedLocation === "/fr-FR" || 
    normalizedLocation === "/it-IT" || normalizedLocation === "/de-DE" || normalizedLocation === "/pt-PT";

  const handleNavClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-serif font-bold text-primary cursor-pointer flex items-center" data-testid="header-title">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo Editorial" className="h-8 object-contain" />
              ) : (
                settings?.name || "Editorial"
              )}
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {isHomePage ? (
              <>
                <button 
                  onClick={() => handleNavClick('inicio')} 
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" 
                  data-testid="nav-home"
                >
                  {navHome}
                </button>
                <button 
                  onClick={() => handleNavClick('standalone')} 
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" 
                  data-testid="nav-publications"
                >
                  {navPublications}
                </button>
                <button 
                  onClick={() => handleNavClick('autores-destacados')} 
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" 
                  data-testid="nav-authors"
                >
                  {navAuthors}
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-home">
                  {navHome}
                </Link>
                <Link href="/autores" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="nav-authors">
                  {navAuthors}
                </Link>
              </>
            )}
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-admin">
              <Link href="/admin">
                <Settings className="h-4 w-4 mr-2" />
                {navAdmin}
              </Link>
            </Button>
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
            {isHomePage ? (
              <>
                <button 
                  onClick={() => { handleNavClick('inicio'); setMobileMenuOpen(false); }} 
                  className="block w-full text-left py-2 text-muted-foreground hover:text-primary"
                >
                  {navHome}
                </button>
                <button 
                  onClick={() => { handleNavClick('standalone'); setMobileMenuOpen(false); }} 
                  className="block w-full text-left py-2 text-muted-foreground hover:text-primary"
                >
                  {navPublications}
                </button>
                <button 
                  onClick={() => { handleNavClick('autores-destacados'); setMobileMenuOpen(false); }} 
                  className="block w-full text-left py-2 text-muted-foreground hover:text-primary"
                >
                  {navAuthors}
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="block py-2 text-muted-foreground hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  {navHome}
                </Link>
                <Link href="/autores" className="block py-2 text-muted-foreground hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  {navAuthors}
                </Link>
              </>
            )}
            <Link href="/admin" className="block w-full text-left py-2 text-primary" onClick={() => setMobileMenuOpen(false)}>
              <Settings className="h-4 w-4 mr-2 inline" />
              {navAdmin}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
