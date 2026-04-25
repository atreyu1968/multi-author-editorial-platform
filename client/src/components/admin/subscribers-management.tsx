import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, MailMinus, MailCheck, ListChecks } from "lucide-react";
import { useAdminAuthor } from "@/contexts/admin-author-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Newsletter, NewsletterList } from "@shared/schema";

export default function SubscribersManagement() {
  const { selectedAuthorId } = useAdminAuthor();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingSubscriber, setEditingSubscriber] = useState<Newsletter | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [managingListsFor, setManagingListsFor] = useState<Newsletter | null>(null);
  const [draftListIds, setDraftListIds] = useState<string[]>([]);

  const { data: subscribers = [], isLoading } = useQuery<Newsletter[]>({
    queryKey: ["/api/newsletter", { authorId: selectedAuthorId }],
    enabled: !!selectedAuthorId,
  });

  const { data: lists = [] } = useQuery<NewsletterList[]>({
    queryKey: ["/api/authors", selectedAuthorId, "newsletter-lists"],
    queryFn: async () => {
      const r = await fetch(`/api/authors/${selectedAuthorId}/newsletter-lists`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to load lists");
      return r.json();
    },
    enabled: !!selectedAuthorId,
  });

  // Membership lookup is fetched lazily, only when the admin opens the
  // "manage lists" dialog. This keeps the table render cheap on big lists.
  const membershipQuery = useQuery<{ subscribedListIds: string[] }>({
    queryKey: ["/api/newsletter", managingListsFor?.id, "lists"],
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/${managingListsFor!.id}/lists`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load list memberships");
      return res.json();
    },
    enabled: !!managingListsFor,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      return apiRequest("PATCH", `/api/newsletter/${id}`, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter"] });
      toast({ title: "Suscriptor actualizado" });
      setEditingSubscriber(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "No se pudo actualizar",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/newsletter/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter"] });
      toast({ title: "Suscriptor eliminado" });
    },
    onError: () =>
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" }),
  });

  const setListsMutation = useMutation({
    mutationFn: async ({ id, listIds }: { id: string; listIds: string[] }) =>
      apiRequest("POST", `/api/newsletter/${id}/lists`, { listIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter"] });
      toast({ title: "Listas actualizadas" });
      setManagingListsFor(null);
    },
    onError: () =>
      toast({
        title: "Error",
        description: "No se pudieron guardar las listas",
        variant: "destructive",
      }),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (s) =>
        s.email?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q),
    );
  }, [subscribers, search]);

  const openEdit = (s: Newsletter) => {
    setEditingSubscriber(s);
    setEditName(s.name || "");
    setEditEmail(s.email || "");
  };

  const openLists = (s: Newsletter) => {
    setManagingListsFor(s);
    setDraftListIds([]);
  };

  // Seed the dialog's checkbox state once the membership response arrives.
  if (
    managingListsFor &&
    membershipQuery.data &&
    draftListIds.length === 0 &&
    membershipQuery.data.subscribedListIds.length > 0
  ) {
    setDraftListIds(membershipQuery.data.subscribedListIds);
  }

  const toggleListId = (id: string) => {
    setDraftListIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" data-testid="text-subscribers-title">
          Suscriptores
        </h2>
        <Input
          placeholder="Buscar por email o nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          data-testid="input-search-subscribers"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} suscriptor{filtered.length === 1 ? "" : "es"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground" data-testid="text-empty-subscribers">
              No hay suscriptores aún.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Nombre</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">Zona horaria</th>
                    <th className="py-2 pr-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b last:border-0"
                      data-testid={`row-subscriber-${s.id}`}
                    >
                      <td className="py-2 pr-4 font-mono text-xs">{s.email}</td>
                      <td className="py-2 pr-4">{s.name || "—"}</td>
                      <td className="py-2 pr-4">
                        {s.unsubscribedAt ? (
                          <Badge variant="destructive">Baja</Badge>
                        ) : (
                          <Badge variant="default">Activo</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {s.timezone || "—"}
                      </td>
                      <td className="py-2 pr-4 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openLists(s)}
                          title="Gestionar listas"
                          data-testid={`button-lists-${s.id}`}
                        >
                          <ListChecks className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateMutation.mutate({
                              id: s.id,
                              patch: { unsubscribed: !s.unsubscribedAt },
                            })
                          }
                          title={s.unsubscribedAt ? "Reactivar" : "Dar de baja"}
                          data-testid={`button-toggle-${s.id}`}
                        >
                          {s.unsubscribedAt ? (
                            <MailCheck className="h-4 w-4" />
                          ) : (
                            <MailMinus className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(s)}
                          title="Editar"
                          data-testid={`button-edit-${s.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`¿Borrar definitivamente a ${s.email}?`)) {
                              deleteMutation.mutate(s.id);
                            }
                          }}
                          title="Borrar"
                          data-testid={`button-delete-${s.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog
        open={!!editingSubscriber}
        onOpenChange={(o) => !o && setEditingSubscriber(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar suscriptor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid="input-edit-name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                data-testid="input-edit-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubscriber(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                editingSubscriber &&
                updateMutation.mutate({
                  id: editingSubscriber.id,
                  patch: { name: editName, email: editEmail },
                })
              }
              disabled={updateMutation.isPending}
              data-testid="button-save-subscriber"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lists dialog */}
      <Dialog
        open={!!managingListsFor}
        onOpenChange={(o) => !o && setManagingListsFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Listas de {managingListsFor?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {lists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este autor todavía no tiene listas. Créalas en la sección "Listas".
              </p>
            ) : (
              lists.map((l) => (
                <label
                  key={l.id}
                  className="flex items-center gap-2 cursor-pointer"
                  data-testid={`label-list-${l.id}`}
                >
                  <Checkbox
                    checked={draftListIds.includes(l.id)}
                    onCheckedChange={() => toggleListId(l.id)}
                  />
                  <span>{l.name}</span>
                  {l.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      por defecto
                    </Badge>
                  )}
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingListsFor(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                managingListsFor &&
                setListsMutation.mutate({
                  id: managingListsFor.id,
                  listIds: draftListIds,
                })
              }
              disabled={setListsMutation.isPending}
              data-testid="button-save-lists"
            >
              Guardar listas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
