import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save, Eye } from "lucide-react";
import { useAdminAuthor } from "@/contexts/admin-author-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAuthorSchema, type Author, type InsertAuthor } from "@shared/schema";
import { useUiText } from "@/contexts/ui-text-context";

export default function BioManagement() {
  const { selectedAuthorId } = useAdminAuthor();
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const t = {
    pageTitle: useUiText("admin.bio", "page_title", "Editar Biografía"),
    buttonPreviewModeOn: useUiText("admin.bio", "button_preview_mode_on", "Vista Previa"),
    buttonPreviewModeOff: useUiText("admin.bio", "button_preview_mode_off", "Editar"),
    cardTitle: useUiText("admin.bio", "card_title", "Información del Autor"),
    previewAltPhoto: useUiText("admin.bio", "preview_alt_photo", "Foto del autor"),
    previewLabelHeroTitle: useUiText("admin.bio", "preview_label_hero_title", "Hero Title:"),
    previewLabelHeroSubtitle: useUiText("admin.bio", "preview_label_hero_subtitle", "Hero Subtitle:"),
    previewLabelBio: useUiText("admin.bio", "preview_label_bio", "Biografía:"),
    sectionLabelPhoto: useUiText("admin.bio", "section_label_photo", "Foto del Autor"),
    altCurrentPhoto: useUiText("admin.bio", "alt_current_photo", "Foto actual del autor"),
    placeholderPhotoUrl: useUiText("admin.bio", "placeholder_photo_url", "URL de la foto"),
    descriptionPhoto: useUiText("admin.bio", "description_photo", "Introduce la URL de la imagen"),
    labelName: useUiText("admin.bio", "label_name", "Nombre Completo"),
    labelEmail: useUiText("admin.bio", "label_email", "Email de Contacto"),
    labelHeroTitle: useUiText("admin.bio", "label_hero_title", "Título del Hero"),
    labelHeroSubtitle: useUiText("admin.bio", "label_hero_subtitle", "Subtítulo del Hero"),
    labelBioParagraph1: useUiText("admin.bio", "label_bio_paragraph_1", "Biografía Párrafo 1"),
    placeholderBioParagraph1: useUiText("admin.bio", "placeholder_bio_paragraph_1", "Primer párrafo de la biografía..."),
    labelBioParagraph2: useUiText("admin.bio", "label_bio_paragraph_2", "Biografía Párrafo 2"),
    placeholderBioParagraph2: useUiText("admin.bio", "placeholder_bio_paragraph_2", "Segundo párrafo de la biografía..."),
    labelBioParagraph3: useUiText("admin.bio", "label_bio_paragraph_3", "Biografía Párrafo 3"),
    placeholderBioParagraph3: useUiText("admin.bio", "placeholder_bio_paragraph_3", "Tercer párrafo de la biografía..."),
    labelInstagram: useUiText("admin.bio", "label_instagram", "Instagram URL"),
    placeholderInstagram: useUiText("admin.bio", "placeholder_instagram", "https://instagram.com/..."),
    labelTwitter: useUiText("admin.bio", "label_twitter", "Twitter URL"),
    placeholderTwitter: useUiText("admin.bio", "placeholder_twitter", "https://twitter.com/..."),
    labelFacebook: useUiText("admin.bio", "label_facebook", "Facebook URL"),
    placeholderFacebook: useUiText("admin.bio", "placeholder_facebook", "https://facebook.com/..."),
    labelAmazon: useUiText("admin.bio", "label_amazon", "Amazon Author Page"),
    placeholderAmazon: useUiText("admin.bio", "placeholder_amazon", "https://amazon.com/author/..."),
    buttonSave: useUiText("admin.bio", "button_save", "Guardar Cambios"),
    buttonSavePending: useUiText("admin.bio", "button_save_pending", "Guardando..."),
    toastSuccessTitle: useUiText("admin.bio", "toast_success_title", "Biografía actualizada"),
    toastSuccessDescription: useUiText("admin.bio", "toast_success_description", "Los cambios han sido guardados exitosamente."),
    toastErrorTitle: useUiText("admin.bio", "toast_error_title", "Error"),
    toastErrorDescription: useUiText("admin.bio", "toast_error_description", "No se pudieron guardar los cambios."),
    loadingText: useUiText("admin.bio", "loading_text", "Cargando biografía..."),
  };

  const { data: author, isLoading } = useQuery<Author>({
    queryKey: [`/api/authors/${selectedAuthorId}`],
    enabled: !!selectedAuthorId,
  });

  const form = useForm<InsertAuthor>({
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
      amazonUrl: ""
    },
  });

  // Update form when author data loads
  React.useEffect(() => {
    if (author) {
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
        amazonUrl: author.amazonUrl || ""
      });
    }
  }, [author, form]);

  const updateAuthorMutation = useMutation({
    mutationFn: async (data: InsertAuthor) => {
      const response = await apiRequest("PUT", `/api/authors/${selectedAuthorId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.toastSuccessTitle,
        description: t.toastSuccessDescription,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/authors/${selectedAuthorId}`] });
    },
    onError: () => {
      toast({
        title: t.toastErrorTitle,
        description: t.toastErrorDescription,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAuthor) => {
    updateAuthorMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-xl text-muted-foreground">{t.loadingText}</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-3xl font-bold text-primary mb-6">{t.pageTitle}</h3>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t.cardTitle}</CardTitle>
            <Button 
              variant="outline" 
              onClick={() => setPreviewMode(!previewMode)}
              data-testid="button-preview-mode"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? t.buttonPreviewModeOff : t.buttonPreviewModeOn}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {previewMode ? (
            <div className="space-y-6" data-testid="bio-preview">
              <div className="flex items-center gap-6">
                <img 
                  src={form.watch("photo") || "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                  alt={t.previewAltPhoto} 
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-2xl font-bold">{form.watch("name")}</h4>
                  <p className="text-muted-foreground">{form.watch("email")}</p>
                </div>
              </div>
              <div>
                <h5 className="font-semibold mb-2">{t.previewLabelHeroTitle}</h5>
                <p>{form.watch("heroTitle")}</p>
              </div>
              <div>
                <h5 className="font-semibold mb-2">{t.previewLabelHeroSubtitle}</h5>
                <p>{form.watch("heroSubtitle")}</p>
              </div>
              <div>
                <h5 className="font-semibold mb-2">{t.previewLabelBio}</h5>
                <div className="space-y-4 text-muted-foreground">
                  <p>{form.watch("bioParagraph1")}</p>
                  <p>{form.watch("bioParagraph2")}</p>
                  <p>{form.watch("bioParagraph3")}</p>
                </div>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="bio-form">
                {/* Hidden slug field */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.sectionLabelPhoto}</label>
                  <div className="flex items-center gap-6">
                    <img 
                      src={form.watch("photo") || "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                      alt={t.altCurrentPhoto} 
                      className="w-24 h-24 rounded-full object-cover" 
                      data-testid="author-photo-preview"
                    />
                    <div>
                      <FormField
                        control={form.control}
                        name="photo"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="url" 
                                placeholder={t.placeholderPhotoUrl}
                                {...field}
                                value={field.value ?? ""}
                                data-testid="input-photo-url"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-sm text-muted-foreground mt-2">{t.descriptionPhoto}</p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.labelName}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-name" />
                      </FormControl>
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
                        <Input type="email" {...field} value={field.value ?? ""} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="heroTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.labelHeroTitle}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-hero-title" />
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
                        <Textarea rows={3} {...field} data-testid="textarea-hero-subtitle" />
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
                        <Textarea 
                          rows={4} 
                          placeholder={t.placeholderBioParagraph1}
                          {...field} 
                          data-testid="textarea-bio-1"
                        />
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
                        <Textarea 
                          rows={4} 
                          placeholder={t.placeholderBioParagraph2}
                          {...field} 
                          data-testid="textarea-bio-2"
                        />
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
                        <Textarea 
                          rows={4} 
                          placeholder={t.placeholderBioParagraph3}
                          {...field} 
                          data-testid="textarea-bio-3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Social Media URLs */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelInstagram}</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder={t.placeholderInstagram} {...field} value={field.value ?? ""} data-testid="input-instagram" />
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
                          <Input type="url" placeholder={t.placeholderTwitter} {...field} value={field.value ?? ""} data-testid="input-twitter" />
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
                          <Input type="url" placeholder={t.placeholderFacebook} {...field} value={field.value ?? ""} data-testid="input-facebook" />
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
                          <Input type="url" placeholder={t.placeholderAmazon} {...field} value={field.value ?? ""} data-testid="input-amazon" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    disabled={updateAuthorMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-save-bio"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateAuthorMutation.isPending ? t.buttonSavePending : t.buttonSave}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
