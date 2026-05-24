import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, RefreshCw, Download } from "lucide-react";

interface SettingsResponse {
  isEnabled: boolean;
  hasCredentials: boolean;
  clientId: string | null;
  profileId: string | null;
  marketplace: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
}

interface DashboardRow {
  landingType: string;
  authorId: string | null;
  seriesId: string | null;
  bookId: string | null;
  sessions: number;
  clicks: number;
  detailPageViews: number;
  addToCart: number;
  purchases: number;
  salesAmount: number;
}

export default function AmazonAttributionManagement() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Amazon Attribution</h2>
        <p className="text-muted-foreground">
          Conecta la cuenta de Amazon Ads de la editorial para rastrear ventas
          generadas desde tus páginas y recibir el Brand Referral Bonus.
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings" data-testid="tab-attribution-settings">Configuración</TabsTrigger>
          <TabsTrigger value="dashboard" data-testid="tab-attribution-dashboard">Panel de resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <SettingsTab toast={toast} />
        </TabsContent>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const { data: settings, isLoading } = useQuery<SettingsResponse>({
    queryKey: ["/api/admin/attribution/settings"],
  });

  const [form, setForm] = useState({
    clientId: "",
    clientSecret: "",
    profileId: "",
    marketplace: "www.amazon.es",
    isEnabled: false,
  });
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setForm({
      clientId: settings.clientId || "",
      clientSecret: "",
      profileId: settings.profileId || "",
      marketplace: settings.marketplace || "www.amazon.es",
      isEnabled: settings.isEnabled,
    });
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("PUT", "/api/admin/attribution/settings", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Configuración guardada" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/attribution/settings"] });
    },
    onError: (err: any) => {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/attribution/sync", {});
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Sincronización completada", description: `${data.rowsUpserted} filas actualizadas` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/attribution/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/attribution/dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "Error de sincronización", description: err.message, variant: "destructive" });
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/admin/attribution/oauth/start");
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: any) => {
      toast({ title: "No se puede iniciar la conexión", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const handleSave = () => {
    const patch: any = {
      clientId: form.clientId,
      profileId: form.profileId,
      marketplace: form.marketplace,
      isEnabled: form.isEnabled,
    };
    // Only send the secret if the admin typed something new — otherwise we
    // keep the stored value intact (the secret is never returned to the UI).
    if (form.clientSecret.trim() !== "") patch.clientSecret = form.clientSecret;
    saveMutation.mutate(patch);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Estado</CardTitle>
          <CardDescription>
            {settings?.hasCredentials
              ? "Cuenta conectada. Puedes activar o desactivar la integración."
              : "No hay credenciales guardadas. Introduce las credenciales y pulsa 'Conectar con Amazon' para autorizar la cuenta."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={settings?.isEnabled ? "default" : "secondary"} data-testid="badge-attribution-status">
              {settings?.isEnabled ? "Activa" : "Desactivada"}
            </Badge>
            {settings?.lastSyncAt && (
              <span className="text-xs text-muted-foreground" data-testid="text-last-sync">
                Última sincronización: {new Date(settings.lastSyncAt).toLocaleString()} · {settings.lastSyncStatus}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credenciales</CardTitle>
          <CardDescription>
            Crea una aplicación "Login with Amazon" en el portal de desarrolladores
            de Amazon y pega aquí su Client ID y Client Secret. Después usa el botón
            "Conectar con Amazon" para autorizar la cuenta de Amazon Ads y obtener
            el Profile ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="att-client-id">Client ID</Label>
            <Input
              id="att-client-id"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              data-testid="input-attribution-client-id"
            />
          </div>
          <div>
            <Label htmlFor="att-client-secret">Client Secret</Label>
            <Input
              id="att-client-secret"
              type="password"
              placeholder={settings?.hasCredentials ? "•••••••• (sin cambios)" : ""}
              value={form.clientSecret}
              onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
              data-testid="input-attribution-client-secret"
            />
          </div>
          <div>
            <Label htmlFor="att-profile-id">Profile ID de Amazon Ads</Label>
            <Input
              id="att-profile-id"
              value={form.profileId}
              onChange={(e) => setForm({ ...form, profileId: e.target.value })}
              data-testid="input-attribution-profile-id"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Numérico, identifica la cuenta + marketplace. Se rellena automáticamente
              al completar el flujo "Conectar con Amazon".
            </p>
          </div>
          <div>
            <Label htmlFor="att-marketplace">Marketplace</Label>
            <Input
              id="att-marketplace"
              placeholder="www.amazon.es"
              value={form.marketplace}
              onChange={(e) => setForm({ ...form, marketplace: e.target.value })}
              data-testid="input-attribution-marketplace"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Integración activa</Label>
              <p className="text-xs text-muted-foreground">
                Al desactivarla los botones "Comprar en Amazon" vuelven al enlace plano.
              </p>
            </div>
            <Switch
              checked={form.isEnabled}
              onCheckedChange={(v) => setForm({ ...form, isEnabled: v })}
              data-testid="switch-attribution-enabled"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-attribution-save">
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
            <Button
              variant="outline"
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending || !settings?.clientId}
              data-testid="button-attribution-connect"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Conectar con Amazon
            </Button>
            <Button
              variant="outline"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || !settings?.isEnabled}
              data-testid="button-attribution-sync"
            >
              {syncMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sincronizar ahora
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardTab() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [start, setStart] = useState(monthAgo);
  const [end, setEnd] = useState(today);

  const { data, isLoading } = useQuery<{ start: string; end: string; rows: DashboardRow[] }>({
    queryKey: ["/api/admin/attribution/dashboard", start, end],
    queryFn: async () => {
      const res = await fetch(`/api/admin/attribution/dashboard?start=${start}&end=${end}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load dashboard");
      return await res.json();
    },
  });

  const totals = (data?.rows || []).reduce(
    (acc, r) => ({
      sessions: acc.sessions + r.sessions,
      clicks: acc.clicks + r.clicks,
      detailPageViews: acc.detailPageViews + r.detailPageViews,
      addToCart: acc.addToCart + r.addToCart,
      purchases: acc.purchases + r.purchases,
      salesAmount: acc.salesAmount + r.salesAmount,
    }),
    { sessions: 0, clicks: 0, detailPageViews: 0, addToCart: 0, purchases: 0, salesAmount: 0 },
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap gap-3 items-end pt-6">
          <div>
            <Label htmlFor="att-start">Desde</Label>
            <Input id="att-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} data-testid="input-attribution-start" />
          </div>
          <div>
            <Label htmlFor="att-end">Hasta</Label>
            <Input id="att-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} data-testid="input-attribution-end" />
          </div>
          <Button asChild variant="outline" data-testid="button-attribution-export">
            <a href={`/api/admin/attribution/export?start=${start}&end=${end}`}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <MetricCard label="Sesiones" value={totals.sessions} testId="metric-sessions" />
        <MetricCard label="Clicks" value={totals.clicks} testId="metric-clicks" />
        <MetricCard label="Vistas ficha" value={totals.detailPageViews} testId="metric-detail-views" />
        <MetricCard label="Carritos" value={totals.addToCart} testId="metric-add-to-cart" />
        <MetricCard label="Compras" value={totals.purchases} testId="metric-purchases" />
        <MetricCard label="Ventas (€)" value={totals.salesAmount.toFixed(2)} testId="metric-sales" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por landing</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Landing</th>
                    <th className="py-2 pr-3">Autor</th>
                    <th className="py-2 pr-3">Serie</th>
                    <th className="py-2 pr-3">Libro</th>
                    <th className="py-2 pr-3 text-right">Sesiones</th>
                    <th className="py-2 pr-3 text-right">Clicks</th>
                    <th className="py-2 pr-3 text-right">Vistas</th>
                    <th className="py-2 pr-3 text-right">Carritos</th>
                    <th className="py-2 pr-3 text-right">Compras</th>
                    <th className="py-2 pr-3 text-right">€</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.rows || []).map((r, i) => (
                    <tr key={i} className="border-b" data-testid={`row-attribution-${i}`}>
                      <td className="py-2 pr-3 capitalize">{r.landingType}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.authorId?.slice(0, 8) || "—"}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.seriesId?.slice(0, 8) || "—"}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.bookId?.slice(0, 8) || "—"}</td>
                      <td className="py-2 pr-3 text-right">{r.sessions}</td>
                      <td className="py-2 pr-3 text-right">{r.clicks}</td>
                      <td className="py-2 pr-3 text-right">{r.detailPageViews}</td>
                      <td className="py-2 pr-3 text-right">{r.addToCart}</td>
                      <td className="py-2 pr-3 text-right">{r.purchases}</td>
                      <td className="py-2 pr-3 text-right">{r.salesAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!data?.rows || data.rows.length === 0) && (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-muted-foreground">
                        Sin datos en el rango seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, testId }: { label: string; value: number | string; testId: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold" data-testid={testId}>{value}</div>
      </CardContent>
    </Card>
  );
}
