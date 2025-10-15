import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAuthorSchema } from "@shared/schema";
import { z } from "zod";
import type { Author } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

type AuthorFormData = z.infer<typeof insertAuthorSchema>;

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD") // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
}

export default function AuthorManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const { toast } = useToast();

  const form = useForm<AuthorFormData>({
    resolver: zodResolver(insertAuthorSchema),
    defaultValues: {
      name: "",
      slug: "",
      heroTitle: "",
      heroSubtitle: "",
      bioParagraph1: "",
      bioParagraph2: "",
      bioParagraph3: "",
      photo: "",
      email: "",
      instagramUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      amazonUrl: "",
      isActive: true,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
    },
  });

  const { data: authors = [] } = useQuery<Author[]>({
    queryKey: ["/api/authors"]
  });

  const createAuthorMutation = useMutation({
    mutationFn: async (authorData: AuthorFormData) => {
      const response = await apiRequest("POST", "/api/authors", authorData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Autor creado",
        description: "El autor ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
      setIsModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el autor.",
        variant: "destructive",
      });
    },
  });

  const updateAuthorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AuthorFormData }) => {
      const response = await apiRequest("PUT", `/api/authors/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Autor actualizado",
        description: "El autor ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
      setIsModalOpen(false);
      setEditingAuthor(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el autor.",
        variant: "destructive",
      });
    },
  });

  const deleteAuthorMutation = useMutation({
    mutationFn: async (authorId: string) => {
      await apiRequest("DELETE", `/api/authors/${authorId}`);
    },
    onSuccess: () => {
      toast({
        title: "Autor eliminado",
        description: "El autor ha sido eliminado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el autor.",
        variant: "destructive",
      });
    },
  });

  // Helper functions for image upload
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageURL = uploadedFile.uploadURL;
      
      try {
        const response = await apiRequest("POST", "/api/images/upload", { imageURL });
        const data = await response.json();
        
        form.setValue("photo", data.objectPath);
        
        toast({
          title: "Imagen subida",
          description: "La imagen ha sido subida exitosamente.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al procesar la imagen subida.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredAuthors = authors.filter(author => {
    const matchesSearch = author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         author.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && author.isActive) ||
                         (statusFilter === "inactive" && !author.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleDeleteAuthor = (authorId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este autor?")) {
      deleteAuthorMutation.mutate(authorId);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAuthor(null);
    form.reset({
      name: "",
      slug: "",
      heroTitle: "",
      heroSubtitle: "",
      bioParagraph1: "",
      bioParagraph2: "",
      bioParagraph3: "",
      photo: "",
      email: "",
      instagramUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      amazonUrl: "",
      isActive: true,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (author: Author) => {
    setEditingAuthor(author);
    form.reset({
      name: author.name,
      slug: author.slug,
      heroTitle: author.heroTitle,
      heroSubtitle: author.heroSubtitle,
      bioParagraph1: author.bioParagraph1,
      bioParagraph2: author.bioParagraph2,
      bioParagraph3: author.bioParagraph3,
      photo: author.photo || "",
      email: author.email || "",
      instagramUrl: author.instagramUrl || "",
      twitterUrl: author.twitterUrl || "",
      facebookUrl: author.facebookUrl || "",
      amazonUrl: author.amazonUrl || "",
      isActive: author.isActive ?? true,
      seoTitle: author.seoTitle || "",
      seoDescription: author.seoDescription || "",
      seoKeywords: author.seoKeywords || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (data: AuthorFormData) => {
    if (editingAuthor) {
      updateAuthorMutation.mutate({ id: editingAuthor.id, data });
    } else {
      createAuthorMutation.mutate(data);
    }
  };

  // Auto-generate slug when name changes
  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!editingAuthor) {
      // Only auto-generate slug for new authors
      const generatedSlug = generateSlug(value);
      form.setValue("slug", generatedSlug);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">Gestión de Autores</h3>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          data-testid="button-add-author"
          onClick={handleOpenAddModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Autor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar autores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input"
                data-testid="input-search-authors"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">Nombre</th>
                  <th className="text-left p-4">Slug</th>
                  <th className="text-left p-4">Estado</th>
                  <th className="text-left p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthors.map((author) => (
                  <tr key={author.id} className="border-b" data-testid={`row-author-${author.id}`}>
                    <td className="p-4" data-testid={`text-author-name-${author.id}`}>{author.name}</td>
                    <td className="p-4" data-testid={`text-author-slug-${author.id}`}>{author.slug}</td>
                    <td className="p-4">
                      <Badge 
                        variant={author.isActive ? "default" : "secondary"}
                        data-testid={`badge-author-status-${author.id}`}
                      >
                        {author.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(author)}
                          data-testid={`button-edit-author-${author.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAuthor(author.id)}
                          data-testid={`button-delete-author-${author.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAuthor ? "Editar Autor" : "Agregar Autor"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => handleNameChange(e.target.value)}
                          data-testid="input-author-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL) *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          readOnly 
                          className="bg-muted text-muted-foreground cursor-not-allowed"
                          data-testid="input-author-slug" 
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Se genera automáticamente del nombre
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="heroTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título Hero *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-author-hero-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heroSubtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtítulo Hero *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="textarea-author-hero-subtitle" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bioParagraph1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía - Párrafo 1 *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} data-testid="textarea-author-bio-1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bioParagraph2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía - Párrafo 2 *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} data-testid="textarea-author-bio-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bioParagraph3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía - Párrafo 3 *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} data-testid="textarea-author-bio-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto del Autor</FormLabel>
                    <FormControl>
                      <div className="flex gap-4 items-center">
                        <Input {...field} value={field.value || ""} placeholder="URL de la foto" data-testid="input-author-photo" />
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handleImageUploadComplete}
                          allowedFileTypes={['image/*']}
                          buttonClassName="shrink-0"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Subir
                        </ObjectUploader>
                      </div>
                    </FormControl>
                    {field.value && (
                      <div className="mt-2">
                        <img 
                          src={field.value} 
                          alt="Preview" 
                          className="h-32 w-32 object-cover rounded"
                          data-testid="image-author-photo-preview"
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="email" data-testid="input-author-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="instagramUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="https://instagram.com/..." data-testid="input-author-instagram" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitterUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="https://twitter.com/..." data-testid="input-author-twitter" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="https://facebook.com/..." data-testid="input-author-facebook" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amazonUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amazon Author URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="https://amazon.com/author/..." data-testid="input-author-amazon" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold">SEO - Optimización para Buscadores</h3>
                <p className="text-sm text-muted-foreground">Configura cómo aparecerá la página del autor en Google y redes sociales.</p>
                
                <FormField
                  control={form.control}
                  name="seoTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título SEO</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={`${form.watch('name')} - Autor`} data-testid="input-author-seo-title" />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Deja vacío para usar: "{form.watch('name')} - Autor"
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seoDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción SEO</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} rows={3} placeholder="Descripción breve para buscadores (150-160 caracteres)" data-testid="textarea-author-seo-description" />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        {field.value?.length || 0}/160 caracteres. Deja vacío para usar el primer párrafo de la biografía.
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seoKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Palabras Clave SEO</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="autor, escritor, novela, fantasía, etc." data-testid="input-author-seo-keywords" />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Separa las palabras clave con comas
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Estado Activo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        El autor estará visible en el sitio web
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        data-testid="switch-author-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAuthor(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-author"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={createAuthorMutation.isPending || updateAuthorMutation.isPending}
                  data-testid="button-submit-author"
                >
                  {editingAuthor ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
