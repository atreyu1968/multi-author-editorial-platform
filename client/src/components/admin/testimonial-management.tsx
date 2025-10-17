import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { useAdminAuthor } from "@/contexts/admin-author-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTestimonialSchema, type Testimonial, type InsertTestimonial } from "@shared/schema";
import { useUiText } from "@/contexts/ui-text-context";

export default function TestimonialManagement() {
  const { selectedAuthorId } = useAdminAuthor();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const t = {
    pageTitle: useUiText("admin.testimonials", "page_title", "Gestión de Testimonios"),
    buttonAdd: useUiText("admin.testimonials", "button_add", "Agregar Testimonio"),
    dialogTitleEdit: useUiText("admin.testimonials", "dialog_title_edit", "Editar Testimonio"),
    dialogTitleNew: useUiText("admin.testimonials", "dialog_title_new", "Nuevo Testimonio"),
    labelContent: useUiText("admin.testimonials", "label_content", "Contenido del Testimonio"),
    placeholderContent: useUiText("admin.testimonials", "placeholder_content", "Escribe el testimonio aquí..."),
    labelAuthorName: useUiText("admin.testimonials", "label_author_name", "Nombre del Autor"),
    placeholderAuthorName: useUiText("admin.testimonials", "placeholder_author_name", "Nombre completo"),
    labelAuthorType: useUiText("admin.testimonials", "label_author_type", "Tipo de Lector"),
    optionTypeVerifiedFemale: useUiText("admin.testimonials", "option_type_verified_female", "Lectora verificada"),
    optionTypeVerifiedMale: useUiText("admin.testimonials", "option_type_verified_male", "Lector verificado"),
    optionTypeFan: useUiText("admin.testimonials", "option_type_fan", "Fan #1"),
    optionTypeFantasy: useUiText("admin.testimonials", "option_type_fantasy", "Amante de la fantasía"),
    optionTypeLibrarian: useUiText("admin.testimonials", "option_type_librarian", "Bibliotecaria"),
    optionTypeBlogger: useUiText("admin.testimonials", "option_type_blogger", "Blogger literario"),
    labelAuthorPhoto: useUiText("admin.testimonials", "label_author_photo", "Foto del Autor (URL)"),
    placeholderAuthorPhoto: useUiText("admin.testimonials", "placeholder_author_photo", "https://example.com/photo.jpg"),
    labelRating: useUiText("admin.testimonials", "label_rating", "Calificación"),
    optionRating5: useUiText("admin.testimonials", "option_rating_5", "5 estrellas"),
    optionRating4: useUiText("admin.testimonials", "option_rating_4", "4 estrellas"),
    optionRating3: useUiText("admin.testimonials", "option_rating_3", "3 estrellas"),
    optionRating2: useUiText("admin.testimonials", "option_rating_2", "2 estrellas"),
    optionRating1: useUiText("admin.testimonials", "option_rating_1", "1 estrella"),
    labelFeatured: useUiText("admin.testimonials", "label_featured", "Destacado"),
    descriptionFeatured: useUiText("admin.testimonials", "description_featured", "Mostrar en la página principal"),
    labelPublished: useUiText("admin.testimonials", "label_published", "Publicado"),
    descriptionPublished: useUiText("admin.testimonials", "description_published", "Visible al público"),
    buttonCancel: useUiText("admin.testimonials", "button_cancel", "Cancelar"),
    buttonUpdate: useUiText("admin.testimonials", "button_update", "Actualizar"),
    buttonCreate: useUiText("admin.testimonials", "button_create", "Crear"),
    buttonSuffix: useUiText("admin.testimonials", "button_suffix", " Testimonio"),
    emptyState: useUiText("admin.testimonials", "empty_state", "No hay testimonios disponibles."),
    altPhotoPrefix: useUiText("admin.testimonials", "alt_photo_prefix", "Foto de "),
    badgePublished: useUiText("admin.testimonials", "badge_published", "Publicado"),
    badgeDraft: useUiText("admin.testimonials", "badge_draft", "Borrador"),
    badgeFeatured: useUiText("admin.testimonials", "badge_featured", "Destacado"),
    toastCreateTitle: useUiText("admin.testimonials", "toast_create_title", "Testimonio creado"),
    toastCreateDescription: useUiText("admin.testimonials", "toast_create_description", "El testimonio ha sido agregado exitosamente."),
    toastCreateErrorTitle: useUiText("admin.testimonials", "toast_create_error_title", "Error"),
    toastCreateErrorDescription: useUiText("admin.testimonials", "toast_create_error_description", "No se pudo crear el testimonio."),
    toastUpdateTitle: useUiText("admin.testimonials", "toast_update_title", "Testimonio actualizado"),
    toastUpdateDescription: useUiText("admin.testimonials", "toast_update_description", "Los cambios han sido guardados exitosamente."),
    toastUpdateErrorTitle: useUiText("admin.testimonials", "toast_update_error_title", "Error"),
    toastUpdateErrorDescription: useUiText("admin.testimonials", "toast_update_error_description", "No se pudieron guardar los cambios."),
    toastDeleteTitle: useUiText("admin.testimonials", "toast_delete_title", "Testimonio eliminado"),
    toastDeleteDescription: useUiText("admin.testimonials", "toast_delete_description", "El testimonio ha sido eliminado exitosamente."),
    toastDeleteErrorTitle: useUiText("admin.testimonials", "toast_delete_error_title", "Error"),
    toastDeleteErrorDescription: useUiText("admin.testimonials", "toast_delete_error_description", "No se pudo eliminar el testimonio."),
    confirmDelete: useUiText("admin.testimonials", "confirm_delete", "¿Estás seguro de que quieres eliminar este testimonio?"),
  };

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials", { authorId: selectedAuthorId }],
    enabled: !!selectedAuthorId,
  });

  const form = useForm<InsertTestimonial>({
    resolver: zodResolver(insertTestimonialSchema),
    defaultValues: {
      content: "",
      authorName: "",
      authorType: "Lectora verificada",
      authorPhoto: "",
      rating: 5,
      isFeatured: false,
      isPublished: true
    },
  });

  const createTestimonialMutation = useMutation({
    mutationFn: async (data: InsertTestimonial) => {
      const response = await apiRequest("POST", "/api/testimonials", { ...data, authorId: selectedAuthorId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.toastCreateTitle,
        description: t.toastCreateDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials", { authorId: selectedAuthorId }] });
      setIsDialogOpen(false);
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

  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTestimonial> }) => {
      const response = await apiRequest("PUT", `/api/testimonials/${id}`, { ...data, authorId: selectedAuthorId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.toastUpdateTitle,
        description: t.toastUpdateDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials", { authorId: selectedAuthorId }] });
      setIsDialogOpen(false);
      setEditingTestimonial(null);
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

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (testimonialId: string) => {
      await apiRequest("DELETE", `/api/testimonials/${testimonialId}`);
    },
    onSuccess: () => {
      toast({
        title: t.toastDeleteTitle,
        description: t.toastDeleteDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials", { authorId: selectedAuthorId }] });
    },
    onError: () => {
      toast({
        title: t.toastDeleteErrorTitle,
        description: t.toastDeleteErrorDescription,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    form.reset({
      content: testimonial.content,
      authorName: testimonial.authorName,
      authorType: testimonial.authorType,
      authorPhoto: testimonial.authorPhoto || "",
      rating: testimonial.rating,
      isFeatured: testimonial.isFeatured,
      isPublished: testimonial.isPublished
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (testimonialId: string) => {
    if (window.confirm(t.confirmDelete)) {
      deleteTestimonialMutation.mutate(testimonialId);
    }
  };

  const onSubmit = (data: InsertTestimonial) => {
    if (editingTestimonial) {
      updateTestimonialMutation.mutate({ id: editingTestimonial.id, data });
    } else {
      createTestimonialMutation.mutate(data);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTestimonial(null);
    form.reset();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">{t.pageTitle}</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-testimonial">
              <Plus className="h-4 w-4 mr-2" />
              {t.buttonAdd}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial ? t.dialogTitleEdit : t.dialogTitleNew}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="testimonial-form">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.labelContent}</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4} 
                          placeholder={t.placeholderContent}
                          {...field} 
                          data-testid="textarea-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelAuthorName}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.placeholderAuthorName} {...field} data-testid="input-author-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="authorType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelAuthorType}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-author-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Lectora verificada">{t.optionTypeVerifiedFemale}</SelectItem>
                            <SelectItem value="Lector verificado">{t.optionTypeVerifiedMale}</SelectItem>
                            <SelectItem value="Fan #1">{t.optionTypeFan}</SelectItem>
                            <SelectItem value="Amante de la fantasía">{t.optionTypeFantasy}</SelectItem>
                            <SelectItem value="Bibliotecaria">{t.optionTypeLibrarian}</SelectItem>
                            <SelectItem value="Blogger literario">{t.optionTypeBlogger}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="authorPhoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.labelAuthorPhoto}</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder={t.placeholderAuthorPhoto}
                          {...field}
                          value={field.value ?? ""}
                          data-testid="input-author-photo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.labelRating}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString() ?? "5"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-rating">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="5">{t.optionRating5}</SelectItem>
                          <SelectItem value="4">{t.optionRating4}</SelectItem>
                          <SelectItem value="3">{t.optionRating3}</SelectItem>
                          <SelectItem value="2">{t.optionRating2}</SelectItem>
                          <SelectItem value="1">{t.optionRating1}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t.labelFeatured}</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            {t.descriptionFeatured}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-featured"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t.labelPublished}</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            {t.descriptionPublished}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-published"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    {t.buttonCancel}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTestimonialMutation.isPending || updateTestimonialMutation.isPending}
                    data-testid="button-save-testimonial"
                  >
                    {editingTestimonial ? t.buttonUpdate : t.buttonCreate}{t.buttonSuffix}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {testimonials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground" data-testid="no-testimonials-message">{t.emptyState}</p>
            </CardContent>
          </Card>
        ) : (
          testimonials.map((testimonial) => (
            <Card key={testimonial.id} data-testid={`testimonial-card-${testimonial.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.authorPhoto || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                      alt={`${t.altPhotoPrefix}${testimonial.authorName}`}
                      className="w-12 h-12 rounded-full object-cover" 
                    />
                    <div>
                      <CardTitle className="font-semibold">{testimonial.authorName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{testimonial.authorType}</p>
                    </div>
                    <div className="flex text-accent">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(testimonial)}
                      className="text-primary hover:text-primary/80"
                      data-testid={`button-edit-testimonial-${testimonial.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(testimonial.id)}
                      disabled={deleteTestimonialMutation.isPending}
                      className="text-red-500 hover:text-red-700"
                      data-testid={`button-delete-testimonial-${testimonial.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic mb-4">
                  "{testimonial.content}"
                </p>
                <div className="flex gap-2">
                  <Badge className={testimonial.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {testimonial.isPublished ? t.badgePublished : t.badgeDraft}
                  </Badge>
                  {testimonial.isFeatured && (
                    <Badge className="bg-blue-100 text-blue-800">{t.badgeFeatured}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
