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
import { useUiText } from "@/contexts/ui-text-context";

const NAMESPACES = ["navigation", "home", "footer", "book_landing", "series_landing", "admin", "common"];

export default function UiTextsManagement() {
  const t = {
    loading: useUiText("admin.ui_texts", "loading"),
    pageTitle: useUiText("admin.ui_texts", "page_title"),
    pageDescription: useUiText("admin.ui_texts", "page_description"),
    buttonAddText: useUiText("admin.ui_texts", "button_add_text"),
    dialogTitle: useUiText("admin.ui_texts", "dialog_title"),
    labelNamespace: useUiText("admin.ui_texts", "label_namespace"),
    placeholderNamespace: useUiText("admin.ui_texts", "placeholder_namespace"),
    labelKey: useUiText("admin.ui_texts", "label_key"),
    placeholderKey: useUiText("admin.ui_texts", "placeholder_key"),
    labelLocale: useUiText("admin.ui_texts", "label_locale"),
    labelValue: useUiText("admin.ui_texts", "label_value"),
    placeholderValue: useUiText("admin.ui_texts", "placeholder_value"),
    buttonSaving: useUiText("admin.ui_texts", "button_saving"),
    buttonSave: useUiText("admin.ui_texts", "button_save"),
    buttonCancel: useUiText("admin.ui_texts", "button_cancel"),
    buttonEdit: useUiText("admin.ui_texts", "button_edit"),
    emptyState: useUiText("admin.ui_texts", "empty_state"),
    toastUpdateSuccess: useUiText("admin.ui_texts", "toast_update_success"),
    toastUpdateError: useUiText("admin.ui_texts", "toast_update_error"),
    toastCreateSuccess: useUiText("admin.ui_texts", "toast_create_success"),
    toastCreateError: useUiText("admin.ui_texts", "toast_create_error"),
  };

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
      toast({ title: t.toastUpdateSuccess });
      setEditingText(null);
    },
    onError: () => {
      toast({ title: t.toastUpdateError, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUiText) => {
      return await apiRequest("POST", "/api/ui-texts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ui-texts"] });
      toast({ title: t.toastCreateSuccess });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: t.toastCreateError, variant: "destructive" });
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
    return <div className="p-6">{t.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t.pageTitle}</h2>
          <p className="text-muted-foreground mt-2">
            {t.pageDescription}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-text">
              <Plus className="h-4 w-4 mr-2" />
              {t.buttonAddText}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.dialogTitle}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateText} className="space-y-4">
              <div>
                <Label htmlFor="namespace">{t.labelNamespace}</Label>
                <Select 
                  value={newTextForm.namespace}
                  onValueChange={(value) => setNewTextForm({ ...newTextForm, namespace: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.placeholderNamespace} />
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
                <Label htmlFor="key">{t.labelKey}</Label>
                <Input
                  id="key"
                  value={newTextForm.key}
                  onChange={(e) => setNewTextForm({ ...newTextForm, key: e.target.value })}
                  required
                  placeholder={t.placeholderKey}
                  data-testid="input-key"
                />
              </div>
              <div>
                <Label htmlFor="locale">{t.labelLocale}</Label>
                <Input
                  id="locale"
                  value={newTextForm.locale}
                  onChange={(e) => setNewTextForm({ ...newTextForm, locale: e.target.value })}
                  required
                  data-testid="input-locale"
                />
              </div>
              <div>
                <Label htmlFor="value">{t.labelValue}</Label>
                <Textarea
                  id="value"
                  value={newTextForm.value}
                  onChange={(e) => setNewTextForm({ ...newTextForm, value: e.target.value })}
                  required
                  placeholder={t.placeholderValue}
                  data-testid="input-value"
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                {createMutation.isPending ? t.buttonSaving : t.buttonSave}
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
                            {t.buttonSave}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingText(null)}
                            data-testid={`button-cancel-${text.key}`}
                          >
                            <X className="h-4 w-4 mr-2" />
                            {t.buttonCancel}
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
                          {t.buttonEdit}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {!textsByNamespace[ns] || textsByNamespace[ns].length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  {t.emptyState}
                </p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
