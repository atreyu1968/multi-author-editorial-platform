import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Gift, Check, Users, Mail, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUiText } from "@/contexts/ui-text-context";
import { useLocale } from "@/contexts/locale-context";
import type { Author, NewsletterList } from "@shared/schema";

// RGPD: keep this disclosure aligned with the server-side `GDPR_CONSENT_TEXT`
// constant in server/routes.ts. The exact wording shown here is what the
// server snapshots on the subscriber row at signup time.
const GDPR_CONSENT_LABEL =
  "Acepto recibir el libro gratuito (cuando aplica) y los correos comerciales del autor o editorial (novedades, ofertas y contenido). Puedo darme de baja en un solo clic desde cualquier email. Mis datos se tratan conforme al RGPD.";

interface NewsletterProps {
  authorId?: string;
}

export default function Newsletter({ authorId }: NewsletterProps = {}) {
  const newsletterTitle = useUiText("home", "newsletter_title", "Únete a Nuestra Comunidad");
  const newsletterSubtitle = useUiText("home", "newsletter_subtitle", "Suscríbete a nuestro newsletter y recibe un libro gratuito, además de ser el primero en conocer sobre nuevos lanzamientos, ofertas exclusivas y contenido especial.");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { locale } = useLocale();

  const { data: authors = [] } = useQuery<Author[]>({
    queryKey: ["/api/authors"],
    enabled: !authorId,
  });

  const defaultAuthorId = authorId || authors[0]?.id;

  // Fetch the author so we can surface per-author free book + mailing list flag
  const { data: scopedAuthor, isLoading: isAuthorLoading } = useQuery<Author>({
    queryKey: [`/api/authors/${defaultAuthorId}`],
    enabled: !!defaultAuthorId,
  });

  // Fetch active interest lists for this author so subscribers can opt in
  // at signup time. Tolerates the endpoint returning [] for authors with
  // no lists configured.
  const { data: lists = [] } = useQuery<NewsletterList[]>({
    queryKey: ["/api/authors", defaultAuthorId, "newsletter-lists"],
    enabled: !!defaultAuthorId,
    queryFn: async () => {
      try {
        const r = await fetch(`/api/authors/${defaultAuthorId}/newsletter-lists`, { credentials: "include" });
        if (!r.ok) return [];
        return (await r.json()) as NewsletterList[];
      } catch {
        return [];
      }
    },
  });

  // Pre-check default lists once they load (only when nothing has been chosen yet).
  useEffect(() => {
    if (lists.length > 0 && selectedListIds.length === 0) {
      const defaults = lists.filter((l) => l.isDefault).map((l) => l.id);
      if (defaults.length > 0) setSelectedListIds(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists]);

  // Endpoint depends on whether the scoped author has a free book configured:
  //   - With a free book: POST /api/authors/:id/free-book/claim, which
  //     subscribes AND emails a one-time tokenized download link (raw file
  //     URL is never sent).
  //   - Without a free book: POST /api/newsletter for a plain subscription
  //     (so authors with mailingListEnabled=true but no gift can still
  //     collect signups).
  const subscribeMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; authorId: string; listIds: string[]; format?: string }) => {
      // The free-book endpoint only fires when the author has at least one
      // file format set (legacy `freeBookFile` OR any of the four format
      // columns). Otherwise we fall back to the plain newsletter endpoint
      // so authors with mailingListEnabled=true but no gift can still
      // collect signups.
      const endpoint = hasFreeBook
        ? `/api/authors/${data.authorId}/free-book/claim`
        : `/api/newsletter`;
      // Best-effort: send the browser's IANA timezone so the per-recipient
      // local-9-a.m. broadcast scheduler can deliver each subscriber's
      // campaign at 9 a.m. their own local time. Falls back to undefined on
      // older browsers; the server treats it as optional.
      let browserTimezone: string | undefined;
      try {
        browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
      } catch { /* ignore */ }
      // Always send the active UI locale so subscribers/tokens are tagged
      // with the language they signed up in (used for downstream emails).
      // `consent: true` is required by both endpoints (RGPD).
      const body = hasFreeBook
        ? { name: data.name, email: data.email, locale, consent: true, listIds: data.listIds, timezone: browserTimezone, format: data.format }
        : { name: data.name, email: data.email, authorId: data.authorId, locale, consent: true, listIds: data.listIds, timezone: browserTimezone };
      const response = await apiRequest("POST", endpoint, body);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Suscripción exitosa!",
        description: hasFreeBook
          ? "Revisa tu email para descargar tu libro gratuito."
          : "Te has suscrito correctamente a la newsletter.",
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
    if (!consent) {
      toast({
        title: "Necesitamos tu consentimiento",
        description: "Marca la casilla de aceptación para suscribirte (RGPD).",
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
      authorId: defaultAuthorId,
      listIds: selectedListIds,
    });
  };

  function toggleList(id: string, checked: boolean) {
    setSelectedListIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((x) => x !== id);
    });
  }

  // The free-book CTA itself is gated separately below: when the author has no
  // free-book file configured we still render the signup form (subscription is
  // a standalone feature) but suppress the gift-themed copy and cover.
  // The book is considered "available" if any of the legacy generic file or
  // any of the per-format files is set.
  //
  // IMPORTANT: this block — including the `useEffect` that auto-selects the
  // default format — must run BEFORE the early `return null` guards below.
  // Otherwise the hook count changes across renders (the effect is skipped
  // while the author query is loading and then appears once data arrives),
  // which is React's "rendered more hooks than during the previous render"
  // (error #310) — in a minified production build that turns the whole page
  // blank, even though dev builds usually show the helpful overlay.
  const formatOptions: { value: string; label: string; available: boolean }[] = [
    { value: "epub", label: "EPUB (Kobo, Apple Books, lectores genéricos)", available: !!scopedAuthor?.freeBookFileEpub },
    { value: "pdf",  label: "PDF (cualquier dispositivo)",                  available: !!scopedAuthor?.freeBookFilePdf },
    { value: "azw3", label: "AZW3 (Kindle moderno)",                        available: !!scopedAuthor?.freeBookFileAzw3 },
    { value: "mobi", label: "MOBI (Kindle antiguo)",                        available: !!scopedAuthor?.freeBookFileMobi },
  ];
  const availableFormats = formatOptions.filter((f) => f.available);
  const hasFreeBook = !!scopedAuthor?.freeBookFile || availableFormats.length > 0;
  const showFormatChooser = availableFormats.length >= 2;

  // Default the radio selection to the first available format when the
  // author profile loads, so the user doesn't have to pick one when only
  // a couple are offered (saves a click on mobile).
  useEffect(() => {
    if (availableFormats.length > 0 && !selectedFormat) {
      setSelectedFormat(availableFormats[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedAuthor?.id]);

  // Hide while loading the author so we never flash a form for an opted-out author.
  if (defaultAuthorId && (isAuthorLoading || !scopedAuthor)) {
    return null;
  }
  // Hide newsletter section entirely if this author opted out of mailing list
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
                  {hasFreeBook ? <Gift className="h-6 w-6 mr-2" /> : <Mail className="h-6 w-6 mr-2" />}
                  {hasFreeBook ? "Regalo de Bienvenida" : "Suscríbete a la newsletter"}
                </h3>
                <p className="opacity-90 mb-4">
                  {hasFreeBook ? "Al suscribirte recibirás inmediatamente:" : "Al suscribirte recibirás:"}
                </p>
                <ul className="space-y-2 opacity-90">
                  {hasFreeBook && (
                    <li className="flex items-center" data-testid="text-free-book-title">
                      <Check className="h-5 w-5 mr-3 text-accent" />
                      {freeBookTitle}
                    </li>
                  )}
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-3 text-accent" />
                    Acceso a contenido exclusivo
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-3 text-accent" />
                    Descuentos especiales en próximos lanzamientos
                  </li>
                </ul>
                {hasFreeBook && freeBookDescription && (
                  <p className="text-sm opacity-80 mt-3" data-testid="text-free-book-description">{freeBookDescription}</p>
                )}
                {hasFreeBook && freeBookCover && (
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
                  {showFormatChooser && (
                    <div className="text-left space-y-2 bg-white/10 rounded-lg p-3 border border-white/20" data-testid="format-chooser">
                      <p className="text-sm font-medium opacity-90">¿En qué formato quieres tu libro?</p>
                      <div className="space-y-2">
                        {availableFormats.map((f) => (
                          <label
                            key={f.value}
                            className="flex items-start gap-2 text-sm cursor-pointer"
                            data-testid={`row-format-${f.value}`}
                          >
                            <input
                              type="radio"
                              name="freeBookFormat"
                              value={f.value}
                              checked={selectedFormat === f.value}
                              onChange={(e) => setSelectedFormat(e.target.value)}
                              className="mt-0.5 accent-accent shrink-0"
                              data-testid={`radio-format-${f.value}`}
                            />
                            <span className="opacity-95">{f.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {lists.length > 0 && (
                    <div className="text-left space-y-2 bg-white/10 rounded-lg p-3 border border-white/20" data-testid="newsletter-lists">
                      <p className="text-sm font-medium opacity-90">Tus intereses (opcional):</p>
                      <div className="space-y-2">
                        {lists.map((l) => {
                          const checked = selectedListIds.includes(l.id);
                          return (
                            <label
                              key={l.id}
                              className="flex items-start gap-2 text-sm cursor-pointer"
                              data-testid={`row-signup-list-${l.id}`}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(c) => toggleList(l.id, !!c)}
                                className="mt-0.5 border-white/60 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                                data-testid={`checkbox-signup-list-${l.id}`}
                              />
                              <span className="opacity-95">{l.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <label
                    htmlFor="newsletter-consent"
                    className="flex items-start gap-3 text-left text-sm opacity-90 cursor-pointer rounded-md p-2 -mx-2 hover:bg-white/5 transition-colors"
                  >
                    <Checkbox
                      id="newsletter-consent"
                      checked={consent}
                      onCheckedChange={(c) => setConsent(c === true)}
                      className="mt-0.5 border-white/60 data-[state=checked]:bg-accent data-[state=checked]:border-accent shrink-0"
                      data-testid="checkbox-consent"
                    />
                    <span className="leading-snug">{GDPR_CONSENT_LABEL}</span>
                  </label>
                  <Button
                    type="submit"
                    disabled={subscribeMutation.isPending || !consent}
                    className="w-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    data-testid="button-subscribe"
                  >
                    {hasFreeBook ? <Gift className="h-4 w-4 mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    {subscribeMutation.isPending
                      ? "Suscribiendo..."
                      : (hasFreeBook ? freeBookCtaText : "Suscribirme")}
                  </Button>
                </form>
                <p className="text-xs opacity-70 mt-4 leading-relaxed">
                  Sin spam. Cada email incluye un enlace para darte de baja en un solo clic.
                  Responsable: el autor o editorial. Finalidad: enviarte el material gratuito y comunicaciones comerciales.
                  Derechos: acceso, rectificación y supresión escribiendo al remitente del correo.
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
