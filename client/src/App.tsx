import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { UiTextProvider } from "@/contexts/ui-text-context";
import { DynamicTheme } from "@/components/dynamic-theme";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import AuthPage from "@/pages/auth-page";
import BlogList from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import BookLanding from "@/pages/book-landing";
import SeriesLanding from "@/pages/series-landing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/blog" component={BlogList} />
      <Route path="/blog/:id" component={BlogPost} />
      <Route path="/libro/:id" component={BookLanding} />
      <Route path="/serie/:id" component={SeriesLanding} />
      <ProtectedRoute path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicTheme>
        <UiTextProvider locale="es-ES">
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </UiTextProvider>
      </DynamicTheme>
    </QueryClientProvider>
  );
}

export default App;
