import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { LocaleProvider, useLocale, type Locale } from "@/contexts/locale-context";
import { UiTextProvider } from "@/contexts/ui-text-context";
import { DynamicTheme } from "@/components/dynamic-theme";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CartProvider } from "@/contexts/CartContext";
import { getLocaleFromPath } from "@/lib/localized-routes";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import { useQuery } from "@tanstack/react-query";
import type { Author } from "@shared/schema";
import AuthPage from "@/pages/auth-page";
import BlogList from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import BookLanding from "@/pages/book-landing";
import SeriesLanding from "@/pages/series-landing";
import AuthorPage from "@/pages/author-page";
import AuthorsListPage from "@/pages/authors-list";
import SearchResultsPage from "@/pages/search-results";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function LocaleSync() {
  const [location] = useLocation();
  const { setLocale } = useLocale();

  useEffect(() => {
    const localeFromPath = getLocaleFromPath(location);
    if (localeFromPath) {
      setLocale(localeFromPath);
    }
  }, [location, setLocale]);

  return null;
}

// On a custom (non-platform) host, render the matched AuthorPage directly at
// the bare URL root (and any bare locale root) without changing the URL. The
// SPA's own routes still serve everything else (e.g. /libros, /admin) as
// usual. The server-side customDomainRouter middleware also tags the response
// headers so crawlers/CDNs know which author this hostname maps to.
function CustomDomainRedirect({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const host = typeof window !== "undefined" ? window.location.hostname.replace(/^www\./, "") : "";

  const isPlatformHost = !host
    || host === "localhost"
    || host.endsWith(".replit.dev")
    || host.endsWith(".repl.co")
    || host.endsWith(".replit.app")
    || host.endsWith(".repl.run");

  const { data: customAuthor, isLoading } = useQuery<Author>({
    queryKey: [`/api/authors/by-domain/${host}`],
    enabled: !isPlatformHost,
    retry: false,
  });

  if (!isPlatformHost && isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  // If we're on a custom domain AND at the bare root or a bare locale root,
  // render the AuthorPage inline so the URL stays at "/" (or "/es-ES").
  if (customAuthor) {
    const isRootOrLocaleRoot = /^\/((es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)\/?)?$/.test(location);
    if (isRootOrLocaleRoot) {
      return <AuthorPage slugOverride={customAuthor.slug} />;
    }
  }

  return <>{children}</>;
}

function Router() {
  const { locale } = useLocale();

  return (
    <Switch>
      {/* Admin routes (no locale prefix needed) - MUST be first */}
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/admin" component={Admin} />
      
      {/* Locale-prefixed routes */}
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/" component={Home} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/autores" component={AuthorsListPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/authors" component={AuthorsListPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/autors" component={AuthorsListPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/auteurs" component={AuthorsListPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/autori" component={AuthorsListPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/autoren" component={AuthorsListPage} />
      
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/buscar" component={SearchResultsPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/search" component={SearchResultsPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/cercar" component={SearchResultsPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/rechercher" component={SearchResultsPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/cerca" component={SearchResultsPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/suchen" component={SearchResultsPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/procurar" component={SearchResultsPage} />
      
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/blog" component={BlogList} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/bloc" component={BlogList} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/blogue" component={BlogList} />
      
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/blog/:id" component={BlogPost} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/bloc/:id" component={BlogPost} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/blogue/:id" component={BlogPost} />
      
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/libro/:id" component={BookLanding} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/book/:id" component={BookLanding} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/llibre/:id" component={BookLanding} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/livre/:id" component={BookLanding} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/buch/:id" component={BookLanding} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/livro/:id" component={BookLanding} />
      
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/serie/:id" component={SeriesLanding} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/series/:id" component={SeriesLanding} />
      
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/autor/:slug" component={AuthorPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/author/:slug" component={AuthorPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/auteur/:slug" component={AuthorPage} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/autore/:slug" component={AuthorPage} />
      
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/checkout" component={Checkout} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/pagament" component={Checkout} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/paiement" component={Checkout} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/pagamento" component={Checkout} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/kasse" component={Checkout} />
      
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/pedido/:orderId" component={OrderConfirmation} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/order/:orderId" component={OrderConfirmation} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/comanda/:orderId" component={OrderConfirmation} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/commande/:orderId" component={OrderConfirmation} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/ordine/:orderId" component={OrderConfirmation} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/bestellung/:orderId" component={OrderConfirmation} />
      <Route path="/:locale(es-ES|en-US|ca-ES|fr-FR|it-IT|de-DE|pt-PT)/encomenda/:orderId" component={OrderConfirmation} />
      
      {/* Backward compatibility: non-prefixed routes redirect to locale-prefixed */}
      <Route path="/">
        {() => <Redirect to={`/${locale}/`} />}
      </Route>
      <Route path="/autores">
        {() => <Redirect to={`/${locale}/autores`} />}
      </Route>
      <Route path="/buscar">
        {() => <Redirect to={`/${locale}/buscar`} />}
      </Route>
      <Route path="/search">
        {() => <Redirect to={`/${locale}/search`} />}
      </Route>
      <Route path="/blog">
        {() => <Redirect to={`/${locale}/blog`} />}
      </Route>
      <Route path="/blog/:id">
        {(params) => <Redirect to={`/${locale}/blog/${params.id}`} />}
      </Route>
      <Route path="/libro/:id">
        {(params) => <Redirect to={`/${locale}/libro/${params.id}`} />}
      </Route>
      <Route path="/serie/:id">
        {(params) => <Redirect to={`/${locale}/serie/${params.id}`} />}
      </Route>
      <Route path="/autor/:slug">
        {(params) => <Redirect to={`/${locale}/autor/${params.slug}`} />}
      </Route>
      <Route path="/checkout">
        {() => <Redirect to={`/${locale}/checkout`} />}
      </Route>
      <Route path="/pedido/:orderId">
        {(params) => <Redirect to={`/${locale}/pedido/${params.orderId}`} />}
      </Route>
      <Route path="/order-confirmation/:orderId">
        {(params) => <Redirect to={`/${locale}/pedido/${params.orderId}`} />}
      </Route>
      
      {/* 404 Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AnalyticsProvider>
          <DynamicTheme>
            <UiTextProvider>
              <AuthProvider>
                <CartProvider>
                  <TooltipProvider>
                    <Toaster />
                    <LocaleSync />
                    <CustomDomainRedirect>
                      <Router />
                    </CustomDomainRedirect>
                  </TooltipProvider>
                </CartProvider>
              </AuthProvider>
            </UiTextProvider>
          </DynamicTheme>
        </AnalyticsProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

export default App;
