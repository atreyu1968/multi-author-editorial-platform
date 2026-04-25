import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type AdminUser = {
  id: string;
  username: string;
  email: string | null;
};

type Mode = "create" | "edit" | "password" | null;

export default function UsersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>(null);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/admin/users", {
        username,
        password,
        ...(email ? { email } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      closeDialog();
      toast({ title: "Usuario creado" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err?.message || "No se pudo crear el usuario",
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!target) throw new Error("Sin usuario seleccionado");
      return apiRequest("PATCH", `/api/admin/users/${target.id}`, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      closeDialog();
      toast({ title: "Usuario actualizado" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err?.message || "No se pudo actualizar",
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Usuario eliminado" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err?.message || "No se pudo eliminar",
        variant: "destructive",
      }),
  });

  const openCreate = () => {
    setMode("create");
    setTarget(null);
    setUsername("");
    setEmail("");
    setPassword("");
  };

  const openEdit = (u: AdminUser) => {
    setMode("edit");
    setTarget(u);
    setUsername(u.username);
    setEmail(u.email ?? "");
    setPassword("");
  };

  const openPassword = (u: AdminUser) => {
    setMode("password");
    setTarget(u);
    setPassword("");
  };

  const closeDialog = () => {
    setMode(null);
    setTarget(null);
    setUsername("");
    setEmail("");
    setPassword("");
  };

  const submit = () => {
    if (mode === "create") {
      if (!username.trim() || password.length < 6) {
        toast({
          title: "Datos incompletos",
          description: "Usuario y contraseña (mín. 6) son obligatorios.",
          variant: "destructive",
        });
        return;
      }
      createMutation.mutate();
    } else if (mode === "edit") {
      const patch: Record<string, unknown> = {};
      if (username && username !== target?.username) patch.username = username;
      // Treat empty input as "clear" so admin can detach an email.
      if ((email || "") !== (target?.email || "")) {
        patch.email = email.trim() ? email.trim() : null;
      }
      if (Object.keys(patch).length === 0) {
        closeDialog();
        return;
      }
      updateMutation.mutate(patch);
    } else if (mode === "password") {
      if (password.length < 6) {
        toast({
          title: "Contraseña demasiado corta",
          description: "Mínimo 6 caracteres.",
          variant: "destructive",
        });
        return;
      }
      updateMutation.mutate({ password });
    }
  };

  const dialogTitle =
    mode === "create"
      ? "Nuevo usuario"
      : mode === "edit"
      ? `Editar ${target?.username ?? ""}`
      : mode === "password"
      ? `Cambiar contraseña de ${target?.username ?? ""}`
      : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" data-testid="text-users-title">
          Usuarios del Panel
        </h2>
        <Button onClick={openCreate} data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-2" /> Nuevo usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{users.length} usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground">No hay usuarios.</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`row-user-${u.id}`}
                >
                  <div>
                    <div className="font-semibold">{u.username}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.email || "sin email"}
                    </div>
                  </div>
                  <div className="space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openPassword(u)}
                      title="Cambiar contraseña"
                      data-testid={`button-password-${u.id}`}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(u)}
                      title="Editar"
                      data-testid={`button-edit-user-${u.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (
                          confirm(
                            `¿Borrar al usuario "${u.username}"? Esta acción no se puede deshacer.`,
                          )
                        ) {
                          deleteMutation.mutate(u.id);
                        }
                      }}
                      title="Borrar"
                      data-testid={`button-delete-user-${u.id}`}
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

      <Dialog open={!!mode} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(mode === "create" || mode === "edit") && (
              <>
                <div>
                  <Label>Usuario</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="usuario"
                    data-testid="input-user-username"
                  />
                </div>
                <div>
                  <Label>Email (opcional)</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    data-testid="input-user-email"
                  />
                </div>
              </>
            )}
            {(mode === "create" || mode === "password") && (
              <div>
                <Label>
                  {mode === "create" ? "Contraseña" : "Nueva contraseña"} (mín. 6)
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-user-password"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-user"
            >
              {mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
