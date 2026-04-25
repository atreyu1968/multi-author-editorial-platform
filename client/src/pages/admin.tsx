import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Home, BookOpen, Users, User, Star, Settings, FileText, HelpCircle, Type, UserCircle, Building2, BarChart3, ShoppingCart, Languages, Mail, Inbox, ListChecks, KeyRound } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicTheme } from "@/components/dynamic-theme";
import { SEOHead } from "@/components/seo/seo-head";
import AdminDashboard from "@/components/admin/admin-dashboard";
import BookManagement from "@/components/admin/book-management";
import SeriesManagement from "@/components/admin/series-management";
import BioManagement from "@/components/admin/bio-management";
import TestimonialManagement from "@/components/admin/testimonial-management";
import SettingsManagement from "@/components/admin/settings-management";
import BlogManagement from "@/components/admin/blog-management";
import HelpInstructions from "@/components/admin/help-instructions";
import UiTextsManagement from "@/components/admin/ui-texts-management";
import TranslationManagement from "@/components/admin/translation-management";
import SimpleUiTexts from "@/components/admin/simple-ui-texts";
import AuthorManagement from "@/components/admin/author-management";
import EditorialSettingsManagement from "@/components/admin/editorial-settings-management";
import AnalyticsManagement from "@/components/admin/analytics-management";
import OrdersManagement from "@/components/admin/orders-management";
import BroadcastManagement from "@/components/admin/broadcast-management";
import SubscribersManagement from "@/components/admin/subscribers-management";
import NewsletterListsManagement from "@/components/admin/newsletter-lists-management";
import UsersManagement from "@/components/admin/users-management";
import { AdminAuthorProvider, useAdminAuthor } from "@/contexts/admin-author-context";
import { useUiText } from "@/contexts/ui-text-context";

type AdminSection = 'dashboard' | 'books' | 'series' | 'authors' | 'bio' | 'testimonials' | 'blog' | 'settings' | 'ui-texts' | 'translations' | 'editorial-settings' | 'analytics' | 'orders' | 'broadcasts' | 'subscribers' | 'newsletter-lists' | 'users' | 'help';

function AdminContent() {
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const { selectedAuthorId, setSelectedAuthorId, authors, isLoading } = useAdminAuthor();
  
  const t = {
    loadingAuthors: useUiText("admin.shell", "loading_authors", "Cargando autores..."),
    noAuthorsAvailable: useUiText("admin.shell", "no_authors_available", "No hay autores disponibles"),
    createFirstAuthor: useUiText("admin.shell", "create_first_author", "Crea tu primer autor para comenzar"),
    panelTitle: useUiText("admin.shell", "panel_title", "Panel de Administración"),
    selectAuthorPlaceholder: useUiText("admin.shell", "select_author_placeholder", "Seleccionar autor"),
    sectionSelectedAuthor: useUiText("admin.shell", "section_selected_author", "Autor Seleccionado"),
    navDashboard: useUiText("admin.shell", "nav_dashboard", "Dashboard"),
    navBooks: useUiText("admin.shell", "nav_books", "Libros"),
    navBio: useUiText("admin.shell", "nav_bio", "Biografía"),
    navTestimonials: useUiText("admin.shell", "nav_testimonials", "Testimonios"),
    navBlog: useUiText("admin.shell", "nav_blog", "Blog"),
    navUiTexts: useUiText("admin.shell", "nav_ui_texts", "Textos del Sitio"),
    navTranslations: useUiText("admin.shell", "nav_translations", "Traducciones"),
    navSettings: useUiText("admin.shell", "nav_settings", "Configuración"),
    sectionEditorialGlobal: useUiText("admin.shell", "section_editorial_global", "Editorial (Global)"),
    navSeries: useUiText("admin.shell", "nav_series", "Series"),
    navAuthors: useUiText("admin.shell", "nav_authors", "Autores"),
    navEditorialPage: useUiText("admin.shell", "nav_editorial_page", "Página Editorial"),
    navAnalytics: useUiText("admin.shell", "nav_analytics", "Analíticas"),
    navOrders: useUiText("admin.shell", "nav_orders", "Pedidos"),
    navHelp: useUiText("admin.shell", "nav_help", "Ayuda"),
  };

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
        return <SimpleUiTexts />;
      case 'translations':
        return <TranslationManagement />;
      case 'editorial-settings':
        return <EditorialSettingsManagement />;
      case 'analytics':
        return <AnalyticsManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'broadcasts':
        return <BroadcastManagement />;
      case 'subscribers':
        return <SubscribersManagement />;
      case 'newsletter-lists':
        return <NewsletterListsManagement />;
      case 'users':
        return <UsersManagement />;
      case 'help':
        return <HelpInstructions />;
      default:
        return <AdminDashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">{t.loadingAuthors}</div>
      </div>
    );
  }

  // If no authors exist, redirect to author creation
  if (!isLoading && authors.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t.panelTitle}</h1>
          <Link href="/" className="text-primary-foreground hover:text-accent transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-[calc(100vh-88px)]">
          <div className="text-center space-y-4">
            <Users className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">{t.noAuthorsAvailable}</h2>
            <p className="text-muted-foreground">{t.createFirstAuthor}</p>
            <AuthorManagement />
          </div>
        </div>
      </div>
    );
  }
  
  if (!isLoading && !selectedAuthorId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">{t.noAuthorsAvailable}</div>
      </div>
    );
  }

  const selectedAuthor = authors.find(a => a.id === selectedAuthorId);

  return (
    <DynamicTheme authorId={selectedAuthorId!}>
      <SEOHead title={t.panelTitle} />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">{t.panelTitle}</h1>
          <Select value={selectedAuthorId || undefined} onValueChange={setSelectedAuthorId} disabled={isLoading}>
            <SelectTrigger className="w-[250px] bg-primary-foreground text-primary" data-testid="select-admin-author">
              <SelectValue placeholder={t.selectAuthorPlaceholder}>
                {selectedAuthor?.name || t.selectAuthorPlaceholder}
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
                {t.sectionSelectedAuthor}
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
                  {t.navDashboard}
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
                  {t.navBooks}
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
                  {t.navBio}
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
                  {t.navTestimonials}
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
                  {t.navBlog}
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
                  {t.navUiTexts}
                </button>
                <button 
                  onClick={() => setCurrentSection('translations')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'translations' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-translations"
                >
                  <Languages className="h-5 w-5" />
                  {t.navTranslations}
                </button>
                <button
                  onClick={() => setCurrentSection('subscribers')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'subscribers'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-subscribers"
                >
                  <Inbox className="h-5 w-5" />
                  Suscriptores
                </button>
                <button
                  onClick={() => setCurrentSection('newsletter-lists')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'newsletter-lists'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-newsletter-lists"
                >
                  <ListChecks className="h-5 w-5" />
                  Listas
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
                  {t.navSettings}
                </button>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-border my-4"></div>

            {/* Sección de la Editorial */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
                {t.sectionEditorialGlobal}
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
                  {t.navSeries}
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
                  {t.navAuthors}
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
                  {t.navEditorialPage}
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
                  {t.navAnalytics}
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
                  {t.navOrders}
                </button>
                <button
                  onClick={() => setCurrentSection('broadcasts')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'broadcasts'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-broadcasts"
                >
                  <Mail className="h-5 w-5" />
                  Campañas
                </button>
                <button
                  onClick={() => setCurrentSection('users')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    currentSection === 'users'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  data-testid="nav-users"
                >
                  <KeyRound className="h-5 w-5" />
                  Usuarios
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
                  {t.navHelp}
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
