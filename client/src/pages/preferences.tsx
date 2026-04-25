import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Mail, ShieldCheck, AlertTriangle, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { NewsletterList } from "@shared/schema";

interface PreferencesPayload {
  subscriber: {
    id: string;
    name: string;
    email: string;
    authorId: string;
    unsubscribedAt: string | null;
  };
  author: { id: string; name: string; slug: string } | null;
  lists: NewsletterList[];
  subscribedListIds: string[];
}

export default function PreferencesPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [didJustSave, setDidJustSave] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<PreferencesPayload>({
    queryKey: ["/api/preferences", token],
    queryFn: async () => {
      const res = await fetch(`/api/preferences/${token}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setName(data.subscriber.name || "");
      setSelectedListIds(data.subscribedListIds);
      setIsUnsubscribed(!!data.subscriber.unsubscribedAt);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { name?: string; listIds?: string[]; unsubscribe?: boolean }) => {
      const res = await apiRequest("POST", `/api/preferences/${token}`, payload);
      return res.json() as Promise<{ subscriber: PreferencesPayload["subscriber"]; subscribedListIds: string[] }>;
    },
    onSuccess: (resp) => {
      setDidJustSave(true);
      setIsUnsubscribed(!!resp.subscriber?.unsubscribedAt);
      toast({ title: "Preferencias guardadas", description: "Tus cambios se han guardado correctamente." });
      refetch();
    },
    onError: () => {
      toast({ title: "No se pudo guardar", description: "Inténtalo de nuevo en unos minutos.", variant: "destructive" });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/preferences/${token}/unsubscribe`, {});
      return res.json();
    },
    onSuccess: () => {
      setIsUnsubscribed(true);
      setDidJustSave(true);
      toast({ title: "Te has dado de baja", description: "No recibirás más emails de esta autora." });
      refetch();
    },
    onError: () => {
      toast({ title: "No se pudo procesar la baja", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-lg w-full" data-testid="card-preferences-error">
          <CardHeader>
            <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Enlace no válido
            </h1>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Este enlace de preferencias no es válido o ha caducado. Si quieres cambiar tu suscripción,
              vuelve a suscribirte desde la página de la autora o contacta directamente con ella.
            </p>
            <Link href="/">
              <Button variant="outline" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { subscriber, author, lists } = data;
  const authorName = author?.name || "esta autora";

  function toggleList(id: string, checked: boolean) {
    setSelectedListIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((x) => x !== id);
    });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({
      name: name.trim(),
      listIds: selectedListIds,
      // Re-subscribe automatically if the subscriber edits preferences after
      // a previous unsubscribe (acts as an opt-in confirmation).
      unsubscribe: false,
    });
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8" data-testid="page-preferences">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Mail className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-3xl md:text-4xl font-serif font-bold" data-testid="text-page-title">Tus preferencias de email</h1>
          <p className="text-muted-foreground mt-2">
            Hola <strong data-testid="text-subscriber-name">{subscriber.name}</strong> · estás suscrito como{" "}
            <span className="font-mono text-sm" data-testid="text-subscriber-email">{subscriber.email}</span>
          </p>
        </div>

        {isUnsubscribed && (
          <Alert variant="default" data-testid="alert-unsubscribed">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Te has dado de baja</AlertTitle>
            <AlertDescription>
              Ya no recibirás emails de {authorName}. Si fue un error, guarda tus preferencias abajo
              para reactivar tu suscripción.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Datos personales</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6" data-testid="form-preferences">
              <div className="space-y-2">
                <Label htmlFor="pref-name">Tu nombre</Label>
                <Input
                  id="pref-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-preferences-name"
                />
              </div>

              {lists.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">Tus intereses</h3>
                    <p className="text-sm text-muted-foreground">
                      Marca los temas sobre los que quieres recibir avisos. Si no marcas ninguno, seguirás
                      recibiendo las novedades generales.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {lists.map((l) => {
                      const checked = selectedListIds.includes(l.id);
                      return (
                        <label
                          key={l.id}
                          className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/40"
                          data-testid={`row-list-${l.id}`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => toggleList(l.id, !!c)}
                            data-testid={`checkbox-pref-list-${l.id}`}
                          />
                          <div>
                            <div className="font-medium">{l.name}</div>
                            {l.description && (
                              <div className="text-sm text-muted-foreground">{l.description}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-preferences">
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Guardar preferencias
                </Button>
                {!isUnsubscribed && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={unsubscribeMutation.isPending}
                    onClick={() => unsubscribeMutation.mutate()}
                    data-testid="button-unsubscribe"
                  >
                    {unsubscribeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Darme de baja de todo
                  </Button>
                )}
              </div>

              {didJustSave && (
                <p className="text-sm text-green-600 dark:text-green-400" data-testid="text-saved-confirmation">
                  Tus cambios se han guardado.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Estás gestionando tus comunicaciones con {authorName}. Si crees que recibiste este enlace por error,
          puedes ignorarlo o darte de baja arriba.
        </p>
      </div>
    </div>
  );
}
