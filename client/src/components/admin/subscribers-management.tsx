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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Newsletter, NewsletterList } from "@shared/schema";

type SubscriberWithLists = Newsletter & { listIds: string[] };

const ALL_LISTS = "__all__";
const NO_LIST = "__none__";

export default function SubscribersManagement() {
  const { selectedAuthorId } = useAdminAuthor();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<string>(ALL_LISTS);
  const [editingSubscriber, setEditingSubscriber] = useState<Newsletter | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [managingListsFor, setManagingListsFor] = useState<Newsletter | null>(null);
  const [draftListIds, setDraftListIds] = useState<string[]>([]);

  // Single bulk fetch: each row already includes the IDs of the lists the
  // subscriber belongs to. This powers both the badge column and the
  // per-list filter without N+1 round-trips.
  const { data: subscribers = [], isLoading } = useQuery<SubscriberWithLists[]>({
    queryKey: ["/api/authors", selectedAuthorId, "subscribers-with-lists"],
    queryFn: async () => {
      const r = await fetch(
        `/api/authors/${selectedAuthorId}/subscribers-with-lists`,
        { credentials: "include" },
      );
      if (!r.ok) throw new Error("Failed to load subscribers");
      return r.json();
    },
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

  const listsById = useMemo(() => {
    const m = new Map<string, NewsletterList>();
    for (const l of lists) m.set(l.id, l);
    return m;
  }, [lists]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      return apiRequest("PATCH", `/api/newsletter/${id}`, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/authors", selectedAuthorId, "subscribers-with-lists"],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["/api/authors", selectedAuthorId, "subscribers-with-lists"],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["/api/authors", selectedAuthorId, "subscribers-with-lists"],
      });
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

  // Per-list counts (active subscribers only) shown above the table so the
  // admin sees the size of each list at a glance.
  const listCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let noListCount = 0;
    for (const s of subscribers) {
      if (s.unsubscribedAt) continue;
      if (s.listIds.length === 0) noListCount += 1;
      for (const lid of s.listIds) counts.set(lid, (counts.get(lid) || 0) + 1);
    }
    return { byList: counts, noList: noListCount };
  }, [subscribers]);

  const totalActive = useMemo(
    () => subscribers.filter((s) => !s.unsubscribedAt).length,
    [subscribers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscribers.filter((s) => {
      if (listFilter === NO_LIST && s.listIds.length !== 0) return false;
      if (listFilter !== ALL_LISTS && listFilter !== NO_LIST && !s.listIds.includes(listFilter)) {
        return false;
      }
      if (q) {
        const matches =
          s.email?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [subscribers, search, listFilter]);

  const openEdit = (s: Newsletter) => {
    setEditingSubscriber(s);
    setEditName(s.name || "");
    setEditEmail(s.email || "");
  };

  const openLists = (s: SubscriberWithLists) => {
    setManagingListsFor(s);
    // Seed the dialog directly from the row we already have, so we don't need
    // a second round-trip to fetch the membership.
    setDraftListIds(s.listIds);
  };

  const toggleListId = (id: string) => {
    setDraftListIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const filterLabel =
    listFilter === ALL_LISTS
      ? "Todas las listas"
      : listFilter === NO_LIST
        ? "Sin lista"
        : (listsById.get(listFilter)?.name ?? "Lista");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold" data-testid="text-subscribers-title">
          Suscriptores
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={listFilter} onValueChange={setListFilter}>
            <SelectTrigger className="w-56" data-testid="select-list-filter">
              <SelectValue placeholder="Filtrar por lista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LISTS}>
                Todas las listas ({totalActive})
              </SelectItem>
              <SelectItem value={NO_LIST}>
                Sin lista ({listCounts.noList})
              </SelectItem>
              {lists.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} ({listCounts.byList.get(l.id) || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar por email o nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            data-testid="input-search-subscribers"
          />
        </div>
      </div>

      {/* Per-list summary chips: a glance-able report of how many active
          subscribers belong to each list for the selected author. */}
      {lists.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resumen por lista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setListFilter(ALL_LISTS)}
                className="focus:outline-none"
                data-testid="chip-summary-all"
              >
                <Badge
                  variant={listFilter === ALL_LISTS ? "default" : "secondary"}
                  className="cursor-pointer"
                >
                  Todas: {totalActive}
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setListFilter(NO_LIST)}
                className="focus:outline-none"
                data-testid="chip-summary-none"
              >
                <Badge
                  variant={listFilter === NO_LIST ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  Sin lista: {listCounts.noList}
                </Badge>
              </button>
              {lists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setListFilter(l.id)}
                  className="focus:outline-none"
                  data-testid={`chip-summary-list-${l.id}`}
                >
                  <Badge
                    variant={listFilter === l.id ? "default" : "secondary"}
                    className="cursor-pointer"
                  >
                    {l.name}: {listCounts.byList.get(l.id) || 0}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} suscriptor{filtered.length === 1 ? "" : "es"}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              · {filterLabel}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground" data-testid="text-empty-subscribers">
              No hay suscriptores que coincidan con el filtro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Nombre</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">Listas</th>
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
                      <td className="py-2 pr-4">
                        {s.listIds.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {s.listIds.map((lid) => {
                              const list = listsById.get(lid);
                              return (
                                <Badge
                                  key={lid}
                                  variant="outline"
                                  className="text-xs"
                                  data-testid={`badge-sub-${s.id}-list-${lid}`}
                                >
                                  {list?.name ?? lid}
                                </Badge>
                              );
                            })}
                          </div>
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
