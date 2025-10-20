import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UiText } from "@shared/schema";
import { useUiText } from "@/contexts/ui-text-context";

export default function SimpleUiTexts() {
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all");
  const [selectedLocale, setSelectedLocale] = useState<string>("es-ES");

  const t = {
    loading: useUiText("admin.ui_texts", "loading", "Cargando textos..."),
    errorTitle: useUiText("admin.ui_texts", "error_title", "Error"),
    pageTitle: useUiText("admin.ui_texts", "page_title", "Textos de la Interfaz"),
    totalTextsLabel: useUiText("admin.ui_texts", "total_texts_label", "textos en total"),
    namespacesLabel: useUiText("admin.ui_texts", "namespaces_label", "namespaces"),
    labelNamespace: useUiText("admin.ui_texts", "label_namespace", "Namespace"),
    allNamespaces: useUiText("admin.ui_texts", "all_namespaces", "Todos los namespaces"),
    labelLanguage: useUiText("admin.ui_texts", "label_language", "Idioma"),
    textsCount: useUiText("admin.ui_texts", "texts_count", "textos"),
    textsIn: useUiText("admin.ui_texts", "texts_in", "en"),
    tableHeaderNamespace: useUiText("admin.ui_texts", "table_header_namespace", "Namespace"),
    tableHeaderKey: useUiText("admin.ui_texts", "table_header_key", "Clave"),
    tableHeaderValue: useUiText("admin.ui_texts", "table_header_value", "Valor"),
    emptyState: useUiText("admin.ui_texts", "empty_state", "No hay textos para mostrar"),
    statsTitle: useUiText("admin.ui_texts", "stats_title", "Estadísticas por Namespace"),
  };

  const { data: uiTexts = [], isLoading, error } = useQuery<UiText[]>({
    queryKey: ["/api/ui-texts"],
    queryFn: async () => {
      console.log("Fetching UI texts...");
      const response = await fetch("/api/ui-texts");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(`Fetched ${data.length} UI texts`);
      return data;
    },
  });

  // Extract unique namespaces
  const namespaces = Array.from(new Set(uiTexts.map(t => t.namespace))).sort();

  // Filter texts
  const filteredTexts = uiTexts.filter(t => {
    const namespaceMatch = selectedNamespace === "all" || t.namespace === selectedNamespace;
    const localeMatch = t.locale === selectedLocale;
    return namespaceMatch && localeMatch;
  });

  const locales = ["es-ES", "en-US", "ca-ES", "fr-FR", "it-IT", "de-DE", "pt-PT"];
  
  const localeNames: Record<string, string> = {
    "es-ES": "Español",
    "en-US": "English",
    "ca-ES": "Català",
    "fr-FR": "Français",
    "it-IT": "Italiano",
    "de-DE": "Deutsch",
    "pt-PT": "Português"
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">{t.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-destructive">
          {t.errorTitle}: {error instanceof Error ? error.message : t.errorTitle}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-ui-texts-title">
          {t.pageTitle}
        </h2>
        <p className="text-muted-foreground">
          {uiTexts.length} {t.totalTextsLabel} • {namespaces.length} {t.namespacesLabel}
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">{t.labelNamespace}</label>
          <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
            <SelectTrigger data-testid="select-namespace">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allNamespaces} ({namespaces.length})</SelectItem>
              {namespaces.map((ns) => (
                <SelectItem key={ns} value={ns}>
                  {ns}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium">{t.labelLanguage}</label>
          <Select value={selectedLocale} onValueChange={setSelectedLocale}>
            <SelectTrigger data-testid="select-locale">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locales.map((locale) => (
                <SelectItem key={locale} value={locale}>
                  {localeNames[locale]} ({locale})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filteredTexts.length} {t.textsCount}
            {selectedNamespace !== "all" && ` ${t.textsIn} ${selectedNamespace}`}
            {` (${localeNames[selectedLocale]})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{t.tableHeaderNamespace}</TableHead>
                  <TableHead className="w-[250px]">{t.tableHeaderKey}</TableHead>
                  <TableHead>{t.tableHeaderValue}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTexts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {t.emptyState}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTexts.map((text) => (
                    <TableRow key={text.id} data-testid={`row-text-${text.id}`}>
                      <TableCell className="font-mono text-xs">{text.namespace}</TableCell>
                      <TableCell className="font-mono text-xs">{text.key}</TableCell>
                      <TableCell className="max-w-md">{text.value}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.statsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {namespaces.map((ns) => {
              const count = uiTexts.filter(t => t.namespace === ns).length;
              return (
                <div key={ns} className="flex justify-between items-center text-sm">
                  <span className="font-mono">{ns}</span>
                  <span className="text-muted-foreground">{count} {t.textsCount}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
