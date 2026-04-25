import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Send, Eye, BookOpen, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminAuthor } from "@/contexts/admin-author-context";
import type { Book, NewsletterList, Broadcast } from "@shared/schema";

const formSchema = z.object({
  type: z.enum(["new_release", "promotion"]),
  bookId: z.string().min(1, "Selecciona un libro"),
  subject: z.string().min(3, "Asunto demasiado corto").max(160),
  previewText: z.string().max(160).optional(),
  customMessage: z.string().max(2000).optional(),
  promoPriceEuros: z.string().optional(),
  promoCurrency: z.string().optional(),
  promoStartsAt: z.string().optional(),
  promoEndsAt: z.string().optional(),
  listIds: z.array(z.string()).default([]),
}).superRefine((data, ctx) => {
  if (data.type === "promotion") {
    if (!data.promoPriceEuros || isNaN(Number(data.promoPriceEuros)) || Number(data.promoPriceEuros) < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoPriceEuros"], message: "Precio requerido" });
    }
    if (!data.promoCurrency) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoCurrency"], message: "Moneda requerida" });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

interface PreviewResponse {
  subject: string;
  html: string;
  recipientCount: number;
}

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Borrador", variant: "outline" },
  sending: { label: "Enviando", variant: "secondary" },
  sent: { label: "Enviada", variant: "default" },
  failed: { label: "Fallida", variant: "destructive" },
};

export default function BroadcastManagement() {
  const { selectedAuthorId } = useAdminAuthor();
  const { toast } = useToast();
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "new_release",
      bookId: "",
      subject: "",
      previewText: "",
      customMessage: "",
      promoPriceEuros: "",
      promoCurrency: "EUR",
      promoStartsAt: "",
      promoEndsAt: "",
      listIds: [],
    },
  });

  const watchType = form.watch("type");
  const watchBookId = form.watch("bookId");

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books", { authorId: selectedAuthorId }],
    enabled: !!selectedAuthorId,
  });

  const { data: lists = [] } = useQuery<NewsletterList[]>({
    queryKey: ["/api/authors", selectedAuthorId, "newsletter-lists"],
    enabled: !!selectedAuthorId,
    // The list endpoint may not be wired yet in this iteration; tolerate 404 by returning [].
    queryFn: async () => {
      try {
        const r = await fetch(`/api/authors/${selectedAuthorId}/newsletter-lists`, { credentials: "include" });
        if (!r.ok) return [];
        return (await r.json()) as NewsletterList[];
      } catch {
        return [];
      }
    },
  });

  const { data: pastBroadcasts = [], isLoading: loadingHistory } = useQuery<Broadcast[]>({
    queryKey: ["/api/authors", selectedAuthorId, "broadcasts"],
    enabled: !!selectedAuthorId,
  });

  const selectedBook = useMemo(
    () => books.find((b) => b.id === watchBookId),
    [books, watchBookId],
  );

  function buildPayload(values: FormValues) {
    const promoPriceCents = values.type === "promotion" && values.promoPriceEuros
      ? Math.round(Number(values.promoPriceEuros) * 100)
      : null;
    return {
      type: values.type,
      bookId: values.bookId,
      subject: values.subject,
      previewText: values.previewText || null,
      customMessage: values.customMessage || null,
      promoPriceCents,
      promoCurrency: values.type === "promotion" ? (values.promoCurrency || "EUR") : null,
      promoStartsAt: values.type === "promotion" ? (values.promoStartsAt || null) : null,
      promoEndsAt: values.type === "promotion" ? (values.promoEndsAt || null) : null,
      listIds: values.listIds && values.listIds.length > 0 ? values.listIds : null,
    };
  }

  const previewMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const r = await apiRequest("POST", `/api/authors/${selectedAuthorId}/broadcasts/preview`, buildPayload(values));
      return (await r.json()) as PreviewResponse;
    },
    onSuccess: (data) => {
      setPreview(data);
    },
    onError: (err: Error) => {
      toast({ title: "No se pudo generar la vista previa", description: err.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const r = await apiRequest("POST", `/api/authors/${selectedAuthorId}/broadcasts`, buildPayload(values));
      return (await r.json()) as Broadcast;
    },
    onSuccess: (data) => {
      toast({
        title: "Campaña enviada",
        description: `Entregada a ${data.successCount ?? 0} destinatarios${(data.failureCount ?? 0) > 0 ? ` (${data.failureCount} fallos)` : ""}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/authors", selectedAuthorId, "broadcasts"] });
      form.reset({ ...form.getValues(), subject: "", customMessage: "", previewText: "" });
      setPreview(null);
      setConfirmOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "No se pudo enviar", description: err.message, variant: "destructive" });
      setConfirmOpen(false);
    },
  });

  if (!selectedAuthorId) {
    return (
      <Alert>
        <AlertTitle>Selecciona un autor</AlertTitle>
        <AlertDescription>Elige un autor para componer una campaña.</AlertDescription>
      </Alert>
    );
  }

  const onSubmitPreview = form.handleSubmit((v) => previewMutation.mutate(v));

  return (
    <div className="space-y-6" data-testid="broadcast-management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Mail className="w-6 h-6" /> Campañas de email
          </h2>
          <p className="text-sm text-muted-foreground">
            Anuncia un nuevo lanzamiento o lanza una promoción a tus suscriptores.
          </p>
        </div>
      </div>

      <Tabs defaultValue="compose" className="w-full">
        <TabsList>
          <TabsTrigger value="compose" data-testid="tab-compose">Componer</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Nueva campaña</h3>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={onSubmitPreview} className="space-y-5">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-broadcast-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new_release">Nuevo lanzamiento</SelectItem>
                          <SelectItem value="promotion">Oferta / promoción</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="bookId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Libro</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-broadcast-book">
                            <SelectValue placeholder="Selecciona un libro..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {books.map((b) => (
                            <SelectItem key={b.id} value={b.id} data-testid={`option-book-${b.id}`}>
                              {b.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {selectedBook?.seriesId
                          ? "Forma parte de una serie — los libros anteriores se incluirán automáticamente."
                          : "Se mostrará portada y enlace a Amazon."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asunto</FormLabel>
                      <FormControl>
                        <Input placeholder="Por ejemplo: ¡Ya está aquí mi nueva novela!" data-testid="input-broadcast-subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="previewText" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto de vista previa (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="El texto que se ve junto al asunto en la bandeja de entrada" data-testid="input-broadcast-preview" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="customMessage" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje personal (opcional)</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder="Unas palabras que aparecerán encima del libro." data-testid="textarea-broadcast-message" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {watchType === "promotion" && (
                    <div className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg bg-muted/30">
                      <FormField control={form.control} name="promoPriceEuros" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio nuevo</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="0,99" data-testid="input-promo-price" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="promoCurrency" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Moneda</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-promo-currency">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="promoStartsAt" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desde</FormLabel>
                          <FormControl>
                            <Input type="date" data-testid="input-promo-starts" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="promoEndsAt" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hasta</FormLabel>
                          <FormControl>
                            <Input type="date" data-testid="input-promo-ends" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  )}

                  {lists.length > 0 && (
                    <FormField control={form.control} name="listIds" render={() => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Users className="w-4 h-4" /> Listas destinatarias</FormLabel>
                        <FormDescription>Si no marcas ninguna, se enviará a toda tu lista activa.</FormDescription>
                        <div className="space-y-2 mt-2">
                          {lists.map((l) => (
                            <FormField key={l.id} control={form.control} name="listIds" render={({ field }) => {
                              const checked = (field.value || []).includes(l.id);
                              return (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      data-testid={`checkbox-list-${l.id}`}
                                      checked={checked}
                                      onCheckedChange={(c) => {
                                        const v = field.value || [];
                                        field.onChange(c ? [...v, l.id] : v.filter((x: string) => x !== l.id));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{l.name}</FormLabel>
                                </FormItem>
                              );
                            }} />
                          ))}
                        </div>
                      </FormItem>
                    )} />
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" variant="outline" disabled={previewMutation.isPending} data-testid="button-broadcast-preview">
                      {previewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                      Vista previa
                    </Button>
                    <Button
                      type="button"
                      disabled={!preview || sendMutation.isPending}
                      onClick={() => setConfirmOpen(true)}
                      data-testid="button-broadcast-send"
                    >
                      <Send className="w-4 h-4 mr-2" /> Enviar campaña
                    </Button>
                    {preview && (
                      <Badge variant="secondary" className="self-center" data-testid="text-recipient-count">
                        {preview.recipientCount} destinatarios
                      </Badge>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {preview && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <h3 className="text-lg font-medium flex items-center gap-2"><Eye className="w-5 h-5" /> Vista previa</h3>
                <Badge variant="outline" data-testid="text-preview-subject">Asunto: {preview.subject}</Badge>
              </CardHeader>
              <CardContent>
                <iframe
                  title="Email preview"
                  srcDoc={preview.html}
                  className="w-full min-h-[640px] border rounded bg-white"
                  data-testid="iframe-broadcast-preview"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Campañas anteriores</h3>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</div>
              ) : pastBroadcasts.length === 0 ? (
                <p className="text-sm text-muted-foreground" data-testid="text-no-broadcasts">Aún no has enviado ninguna campaña.</p>
              ) : (
                <div className="space-y-3">
                  {pastBroadcasts.map((b) => {
                    const status = STATUS_LABEL[b.status] ?? STATUS_LABEL.draft;
                    return (
                      <div key={b.id} className="flex items-start justify-between gap-4 p-4 border rounded-lg" data-testid={`row-broadcast-${b.id}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {b.type === "promotion" ? <Tag className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                              {b.type === "promotion" ? "Oferta" : "Lanzamiento"}
                            </Badge>
                          </div>
                          <p className="font-medium">{b.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.sentAt ? new Date(b.sentAt).toLocaleString("es-ES") : "Sin enviar"} · {b.successCount ?? 0} entregadas
                            {(b.failureCount ?? 0) > 0 ? ` · ${b.failureCount} fallidas` : ""}
                          </p>
                          {b.errorMessage && (
                            <p className="text-xs text-destructive">{b.errorMessage}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent data-testid="dialog-confirm-send">
          <DialogHeader>
            <DialogTitle>¿Enviar la campaña?</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Vas a enviar este email a <strong>{preview?.recipientCount ?? 0}</strong> suscriptores activos. No se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} data-testid="button-cancel-send">Cancelar</Button>
            <Button onClick={() => sendMutation.mutate(form.getValues())} disabled={sendMutation.isPending} data-testid="button-confirm-send">
              {sendMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar ahora
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
