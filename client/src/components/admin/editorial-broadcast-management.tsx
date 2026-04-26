import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Mail,
  Send,
  Eye,
  BookOpen,
  Tag,
  Users,
  Clock,
  Gauge,
  XCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminAuthor } from "@/contexts/admin-author-context";
import type {
  Book,
  Author,
  EditorialList,
  EditorialBroadcast,
} from "@shared/schema";

// Same DST-safe local-to-UTC helper used by the per-author composer.
function localDateTimeToUtcIso(date: string, time: string, tz: string): string | null {
  if (!date || !time || !tz) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm);
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = fmt.formatToParts(new Date(utcGuess));
    const map = Object.fromEntries(
      parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
    );
    const asIfUtc = Date.UTC(
      +map.year,
      +map.month - 1,
      +map.day,
      +map.hour,
      +map.minute,
      +map.second,
    );
    const offset = asIfUtc - utcGuess;
    return new Date(utcGuess - offset).toISOString();
  } catch {
    return null;
  }
}

const COMMON_TIMEZONES = [
  "Europe/Madrid",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Lisbon",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Buenos_Aires",
  "America/Sao_Paulo",
  "UTC",
];

const formSchema = z
  .object({
    senderAuthorId: z.string().min(1, "Selecciona un autor remitente"),
    type: z.enum(["new_release", "promotion"]),
    bookIds: z.array(z.string()).min(1, "Selecciona al menos un libro"),
    subject: z.string().min(3, "Asunto demasiado corto").max(160),
    previewText: z.string().max(160).optional(),
    customMessage: z.string().max(2000).optional(),
    promoPriceEuros: z.string().optional(),
    promoCurrency: z.string().optional(),
    promoStartsAt: z.string().optional(),
    promoEndsAt: z.string().optional(),
    listIds: z.array(z.string()).default([]),
    scheduleMode: z.enum(["now", "later"]).default("now"),
    scheduleDate: z.string().optional(),
    scheduleTime: z.string().optional(),
    scheduleTimezone: z.string().optional(),
    rateLimitPerMinute: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "promotion") {
      if (
        !data.promoPriceEuros ||
        isNaN(Number(data.promoPriceEuros)) ||
        Number(data.promoPriceEuros) < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["promoPriceEuros"],
          message: "Precio requerido",
        });
      }
      if (!data.promoCurrency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["promoCurrency"],
          message: "Moneda requerida",
        });
      }
    }
    if (data.scheduleMode === "later") {
      if (!data.scheduleDate)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduleDate"],
          message: "Fecha requerida",
        });
      if (!data.scheduleTime)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduleTime"],
          message: "Hora requerida",
        });
      if (!data.scheduleTimezone)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduleTimezone"],
          message: "Zona horaria requerida",
        });
      if (data.scheduleDate && data.scheduleTime && data.scheduleTimezone) {
        const iso = localDateTimeToUtcIso(
          data.scheduleDate,
          data.scheduleTime,
          data.scheduleTimezone,
        );
        if (!iso) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["scheduleDate"],
            message: "Fecha/hora inválida",
          });
        } else if (new Date(iso).getTime() <= Date.now()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["scheduleDate"],
            message: "Debe ser una fecha futura",
          });
        }
      }
    }
    if (data.rateLimitPerMinute && data.rateLimitPerMinute.trim()) {
      const n = Number(data.rateLimitPerMinute);
      if (!Number.isFinite(n) || n <= 0 || n > 10000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rateLimitPerMinute"],
          message: "Entre 1 y 10000",
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface PreviewResponse {
  subject: string;
  html: string;
  recipientCount: number;
}

const STATUS_LABEL: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Borrador", variant: "outline" },
  scheduled: { label: "Programada", variant: "outline" },
  sending: { label: "En curso", variant: "secondary" },
  sent: { label: "Enviada", variant: "default" },
  failed: { label: "Fallida", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "secondary" },
};

export default function EditorialBroadcastManagement() {
  const { authors } = useAdminAuthor();
  const { toast } = useToast();
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
  const [cancelTarget, setCancelTarget] = useState<EditorialBroadcast | null>(null);

  const detectedTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);
  const tzOptions = useMemo(() => {
    const set = new Set<string>(COMMON_TIMEZONES);
    set.add(detectedTz);
    return Array.from(set);
  }, [detectedTz]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderAuthorId: "",
      type: "new_release",
      bookIds: [],
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
  const watchBookIds = form.watch("bookIds");
  const watchScheduleMode = form.watch("scheduleMode");

  // All books across the editorial — the editorial campaign can feature
  // titles from any author.
  const { data: allBooks = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const authorsById = useMemo(() => {
    const m = new Map<string, Author>();
    for (const a of authors) m.set(a.id, a);
    return m;
  }, [authors]);

  const booksByAuthor = useMemo(() => {
    const grouped = new Map<string, Book[]>();
    for (const b of allBooks) {
      const key = b.authorId || "__none__";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(b);
    }
    return grouped;
  }, [allBooks]);

  const { data: lists = [] } = useQuery<EditorialList[]>({
    queryKey: ["/api/editorial/lists"],
  });

  const { data: pastBroadcasts = [], isLoading: loadingHistory } = useQuery<
    EditorialBroadcast[]
  >({
    queryKey: ["/api/editorial/broadcasts"],
  });

  function buildPayload(values: FormValues) {
    const promoPriceCents =
      values.type === "promotion" && values.promoPriceEuros
        ? Math.round(Number(values.promoPriceEuros) * 100)
        : null;
    const scheduledFor =
      values.scheduleMode === "later"
        ? localDateTimeToUtcIso(
            values.scheduleDate || "",
            values.scheduleTime || "",
            values.scheduleTimezone || "UTC",
          )
        : null;
    const rate =
      values.rateLimitPerMinute && values.rateLimitPerMinute.trim()
        ? Math.floor(Number(values.rateLimitPerMinute))
        : null;
    return {
      senderAuthorId: values.senderAuthorId,
      type: values.type,
      bookIds: values.bookIds,
      subject: values.subject,
      previewText: values.previewText || null,
      customMessage: values.customMessage || null,
      promoPriceCents,
      promoCurrency:
        values.type === "promotion" ? values.promoCurrency || "EUR" : null,
      promoStartsAt:
        values.type === "promotion" ? values.promoStartsAt || null : null,
      promoEndsAt:
        values.type === "promotion" ? values.promoEndsAt || null : null,
      listIds: values.listIds && values.listIds.length > 0 ? values.listIds : null,
      scheduledFor,
      timezone:
        values.scheduleMode === "later" ? values.scheduleTimezone || null : null,
      rateLimitPerMinute: rate,
      scheduleMode: "fixed" as const,
    };
  }

  const previewMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const r = await apiRequest(
        "POST",
        `/api/editorial/broadcasts/preview`,
        buildPayload(values),
      );
      return (await r.json()) as PreviewResponse;
    },
    onSuccess: (data) => setPreview(data),
    onError: (err: Error) =>
      toast({
        title: "No se pudo generar la vista previa",
        description: err.message,
        variant: "destructive",
      }),
  });

  const sendMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const r = await apiRequest(
        "POST",
        `/api/editorial/broadcasts`,
        buildPayload(values),
      );
      return (await r.json()) as EditorialBroadcast;
    },
    onSuccess: (data) => {
      if (data.status === "scheduled" && data.scheduledFor) {
        const when = new Date(data.scheduledFor).toLocaleString("es-ES");
        toast({
          title: "Campaña editorial programada",
          description: `Se enviará el ${when}${data.timezone ? ` (${data.timezone})` : ""}.`,
        });
      } else {
        toast({
          title: "Campaña editorial enviada",
          description: `Entregada a ${data.successCount ?? 0} destinatarios${(data.failureCount ?? 0) > 0 ? ` (${data.failureCount} fallos)` : ""}.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/broadcasts"] });
      form.reset({
        ...form.getValues(),
        subject: "",
        customMessage: "",
        previewText: "",
      });
      setPreview(null);
      setConfirmOpen(false);
    },
    onError: (err: Error) => {
      toast({
        title: "No se pudo enviar",
        description: err.message,
        variant: "destructive",
      });
      setConfirmOpen(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const r = await apiRequest(
        "POST",
        `/api/editorial/broadcasts/${broadcastId}/cancel`,
        {},
      );
      return (await r.json()) as EditorialBroadcast;
    },
    onSuccess: () => {
      toast({
        title: "Campaña cancelada",
        description: "El envío programado se ha detenido.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/broadcasts"] });
      setCancelTarget(null);
    },
    onError: (err: Error) => {
      toast({
        title: "No se pudo cancelar",
        description: err.message,
        variant: "destructive",
      });
      setCancelTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      await apiRequest("DELETE", `/api/editorial/broadcasts/${broadcastId}`);
    },
    onSuccess: () => {
      toast({ title: "Campaña eliminada" });
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/broadcasts"] });
      setCancelTarget(null);
    },
    onError: (err: Error) =>
      toast({
        title: "No se pudo eliminar",
        description: err.message,
        variant: "destructive",
      }),
  });

  const onSubmitPreview = form.handleSubmit((v) => previewMutation.mutate(v));

  return (
    <div className="space-y-6" data-testid="editorial-broadcast-management">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Mail className="w-6 h-6" /> Campañas Editoriales
        </h2>
        <p className="text-sm text-muted-foreground">
          Anuncia novedades o promociones a todos los suscriptores de la editorial.
          El remitente y el diseño se basan en el autor seleccionado, y puedes incluir
          libros de cualquier autor del catálogo.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "compose" | "history")}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="compose" data-testid="tab-editorial-compose">
            Componer
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-editorial-history">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Nueva campaña editorial</h3>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={onSubmitPreview} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="senderAuthorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remitente (autor)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-editorial-sender">
                              <SelectValue placeholder="Selecciona el autor que firma…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {authors.map((a) => (
                              <SelectItem
                                key={a.id}
                                value={a.id}
                                data-testid={`option-sender-${a.id}`}
                              >
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Su configuración de email (proveedor, dominio, identidad
                          de envío) se usa como remitente de toda la campaña.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-editorial-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new_release">
                              Nuevo lanzamiento
                            </SelectItem>
                            <SelectItem value="promotion">
                              Oferta / promoción
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bookIds"
                    render={() => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" /> Libros destacados
                        </FormLabel>
                        <FormDescription>
                          Marca uno o varios libros de cualquier autor.
                        </FormDescription>
                        <div className="mt-2 space-y-4 max-h-[360px] overflow-y-auto border rounded-md p-3">
                          {authors.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No hay autores en el sistema.
                            </p>
                          ) : (
                            authors.map((a) => {
                              const list = booksByAuthor.get(a.id) || [];
                              if (list.length === 0) return null;
                              return (
                                <div key={a.id} className="space-y-1">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {a.name}
                                  </p>
                                  <div className="space-y-1 pl-2">
                                    {list.map((b) => (
                                      <FormField
                                        key={b.id}
                                        control={form.control}
                                        name="bookIds"
                                        render={({ field }) => {
                                          const checked = (field.value || []).includes(b.id);
                                          return (
                                            <FormItem className="flex items-center gap-2 space-y-0">
                                              <FormControl>
                                                <Checkbox
                                                  data-testid={`checkbox-editorial-book-${b.id}`}
                                                  checked={checked}
                                                  onCheckedChange={(c) => {
                                                    const v = field.value || [];
                                                    field.onChange(
                                                      c
                                                        ? [...v, b.id]
                                                        : v.filter(
                                                            (x: string) => x !== b.id,
                                                          ),
                                                    );
                                                  }}
                                                />
                                              </FormControl>
                                              <FormLabel className="font-normal text-sm">
                                                {b.title}
                                              </FormLabel>
                                            </FormItem>
                                          );
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                        {watchBookIds.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {watchBookIds.length} libro
                            {watchBookIds.length === 1 ? "" : "s"} seleccionado
                            {watchBookIds.length === 1 ? "" : "s"}.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asunto</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Por ejemplo: Novedades de la editorial este mes"
                            data-testid="input-editorial-subject"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previewText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto de vista previa (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="El texto que se ve junto al asunto"
                            data-testid="input-editorial-preview"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje personal (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={5}
                            placeholder="Unas palabras que aparecerán encima de los libros."
                            data-testid="textarea-editorial-message"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchType === "promotion" && (
                    <div className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg bg-muted/30">
                      <FormField
                        control={form.control}
                        name="promoPriceEuros"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio nuevo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0,99"
                                data-testid="input-editorial-promo-price"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="promoCurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moneda</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-editorial-promo-currency">
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
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="promoStartsAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Desde</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                data-testid="input-editorial-promo-starts"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="promoEndsAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hasta</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                data-testid="input-editorial-promo-ends"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="grid gap-4 p-4 border rounded-lg bg-muted/20">
                    <FormField
                      control={form.control}
                      name="scheduleMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="w-4 h-4" /> ¿Cuándo enviar?
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-6 mt-2"
                            >
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem
                                    value="now"
                                    data-testid="radio-editorial-schedule-now"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Enviar ahora
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem
                                    value="later"
                                    data-testid="radio-editorial-schedule-later"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Programar envío
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchScheduleMode === "later" && (
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="scheduleDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  data-testid="input-editorial-schedule-date"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="scheduleTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hora</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  data-testid="input-editorial-schedule-time"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="scheduleTimezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zona horaria</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-editorial-schedule-timezone">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {tzOptions.map((tz) => (
                                    <SelectItem
                                      key={tz}
                                      value={tz}
                                      data-testid={`option-editorial-tz-${tz}`}
                                    >
                                      {tz}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="rateLimitPerMinute"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Gauge className="w-4 h-4" /> Límite de envío (opcional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="10000"
                              placeholder="Sin límite"
                              data-testid="input-editorial-rate-limit"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Emails por minuto.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {lists.length > 0 && (
                    <FormField
                      control={form.control}
                      name="listIds"
                      render={() => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="w-4 h-4" /> Listas destinatarias
                          </FormLabel>
                          <FormDescription>
                            Si no marcas ninguna, se enviará a todos los suscriptores
                            editoriales activos.
                          </FormDescription>
                          <div className="space-y-2 mt-2">
                            {lists.map((l) => (
                              <FormField
                                key={l.id}
                                control={form.control}
                                name="listIds"
                                render={({ field }) => {
                                  const checked = (field.value || []).includes(l.id);
                                  return (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          data-testid={`checkbox-editorial-list-${l.id}`}
                                          checked={checked}
                                          onCheckedChange={(c) => {
                                            const v = field.value || [];
                                            field.onChange(
                                              c
                                                ? [...v, l.id]
                                                : v.filter(
                                                    (x: string) => x !== l.id,
                                                  ),
                                            );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {l.name}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={previewMutation.isPending}
                      data-testid="button-editorial-preview"
                    >
                      {previewMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      Vista previa
                    </Button>
                    <Button
                      type="button"
                      disabled={!preview || sendMutation.isPending}
                      onClick={() => setConfirmOpen(true)}
                      data-testid="button-editorial-send"
                    >
                      {watchScheduleMode === "now" ? (
                        <Send className="w-4 h-4 mr-2" />
                      ) : (
                        <Clock className="w-4 h-4 mr-2" />
                      )}
                      {watchScheduleMode === "now" ? "Enviar campaña" : "Programar campaña"}
                    </Button>
                    {preview && (
                      <Badge
                        variant="secondary"
                        className="self-center"
                        data-testid="text-editorial-recipient-count"
                      >
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
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Eye className="w-5 h-5" /> Vista previa
                </h3>
                <Badge variant="outline" data-testid="text-editorial-preview-subject">
                  Asunto: {preview.subject}
                </Badge>
              </CardHeader>
              <CardContent>
                <iframe
                  title="Editorial email preview"
                  srcDoc={preview.html}
                  className="w-full min-h-[640px] border rounded bg-white"
                  data-testid="iframe-editorial-preview"
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
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                </div>
              ) : pastBroadcasts.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground"
                  data-testid="text-no-editorial-broadcasts"
                >
                  Aún no has enviado ninguna campaña editorial.
                </p>
              ) : (
                <div className="space-y-3">
                  {pastBroadcasts.map((b) => {
                    const status = STATUS_LABEL[b.status] ?? STATUS_LABEL.draft;
                    const isScheduled = b.status === "scheduled";
                    const sender = authorsById.get(b.senderAuthorId);
                    return (
                      <div
                        key={b.id}
                        className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                        data-testid={`row-editorial-broadcast-${b.id}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {b.type === "promotion" ? (
                                <Tag className="w-3 h-3" />
                              ) : (
                                <BookOpen className="w-3 h-3" />
                              )}
                              {b.type === "promotion" ? "Oferta" : "Lanzamiento"}
                            </Badge>
                            {sender && (
                              <Badge variant="outline" className="text-xs">
                                Remitente: {sender.name}
                              </Badge>
                            )}
                            {b.bookIds && b.bookIds.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {b.bookIds.length} libro
                                {b.bookIds.length === 1 ? "" : "s"}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{b.subject}</p>
                          {b.status === "scheduled" && b.scheduledFor ? (
                            <p
                              className="text-xs text-muted-foreground"
                              data-testid={`text-editorial-scheduled-${b.id}`}
                            >
                              Programada para{" "}
                              {new Date(b.scheduledFor).toLocaleString("es-ES")}
                              {b.timezone ? ` (${b.timezone})` : ""}
                              {b.rateLimitPerMinute
                                ? ` · ritmo ${b.rateLimitPerMinute}/min`
                                : ""}
                            </p>
                          ) : b.status === "sending" ? (
                            <p className="text-xs text-muted-foreground">
                              En curso · {b.successCount ?? 0}/
                              {b.recipientCount ?? 0} entregadas
                            </p>
                          ) : b.status === "cancelled" ? (
                            <p
                              className="text-xs text-muted-foreground"
                              data-testid={`text-editorial-cancelled-${b.id}`}
                            >
                              Cancelada antes de enviarse
                              {b.scheduledFor
                                ? ` · estaba programada para ${new Date(b.scheduledFor).toLocaleString("es-ES")}`
                                : ""}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {b.sentAt
                                ? new Date(b.sentAt).toLocaleString("es-ES")
                                : "Sin enviar"}{" "}
                              · {b.successCount ?? 0} entregadas
                              {(b.failureCount ?? 0) > 0
                                ? ` · ${b.failureCount} fallidas`
                                : ""}
                            </p>
                          )}
                          {b.errorMessage && (
                            <p className="text-xs text-destructive">{b.errorMessage}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isScheduled && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancelTarget(b)}
                              data-testid={`button-cancel-editorial-broadcast-${b.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Cancelar
                            </Button>
                          )}
                          {(b.status === "draft" ||
                            b.status === "cancelled" ||
                            b.status === "failed") && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("¿Eliminar esta campaña del historial?")) {
                                  deleteMutation.mutate(b.id);
                                }
                              }}
                              data-testid={`button-delete-editorial-broadcast-${b.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
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
        <DialogContent data-testid="dialog-editorial-confirm-send">
          <DialogHeader>
            <DialogTitle>
              {watchScheduleMode === "now"
                ? "¿Enviar la campaña editorial?"
                : "¿Programar la campaña editorial?"}
            </DialogTitle>
          </DialogHeader>
          {watchScheduleMode === "later" ? (
            <p className="text-sm">
              Se enviará a <strong>{preview?.recipientCount ?? 0}</strong>{" "}
              suscriptores el{" "}
              <strong>
                {(() => {
                  const v = form.getValues();
                  const iso = localDateTimeToUtcIso(
                    v.scheduleDate || "",
                    v.scheduleTime || "",
                    v.scheduleTimezone || "UTC",
                  );
                  return iso ? new Date(iso).toLocaleString("es-ES") : "";
                })()}
              </strong>{" "}
              ({form.getValues("scheduleTimezone")}).
            </p>
          ) : (
            <p className="text-sm">
              Vas a enviar este email a{" "}
              <strong>{preview?.recipientCount ?? 0}</strong> suscriptores
              editoriales activos. No se puede deshacer.
            </p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              data-testid="button-editorial-cancel-send"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => sendMutation.mutate(form.getValues())}
              disabled={sendMutation.isPending}
              data-testid="button-editorial-confirm-send"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : watchScheduleMode === "now" ? (
                <Send className="w-4 h-4 mr-2" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              {watchScheduleMode === "now" ? "Enviar ahora" : "Programar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cancelTarget}
        onOpenChange={(o) => {
          if (!o) setCancelTarget(null);
        }}
      >
        <DialogContent data-testid="dialog-editorial-confirm-cancel">
          <DialogHeader>
            <DialogTitle>¿Cancelar esta campaña?</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            La campaña <strong>{cancelTarget?.subject}</strong> dejará de enviarse y
            quedará marcada como cancelada.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setCancelTarget(null)}
              data-testid="button-editorial-keep-broadcast"
            >
              Mantener
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancelTarget && cancelMutation.mutate(cancelTarget.id)
              }
              disabled={cancelMutation.isPending}
              data-testid="button-editorial-confirm-cancel"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Cancelar campaña
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
