import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { LocaleProvider } from "@/contexts/locale-context";
import { UiTextProvider } from "@/contexts/ui-text-context";
import { DynamicTheme } from "@/components/dynamic-theme";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CartProvider } from "@/contexts/CartContext";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import AuthPage from "@/pages/auth-page";
import BlogList from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import BookLanding from "@/pages/book-landing";
import SeriesLanding from "@/pages/series-landing";
import AuthorPage from "@/pages/author-page";
import AuthorsListPage from "@/pages/authors-list";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/autores" component={AuthorsListPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/blog" component={BlogList} />
      <Route path="/blog/:id" component={BlogPost} />
      <Route path="/libro/:id" component={BookLanding} />
      <Route path="/serie/:id" component={SeriesLanding} />
      <Route path="/autor/:slug" component={AuthorPage} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/pedido/:orderId" component={OrderConfirmation} />
      <Route path="/order-confirmation/:orderId" component={OrderConfirmation} />
      <ProtectedRoute path="/admin" component={Admin} />
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
                    <Router />
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
