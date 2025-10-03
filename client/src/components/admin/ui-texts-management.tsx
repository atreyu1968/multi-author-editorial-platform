import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UiText, InsertUiText } from "@shared/schema";

const NAMESPACES = ["navigation", "home", "footer", "book_landing", "series_landing", "admin", "common"];

export default function UiTextsManagement() {
  const { toast } = useToast();
  const [selectedNamespace, setSelectedNamespace] = useState<string>("navigation");
  const [editingText, setEditingText] = useState<UiText | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newTextForm, setNewTextForm] = useState({
    namespace: "navigation",
    key: "",
    locale: "es-ES",
    value: "",
  });

  const { data: uiTexts = [], isLoading } = useQuery<UiText[]>({
    queryKey: ["/api/ui-texts"],
    queryFn: async () => {
      const response = await fetch("/api/ui-texts");
      if (!response.ok) throw new Error("Failed to fetch UI texts");
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<InsertUiText> }) => {
      return await apiRequest("PUT", `/api/ui-texts/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ui-texts"] });
      toast({ title: "Texto actualizado correctamente" });
      setEditingText(null);
    },
    onError: () => {
      toast({ title: "Error al actualizar texto", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUiText) => {
      return await apiRequest("POST", "/api/ui-texts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ui-texts"] });
      toast({ title: "Texto creado correctamente" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error al crear texto", variant: "destructive" });
    },
  });

  const textsByNamespace = uiTexts.reduce((acc, text) => {
    if (!acc[text.namespace]) {
      acc[text.namespace] = [];
    }
    acc[text.namespace].push(text);
    return acc;
  }, {} as Record<string, UiText[]>);

  const handleSaveEdit = (text: UiText, newValue: string) => {
    updateMutation.mutate({ id: text.id, updates: { value: newValue } });
  };

  const handleCreateText = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate(newTextForm);
  };

  const resetForm = () => {
    setNewTextForm({
      namespace: "navigation",
      key: "",
      locale: "es-ES",
      value: "",
    });
  };

  if (isLoading) {
    return <div className="p-6">Cargando textos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Textos del Sitio</h2>
          <p className="text-muted-foreground mt-2">
            Personaliza todos los textos visibles en el sitio web
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-text">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Texto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Texto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateText} className="space-y-4">
              <div>
                <Label htmlFor="namespace">Namespace</Label>
                <Select 
                  value={newTextForm.namespace}
                  onValueChange={(value) => setNewTextForm({ ...newTextForm, namespace: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un namespace" />
                  </SelectTrigger>
                  <SelectContent>
                    {NAMESPACES.map((ns) => (
                      <SelectItem key={ns} value={ns}>
                        {ns}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="key">Clave (Key)</Label>
                <Input
                  id="key"
                  value={newTextForm.key}
                  onChange={(e) => setNewTextForm({ ...newTextForm, key: e.target.value })}
                  required
                  placeholder="ej: home_title"
                  data-testid="input-key"
                />
              </div>
              <div>
                <Label htmlFor="locale">Idioma</Label>
                <Input
                  id="locale"
                  value={newTextForm.locale}
                  onChange={(e) => setNewTextForm({ ...newTextForm, locale: e.target.value })}
                  required
                  data-testid="input-locale"
                />
              </div>
              <div>
                <Label htmlFor="value">Valor</Label>
                <Textarea
                  id="value"
                  value={newTextForm.value}
                  onChange={(e) => setNewTextForm({ ...newTextForm, value: e.target.value })}
                  required
                  placeholder="Texto a mostrar"
                  data-testid="input-value"
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                {createMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedNamespace} onValueChange={setSelectedNamespace}>
        <TabsList className="grid grid-cols-7 w-full">
          {NAMESPACES.map((ns) => (
            <TabsTrigger key={ns} value={ns}>
              {ns}
            </TabsTrigger>
          ))}
        </TabsList>

        {NAMESPACES.map((ns) => (
          <TabsContent key={ns} value={ns} className="space-y-4">
            <div className="grid gap-4">
              {textsByNamespace[ns]?.map((text) => (
                <Card key={text.id}>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">{text.key}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingText?.id === text.id ? (
                      <div className="space-y-2">
                        <Textarea
                          defaultValue={text.value}
                          id={`edit-${text.id}`}
                          rows={3}
                          data-testid={`textarea-edit-${text.key}`}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById(`edit-${text.id}`) as HTMLTextAreaElement;
                              handleSaveEdit(text, textarea.value);
                            }}
                            disabled={updateMutation.isPending}
                            data-testid={`button-save-${text.key}`}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingText(null)}
                            data-testid={`button-cancel-${text.key}`}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-muted-foreground">{text.value}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingText(text)}
                          data-testid={`button-edit-${text.key}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {!textsByNamespace[ns] || textsByNamespace[ns].length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No hay textos en este namespace todavía
                </p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
