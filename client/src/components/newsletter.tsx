import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Gift, Check, Users, Mail, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUiText } from "@/contexts/ui-text-context";
import type { InsertNewsletter, Author } from "@shared/schema";

interface NewsletterProps {
  authorId?: string;
}

export default function Newsletter({ authorId }: NewsletterProps = {}) {
  const newsletterTitle = useUiText("home", "newsletter_title", "Únete a Nuestra Comunidad");
  const newsletterSubtitle = useUiText("home", "newsletter_subtitle", "Suscríbete a nuestro newsletter y recibe un libro gratuito, además de ser el primero en conocer sobre nuevos lanzamientos, ofertas exclusivas y contenido especial.");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authors = [] } = useQuery<Author[]>({
    queryKey: ["/api/authors"],
    enabled: !authorId,
  });

  const defaultAuthorId = authorId || authors[0]?.id;

  // Fetch the author so we can surface per-author free book + mailing list flag
  const { data: scopedAuthor } = useQuery<Author>({
    queryKey: [`/api/authors/${defaultAuthorId}`],
    enabled: !!defaultAuthorId,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: InsertNewsletter) => {
      const response = await apiRequest("POST", "/api/newsletter", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Suscripción exitosa!",
        description: "Revisa tu email para descargar tu libro gratuito.",
      });
      setName("");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Hubo un problema con tu suscripción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos.",
        variant: "destructive",
      });
      return;
    }
    if (!defaultAuthorId) {
      toast({
        title: "Error",
        description: "No se pudo identificar el autor.",
        variant: "destructive",
      });
      return;
    }
    subscribeMutation.mutate({ 
      name: name.trim(), 
      email: email.trim(),
      authorId: defaultAuthorId
    });
  };

  // Hide newsletter section entirely if this author opted out
  if (scopedAuthor && scopedAuthor.mailingListEnabled === false) {
    return null;
  }

  const freeBookTitle = scopedAuthor?.freeBookTitle || 'Libro digital gratuito';
  const freeBookDescription = scopedAuthor?.freeBookDescription;
  const freeBookCover = scopedAuthor?.freeBookCover;
  const freeBookCtaText = scopedAuthor?.freeBookCtaText || 'Quiero Mi Libro Gratis';

  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            {newsletterTitle}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            {newsletterSubtitle}
          </p>

          <Card className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h3 className="text-2xl font-serif font-bold mb-4 flex items-center">
                  <Gift className="h-6 w-6 mr-2" />
                  Regalo de Bienvenida
                </h3>
                <p className="opacity-90 mb-4">
                  Al suscribirte recibirás inmediatamente:
                </p>
                <ul className="space-y-2 opacity-90">
                  <li className="flex items-center" data-testid="text-free-book-title">
                    <Check className="h-5 w-5 mr-3 text-accent" />
                    {freeBookTitle}
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-3 text-accent" />
                    Acceso a contenido exclusivo
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-3 text-accent" />
                    Descuentos especiales en próximos lanzamientos
                  </li>
                </ul>
                {freeBookDescription && (
                  <p className="text-sm opacity-80 mt-3" data-testid="text-free-book-description">{freeBookDescription}</p>
                )}
                {freeBookCover && (
                  <img
                    src={freeBookCover}
                    alt={freeBookTitle}
                    className="mt-4 rounded-lg shadow-lg max-h-48 object-contain"
                    data-testid="img-free-book-cover"
                  />
                )}
              </div>
              <div>
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="newsletter-form">
                  <div>
                    <Input
                      type="text"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white text-foreground border border-border focus:ring-2 focus:ring-accent focus:border-transparent"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Tu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white text-foreground border border-border focus:ring-2 focus:ring-accent focus:border-transparent"
                      data-testid="input-email"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={subscribeMutation.isPending}
                    className="w-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-all transform hover:scale-105"
                    data-testid="button-subscribe"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    {subscribeMutation.isPending ? "Suscribiendo..." : freeBookCtaText}
                  </Button>
                </form>
                <p className="text-sm opacity-70 mt-4">
                  * No spam, solo contenido de calidad. Puedes darte de baja en cualquier momento.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-center items-center space-x-8 text-sm opacity-70">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>+5,000 lectores</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              <span>Newsletter semanal</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2" />
              <span>Contenido exclusivo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
