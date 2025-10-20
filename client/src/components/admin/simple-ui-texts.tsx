import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UiText } from "@shared/schema";

export default function SimpleUiTexts() {
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all");
  const [selectedLocale, setSelectedLocale] = useState<string>("es-ES");

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
        <div className="text-center py-8">Cargando textos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-destructive">
          Error: {error instanceof Error ? error.message : "Error desconocido"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-ui-texts-title">
          Textos de la Interfaz
        </h2>
        <p className="text-muted-foreground">
          {uiTexts.length} textos en total • {namespaces.length} namespaces
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">Namespace</label>
          <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
            <SelectTrigger data-testid="select-namespace">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los namespaces ({namespaces.length})</SelectItem>
              {namespaces.map((ns) => (
                <SelectItem key={ns} value={ns}>
                  {ns}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium">Idioma</label>
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
            {filteredTexts.length} textos
            {selectedNamespace !== "all" && ` en ${selectedNamespace}`}
            {` (${localeNames[selectedLocale]})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Namespace</TableHead>
                  <TableHead className="w-[250px]">Clave</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTexts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No hay textos para mostrar
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
          <CardTitle>Estadísticas por Namespace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {namespaces.map((ns) => {
              const count = uiTexts.filter(t => t.namespace === ns).length;
              return (
                <div key={ns} className="flex justify-between items-center text-sm">
                  <span className="font-mono">{ns}</span>
                  <span className="text-muted-foreground">{count} textos</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
