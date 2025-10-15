import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EditorialSettings } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEditorialSettingsSchema } from "@shared/schema";
import { useEffect } from "react";

export default function EditorialSettingsManagement() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings"],
  });

  const form = useForm({
    resolver: zodResolver(insertEditorialSettingsSchema.partial()),
    defaultValues: {
      heroTitle: "",
      heroSubtitle: "",
      heroPrimaryButtonText: "",
      heroSecondaryButtonText: "",
      offerSectionTitle: "",
      offerSectionDescription: "",
      feature1Title: "",
      feature1Description: "",
      feature1Icon: "BookOpen",
      feature2Title: "",
      feature2Description: "",
      feature2Icon: "Users",
      feature3Title: "",
      feature3Description: "",
      feature3Icon: "Sparkles",
      featuredSectionTitle: "",
      featuredSectionDescription: "",
      footerDescription: "",
      footerEmail: "",
      footerLocation: "",
      footerInstagramUrl: "",
      footerTwitterUrl: "",
      footerFacebookUrl: "",
      footerCopyright: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        heroTitle: settings.heroTitle,
        heroSubtitle: settings.heroSubtitle,
        heroPrimaryButtonText: settings.heroPrimaryButtonText,
        heroSecondaryButtonText: settings.heroSecondaryButtonText,
        offerSectionTitle: settings.offerSectionTitle,
        offerSectionDescription: settings.offerSectionDescription,
        feature1Title: settings.feature1Title,
        feature1Description: settings.feature1Description,
        feature1Icon: settings.feature1Icon,
        feature2Title: settings.feature2Title,
        feature2Description: settings.feature2Description,
        feature2Icon: settings.feature2Icon,
        feature3Title: settings.feature3Title,
        feature3Description: settings.feature3Description,
        feature3Icon: settings.feature3Icon,
        featuredSectionTitle: settings.featuredSectionTitle,
        featuredSectionDescription: settings.featuredSectionDescription,
        footerDescription: settings.footerDescription,
        footerEmail: settings.footerEmail,
        footerLocation: settings.footerLocation,
        footerInstagramUrl: settings.footerInstagramUrl || "",
        footerTwitterUrl: settings.footerTwitterUrl || "",
        footerFacebookUrl: settings.footerFacebookUrl || "",
        footerCopyright: settings.footerCopyright,
        seoTitle: settings.seoTitle,
        seoDescription: settings.seoDescription,
        seoKeywords: settings.seoKeywords,
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/editorial-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial-settings"] });
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se guardaron correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold text-primary mb-2">
          Configuración de la Página Editorial
        </h2>
        <p className="text-muted-foreground">
          Personaliza el contenido de la página principal de tu editorial
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="hero" data-testid="tab-hero">Hero</TabsTrigger>
              <TabsTrigger value="features" data-testid="tab-features">Características</TabsTrigger>
              <TabsTrigger value="authors" data-testid="tab-authors">Autores</TabsTrigger>
              <TabsTrigger value="footer" data-testid="tab-footer">Footer</TabsTrigger>
              <TabsTrigger value="seo" data-testid="tab-seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sección Hero</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="heroTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título Principal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Descubre Historias que Transforman Vidas" data-testid="input-hero-title" />
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
                        <FormLabel>Subtítulo</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Una editorial comprometida..." rows={3} data-testid="input-hero-subtitle" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="heroPrimaryButtonText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto Botón Primario</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Conocer Autores" data-testid="input-hero-primary-button" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="heroSecondaryButtonText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto Botón Secundario</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ver Destacados" data-testid="input-hero-secondary-button" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sección "¿Qué Ofrecemos?"</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="offerSectionTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título de Sección</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="¿Qué Ofrecemos?" data-testid="input-offer-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="offerSectionDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Somos más que una editorial..." rows={2} data-testid="input-offer-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Característica 1</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="feature1Title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Calidad Literaria" data-testid="input-feature1-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="feature1Description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="input-feature1-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="feature1Icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icono (Lucide)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="BookOpen" data-testid="input-feature1-icon" />
                        </FormControl>
                        <FormDescription>Nombre del icono de Lucide React (ej: BookOpen, Users, Sparkles)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Característica 2</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="feature2Title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Autores Diversos" data-testid="input-feature2-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="feature2Description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="input-feature2-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="feature2Icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icono (Lucide)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Users" data-testid="input-feature2-icon" />
                        </FormControl>
                        <FormDescription>Nombre del icono de Lucide React</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Característica 3</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="feature3Title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Experiencia Única" data-testid="input-feature3-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="feature3Description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="input-feature3-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="feature3Icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icono (Lucide)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Sparkles" data-testid="input-feature3-icon" />
                        </FormControl>
                        <FormDescription>Nombre del icono de Lucide React</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="authors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sección Autores Destacados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="featuredSectionTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Autores Destacados" data-testid="input-featured-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featuredSectionDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Conoce a algunos de los talentosos escritores..." rows={3} data-testid="input-featured-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="footer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Footer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="footerDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Descubriendo nuevas voces en la literatura..." rows={3} data-testid="input-footer-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de Contacto</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="info@editorial.com" data-testid="input-footer-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Barcelona, España" data-testid="input-footer-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerInstagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Instagram (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://instagram.com/editorial" data-testid="input-footer-instagram" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerTwitterUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Twitter/X (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://twitter.com/editorial" data-testid="input-footer-twitter" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerFacebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Facebook (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://facebook.com/editorial" data-testid="input-footer-facebook" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerCopyright"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copyright</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="© 2024 Editorial. Todos los derechos reservados." data-testid="input-footer-copyright" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO y Metadatos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título SEO</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Editorial - Descubre Nuevas Voces en Literatura" data-testid="input-seo-title" />
                        </FormControl>
                        <FormDescription>Aparece en resultados de búsqueda y pestañas del navegador</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seoDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Bienvenido a nuestra editorial..." rows={3} data-testid="input-seo-description" />
                        </FormControl>
                        <FormDescription>Aparece en resultados de búsqueda (máx. 160 caracteres)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seoKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="editorial, libros, autores, literatura, novelas, escritores" data-testid="input-seo-keywords" />
                        </FormControl>
                        <FormDescription>Separadas por comas</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              data-testid="button-save-settings"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
