import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Home, BookOpen, Users, User, Star, Settings } from "lucide-react";
import AdminDashboard from "@/components/admin/admin-dashboard";
import BookManagement from "@/components/admin/book-management";
import SeriesManagement from "@/components/admin/series-management";
import BioManagement from "@/components/admin/bio-management";
import TestimonialManagement from "@/components/admin/testimonial-management";
import SettingsManagement from "@/components/admin/settings-management";

type AdminSection = 'dashboard' | 'books' | 'series' | 'bio' | 'testimonials' | 'settings';

export default function Admin() {
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'books':
        return <BookManagement />;
      case 'series':
        return <SeriesManagement />;
      case 'bio':
        return <BioManagement />;
      case 'testimonials':
        return <TestimonialManagement />;
      case 'settings':
        return <SettingsManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <Link href="/" className="text-primary-foreground hover:text-accent transition-colors" data-testid="link-home">
          <ArrowLeft className="h-6 w-6" />
        </Link>
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-muted p-6 min-h-[calc(100vh-88px)] border-r border-border">
          <nav className="space-y-2">
            <button 
              onClick={() => setCurrentSection('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                currentSection === 'dashboard' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary hover:text-primary-foreground'
              }`}
              data-testid="nav-dashboard"
            >
              <Home className="h-5 w-5" />
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentSection('books')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                currentSection === 'books' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary hover:text-primary-foreground'
              }`}
              data-testid="nav-books"
            >
              <BookOpen className="h-5 w-5" />
              Gestión de Libros
            </button>
            <button 
              onClick={() => setCurrentSection('series')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                currentSection === 'series' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary hover:text-primary-foreground'
              }`}
              data-testid="nav-series"
            >
              <Users className="h-5 w-5" />
              Series
            </button>
            <button 
              onClick={() => setCurrentSection('bio')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                currentSection === 'bio' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary hover:text-primary-foreground'
              }`}
              data-testid="nav-bio"
            >
              <User className="h-5 w-5" />
              Biografía
            </button>
            <button 
              onClick={() => setCurrentSection('testimonials')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                currentSection === 'testimonials' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary hover:text-primary-foreground'
              }`}
              data-testid="nav-testimonials"
            >
              <Star className="h-5 w-5" />
              Testimonios
            </button>
            <button 
              onClick={() => setCurrentSection('settings')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                currentSection === 'settings' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary hover:text-primary-foreground'
              }`}
              data-testid="nav-settings"
            >
              <Settings className="h-5 w-5" />
              Configuración
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
