import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, User, BookOpen, Library, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EditorialNavigation from "@/components/editorial-navigation";
import { SEOHead } from "@/components/seo/seo-head";
import { useUiText } from "@/contexts/ui-text-context";
import { useLocale } from "@/contexts/locale-context";
import { getLocalizedPath } from "@/lib/localized-routes";
import type { Author, BookSeries, Book } from "@shared/schema";

interface SearchResults {
  authors: Author[];
  series: BookSeries[];
  books: Book[];
}

type FilterType = "all" | "authors" | "series" | "books";

export default function SearchResultsPage() {
  const [location, setLocation] = useLocation();
  const { locale } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // UI Texts
  const pageTitle = useUiText("search", "search_page_title", "Resultados de búsqueda");
  const filterAll = useUiText("search", "search_filter_all", "Todos");
  const filterAuthors = useUiText("search", "search_filter_authors", "Autores");
  const filterSeries = useUiText("search", "search_filter_series", "Series");
  const filterBooks = useUiText("search", "search_filter_books", "Libros");
  const resultsCount = useUiText("search", "search_results_count", "{count} resultados");
  const noResultsMessage = useUiText("search", "search_no_results_message", "No encontramos nada con '{query}'. Intenta con otros términos.");
  const searchPlaceholder = useUiText("search", "search_placeholder", "Buscar autores, series, libros...");
  const viewAuthor = useUiText("search", "view_author", "Ver autor");
  const viewSeries = useUiText("search", "view_series", "Ver serie");
  const viewBook = useUiText("search", "view_book", "Ver libro");

  // Parse URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const q = params.get('q') || '';
    const filter = (params.get('filter') || 'all') as FilterType;
    
    setSearchQuery(q);
    setActiveFilter(filter);
  }, [location]);

  // Update URL when search or filter changes
  const updateURL = (query: string, filter: FilterType) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filter !== 'all') params.set('filter', filter);
    
    const searchPath = getLocalizedPath('search', locale);
    const newPath = params.toString() ? `${searchPath}?${params.toString()}` : searchPath;
    setLocation(newPath);
  };

  // Fetch search results
  const { data, isLoading } = useQuery<SearchResults>({
    queryKey: ["/api/search", { q: searchQuery }],
    enabled: searchQuery.length >= 2,
    staleTime: 1000 * 60,
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateURL(value, activeFilter);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    updateURL(searchQuery, filter);
  };

  // Navigate to result pages
  const navigateToAuthor = (slug: string) => {
    const path = getLocalizedPath('author', locale, { slug });
    setLocation(path);
  };

  const navigateToSeries = (id: string) => {
    const path = getLocalizedPath('series', locale, { id });
    setLocation(path);
  };

  const navigateToBook = (id: string) => {
    const path = getLocalizedPath('book', locale, { id });
    setLocation(path);
  };

  // Calculate counts
  const authorsCount = data?.authors?.length || 0;
  const seriesCount = data?.series?.length || 0;
  const booksCount = data?.books?.length || 0;
  const totalCount = authorsCount + seriesCount + booksCount;

  // Format results count message
  const formatResultsCount = (count: number) => {
    return resultsCount.replace('{count}', count.toString());
  };

  // Format no results message
  const formatNoResultsMessage = () => {
    return noResultsMessage.replace('{query}', searchQuery);
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="text-center py-20" data-testid="search-no-results">
      <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <p className="text-lg text-muted-foreground">
        {searchQuery ? formatNoResultsMessage() : "Ingresa un término de búsqueda para comenzar"}
      </p>
    </div>
  );

  // Author card component
  const AuthorCard = ({ author }: { author: Author }) => (
    <Card 
      key={author.id}
      className="bg-card rounded-xl shadow-lg border border-border overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
      onClick={() => navigateToAuthor(author.slug)}
      data-testid={`search-author-card-${author.id}`}
    >
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20">
        {author.photo ? (
          <img 
            src={author.photo} 
            alt={author.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-24 w-24 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-serif font-bold text-primary mb-2">
          {author.name}
        </h3>
        {author.heroTitle && (
          <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-2">
            {author.heroTitle}
          </p>
        )}
        <div className="text-sm text-accent font-medium">
          {viewAuthor} →
        </div>
      </div>
    </Card>
  );

  // Series card component
  const SeriesCard = ({ series }: { series: BookSeries }) => (
    <Card 
      key={series.id}
      className="bg-card rounded-xl shadow-lg border border-border overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
      onClick={() => navigateToSeries(series.id)}
      data-testid={`search-series-card-${series.id}`}
    >
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20">
        {series.cardBackgroundImage ? (
          <img 
            src={series.cardBackgroundImage} 
            alt={series.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Library className="h-24 w-24 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-serif font-bold text-primary mb-2">
          {series.title}
        </h3>
        {series.description && (
          <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-3">
            {series.description}
          </p>
        )}
        {series.genre && (
          <div className="text-sm text-muted-foreground mb-2">
            {series.genre}
          </div>
        )}
        <div className="text-sm text-accent font-medium">
          {viewSeries} →
        </div>
      </div>
    </Card>
  );

  // Book card component
  const BookCard = ({ book }: { book: Book }) => (
    <Card 
      key={book.id}
      className="bg-card rounded-xl shadow-lg border border-border overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
      onClick={() => navigateToBook(book.id)}
      data-testid={`search-book-card-${book.id}`}
    >
      <div className="relative h-80 bg-gradient-to-br from-primary/20 to-accent/20">
        {book.coverImage ? (
          <img 
            src={book.coverImage} 
            alt={book.title}
            className="w-full h-full object-cover aspect-[2/3]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center aspect-[2/3]">
            <BookOpen className="h-24 w-24 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-serif font-bold text-primary mb-2 line-clamp-2">
          {book.title}
        </h3>
        {book.description && (
          <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-3 text-sm">
            {book.description}
          </p>
        )}
        {book.genre && (
          <div className="text-sm text-muted-foreground mb-2">
            {book.genre}
          </div>
        )}
        <div className="text-sm text-accent font-medium">
          {viewBook} →
        </div>
      </div>
    </Card>
  );

  return (
    <div className="bg-background text-foreground font-sans min-h-screen">
      <SEOHead
        title={`${pageTitle} - ${searchQuery || ''}`}
        description={`Busca entre autores, series y libros. ${searchQuery ? `Resultados para: ${searchQuery}` : ''}`}
        keywords={["búsqueda", "autores", "series", "libros", "literatura"]}
        ogType="website"
      />
      <EditorialNavigation />

      {/* Search Header */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-white text-center">
              {pageTitle}
            </h1>
            
            {/* Search Input */}
            <div className="relative" data-testid="search-input-container">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-12 pr-4 h-14 text-lg bg-white dark:bg-background"
                data-testid="input-search-page"
              />
            </div>

            {/* Results count */}
            {searchQuery && data && totalCount > 0 && (
              <div className="mt-4 text-white text-center" data-testid="search-results-count">
                {formatResultsCount(totalCount)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {searchQuery.length < 2 ? (
            <EmptyState />
          ) : (
            <Tabs value={activeFilter} onValueChange={(value) => handleFilterChange(value as FilterType)} className="w-full">
              {/* Filter Tabs */}
              <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8" data-testid="search-filter-tabs">
                <TabsTrigger value="all" data-testid="filter-tab-all">
                  {filterAll} {totalCount > 0 && `(${totalCount})`}
                </TabsTrigger>
                <TabsTrigger value="authors" data-testid="filter-tab-authors">
                  {filterAuthors} {authorsCount > 0 && `(${authorsCount})`}
                </TabsTrigger>
                <TabsTrigger value="series" data-testid="filter-tab-series">
                  {filterSeries} {seriesCount > 0 && `(${seriesCount})`}
                </TabsTrigger>
                <TabsTrigger value="books" data-testid="filter-tab-books">
                  {filterBooks} {booksCount > 0 && `(${booksCount})`}
                </TabsTrigger>
              </TabsList>

              {/* All Results */}
              <TabsContent value="all" data-testid="search-results-all">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : totalCount === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-12">
                    {/* Authors Section */}
                    {authorsCount > 0 && (
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center gap-2">
                          <User className="h-6 w-6" />
                          {filterAuthors} ({authorsCount})
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {data?.authors.map((author) => (
                            <AuthorCard key={author.id} author={author} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Series Section */}
                    {seriesCount > 0 && (
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center gap-2">
                          <Library className="h-6 w-6" />
                          {filterSeries} ({seriesCount})
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {data?.series.map((series) => (
                            <SeriesCard key={series.id} series={series} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Books Section */}
                    {booksCount > 0 && (
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center gap-2">
                          <BookOpen className="h-6 w-6" />
                          {filterBooks} ({booksCount})
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {data?.books.map((book) => (
                            <BookCard key={book.id} book={book} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Authors Only */}
              <TabsContent value="authors" data-testid="search-results-authors">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : authorsCount === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.authors.map((author) => (
                      <AuthorCard key={author.id} author={author} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Series Only */}
              <TabsContent value="series" data-testid="search-results-series">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : seriesCount === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.series.map((series) => (
                      <SeriesCard key={series.id} series={series} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Books Only */}
              <TabsContent value="books" data-testid="search-results-books">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : booksCount === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.books.map((book) => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>
    </div>
  );
}
