import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Home, BookOpen, Users, User, Star, Settings, FileText, HelpCircle, Type, UserCircle, Building2, BarChart3, ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicTheme } from "@/components/dynamic-theme";
import AdminDashboard from "@/components/admin/admin-dashboard";
import BookManagement from "@/components/admin/book-management";
import SeriesManagement from "@/components/admin/series-management";
import BioManagement from "@/components/admin/bio-management";
import TestimonialManagement from "@/components/admin/testimonial-management";
import SettingsManagement from "@/components/admin/settings-management";
import BlogManagement from "@/components/admin/blog-management";
import HelpInstructions from "@/components/admin/help-instructions";
import UiTextsManagement from "@/components/admin/ui-texts-management";
import AuthorManagement from "@/components/admin/author-management";
import EditorialSettingsManagement from "@/components/admin/editorial-settings-management";
import AnalyticsManagement from "@/components/admin/analytics-management";
import OrdersManagement from "@/components/admin/orders-management";
import { AdminAuthorProvider, useAdminAuthor } from "@/contexts/admin-author-context";

type AdminSection = 'dashboard' | 'books' | 'series' | 'authors' | 'bio' | 'testimonials' | 'blog' | 'settings' | 'ui-texts' | 'editorial-settings' | 'analytics' | 'orders' | 'help';

function AdminContent() {
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const { selectedAuthorId, setSelectedAuthorId, authors, isLoading } = useAdminAuthor();

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'books':
        return <BookManagement />;
      case 'series':
        return <SeriesManagement />;
      case 'authors':
        return <AuthorManagement />;
      case 'bio':
        return <BioManagement />;
      case 'testimonials':
        return <TestimonialManagement />;
      case 'blog':
        return <BlogManagement />;
      case 'settings':
        return <SettingsManagement />;
      case 'ui-texts':
        return <UiTextsManagement />;
      case 'editorial-settings':
        return <EditorialSettingsManagement />;
      case 'analytics':
        return <AnalyticsManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'help':
        return <HelpInstructions />;
      default:
        return <AdminDashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Cargando autores...</div>
      </div>
    );
  }

  if (!isLoading && !selectedAuthorId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">No hay autores disponibles</div>
      </div>
    );
  }

  const selectedAuthor = authors.find(a => a.id === selectedAuthorId);

  return (
    <DynamicTheme authorId={selectedAuthorId!}>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <Select value={selectedAuthorId || undefined} onValueChange={setSelectedAuthorId} disabled={isLoading}>
            <SelectTrigger className="w-[250px] bg-primary-foreground text-primary" data-testid="select-admin-author">
              <SelectValue placeholder="Seleccionar autor">
                {selectedAuthor?.name || "Seleccionar autor"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {authors.map((author) => (
                <SelectItem key={author.id} value={author.id}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href="/" className="text-primary-foreground hover:text-accent transition-colors" data-testid="link-home">
          <ArrowLeft className="h-6 w-6" />
        </Link>
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-muted p-6 min-h-[calc(100vh-88px)] border-r border-border">
          <nav className="space-y-4">
            {/* Sección del Autor */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
                Autor Seleccionado
              </h3>
              <div className="space-y-1">
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
                  Libros
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
                  onClick={() => setCurrentSection('blog')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'blog' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-blog"
                >
                  <FileText className="h-5 w-5" />
                  Blog
                </button>
                <button 
                  onClick={() => setCurrentSection('ui-texts')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'ui-texts' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-ui-texts"
                >
                  <Type className="h-5 w-5" />
                  Textos del Sitio
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
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-border my-4"></div>

            {/* Sección de la Editorial */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
                Editorial (Global)
              </h3>
              <div className="space-y-1">
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
                  onClick={() => setCurrentSection('authors')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'authors' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-authors"
                >
                  <UserCircle className="h-5 w-5" />
                  Autores
                </button>
                <button 
                  onClick={() => setCurrentSection('editorial-settings')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'editorial-settings' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-editorial-settings"
                >
                  <Building2 className="h-5 w-5" />
                  Página Editorial
                </button>
                <button 
                  onClick={() => setCurrentSection('analytics')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'analytics' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-analytics"
                >
                  <BarChart3 className="h-5 w-5" />
                  Analíticas
                </button>
                <button 
                  onClick={() => setCurrentSection('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'orders' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-orders"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Pedidos
                </button>
                <button 
                  onClick={() => setCurrentSection('help')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'help' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-help"
                >
                  <HelpCircle className="h-5 w-5" />
                  Ayuda
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
      </div>
    </DynamicTheme>
  );
}

export default function Admin() {
  return (
    <AdminAuthorProvider>
      <AdminContent />
    </AdminAuthorProvider>
  );
}
