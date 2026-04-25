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
import { FileUploader } from "@/components/FileUploader";
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
      mailingListEnabled: true,
      emailFromName: "",
      emailFromEmail: "",
      emailProvider: "",
      emailApiKey: "",
      customDomain: "",
      freeBookFile: "",
      freeBookFileEpub: "",
      freeBookFilePdf: "",
      freeBookFileAzw3: "",
      freeBookFileMobi: "",
      freeBookCover: "",
      freeBookTitle: "",
      freeBookDescription: "",
      freeBookCtaText: "",
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

  const handleImageUploadComplete = (result: { url: string; objectPath: string }) => {
    form.setValue("photo", result.objectPath);
    toast({
      title: t.toastImageUploadTitle,
      description: t.toastImageUploadDescription,
    });
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
      mailingListEnabled: true,
      emailFromName: "",
      emailFromEmail: "",
      emailProvider: "",
      emailApiKey: "",
      customDomain: "",
      freeBookFile: "",
      freeBookFileEpub: "",
      freeBookFilePdf: "",
      freeBookFileAzw3: "",
      freeBookFileMobi: "",
      freeBookCover: "",
      freeBookTitle: "",
      freeBookDescription: "",
      freeBookCtaText: "",
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
      mailingListEnabled: author.mailingListEnabled ?? true,
      emailFromName: author.emailFromName || "",
      emailFromEmail: author.emailFromEmail || "",
      emailProvider: author.emailProvider || "",
      emailApiKey: author.emailApiKey || "",
      customDomain: author.customDomain || "",
      freeBookFile: author.freeBookFile || "",
      freeBookFileEpub: author.freeBookFileEpub || "",
      freeBookFilePdf: author.freeBookFilePdf || "",
      freeBookFileAzw3: author.freeBookFileAzw3 || "",
      freeBookFileMobi: author.freeBookFileMobi || "",
      freeBookCover: author.freeBookCover || "",
      freeBookTitle: author.freeBookTitle || "",
      freeBookDescription: author.freeBookDescription || "",
      freeBookCtaText: author.freeBookCtaText || "",
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

  const handleBackgroundUploadComplete = (result: { url: string; objectPath: string }) => {
    form.setValue("backgroundImageUrl", result.objectPath);
    toast({
      title: "Imagen de fondo subida",
      description: "La imagen de fondo se ha subido correctamente",
    });
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
                        <FileUploader
                          onComplete={handleImageUploadComplete}
                          allowedFileTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                          buttonClassName="shrink-0"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {t.buttonUpload}
                        </FileUploader>
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
                
                {form.watch("backgroundImageUrl") && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <img 
                      src={form.watch("backgroundImageUrl") || ""} 
                      alt="Vista previa de imagen de fondo" 
                      className="w-full max-h-48 object-cover rounded"
                      data-testid="image-author-bg-preview"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <FileUploader
                    onComplete={handleBackgroundUploadComplete}
                    allowedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                    maxFileSize={5 * 1024 * 1024}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Imagen de Fondo
                  </FileUploader>
                  <p className="text-xs text-muted-foreground">
                    Formatos: JPEG, PNG, WebP • Tamaño máximo: 5 MB
                  </p>
                </div>

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

              {/* Mailing list */}
              <div className="space-y-4 border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold">Lista de correo del autor</h3>
                <p className="text-sm text-muted-foreground">
                  Configura un proveedor de email exclusivo para este autor. Si se deja vacío, se utilizará la configuración global.
                </p>
                <FormField
                  control={form.control}
                  name="mailingListEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Lista de correo activa</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Si se desactiva, no se mostrará el formulario de suscripción del autor
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                          data-testid="switch-author-mailing-list"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emailFromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del remitente</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Newsletter del autor" data-testid="input-author-email-from-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emailFromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email del remitente</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="email" placeholder="newsletter@dominio.com" data-testid="input-author-email-from-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emailProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedor de email</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-author-email-provider">
                              <SelectValue placeholder="Usar configuración global" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="resend">Resend</SelectItem>
                            <SelectItem value="sendgrid">SendGrid</SelectItem>
                            <SelectItem value="mailchimp">Mailchimp Transactional</SelectItem>
                            <SelectItem value="brevo">Brevo</SelectItem>
                            <SelectItem value="postmark">Postmark</SelectItem>
                            <SelectItem value="mailgun">Mailgun</SelectItem>
                            <SelectItem value="gmail">Gmail</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emailApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="password" placeholder="Clave API del proveedor" data-testid="input-author-email-api-key" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Mailgun: usa el formato "APIKEY:DOMINIO". Gmail: "email:app-password".
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Custom domain */}
              <div className="space-y-4 border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold">Dominio personalizado</h3>
                <p className="text-sm text-muted-foreground">
                  Vincula un dominio propio (por ejemplo nombredelautor.com) que apuntará directamente a la página del autor. Configura el DNS para que el dominio resuelva a este servidor.
                </p>
                <FormField
                  control={form.control}
                  name="customDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dominio</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="nombredelautor.com"
                          data-testid="input-author-custom-domain"
                          onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, ""))}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Sin "https://" ni "www.". El dominio debe ser único en toda la plataforma.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Free book */}
              <div className="space-y-4 border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold">Libro de regalo</h3>
                <p className="text-sm text-muted-foreground">
                  Libro gratuito que el autor entregará automáticamente cuando un lector se suscriba a su lista de correo. Sube el archivo en uno o varios formatos: el lector elegirá el que le funcione en su dispositivo.
                </p>
                {(["Epub", "Pdf", "Azw3", "Mobi"] as const).map((fmt) => {
                  const labels = {
                    Epub: { label: "EPUB (Kobo, Apple Books, Tolino, lectores genéricos)", placeholder: "Sube tu archivo .epub" },
                    Pdf:  { label: "PDF (compatible con cualquier dispositivo)", placeholder: "Sube tu archivo .pdf" },
                    Azw3: { label: "AZW3 (Kindle moderno)", placeholder: "Sube tu archivo .azw3" },
                    Mobi: { label: "MOBI (Kindle antiguo)", placeholder: "Sube tu archivo .mobi" },
                  } as const;
                  const fieldName = `freeBookFile${fmt}` as const;
                  return (
                    <FormField
                      key={fmt}
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{labels[fmt].label}</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder={labels[fmt].placeholder}
                                data-testid={`input-author-free-book-file-${fmt.toLowerCase()}`}
                              />
                              <FileUploader
                                onComplete={(result) => form.setValue(fieldName, result.objectPath)}
                                allowedFileTypes={["application/epub+zip", "application/pdf", "application/vnd.amazon.ebook", "application/x-mobipocket-ebook", "application/octet-stream", ".epub", ".pdf", ".azw", ".azw3", ".mobi", ".kfx"]}
                                buttonClassName="shrink-0"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Subir
                              </FileUploader>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
                <FormField
                  control={form.control}
                  name="freeBookFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Archivo genérico (compatibilidad con configuraciones antiguas, opcional)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} value={field.value || ""} placeholder="/objects/... o https://..." data-testid="input-author-free-book-file" />
                          <FileUploader
                            onComplete={(result) => form.setValue("freeBookFile", result.objectPath)}
                            allowedFileTypes={["application/epub+zip", "application/pdf", "application/vnd.amazon.ebook", "application/x-mobipocket-ebook", "application/octet-stream", ".epub", ".pdf", ".azw", ".azw3", ".mobi", ".kfx"]}
                            buttonClassName="shrink-0"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Subir
                          </FileUploader>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="freeBookCover"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portada del libro</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} value={field.value || ""} placeholder="https://... o /objects/..." data-testid="input-author-free-book-cover" />
                          <FileUploader
                            onComplete={(result) => form.setValue("freeBookCover", result.objectPath)}
                            allowedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                            buttonClassName="shrink-0"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Subir
                          </FileUploader>
                        </div>
                      </FormControl>
                      {field.value && (
                        <img src={field.value} alt="Portada del libro" className="mt-2 h-32 object-contain rounded" data-testid="img-author-free-book-cover-preview" />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="freeBookTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del libro</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Mi libro de regalo" data-testid="input-author-free-book-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="freeBookDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} rows={3} placeholder="Una breve descripción del libro de regalo" data-testid="textarea-author-free-book-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="freeBookCtaText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto del botón</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Quiero Mi Libro Gratis" data-testid="input-author-free-book-cta" />
                      </FormControl>
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
