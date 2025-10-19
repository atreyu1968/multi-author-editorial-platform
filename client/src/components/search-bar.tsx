import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, User, BookOpen, Library, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUiText } from "@/contexts/ui-text-context";
import { useLocale } from "@/contexts/locale-context";
import { getLocalizedPath } from "@/lib/localized-routes";
import type { Author, BookSeries, Book } from "@shared/schema";

interface SearchResults {
  authors: Author[];
  series: BookSeries[];
  books: Book[];
}

export default function SearchBar() {
  const [, setLocation] = useLocation();
  const { locale } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // UI Texts
  const searchPlaceholder = useUiText("search", "search_placeholder", "Buscar autores, series, libros...");
  const searchAuthors = useUiText("search", "search_authors", "Autores");
  const searchSeries = useUiText("search", "search_series", "Series");
  const searchBooks = useUiText("search", "search_books", "Libros");
  const searchNoResults = useUiText("search", "search_no_results", "No se encontraron resultados");
  const searchSearching = useUiText("search", "search_searching", "Buscando...");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const { data, isLoading } = useQuery<SearchResults>({
    queryKey: ["/api/search", { q: debouncedQuery }],
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60,
  });

  // Calculate total results and flatten for keyboard navigation
  const allResults = data
    ? [
        ...(data.authors || []).slice(0, 5).map(item => ({ type: 'author' as const, data: item })),
        ...(data.series || []).slice(0, 5).map(item => ({ type: 'series' as const, data: item })),
        ...(data.books || []).slice(0, 5).map(item => ({ type: 'book' as const, data: item })),
      ]
    : [];

  const hasResults = allResults.length > 0;
  const showResults = isOpen && debouncedQuery.length >= 2;

  // Handle navigation to result
  const navigateToResult = useCallback((type: 'author' | 'series' | 'book', item: any) => {
    let path = "";
    
    if (type === 'author') {
      path = getLocalizedPath('author', locale, { slug: item.slug });
    } else if (type === 'series') {
      path = getLocalizedPath('series', locale, { id: item.id });
    } else if (type === 'book') {
      path = getLocalizedPath('book', locale, { id: item.id });
    }
    
    setLocation(path);
    setIsOpen(false);
    setSearchQuery("");
    setSelectedIndex(-1);
  }, [locale, setLocation]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          const result = allResults[selectedIndex];
          navigateToResult(result.type, result.data);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Highlight search term in text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="font-semibold text-primary">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <Popover open={showResults} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md" data-testid="search-bar-container">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (debouncedQuery.length >= 2) {
                setIsOpen(true);
              }
            }}
            className="pl-10 pr-4"
            data-testid="input-search"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        data-testid="search-results-popover"
      >
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground" data-testid="search-loading">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              {searchSearching}
            </div>
          ) : !hasResults ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="search-no-results">
              {searchNoResults}
            </div>
          ) : (
            <div className="py-2">
              {/* Authors */}
              {data?.authors && data.authors.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {searchAuthors}
                  </div>
                  <div className="space-y-1 px-1">
                    {data.authors.slice(0, 5).map((author, idx) => {
                      const globalIndex = allResults.findIndex(r => r.type === 'author' && r.data.id === author.id);
                      return (
                        <button
                          key={author.id}
                          onClick={() => navigateToResult('author', author)}
                          className={cn(
                            "w-full text-left px-2 py-2 rounded-sm hover:bg-accent transition-colors flex items-center gap-3",
                            selectedIndex === globalIndex && "bg-accent"
                          )}
                          data-testid={`search-result-author-${author.id}`}
                        >
                          {author.photo ? (
                            <img 
                              src={author.photo} 
                              alt={author.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {highlightMatch(author.name, debouncedQuery)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Series */}
              {data?.series && data.series.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Library className="h-3 w-3" />
                    {searchSeries}
                  </div>
                  <div className="space-y-1 px-1">
                    {data.series.slice(0, 5).map((series) => {
                      const globalIndex = allResults.findIndex(r => r.type === 'series' && r.data.id === series.id);
                      return (
                        <button
                          key={series.id}
                          onClick={() => navigateToResult('series', series)}
                          className={cn(
                            "w-full text-left px-2 py-2 rounded-sm hover:bg-accent transition-colors",
                            selectedIndex === globalIndex && "bg-accent"
                          )}
                          data-testid={`search-result-series-${series.id}`}
                        >
                          <div className="font-medium text-sm">
                            {highlightMatch(series.title, debouncedQuery)}
                          </div>
                          {series.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {series.description.slice(0, 60)}...
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Books */}
              {data?.books && data.books.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-3 w-3" />
                    {searchBooks}
                  </div>
                  <div className="space-y-1 px-1">
                    {data.books.slice(0, 5).map((book) => {
                      const globalIndex = allResults.findIndex(r => r.type === 'book' && r.data.id === book.id);
                      return (
                        <button
                          key={book.id}
                          onClick={() => navigateToResult('book', book)}
                          className={cn(
                            "w-full text-left px-2 py-2 rounded-sm hover:bg-accent transition-colors flex items-center gap-3",
                            selectedIndex === globalIndex && "bg-accent"
                          )}
                          data-testid={`search-result-book-${book.id}`}
                        >
                          {book.coverImage ? (
                            <img 
                              src={book.coverImage} 
                              alt={book.title}
                              className="h-12 w-9 object-cover rounded"
                            />
                          ) : (
                            <div className="h-12 w-9 bg-muted flex items-center justify-center rounded">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {highlightMatch(book.title, debouncedQuery)}
                            </div>
                            {book.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {book.description.slice(0, 50)}...
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
