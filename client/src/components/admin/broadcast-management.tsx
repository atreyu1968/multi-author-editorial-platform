import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, MailCheck, Send, Eye, BookOpen, Tag, Users, Clock, Gauge, Plus, Trash2, Pencil, XCircle, Save } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminAuthor } from "@/contexts/admin-author-context";
import { useAuth } from "@/hooks/use-auth";
import type { Book, NewsletterList, Broadcast } from "@shared/schema";

// Convert "YYYY-MM-DD" + "HH:MM" interpreted in `tz` (an IANA zone) into a
// UTC ISO timestamp. Uses Intl.DateTimeFormat to derive the zone's offset
// at the chosen wall-clock time (handles DST correctly without pulling in a
// timezone library). If the inputs are invalid, returns null so the caller
// can surface a validation message instead of sending a bad payload.
function localDateTimeToUtcIso(date: string, time: string, tz: string): string | null {
  if (!date || !time || !tz) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm);
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts = fmt.formatToParts(new Date(utcGuess));
    const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    const asIfUtc = Date.UTC(+map.year, +map.month - 1, +map.day, +map.hour, +map.minute, +map.second);
    const offset = asIfUtc - utcGuess;
    return new Date(utcGuess - offset).toISOString();
  } catch {
    return null;
  }
}

// `apiRequest` throws `Error("<status>: <body>")`. Most of our routes return
// `{ "message": "..." }` JSON, so unwrap it here so toasts show the human
// message verbatim instead of the wrapped status + JSON envelope.
function extractErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  // Strip the leading "<status>: " prefix that apiRequest adds.
  const colonIdx = raw.indexOf(": ");
  const body = colonIdx > 0 && /^\d{3}/.test(raw) ? raw.slice(colonIdx + 2) : raw;
  // If the body is JSON with a `message` field, return that field.
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === "object" && typeof parsed.message === "string") {
      return parsed.message;
    }
  } catch {
    // Not JSON — fall through and return the body as-is.
  }
  return body;
}

function utcIsoToLocalDateTime(iso: string, tz: string): { date: string; time: string } | null {
  if (!iso || !tz) return null;
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
    const parts = fmt.formatToParts(new Date(iso));
    const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    return {
      date: `${map.year}-${map.month}-${map.day}`,
      time: `${map.hour}:${map.minute}`,
    };
  } catch {
    return null;
  }
}

// A short curated list — the most common author timezones — plus the
// admin's detected local zone if it's not already in the list.
const COMMON_TIMEZONES = [
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Lisbon',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Buenos_Aires',
  'America/Sao_Paulo',
  'UTC',
];

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
  // "now"            – send immediately (legacy)
  // "later"          – at a single fixed datetime + timezone (legacy)
  // "per_local_9am"  – on a chosen local date, deliver at 9 a.m. in each
  //                    subscriber's own timezone
  scheduleMode: z.enum(["now", "later", "per_local_9am"]).default("now"),
  scheduleDate: z.string().optional(),
  scheduleTime: z.string().optional(),
  scheduleTimezone: z.string().optional(),
  rateLimitPerMinute: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "promotion") {
    if (!data.promoPriceEuros || isNaN(Number(data.promoPriceEuros)) || Number(data.promoPriceEuros) < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoPriceEuros"], message: "Precio requerido" });
    }
    if (!data.promoCurrency) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoCurrency"], message: "Moneda requerida" });
    }
  }
  if (data.scheduleMode === "later") {
    if (!data.scheduleDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduleDate"], message: "Fecha requerida" });
    }
    if (!data.scheduleTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduleTime"], message: "Hora requerida" });
    }
    if (!data.scheduleTimezone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduleTimezone"], message: "Zona horaria requerida" });
    }
    if (data.scheduleDate && data.scheduleTime && data.scheduleTimezone) {
      const iso = localDateTimeToUtcIso(data.scheduleDate, data.scheduleTime, data.scheduleTimezone);
      if (!iso) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduleDate"], message: "Fecha/hora inválida" });
      } else if (new Date(iso).getTime() <= Date.now()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduleDate"], message: "Debe ser una fecha futura" });
      }
    }
  }
  if (data.scheduleMode === "per_local_9am") {
    if (!data.scheduleDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduleDate"], message: "Fecha requerida" });
    } else {
      // The chosen local date must not be entirely in the past everywhere on
      // earth. We accept anything from "today in UTC+14" onward.
      const today = new Date();
      const todayInUtcPlus14 = new Date(today.getTime() + 14 * 3600 * 1000)
        .toISOString().slice(0, 10);
      if (data.scheduleDate < todayInUtcPlus14) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduleDate"], message: "Debe ser una fecha futura" });
      }
    }
  }
  if (data.rateLimitPerMinute && data.rateLimitPerMinute.trim()) {
    const n = Number(data.rateLimitPerMinute);
    if (!Number.isFinite(n) || n <= 0 || n > 10000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rateLimitPerMinute"], message: "Entre 1 y 10000" });
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
  scheduled: { label: "Programada", variant: "outline" },
  sending: { label: "En curso", variant: "secondary" },
  sent: { label: "Enviada", variant: "default" },
  failed: { label: "Fallida", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "secondary" },
};

export default function BroadcastManagement() {
  const { selectedAuthorId, authors } = useAdminAuthor();
  const { user } = useAuth();
  const { toast } = useToast();
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
  // When non-null we are editing an existing scheduled broadcast in place
  // (PATCH), otherwise the composer creates a new one (POST).
  const [editingId, setEditingId] = useState<string | null>(null);
  // Cancellation goes through a tiny confirm dialog so admins can't pull
  // a campaign by accident while skimming the history list.
  const [cancelTarget, setCancelTarget] = useState<Broadcast | null>(null);
  // Test-send dialog state. Lets the admin deliver the rendered draft to
  // a single inbox (default = the selected author's own email) before
  // committing to a real broadcast — no row is written to the broadcasts
  // table for these one-shot sends.
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const selectedAuthor = useMemo(
    () => authors.find((a) => a.id === selectedAuthorId) || null,
    [authors, selectedAuthorId],
  );

  const detectedTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
  }, []);
  const tzOptions = useMemo(() => {
    const set = new Set<string>(COMMON_TIMEZONES);
    set.add(detectedTz);
    return Array.from(set);
  }, [detectedTz]);

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
      scheduleMode: "now",
      scheduleDate: "",
      scheduleTime: "09:00",
      scheduleTimezone: detectedTz,
      rateLimitPerMinute: "",
    },
  });

  const watchType = form.watch("type");
  const watchBookId = form.watch("bookId");
  const watchScheduleMode = form.watch("scheduleMode");

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books", { authorId: selectedAuthorId }],
    enabled: !!selectedAuthorId,
  });

  const { data: lists = [] } = useQuery<NewsletterList[]>({
    queryKey: ["/api/authors", selectedAuthorId, "newsletter-lists"],
    enabled: !!selectedAuthorId,
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

  const createListMutation = useMutation({
    mutationFn: async (input: { name: string; description?: string; isDefault?: boolean }) => {
      const r = await apiRequest("POST", `/api/authors/${selectedAuthorId}/newsletter-lists`, input);
      return (await r.json()) as NewsletterList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors", selectedAuthorId, "newsletter-lists"] });
      toast({ title: "Lista creada" });
    },
    onError: (err: Error) => {
      toast({ title: "No se pudo crear la lista", description: err.message, variant: "destructive" });
    },
  });

  const updateListMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<NewsletterList> }) => {
      const r = await apiRequest("PATCH", `/api/newsletter-lists/${id}`, patch);
      return (await r.json()) as NewsletterList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors", selectedAuthorId, "newsletter-lists"] });
      toast({ title: "Lista actualizada" });
    },
    onError: (err: Error) => {
      toast({ title: "No se pudo actualizar", description: err.message, variant: "destructive" });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/newsletter-lists/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authors", selectedAuthorId, "newsletter-lists"] });
      toast({ title: "Lista eliminada" });
    },
    onError: (err: Error) => {
      toast({ title: "No se pudo eliminar", description: err.message, variant: "destructive" });
    },
  });

  const { data: pastBroadcasts = [], isLoading: loadingHistory } = useQuery<Broadcast[]>({
    queryKey: ["/api/authors", selectedAuthorId, "broadcasts"],
    // The default fetcher only treats *object* segments as query params, so a
    // hierarchical key like ["/api/authors", id, "broadcasts"] would collapse
    // to "/api/authors". Override here to build the actual nested REST URL.
    // The default fetcher only assembles ?query=string params from object
    // segments — it can't build hierarchical paths from string segments —
    // so we have to spell the URL out explicitly here.
    queryFn: async () => {
      const r = await fetch(`/api/authors/${selectedAuthorId}/broadcasts`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error(`${r.status}: ${(await r.text()) || r.statusText}`);
      return (await r.json()) as Broadcast[];
    },
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
    const scheduledFor = values.scheduleMode === "later"
      ? localDateTimeToUtcIso(values.scheduleDate || "", values.scheduleTime || "", values.scheduleTimezone || "UTC")
      : null;
    const rate = values.rateLimitPerMinute && values.rateLimitPerMinute.trim()
      ? Math.floor(Number(values.rateLimitPerMinute))
      : null;
    // Map the UI's three-way `scheduleMode` to the wire format. The
    // server understands two values: "fixed" (covers both "now" and "later")
    // and "per_recipient_local_9am". The admin's detected timezone is
    // forwarded as the fallback for subscribers that never shared one of
    // their own.
    const wireScheduleMode = values.scheduleMode === "per_local_9am"
      ? "per_recipient_local_9am"
      : "fixed";
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
      scheduledFor,
      timezone: values.scheduleMode === "later"
        ? (values.scheduleTimezone || null)
        : (values.scheduleMode === "per_local_9am" ? detectedTz : null),
      rateLimitPerMinute: rate,
      scheduleMode: wireScheduleMode,
      localDeliveryDate: values.scheduleMode === "per_local_9am" ? (values.scheduleDate || null) : null,
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
      const url = editingId
        ? `/api/authors/${selectedAuthorId}/broadcasts/${editingId}`
        : `/api/authors/${selectedAuthorId}/broadcasts`;
      const method = editingId ? "PATCH" : "POST";
      const r = await apiRequest(method, url, buildPayload(values));
      return (await r.json()) as Broadcast;
    },
    onSuccess: (data) => {
      if (editingId) {
        const when = data.scheduledFor ? new Date(data.scheduledFor).toLocaleString("es-ES") : "";
        toast({
          title: "Campaña actualizada",
          description: `Se enviará el ${when}${data.timezone ? ` (${data.timezone})` : ""}.`,
        });
      } else if (data.status === "scheduled") {
        if (data.scheduleMode === "per_recipient_local_9am" && data.localDeliveryDate) {
          toast({
            title: "Entrega local programada",
            description: `Cada suscriptor recibirá la campaña a las 9:00 hora local el ${data.localDeliveryDate}.`,
          });
        } else {
          const when = data.scheduledFor ? new Date(data.scheduledFor).toLocaleString("es-ES") : "";
          toast({
            title: "Campaña programada",
            description: `Se enviará el ${when}${data.timezone ? ` (${data.timezone})` : ""}.`,
          });
        }
      } else {
        toast({
          title: "Campaña enviada",
          description: `Entregada a ${data.successCount ?? 0} destinatarios${(data.failureCount ?? 0) > 0 ? ` (${data.failureCount} fallos)` : ""}.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/authors", selectedAuthorId, "broadcasts"] });
      form.reset({ ...form.getValues(), subject: "", customMessage: "", previewText: "" });
      setPreview(null);
      setConfirmOpen(false);
      setEditingId(null);
      if (editingId) setActiveTab("history");
    },
    onError: (err: Error) => {
      toast({ title: editingId ? "No se pudo actualizar" : "No se pudo enviar", description: err.message, variant: "destructive" });
      setConfirmOpen(false);
    },
  });

  const testSendMutation = useMutation({
    mutationFn: async ({ values, recipientEmail }: { values: FormValues; recipientEmail: string }) => {
      const r = await apiRequest(
        "POST",
        `/api/authors/${selectedAuthorId}/broadcasts/test`,
        { ...buildPayload(values), recipientEmail },
      );
      return (await r.json()) as { success: boolean; sentTo: string };
    },
    onSuccess: (data) => {
      toast({
        title: "Email de prueba enviado",
        description: `Entregado a ${data.sentTo}. Revisa tu bandeja de entrada (y spam).`,
      });
      setTestOpen(false);
    },
    onError: (err: Error) => {
      // Surface the provider error verbatim so admins can act on it
      // (e.g. "Domain not verified", "Invalid API key").
      // apiRequest wraps non-2xx responses as `Error("<status>: <body>")`
      // where <body> is usually the JSON `{ "message": "..." }` returned
      // by the route. Unwrap it so the toast shows ONLY the human-readable
      // provider message instead of "500: {"message":"..."}".
      toast({
        title: "No se pudo enviar la prueba",
        description: extractErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  function openTestDialog() {
    // "Enviar prueba a mí" — pre-fill with the logged-in admin's contact
    // email so a single click sends the test to their own inbox. Fall back
    // to the selected author's email when the admin account has no email
    // on file (legacy accounts created before the column existed). Admin
    // can still override with any address before confirming.
    setTestEmail((prev) => prev || user?.email || selectedAuthor?.email || "");
    setTestOpen(true);
  }

  const cancelMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const r = await apiRequest("POST", `/api/authors/${selectedAuthorId}/broadcasts/${broadcastId}/cancel`, {});
      return (await r.json()) as Broadcast;
    },
    onSuccess: () => {
      toast({ title: "Campaña cancelada", description: "El envío programado se ha detenido." });
      queryClient.invalidateQueries({ queryKey: ["/api/authors", selectedAuthorId, "broadcasts"] });
      setCancelTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "No se pudo cancelar", description: err.message, variant: "destructive" });
      setCancelTarget(null);
    },
  });

  // Move the chosen scheduled broadcast into the composer. We project the
  // stored UTC scheduledFor + timezone back into the date/time pair the
  // form inputs expect so the admin sees exactly what they typed before.
  function startEditing(b: Broadcast) {
    const tz = b.timezone || detectedTz;
    const local = b.scheduledFor ? utcIsoToLocalDateTime(b.scheduledFor, tz) : null;
    form.reset({
      type: (b.type as "new_release" | "promotion") || "new_release",
      bookId: b.bookId || "",
      subject: b.subject || "",
      previewText: b.previewText || "",
      customMessage: b.customMessage || "",
      promoPriceEuros: b.promoPriceCents != null ? (b.promoPriceCents / 100).toFixed(2) : "",
      promoCurrency: b.promoCurrency || "EUR",
      promoStartsAt: b.promoStartsAt || "",
      promoEndsAt: b.promoEndsAt || "",
      listIds: b.listIds || [],
      // Editing always uses "later" since only scheduled rows are editable.
      scheduleMode: "later",
      scheduleDate: local?.date || "",
      scheduleTime: local?.time || "09:00",
      scheduleTimezone: tz,
      rateLimitPerMinute: b.rateLimitPerMinute != null ? String(b.rateLimitPerMinute) : "",
    });
    setEditingId(b.id);
    setPreview(null);
    setActiveTab("compose");
  }

  function cancelEditing() {
    setEditingId(null);
    setPreview(null);
    form.reset({
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
      scheduleMode: "now",
      scheduleDate: "",
      scheduleTime: "09:00",
      scheduleTimezone: detectedTz,
      rateLimitPerMinute: "",
    });
  }

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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "compose" | "history")} className="w-full">
        <TabsList>
          <TabsTrigger value="compose" data-testid="tab-compose">Componer</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Historial</TabsTrigger>
          <TabsTrigger value="lists" data-testid="tab-lists">Listas de interés</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <h3 className="text-lg font-medium">
                {editingId ? "Editar campaña programada" : "Nueva campaña"}
              </h3>
              {editingId && (
                <Button type="button" variant="ghost" size="sm" onClick={cancelEditing} data-testid="button-cancel-edit">
                  Descartar cambios
                </Button>
              )}
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

                  <div className="grid gap-4 p-4 border rounded-lg bg-muted/20">
                    <FormField control={form.control} name="scheduleMode" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Clock className="w-4 h-4" /> ¿Cuándo enviar?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-6 mt-2"
                          >
                            {/* Editing an already-scheduled campaign always
                                stays in "later" mode — switching to "now"
                                would only ever fail server-side validation
                                (scheduledFor must be in the future), so we
                                hide that option to avoid the dead-end. */}
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="now" data-testid="radio-schedule-now" disabled={!!editingId} />
                              </FormControl>
                              <FormLabel className={`font-normal ${editingId ? "text-muted-foreground" : ""}`}>Enviar ahora</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="later" data-testid="radio-schedule-later" />
                              </FormControl>
                              <FormLabel className="font-normal">Programar envío</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="per_local_9am" data-testid="radio-schedule-per-local" />
                              </FormControl>
                              <FormLabel className="font-normal">Enviar a las 9:00 hora local de cada suscriptor</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        {editingId && (
                          <FormDescription>
                            Las campañas ya programadas se editan manteniendo un envío futuro. Si quieres detener el envío, usa <strong>Cancelar</strong> desde el historial.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )} />

                    {watchScheduleMode === "later" && (
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField control={form.control} name="scheduleDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha</FormLabel>
                            <FormControl>
                              <Input type="date" data-testid="input-schedule-date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="scheduleTime" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hora</FormLabel>
                            <FormControl>
                              <Input type="time" data-testid="input-schedule-time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="scheduleTimezone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zona horaria</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-schedule-timezone">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tzOptions.map((tz) => (
                                  <SelectItem key={tz} value={tz} data-testid={`option-tz-${tz}`}>{tz}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>9:00 significará 9:00 hora local de esta zona.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    )}

                    {watchScheduleMode === "per_local_9am" && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="scheduleDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de entrega local</FormLabel>
                            <FormControl>
                              <Input type="date" data-testid="input-local-delivery-date" {...field} />
                            </FormControl>
                            <FormDescription>
                              Cada suscriptor recibirá el email a las 9:00 hora local en esta fecha.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="text-sm text-muted-foreground self-end pb-2" data-testid="text-per-local-fallback">
                          Suscriptores sin zona horaria detectada usarán <strong>{detectedTz}</strong>.
                        </div>
                      </div>
                    )}

                    <FormField control={form.control} name="rateLimitPerMinute" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Gauge className="w-4 h-4" /> Límite de envío (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10000"
                            placeholder="Sin límite"
                            data-testid="input-rate-limit"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Emails por minuto. Útil para listas grandes y para no marcar como spam.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

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
                      variant="outline"
                      disabled={testSendMutation.isPending}
                      onClick={() => {
                        // Validate the draft before opening the dialog so we
                        // don't waste a real send on a form with errors.
                        form.handleSubmit(() => openTestDialog())();
                      }}
                      data-testid="button-broadcast-test"
                    >
                      {testSendMutation.isPending
                        ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        : <MailCheck className="w-4 h-4 mr-2" />}
                      Enviar prueba a mí
                    </Button>
                    <Button
                      type="button"
                      disabled={!preview || sendMutation.isPending}
                      onClick={() => setConfirmOpen(true)}
                      data-testid="button-broadcast-send"
                    >
                      {editingId
                        ? <Save className="w-4 h-4 mr-2" />
                        : (watchScheduleMode === "now" ? <Send className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />)}
                      {editingId
                        ? "Guardar cambios"
                        : watchScheduleMode === "now"
                          ? "Enviar campaña"
                          : watchScheduleMode === "per_local_9am"
                            ? "Programar entrega local"
                            : "Programar campaña"}
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
                    const isScheduled = b.status === "scheduled";
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
                          {b.status === "scheduled" && b.scheduleMode === "per_recipient_local_9am" ? (
                            <p className="text-xs text-muted-foreground" data-testid={`text-scheduled-${b.id}`}>
                              Entrega local: 9:00 hora local de cada suscriptor el {b.localDeliveryDate}
                              {b.rateLimitPerMinute ? ` · ritmo ${b.rateLimitPerMinute}/min` : ""}
                            </p>
                          ) : b.status === "scheduled" && b.scheduledFor ? (
                            <p className="text-xs text-muted-foreground" data-testid={`text-scheduled-${b.id}`}>
                              Programada para {new Date(b.scheduledFor).toLocaleString("es-ES")}
                              {b.timezone ? ` (${b.timezone})` : ""}
                              {b.rateLimitPerMinute ? ` · ritmo ${b.rateLimitPerMinute}/min` : ""}
                            </p>
                          ) : b.status === "sending" && b.scheduleMode === "per_recipient_local_9am" ? (
                            <p className="text-xs text-muted-foreground">
                              Entrega local en curso · {b.successCount ?? 0}/{b.recipientCount ?? 0} entregadas
                              {b.completedTimezones && b.completedTimezones.length > 0
                                ? ` · zonas listas: ${b.completedTimezones.length}`
                                : ""}
                            </p>
                          ) : b.status === "sending" ? (
                            <p className="text-xs text-muted-foreground">
                              En curso · {b.successCount ?? 0}/{b.recipientCount ?? 0} entregadas
                            </p>
                          ) : b.status === "cancelled" ? (
                            <p className="text-xs text-muted-foreground" data-testid={`text-cancelled-${b.id}`}>
                              Cancelada antes de enviarse
                              {b.scheduledFor ? ` · estaba programada para ${new Date(b.scheduledFor).toLocaleString("es-ES")}` : ""}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {b.sentAt ? new Date(b.sentAt).toLocaleString("es-ES") : "Sin enviar"} · {b.successCount ?? 0} entregadas
                              {(b.failureCount ?? 0) > 0 ? ` · ${b.failureCount} fallidas` : ""}
                            </p>
                          )}
                          {b.errorMessage && (
                            <p className="text-xs text-destructive">{b.errorMessage}</p>
                          )}
                        </div>
                        {isScheduled && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(b)}
                              data-testid={`button-edit-broadcast-${b.id}`}
                            >
                              <Pencil className="w-4 h-4 mr-1" /> Editar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancelTarget(b)}
                              data-testid={`button-cancel-broadcast-${b.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lists">
          <ListsManager
            lists={lists}
            onCreate={(input) => createListMutation.mutate(input)}
            onUpdate={(id, patch) => updateListMutation.mutate({ id, patch })}
            onDelete={(id) => deleteListMutation.mutate(id)}
            isCreating={createListMutation.isPending}
            isUpdating={updateListMutation.isPending}
            isDeleting={deleteListMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent data-testid="dialog-confirm-send">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? "¿Guardar cambios?"
                : watchScheduleMode === "now"
                  ? "¿Enviar la campaña?"
                  : watchScheduleMode === "per_local_9am"
                    ? "¿Programar la entrega local?"
                    : "¿Programar la campaña?"}
            </DialogTitle>
          </DialogHeader>
          {editingId || watchScheduleMode === "later" ? (
            <p className="text-sm">
              Se enviará a <strong>{preview?.recipientCount ?? 0}</strong> suscriptores el{" "}
              <strong>
                {(() => {
                  const v = form.getValues();
                  const iso = localDateTimeToUtcIso(v.scheduleDate || "", v.scheduleTime || "", v.scheduleTimezone || "UTC");
                  return iso ? new Date(iso).toLocaleString("es-ES") : "";
                })()}
              </strong>{" "}
              ({form.getValues("scheduleTimezone")}).
            </p>
          ) : watchScheduleMode === "per_local_9am" ? (
            <p className="text-sm" data-testid="text-confirm-per-local">
              Cada uno de los <strong>{preview?.recipientCount ?? 0}</strong> suscriptores recibirá la
              campaña a las <strong>9:00</strong> hora local en su propia zona el{" "}
              <strong>{form.getValues("scheduleDate")}</strong>. Quienes no tengan zona detectada
              usarán <strong>{detectedTz}</strong>.
            </p>
          ) : (
            <p className="text-sm">
              Vas a enviar este email a <strong>{preview?.recipientCount ?? 0}</strong> suscriptores activos. No se puede deshacer.
            </p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} data-testid="button-cancel-send">Cancelar</Button>
            <Button onClick={() => sendMutation.mutate(form.getValues())} disabled={sendMutation.isPending} data-testid="button-confirm-send">
              {sendMutation.isPending
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : (editingId
                    ? <Save className="w-4 h-4 mr-2" />
                    : (watchScheduleMode === "now" ? <Send className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />))}
              {editingId
                ? "Guardar"
                : (watchScheduleMode === "now" ? "Enviar ahora" : "Programar")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={(o) => { if (!o) setTestOpen(false); }}>
        <DialogContent data-testid="dialog-test-send">
          <DialogHeader>
            <DialogTitle>Enviar email de prueba</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Recibirás una sola copia del email tal y como lo verán los suscriptores
            (mismo remitente, encabezados y seguimiento). No quedará registro en el historial.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="test-recipient-input">Destinatario</label>
            <Input
              id="test-recipient-input"
              type="email"
              placeholder="tu@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              data-testid="input-test-recipient"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setTestOpen(false)}
              data-testid="button-cancel-test"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => testSendMutation.mutate({ values: form.getValues(), recipientEmail: testEmail.trim() })}
              disabled={testSendMutation.isPending || !testEmail.trim()}
              data-testid="button-confirm-test"
            >
              {testSendMutation.isPending
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <MailCheck className="w-4 h-4 mr-2" />}
              Enviar prueba
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) setCancelTarget(null); }}>
        <DialogContent data-testid="dialog-confirm-cancel-broadcast">
          <DialogHeader>
            <DialogTitle>¿Cancelar la campaña programada?</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            <strong>{cancelTarget?.subject}</strong> ya no se enviará. Podrás volver a programarla más adelante editándola desde el historial.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCancelTarget(null)} data-testid="button-keep-scheduled">Mantener programada</Button>
            <Button
              variant="destructive"
              onClick={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
              disabled={cancelMutation.isPending}
              data-testid="button-confirm-cancel-broadcast"
            >
              {cancelMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Cancelar campaña
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ListsManagerProps {
  lists: NewsletterList[];
  onCreate: (input: { name: string; description?: string; isDefault?: boolean }) => void;
  onUpdate: (id: string, patch: Partial<NewsletterList>) => void;
  onDelete: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

function ListsManager({ lists, onCreate, onUpdate, onDelete, isCreating, isDeleting }: ListsManagerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim() || undefined, isDefault });
    setName("");
    setDescription("");
    setIsDefault(false);
  }

  function startEdit(l: NewsletterList) {
    setEditingId(l.id);
    setEditName(l.name);
    setEditDescription(l.description ?? "");
  }

  function saveEdit() {
    if (!editingId) return;
    onUpdate(editingId, { name: editName.trim(), description: editDescription.trim() || null });
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Nueva lista de interés</h3>
          <p className="text-sm text-muted-foreground">
            Crea categorías (por ejemplo "Romance", "Misterio") para que los suscriptores indiquen qué quieren recibir.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitNew} className="space-y-3" data-testid="form-new-list">
            <Input
              placeholder="Nombre de la lista"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-list-name"
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              data-testid="input-list-description"
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isDefault}
                onCheckedChange={(c) => setIsDefault(!!c)}
                data-testid="checkbox-list-default"
              />
              Marcar por defecto al inscribirse
            </label>
            <Button type="submit" disabled={isCreating || !name.trim()} data-testid="button-create-list">
              {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Crear lista
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Listas existentes</h3>
        </CardHeader>
        <CardContent>
          {lists.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-no-lists">
              Aún no hay listas. Crea la primera arriba.
            </p>
          ) : (
            <div className="space-y-3">
              {lists.map((l) => {
                const editing = editingId === l.id;
                return (
                  <div
                    key={l.id}
                    className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                    data-testid={`row-list-${l.id}`}
                  >
                    {editing ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          data-testid={`input-edit-list-name-${l.id}`}
                        />
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          data-testid={`input-edit-list-description-${l.id}`}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} data-testid={`button-save-list-${l.id}`}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)} data-testid={`button-cancel-edit-list-${l.id}`}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium" data-testid={`text-list-name-${l.id}`}>{l.name}</p>
                          {l.isDefault && <Badge variant="secondary">Por defecto</Badge>}
                          {!l.isActive && <Badge variant="outline">Inactiva</Badge>}
                        </div>
                        {l.description && (
                          <p className="text-sm text-muted-foreground">{l.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">/{l.slug}</p>
                      </div>
                    )}

                    {!editing && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdate(l.id, { isActive: !l.isActive })}
                          data-testid={`button-toggle-active-list-${l.id}`}
                        >
                          {l.isActive ? "Desactivar" : "Activar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(l)}
                          data-testid={`button-edit-list-${l.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`¿Eliminar la lista "${l.name}"? Las suscripciones a esta lista también se borrarán.`)) {
                              onDelete(l.id);
                            }
                          }}
                          disabled={isDeleting}
                          data-testid={`button-delete-list-${l.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
