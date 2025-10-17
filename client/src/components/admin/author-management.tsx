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
import { useUiText } from "@/contexts/ui-text-context";

type AuthorFormData = z.infer<typeof insertAuthorSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AuthorManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const { toast } = useToast();

  const t = {
    toastCreateTitle: useUiText("admin.authors", "toast_create_title", "Autor creado"),
    toastCreateDescription: useUiText("admin.authors", "toast_create_description", "El autor ha sido creado exitosamente."),
    toastCreateErrorTitle: useUiText("admin.authors", "toast_create_error_title", "Error"),
    toastCreateErrorDescription: useUiText("admin.authors", "toast_create_error_description", "No se pudo crear el autor."),
    toastUpdateTitle: useUiText("admin.authors", "toast_update_title", "Autor actualizado"),
    toastUpdateDescription: useUiText("admin.authors", "toast_update_description", "El autor ha sido actualizado exitosamente."),
    toastUpdateErrorTitle: useUiText("admin.authors", "toast_update_error_title", "Error"),
    toastUpdateErrorDescription: useUiText("admin.authors", "toast_update_error_description", "No se pudo actualizar el autor."),
    toastDeleteTitle: useUiText("admin.authors", "toast_delete_title", "Autor eliminado"),
    toastDeleteDescription: useUiText("admin.authors", "toast_delete_description", "El autor ha sido eliminado exitosamente."),
    toastDeleteErrorTitle: useUiText("admin.authors", "toast_delete_error_title", "Error"),
    toastDeleteErrorDescription: useUiText("admin.authors", "toast_delete_error_description", "No se pudo eliminar el autor."),
    toastImageUploadTitle: useUiText("admin.authors", "toast_image_upload_title", "Imagen subida"),
    toastImageUploadDescription: useUiText("admin.authors", "toast_image_upload_description", "La imagen ha sido subida exitosamente."),
    toastImageUploadErrorTitle: useUiText("admin.authors", "toast_image_upload_error_title", "Error"),
    toastImageUploadErrorDescription: useUiText("admin.authors", "toast_image_upload_error_description", "Error al procesar la imagen subida."),
    confirmDelete: useUiText("admin.authors", "confirm_delete", "¿Estás seguro de que quieres eliminar este autor?"),
    pageTitle: useUiText("admin.authors", "page_title", "Gestión de Autores"),
    buttonAddAuthor: useUiText("admin.authors", "button_add_author", "Agregar Autor"),
    placeholderSearch: useUiText("admin.authors", "placeholder_search", "Buscar autores..."),
    filterAllStatus: useUiText("admin.authors", "filter_all_status", "Todos los estados"),
    filterActive: useUiText("admin.authors", "filter_active", "Activos"),
    filterInactive: useUiText("admin.authors", "filter_inactive", "Inactivos"),
    tableHeaderName: useUiText("admin.authors", "table_header_name", "Nombre"),
    tableHeaderSlug: useUiText("admin.authors", "table_header_slug", "Slug"),
    tableHeaderStatus: useUiText("admin.authors", "table_header_status", "Estado"),
    tableHeaderActions: useUiText("admin.authors", "table_header_actions", "Acciones"),
    badgeActive: useUiText("admin.authors", "badge_active", "Activo"),
    badgeInactive: useUiText("admin.authors", "badge_inactive", "Inactivo"),
    modalTitleEdit: useUiText("admin.authors", "modal_title_edit", "Editar Autor"),
    modalTitleAdd: useUiText("admin.authors", "modal_title_add", "Agregar Autor"),
    labelName: useUiText("admin.authors", "label_name", "Nombre *"),
    labelSlug: useUiText("admin.authors", "label_slug", "Slug (URL) *"),
    descriptionSlugAuto: useUiText("admin.authors", "description_slug_auto", "Se genera automáticamente del nombre"),
    labelHeroTitle: useUiText("admin.authors", "label_hero_title", "Título Hero *"),
    labelHeroSubtitle: useUiText("admin.authors", "label_hero_subtitle", "Subtítulo Hero *"),
    labelBioParagraph1: useUiText("admin.authors", "label_bio_paragraph_1", "Biografía - Párrafo 1 *"),
    labelBioParagraph2: useUiText("admin.authors", "label_bio_paragraph_2", "Biografía - Párrafo 2 *"),
    labelBioParagraph3: useUiText("admin.authors", "label_bio_paragraph_3", "Biografía - Párrafo 3 *"),
    labelPhoto: useUiText("admin.authors", "label_photo", "Foto del Autor"),
    placeholderPhoto: useUiText("admin.authors", "placeholder_photo", "URL de la foto"),
    buttonUpload: useUiText("admin.authors", "button_upload", "Subir"),
    altPhotoPreview: useUiText("admin.authors", "alt_photo_preview", "Preview"),
    labelEmail: useUiText("admin.authors", "label_email", "Email"),
    labelInstagram: useUiText("admin.authors", "label_instagram", "Instagram URL"),
    placeholderInstagram: useUiText("admin.authors", "placeholder_instagram", "https://instagram.com/..."),
    labelTwitter: useUiText("admin.authors", "label_twitter", "Twitter URL"),
    placeholderTwitter: useUiText("admin.authors", "placeholder_twitter", "https://twitter.com/..."),
    labelFacebook: useUiText("admin.authors", "label_facebook", "Facebook URL"),
    placeholderFacebook: useUiText("admin.authors", "placeholder_facebook", "https://facebook.com/..."),
    labelAmazon: useUiText("admin.authors", "label_amazon", "Amazon Author URL"),
    placeholderAmazon: useUiText("admin.authors", "placeholder_amazon", "https://amazon.com/author/..."),
    sectionSeoTitle: useUiText("admin.authors", "section_seo_title", "SEO - Optimización para Buscadores"),
    sectionSeoDescription: useUiText("admin.authors", "section_seo_description", "Configura cómo aparecerá la página del autor en Google y redes sociales."),
    labelSeoTitle: useUiText("admin.authors", "label_seo_title", "Título SEO"),
    placeholderSeoTitleSuffix: useUiText("admin.authors", "placeholder_seo_title_suffix", " - Autor"),
    descriptionSeoTitlePrefix: useUiText("admin.authors", "description_seo_title_prefix", "Deja vacío para usar: \""),
    descriptionSeoTitleSuffix: useUiText("admin.authors", "description_seo_title_suffix", "\""),
    labelSeoDescription: useUiText("admin.authors", "label_seo_description", "Descripción SEO"),
    placeholderSeoDescription: useUiText("admin.authors", "placeholder_seo_description", "Descripción breve para buscadores (150-160 caracteres)"),
    descriptionSeoCharCount: useUiText("admin.authors", "description_seo_char_count", "/160 caracteres. Deja vacío para usar el primer párrafo de la biografía."),
    labelSeoKeywords: useUiText("admin.authors", "label_seo_keywords", "Palabras Clave SEO"),
    placeholderSeoKeywords: useUiText("admin.authors", "placeholder_seo_keywords", "autor, escritor, novela, fantasía, etc."),
    descriptionSeoKeywords: useUiText("admin.authors", "description_seo_keywords", "Separa las palabras clave con comas"),
    sectionBackgroundTitle: useUiText("admin.authors", "section_background_title", "Personalización de Fondo"),
    sectionBackgroundDescription: useUiText("admin.authors", "section_background_description", "Configura el fondo personalizado para la página del autor."),
    labelBgImage: useUiText("admin.authors", "label_bg_image", "URL de Imagen de Fondo"),
    placeholderBgImage: useUiText("admin.authors", "placeholder_bg_image", "https://... o /objects/..."),
    descriptionBgImage: useUiText("admin.authors", "description_bg_image", "Imagen de fondo para la página del autor (opcional)"),
    labelBgColor: useUiText("admin.authors", "label_bg_color", "Color de Fondo"),
    placeholderBgColor: useUiText("admin.authors", "placeholder_bg_color", "#ffffff o rgb(255,255,255)"),
    descriptionBgColor: useUiText("admin.authors", "description_bg_color", "Color de fondo para la página del autor (opcional, se usa si no hay imagen)"),
    labelIsActive: useUiText("admin.authors", "label_is_active", "Estado Activo"),
    descriptionIsActive: useUiText("admin.authors", "description_is_active", "El autor estará visible en el sitio web"),
    buttonCancel: useUiText("admin.authors", "button_cancel", "Cancelar"),
    buttonUpdate: useUiText("admin.authors", "button_update", "Actualizar"),
    buttonCreate: useUiText("admin.authors", "button_create", "Crear"),
  };

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
      backgroundImageUrl: "",
      backgroundColor: "",
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
        title: t.toastCreateTitle,
        description: t.toastCreateDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
      setIsModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: t.toastCreateErrorTitle,
        description: t.toastCreateErrorDescription,
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
        title: t.toastUpdateTitle,
        description: t.toastUpdateDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
      setIsModalOpen(false);
      setEditingAuthor(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: t.toastUpdateErrorTitle,
        description: t.toastUpdateErrorDescription,
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
        title: t.toastDeleteTitle,
        description: t.toastDeleteDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
    },
    onError: () => {
      toast({
        title: t.toastDeleteErrorTitle,
        description: t.toastDeleteErrorDescription,
        variant: "destructive",
      });
    },
  });

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
          title: t.toastImageUploadTitle,
          description: t.toastImageUploadDescription,
        });
      } catch (error) {
        toast({
          title: t.toastImageUploadErrorTitle,
          description: t.toastImageUploadErrorDescription,
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
    if (window.confirm(t.confirmDelete)) {
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
      backgroundImageUrl: "",
      backgroundColor: "",
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
      backgroundImageUrl: author.backgroundImageUrl || "",
      backgroundColor: author.backgroundColor || "",
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

  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!editingAuthor) {
      const generatedSlug = generateSlug(value);
      form.setValue("slug", generatedSlug);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">{t.pageTitle}</h3>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          data-testid="button-add-author"
          onClick={handleOpenAddModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.buttonAddAuthor}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t.placeholderSearch}
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
                <SelectItem value="all">{t.filterAllStatus}</SelectItem>
                <SelectItem value="active">{t.filterActive}</SelectItem>
                <SelectItem value="inactive">{t.filterInactive}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">{t.tableHeaderName}</th>
                  <th className="text-left p-4">{t.tableHeaderSlug}</th>
                  <th className="text-left p-4">{t.tableHeaderStatus}</th>
                  <th className="text-left p-4">{t.tableHeaderActions}</th>
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
                        {author.isActive ? t.badgeActive : t.badgeInactive}
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
              {editingAuthor ? t.modalTitleEdit : t.modalTitleAdd}
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
                      <FormLabel>{t.labelName}</FormLabel>
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
                      <FormLabel>{t.labelSlug}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          readOnly 
                          className="bg-muted text-muted-foreground cursor-not-allowed"
                          data-testid="input-author-slug" 
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        {t.descriptionSlugAuto}
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
                    <FormLabel>{t.labelHeroTitle}</FormLabel>
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
                    <FormLabel>{t.labelHeroSubtitle}</FormLabel>
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
                    <FormLabel>{t.labelBioParagraph1}</FormLabel>
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
                    <FormLabel>{t.labelBioParagraph2}</FormLabel>
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
                    <FormLabel>{t.labelBioParagraph3}</FormLabel>
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
                    <FormLabel>{t.labelPhoto}</FormLabel>
                    <FormControl>
                      <div className="flex gap-4 items-center">
                        <Input {...field} value={field.value || ""} placeholder={t.placeholderPhoto} data-testid="input-author-photo" />
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handleImageUploadComplete}
                          allowedFileTypes={['image/*']}
                          buttonClassName="shrink-0"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {t.buttonUpload}
                        </ObjectUploader>
                      </div>
                    </FormControl>
                    {field.value && (
                      <div className="mt-2">
                        <img 
                          src={field.value} 
                          alt={t.altPhotoPreview}
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
                    <FormLabel>{t.labelEmail}</FormLabel>
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
                      <FormLabel>{t.labelInstagram}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={t.placeholderInstagram} data-testid="input-author-instagram" />
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
                      <FormLabel>{t.labelTwitter}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={t.placeholderTwitter} data-testid="input-author-twitter" />
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
                      <FormLabel>{t.labelFacebook}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={t.placeholderFacebook} data-testid="input-author-facebook" />
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
                      <FormLabel>{t.labelAmazon}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={t.placeholderAmazon} data-testid="input-author-amazon" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold">{t.sectionSeoTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.sectionSeoDescription}</p>
                
                <FormField
                  control={form.control}
                  name="seoTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.labelSeoTitle}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={`${form.watch('name')}${t.placeholderSeoTitleSuffix}`} data-testid="input-author-seo-title" />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        {t.descriptionSeoTitlePrefix}{form.watch('name')}{t.placeholderSeoTitleSuffix}{t.descriptionSeoTitleSuffix}
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
                      <FormLabel>{t.labelSeoDescription}</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} rows={3} placeholder={t.placeholderSeoDescription} data-testid="textarea-author-seo-description" />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        {field.value?.length || 0}{t.descriptionSeoCharCount}
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
                      <FormLabel>{t.labelSeoKeywords}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={t.placeholderSeoKeywords} data-testid="input-author-seo-keywords" />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        {t.descriptionSeoKeywords}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold">{t.sectionBackgroundTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.sectionBackgroundDescription}</p>
                
                <FormField
                  control={form.control}
                  name="backgroundImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.labelBgImage}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={t.placeholderBgImage} data-testid="input-author-bg-image" />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        {t.descriptionBgImage}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.labelBgColor}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder={t.placeholderBgColor} data-testid="input-author-bg-color" />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        {t.descriptionBgColor}
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
                      <FormLabel className="text-base">{t.labelIsActive}</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {t.descriptionIsActive}
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
                  {t.buttonCancel}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={createAuthorMutation.isPending || updateAuthorMutation.isPending}
                  data-testid="button-submit-author"
                >
                  {editingAuthor ? t.buttonUpdate : t.buttonCreate}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
