import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Star, Plus, Edit, MessageSquare } from "lucide-react";
import type { Book, BookSeries, Testimonial } from "@shared/schema";
import { useUiText } from "@/contexts/ui-text-context";

export default function AdminDashboard() {
  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"]
  });

  const { data: series = [] } = useQuery<BookSeries[]>({
    queryKey: ["/api/book-series"]
  });

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"]
  });

  const activeSeries = series.filter(s => s.isActive);
  const publishedBooks = books.filter(b => b.isPublished);
  
  const t = {
    pageTitle: useUiText("admin.dashboard", "page_title", "Dashboard"),
    statTotalBooksTitle: useUiText("admin.dashboard", "stat_total_books_title", "Total Libros"),
    statPublishedLabel: useUiText("admin.dashboard", "stat_published_label", "publicados"),
    statActiveSeriesTitle: useUiText("admin.dashboard", "stat_active_series_title", "Series Activas"),
    statTotalLabel: useUiText("admin.dashboard", "stat_total_label", "total"),
    statTestimonialsTitle: useUiText("admin.dashboard", "stat_testimonials_title", "Testimonios"),
    recentActivityTitle: useUiText("admin.dashboard", "recent_activity_title", "Actividad Reciente"),
    activitySystemInitialized: useUiText("admin.dashboard", "activity_system_initialized", "Sistema inicializado con datos de ejemplo"),
    activityTimeAgo: useUiText("admin.dashboard", "activity_time_ago", "Hace unos momentos"),
    activityBioConfigured: useUiText("admin.dashboard", "activity_bio_configured", "Biografía de autor configurada"),
    activityTestimonialsAdded: useUiText("admin.dashboard", "activity_testimonials_added", "Testimonios de ejemplo agregados"),
  };

  return (
    <div>
      <h3 className="text-3xl font-bold text-primary mb-6">{t.pageTitle}</h3>
      
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.statTotalBooksTitle}</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="stat-total-books">{books.length}</div>
            <p className="text-xs text-muted-foreground">
              {publishedBooks.length} {t.statPublishedLabel}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-accent/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.statActiveSeriesTitle}</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-foreground" data-testid="stat-active-series">{activeSeries.length}</div>
            <p className="text-xs text-muted-foreground">
              {series.length} {t.statTotalLabel}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.statTestimonialsTitle}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground" data-testid="stat-testimonials">{testimonials.length}</div>
            <p className="text-xs text-muted-foreground">
              {testimonials.filter(t => t.isPublished).length} {t.statPublishedLabel}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{t.recentActivityTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-muted rounded-lg" data-testid="activity-item-1">
              <Plus className="h-5 w-5 text-primary mr-3" />
              <span>{t.activitySystemInitialized}</span>
              <span className="ml-auto text-sm text-muted-foreground">{t.activityTimeAgo}</span>
            </div>
            <div className="flex items-center p-3 bg-muted rounded-lg" data-testid="activity-item-2">
              <Edit className="h-5 w-5 text-accent mr-3" />
              <span>{t.activityBioConfigured}</span>
              <span className="ml-auto text-sm text-muted-foreground">{t.activityTimeAgo}</span>
            </div>
            <div className="flex items-center p-3 bg-muted rounded-lg" data-testid="activity-item-3">
              <MessageSquare className="h-5 w-5 text-secondary-foreground mr-3" />
              <span>{t.activityTestimonialsAdded}</span>
              <span className="ml-auto text-sm text-muted-foreground">{t.activityTimeAgo}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
