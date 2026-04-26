import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { EditorialList } from "@shared/schema";

type ListDraft = {
  name: string;
  slug: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

const emptyDraft: ListDraft = {
  name: "",
  slug: "",
  description: "",
  isDefault: false,
  isActive: true,
  sortOrder: 0,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function EditorialListsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditorialList | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draft, setDraft] = useState<ListDraft>(emptyDraft);

  // Editorial lists are a flat collection — no authorId scoping. The default
  // fetcher works fine because the path is unambiguous.
  const listsKey = ["/api/editorial/lists"] as const;

  const { data: lists = [], isLoading } = useQuery<EditorialList[]>({
    queryKey: listsKey,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: ListDraft) =>
      apiRequest("POST", `/api/editorial/lists`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsKey });
      setIsCreateOpen(false);
      setDraft(emptyDraft);
      toast({ title: "Lista creada" });
    },
    onError: () =>
      toast({ title: "Error", description: "No se pudo crear la lista", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ListDraft> }) =>
      apiRequest("PATCH", `/api/editorial/lists/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsKey });
      setEditing(null);
      toast({ title: "Lista actualizada" });
    },
    onError: () =>
      toast({ title: "Error", description: "No se pudo actualizar la lista", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/editorial/lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsKey });
      toast({ title: "Lista eliminada" });
    },
    onError: () =>
      toast({ title: "Error", description: "No se pudo eliminar la lista", variant: "destructive" }),
  });

  const openCreate = () => {
    setDraft(emptyDraft);
    setIsCreateOpen(true);
  };

  const openEdit = (l: EditorialList) => {
    setEditing(l);
    setDraft({
      name: l.name,
      slug: l.slug,
      description: l.description ?? "",
      isDefault: !!l.isDefault,
      isActive: l.isActive ?? true,
      sortOrder: l.sortOrder ?? 0,
    });
  };

  const submit = () => {
    if (!draft.name.trim()) {
      toast({ title: "Falta el nombre", variant: "destructive" });
      return;
    }
    const safeSlug = (draft.slug.trim() || slugify(draft.name)).slice(0, 60);
    const payload = { ...draft, slug: safeSlug };
    if (editing) {
      updateMutation.mutate({ id: editing.id, patch: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isOpen = isCreateOpen || !!editing;
  const closeDialog = () => {
    setIsCreateOpen(false);
    setEditing(null);
    setDraft(emptyDraft);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-editorial-lists-title">
            Listas Editoriales
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Listas de interés a nivel editorial — comunes a todos los autores.
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-editorial-list">
          <Plus className="h-4 w-4 mr-2" /> Nueva lista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{lists.length} listas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : lists.length === 0 ? (
            <p className="text-muted-foreground" data-testid="text-empty-editorial-lists">
              Aún no hay listas editoriales. Crea una para empezar a segmentar suscriptores.
            </p>
          ) : (
            <div className="space-y-3">
              {lists.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`row-editorial-list-${l.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{l.name}</span>
                      {l.isDefault && (
                        <Badge variant="outline" className="text-xs">por defecto</Badge>
                      )}
                      {!l.isActive && (
                        <Badge variant="destructive" className="text-xs">inactiva</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{l.slug}</div>
                    {l.description && (
                      <p className="text-sm text-muted-foreground">{l.description}</p>
                    )}
                  </div>
                  <div className="space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(l)}
                      data-testid={`button-edit-editorial-list-${l.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`¿Borrar la lista "${l.name}"?`)) {
                          deleteMutation.mutate(l.id);
                        }
                      }}
                      data-testid={`button-delete-editorial-list-${l.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar lista" : "Nueva lista editorial"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    name: e.target.value,
                    slug: !editing && !d.slug ? slugify(e.target.value) : d.slug,
                  }))
                }
                placeholder="Novedades de la editorial"
                data-testid="input-editorial-list-name"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: slugify(e.target.value) }))}
                placeholder="novedades-editorial"
                data-testid="input-editorial-list-slug"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Para suscriptores de toda la editorial…"
                data-testid="input-editorial-list-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Marcada por defecto</Label>
                <p className="text-xs text-muted-foreground">
                  Pre-seleccionada en el formulario público de alta editorial.
                </p>
              </div>
              <Switch
                checked={draft.isDefault}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, isDefault: !!v }))}
                data-testid="switch-editorial-list-default"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Activa</Label>
                <p className="text-xs text-muted-foreground">
                  Las inactivas no aparecen en formularios públicos.
                </p>
              </div>
              <Switch
                checked={draft.isActive}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, isActive: !!v }))}
                data-testid="switch-editorial-list-active"
              />
            </div>
            <div>
              <Label>Orden</Label>
              <Input
                type="number"
                value={draft.sortOrder}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, sortOrder: parseInt(e.target.value) || 0 }))
                }
                data-testid="input-editorial-list-sort"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              onClick={submit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-editorial-list"
            >
              {editing ? "Guardar" : "Crear lista"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
