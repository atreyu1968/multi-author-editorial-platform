import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, Copy, Save, Search, FileJson, FileText, AlertCircle, CheckCircle2, Languages, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

type LocaleSummary = {
  locale: string;
  total: number;
  translated: number;
  missing: number;
  coverage: number;
};

type TranslationRow = {
  namespace: string;
  key: string;
  locales: Record<string, string | null>;
};

type MissingTranslation = {
  namespace: string;
  key: string;
  sourceValue: string;
};

export default function TranslationManagement() {
  const { toast } = useToast();
  const [selectedLocale, setSelectedLocale] = useState<string>("all");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCell, setEditingCell] = useState<{ namespace: string; key: string; locale: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFormat, setImportFormat] = useState<"json" | "csv">("json");
  const [importData, setImportData] = useState("");
  const [importLocale, setImportLocale] = useState("es-ES");

  const locales = ["es-ES", "en-US", "ca-ES"];

  const { data: summary = [], isLoading: summaryLoading } = useQuery<LocaleSummary[]>({
    queryKey: ["/api/translations/summary"],
  });

  const { data: namespaces = [] } = useQuery<string[]>({
    queryKey: ["/api/translations/namespaces"],
    queryFn: async () => {
      const allTexts = await fetch("/api/ui-texts").then(r => r.json());
      const uniqueNamespaces = Array.from(new Set(allTexts.map((t: any) => t.namespace))) as string[];
      return uniqueNamespaces.sort();
    }
  });

  const { data: matrix = [], isLoading: matrixLoading, refetch: refetchMatrix } = useQuery<TranslationRow[]>({
    queryKey: ["/api/translations/matrix", selectedNamespace, searchQuery],
    queryFn: async () => {
      const allTexts = await fetch("/api/ui-texts").then(r => r.json());
      const filtered = allTexts.filter((t: any) => {
        const namespaceMatch = selectedNamespace === "all" || t.namespace === selectedNamespace;
        const searchMatch = !searchQuery || 
          t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.value.toLowerCase().includes(searchQuery.toLowerCase());
        return namespaceMatch && searchMatch;
      });

      const matrixMap = new Map<string, TranslationRow>();
      
      filtered.forEach((text: any) => {
        const compositeKey = `${text.namespace}|||${text.key}`;
        if (!matrixMap.has(compositeKey)) {
          matrixMap.set(compositeKey, {
            namespace: text.namespace,
            key: text.key,
            locales: {}
          });
        }
        matrixMap.get(compositeKey)!.locales[text.locale] = text.value;
      });

      return Array.from(matrixMap.values()).sort((a, b) => {
        if (a.namespace !== b.namespace) return a.namespace.localeCompare(b.namespace);
        return a.key.localeCompare(b.key);
      });
    }
  });

  const { data: missingTranslations = [] } = useQuery<{ locale: string; items: MissingTranslation[] }[]>({
    queryKey: ["/api/translations/missing"],
    queryFn: async () => {
      const results = [];
      for (const locale of ["en-US", "ca-ES"]) {
        const diff = await fetch(`/api/translations/diff?source=es-ES&target=${locale}`).then(r => r.json());
        results.push({
          locale,
          items: diff.missing || []
        });
      }
      return results;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ namespace, key, locale, value }: { namespace: string; key: string; locale: string; value: string }) => {
      return apiRequest("POST", "/api/ui-texts", {
        namespace,
        key,
        locale,
        value
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/translations/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/translations/matrix"] });
      queryClient.invalidateQueries({ queryKey: ["/api/translations/missing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ui-texts"] });
      toast({ title: "Traducción actualizada", description: "El texto se ha actualizado correctamente" });
      setEditingCell(null);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar la traducción", variant: "destructive" });
    }
  });

  const copyMutation = useMutation({
    mutationFn: async ({ sourceLocale, targetLocale, namespaces }: { sourceLocale: string; targetLocale: string; namespaces?: string[] }) => {
      return apiRequest("POST", "/api/translations/copy", {
        sourceLocale,
        targetLocale,
        namespaces
      }) as unknown as Promise<{ copied: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/translations/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/translations/matrix"] });
      queryClient.invalidateQueries({ queryKey: ["/api/translations/missing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ui-texts"] });
      toast({ title: "Traducciones copiadas", description: `Se copiaron ${data.copied} traducciones` });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudieron copiar las traducciones", variant: "destructive" });
    }
  });

  const importMutation = useMutation({
    mutationFn: async ({ format, data, locale }: { format: string; data: any; locale?: string }) => {
      return apiRequest("POST", "/api/translations/import", {
        format,
        data,
        locale
      }) as unknown as Promise<{ imported: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/translations/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/translations/matrix"] });
      queryClient.invalidateQueries({ queryKey: ["/api/translations/missing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ui-texts"] });
      toast({ title: "Importación exitosa", description: `Se importaron ${data.imported} traducciones` });
      setImportDialogOpen(false);
      setImportData("");
    },
    onError: (error: any) => {
      toast({ title: "Error de importación", description: error.message || "Formato inválido", variant: "destructive" });
    }
  });

  const handleExport = async (format: "json" | "csv", locale: string) => {
    try {
      const response = await fetch(`/api/translations/export?format=${format}&locale=${locale}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations-${locale}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Exportación exitosa", description: `Traducciones exportadas en formato ${format.toUpperCase()}` });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo exportar", variant: "destructive" });
    }
  };

  const handleImport = () => {
    try {
      let parsedData = importData;
      if (importFormat === "json") {
        parsedData = JSON.parse(importData);
      }
      importMutation.mutate({
        format: importFormat,
        data: parsedData,
        locale: importLocale
      });
    } catch (error) {
      toast({ title: "Error", description: "Formato JSON inválido", variant: "destructive" });
    }
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    updateMutation.mutate({
      namespace: editingCell.namespace,
      key: editingCell.key,
      locale: editingCell.locale,
      value: editValue
    });
  };

  const handleCopyFromBase = (namespace: string, key: string, targetLocale: string) => {
    const row = matrix.find(r => r.namespace === namespace && r.key === key);
    if (!row || !row.locales["es-ES"]) return;
    
    updateMutation.mutate({
      namespace,
      key,
      locale: targetLocale,
      value: row.locales["es-ES"]
    });
  };

  const filteredMatrix = useMemo(() => {
    if (selectedLocale === "all") return matrix;
    return matrix.filter(row => !row.locales[selectedLocale]);
  }, [matrix, selectedLocale]);

  const displayedLocales = selectedLocale === "all" ? locales : [selectedLocale];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-translations-title">Gestión de Traducciones</h2>
          <p className="text-muted-foreground">Administra ~1,350+ textos en 3 idiomas</p>
        </div>
        <Languages className="h-8 w-8 text-muted-foreground" />
      </div>

      {summaryLoading ? (
        <div className="text-center py-8">Cargando estadísticas...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {summary.map((stat) => (
            <Card key={stat.locale} data-testid={`card-coverage-${stat.locale}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.locale === "es-ES" ? "Español" : stat.locale === "en-US" ? "Inglés" : "Catalán"}
                </CardTitle>
                {stat.coverage === 100 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-coverage-${stat.locale}`}>{stat.coverage}%</div>
                <p className="text-xs text-muted-foreground">
                  {stat.translated} de {stat.total} traducidos
                </p>
                {stat.missing > 0 && (
                  <Badge variant="outline" className="mt-2" data-testid={`badge-missing-${stat.locale}`}>
                    {stat.missing} faltantes
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por clave o valor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search-translations"
            />
          </div>
        </div>
        <div>
          <Label>Namespace</Label>
          <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
            <SelectTrigger className="w-[200px]" data-testid="select-namespace">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los namespaces</SelectItem>
              {namespaces.map((ns) => (
                <SelectItem key={ns} value={ns}>{ns}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="missing" className="space-y-4">
        <TabsList data-testid="tabs-translation-modes">
          <TabsTrigger value="missing" data-testid="tab-missing">Faltantes</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">Todas</TabsTrigger>
          <TabsTrigger value="import-export" data-testid="tab-import-export">Importar/Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="missing" className="space-y-4">
          {missingTranslations.map(({ locale, items }) => (
            items.length > 0 && (
              <Card key={locale} data-testid={`card-missing-${locale}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Faltantes en {locale === "en-US" ? "Inglés" : "Catalán"} ({items.length})</CardTitle>
                  <Button
                    onClick={() => copyMutation.mutate({ sourceLocale: "es-ES", targetLocale: locale })}
                    disabled={copyMutation.isPending}
                    data-testid={`button-copy-all-${locale}`}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar todas desde ES
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Namespace</TableHead>
                          <TableHead>Clave</TableHead>
                          <TableHead>Valor en ES</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.slice(0, 50).map((item, idx) => (
                          <TableRow key={idx} data-testid={`row-missing-${locale}-${idx}`}>
                            <TableCell className="font-mono text-xs">{item.namespace}</TableCell>
                            <TableCell className="font-mono text-xs">{item.key}</TableCell>
                            <TableCell className="max-w-md truncate">{item.sourceValue}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyFromBase(item.namespace, item.key, locale)}
                                data-testid={`button-copy-${locale}-${idx}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {items.length > 50 && (
                    <Alert className="mt-4">
                      <AlertDescription>
                        Mostrando 50 de {items.length}. Usa Copiar todas para importar el resto.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={selectedLocale} onValueChange={setSelectedLocale}>
              <SelectTrigger className="w-[200px]" data-testid="select-locale-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los idiomas</SelectItem>
                <SelectItem value="es-ES">Español (ES)</SelectItem>
                <SelectItem value="en-US">Inglés (EN)</SelectItem>
                <SelectItem value="ca-ES">Catalán (CA)</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {filteredMatrix.length} registros
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Namespace</TableHead>
                      <TableHead className="w-[200px]">Clave</TableHead>
                      {displayedLocales.map(locale => (
                        <TableHead key={locale}>{locale}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrixLoading ? (
                      <TableRow>
                        <TableCell colSpan={2 + displayedLocales.length} className="text-center">
                          Cargando...
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMatrix.map((row, idx) => (
                        <TableRow key={idx} data-testid={`row-translation-${idx}`}>
                          <TableCell className="font-mono text-xs">{row.namespace}</TableCell>
                          <TableCell className="font-mono text-xs">{row.key}</TableCell>
                          {displayedLocales.map(locale => {
                            const isEditing = editingCell?.namespace === row.namespace && 
                                             editingCell?.key === row.key && 
                                             editingCell?.locale === locale;
                            const value = row.locales[locale];

                            return (
                              <TableCell key={locale} data-testid={`cell-${locale}-${idx}`}>
                                {isEditing ? (
                                  <div className="flex gap-2">
                                    <Textarea
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="min-h-[60px]"
                                      data-testid={`input-edit-${locale}-${idx}`}
                                    />
                                    <div className="flex flex-col gap-1">
                                      <Button 
                                        size="sm" 
                                        onClick={handleSaveEdit}
                                        disabled={updateMutation.isPending}
                                        data-testid={`button-save-${locale}-${idx}`}
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => setEditingCell(null)}
                                        data-testid={`button-cancel-${locale}-${idx}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    className="cursor-pointer hover:bg-accent p-2 rounded min-h-[40px] group relative"
                                    onClick={() => {
                                      setEditingCell({ namespace: row.namespace, key: row.key, locale });
                                      setEditValue(value || "");
                                    }}
                                  >
                                    {value ? (
                                      <span className="text-sm">{value}</span>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground italic">Sin traducción</span>
                                        {row.locales["es-ES"] && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-2 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCopyFromBase(row.namespace, row.key, locale);
                                            }}
                                            data-testid={`button-copy-base-${locale}-${idx}`}
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import-export" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card data-testid="card-export">
              <CardHeader>
                <CardTitle>Exportar Traducciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleExport("json", "all")}
                      data-testid="button-export-json"
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      JSON
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleExport("csv", "all")}
                      data-testid="button-export-csv"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Por idioma</Label>
                  <div className="space-y-2">
                    {locales.map(locale => (
                      <div key={locale} className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport("json", locale)}
                          data-testid={`button-export-json-${locale}`}
                        >
                          <Download className="mr-2 h-3 w-3" />
                          {locale} (JSON)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport("csv", locale)}
                          data-testid={`button-export-csv-${locale}`}
                        >
                          <Download className="mr-2 h-3 w-3" />
                          {locale} (CSV)
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-import">
              <CardHeader>
                <CardTitle>Importar Traducciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select value={importFormat} onValueChange={(v) => setImportFormat(v as "json" | "csv")}>
                    <SelectTrigger data-testid="select-import-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {importFormat === "json" && (
                  <div className="space-y-2">
                    <Label>Idioma (opcional)</Label>
                    <Select value={importLocale} onValueChange={setImportLocale}>
                      <SelectTrigger data-testid="select-import-locale">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es-ES">Español</SelectItem>
                        <SelectItem value="en-US">Inglés</SelectItem>
                        <SelectItem value="ca-ES">Catalán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" data-testid="button-open-import">
                      <Upload className="mr-2 h-4 w-4" />
                      Importar desde {importFormat.toUpperCase()}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Importar Traducciones ({importFormat.toUpperCase()})</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Datos {importFormat.toUpperCase()}</Label>
                        <Textarea
                          value={importData}
                          onChange={(e) => setImportData(e.target.value)}
                          placeholder={importFormat === "json" 
                            ? '{"namespace": {"key": "value"}}'
                            : 'namespace,key,locale,value'}
                          className="font-mono text-sm min-h-[300px]"
                          data-testid="input-import-data"
                        />
                      </div>
                      <Button
                        onClick={handleImport}
                        disabled={!importData || importMutation.isPending}
                        className="w-full"
                        data-testid="button-submit-import"
                      >
                        {importMutation.isPending ? "Importando..." : "Importar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
