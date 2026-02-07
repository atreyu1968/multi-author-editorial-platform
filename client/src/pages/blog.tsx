import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Search, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Newsletter from "@/components/newsletter";
import { SEOHead, generateStructuredData } from "@/components/seo/seo-head";
import { useUiText } from "@/contexts/ui-text-context";
import type { BlogPost } from "@shared/schema";

export default function BlogList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Load all UI texts
  const t = {
    seoTitle: useUiText("blog", "seo_title", "Blog - María González Autora"),
    seoDescription: useUiText("blog", "seo_description", "Lee los últimos artículos de María González sobre escritura, proceso creativo, próximos lanzamientos y consejos para escritores emergentes."),
    seoKeywordBlog: useUiText("blog", "seo_keyword_blog", "blog"),
    seoKeywordEscritura: useUiText("blog", "seo_keyword_escritura", "escritura"),
    seoKeywordProcesoCreativo: useUiText("blog", "seo_keyword_proceso_creativo", "proceso creativo"),
    seoKeywordConsejos: useUiText("blog", "seo_keyword_consejos", "consejos"),
    seoKeywordNoticias: useUiText("blog", "seo_keyword_noticias", "noticias"),
    seoKeywordAutora: useUiText("blog", "seo_keyword_autora", "autora"),
    pageTitle: useUiText("blog", "page_title", "Mi Blog"),
    heroSubtitle: useUiText("blog", "hero_subtitle", "Comparto mi proceso creativo, noticias sobre mis próximos libros, consejos para escritores y reflexiones sobre el maravilloso mundo de la literatura."),
    searchPlaceholder: useUiText("blog", "search_placeholder", "Buscar artículos..."),
    categoryFilterPlaceholder: useUiText("blog", "category_filter_placeholder", "Todas las categorías"),
    categoryAll: useUiText("blog", "category_all", "Todas las categorías"),
    noArticlesFound: useUiText("blog", "no_articles_found", "No se encontraron artículos"),
    articleCountSingular: useUiText("blog", "article_count_singular", "artículo encontrado"),
    articleCountPlural: useUiText("blog", "article_count_plural", "artículos encontrados"),
    noArticlesAvailable: useUiText("blog", "no_articles_available", "No hay artículos disponibles"),
    tryOtherSearch: useUiText("blog", "try_other_search", "Prueba con otros términos de búsqueda o cambia los filtros."),
    comingSoon: useUiText("blog", "coming_soon", "Pronto compartiré más contenido aquí. ¡Mantente atento!"),
    clearFilters: useUiText("blog", "clear_filters", "Limpiar filtros"),
    imageAltPrefix: useUiText("blog", "image_alt_prefix", "Imagen de:"),
    readMore: useUiText("blog", "read_more", "Leer más"),
    tagsMore: useUiText("blog", "tags_more", "más"),
    footerName: useUiText("blog", "footer_name", "María González"),
    footerBio: useUiText("blog", "footer_bio", "Autora bestseller especializada en romance, thriller y fantasía. Creando historias que tocan el corazón desde 2012."),
    footerCopyright: useUiText("blog", "footer_copyright", "© 2026 Atreyu Servicios Digitales. Todos los derechos reservados."),
  };

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts/published"],
  });

  // Filter posts based on search and category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(posts.map(post => post.category).filter(Boolean)));

  if (isLoading) {
    return (
      <div className="bg-background text-foreground font-sans">
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground font-sans">
      <SEOHead
        title={t.seoTitle}
        description={t.seoDescription}
        keywords={[t.seoKeywordBlog, t.seoKeywordEscritura, t.seoKeywordProcesoCreativo, t.seoKeywordConsejos, t.seoKeywordNoticias, t.seoKeywordAutora]}
        ogType="website"
      />
      
      <Navigation />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/5 to-secondary/5 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-serif font-bold mb-6 text-primary" data-testid="blog-title">
                {t.pageTitle}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t.heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48" data-testid="category-filter">
                  <SelectValue placeholder={t.categoryFilterPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.categoryAll}</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results Info */}
            <div className="mb-8">
              <p className="text-muted-foreground" data-testid="results-count">
                {filteredPosts.length === 0 ? t.noArticlesFound : 
                 `${filteredPosts.length} ${filteredPosts.length === 1 ? t.articleCountSingular : t.articleCountPlural}`}
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-4xl mx-auto">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="text-2xl font-semibold mb-4">{t.noArticlesAvailable}</h3>
                <p className="text-muted-foreground mb-8">
                  {searchTerm || selectedCategory !== "all" ? 
                    t.tryOtherSearch :
                    t.comingSoon
                  }
                </p>
                {(searchTerm || selectedCategory !== "all") && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                    }}
                    data-testid="clear-filters"
                  >
                    {t.clearFilters}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-8">
                {filteredPosts.map((post, index) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`post-card-${index}`}>
                    <div className="grid md:grid-cols-3 gap-0">
                      {/* Featured Image */}
                      {post.featuredImage && (
                        <div className="md:col-span-1">
                          <img
                            src={post.featuredImage}
                            alt={`${t.imageAltPrefix} ${post.title}`}
                            className="w-full h-48 md:h-full object-cover"
                            data-testid={`post-image-${index}`}
                          />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className={`${post.featuredImage ? 'md:col-span-2' : 'md:col-span-3'}`}>
                        <CardHeader>
                          <div className="flex flex-wrap items-center gap-4 mb-3">
                            {post.category && (
                              <Badge variant="secondary" data-testid={`post-category-${index}`}>
                                {post.category}
                              </Badge>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Calendar className="h-4 w-4" />
                              <span data-testid={`post-date-${index}`}>
                                {new Date(post.publishedAt || post.createdAt || new Date()).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                          <CardTitle className="text-2xl font-serif line-clamp-2" data-testid={`post-title-${index}`}>
                            {post.title}
                          </CardTitle>
                        </CardHeader>
                        
                        <CardContent>
                          <CardDescription className="text-base line-clamp-3 leading-relaxed" data-testid={`post-excerpt-${index}`}>
                            {post.excerpt}
                          </CardDescription>
                        </CardContent>
                        
                        <CardFooter className="flex justify-between items-center">
                          <div className="flex gap-2 flex-wrap">
                            {post.tags && post.tags.slice(0, 3).map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="outline" className="text-xs" data-testid={`post-tag-${index}-${tagIndex}`}>
                                {tag}
                              </Badge>
                            ))}
                            {post.tags && post.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.tags.length - 3} {t.tagsMore}
                              </Badge>
                            )}
                          </div>
                          <Link href={`/blog/${post.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`read-more-${index}`}>
                              {t.readMore}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Newsletter />

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-primary mb-4">
              {t.footerName}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t.footerBio}
            </p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-amazon text-xl"></i>
              </a>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>{t.footerCopyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}