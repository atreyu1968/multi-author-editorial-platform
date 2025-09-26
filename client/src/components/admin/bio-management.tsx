import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAuthorSchema, type Author, type InsertAuthor } from "@shared/schema";

export default function BioManagement() {
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: author, isLoading } = useQuery<Author>({
    queryKey: ["/api/author"]
  });

  const form = useForm<InsertAuthor>({
    resolver: zodResolver(insertAuthorSchema),
    defaultValues: {
      name: "",
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
      const response = await apiRequest("PUT", "/api/author", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Biografía actualizada",
        description: "Los cambios han sido guardados exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/author"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
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
        <div className="text-xl text-muted-foreground">Cargando biografía...</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-3xl font-bold text-primary mb-6">Editar Biografía</h3>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Información del Autor</CardTitle>
            <Button 
              variant="outline" 
              onClick={() => setPreviewMode(!previewMode)}
              data-testid="button-preview-mode"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? "Editar" : "Vista Previa"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {previewMode ? (
            <div className="space-y-6" data-testid="bio-preview">
              <div className="flex items-center gap-6">
                <img 
                  src={form.watch("photo") || "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                  alt="Foto del autor" 
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-2xl font-bold">{form.watch("name")}</h4>
                  <p className="text-muted-foreground">{form.watch("email")}</p>
                </div>
              </div>
              <div>
                <h5 className="font-semibold mb-2">Hero Title:</h5>
                <p>{form.watch("heroTitle")}</p>
              </div>
              <div>
                <h5 className="font-semibold mb-2">Hero Subtitle:</h5>
                <p>{form.watch("heroSubtitle")}</p>
              </div>
              <div>
                <h5 className="font-semibold mb-2">Biografía:</h5>
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
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Foto del Autor</label>
                  <div className="flex items-center gap-6">
                    <img 
                      src={form.watch("photo") || "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                      alt="Foto actual del autor" 
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
                                placeholder="URL de la foto"
                                {...field} 
                                data-testid="input-photo-url"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-sm text-muted-foreground mt-2">Introduce la URL de la imagen</p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
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
                      <FormLabel>Email de Contacto</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
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
                      <FormLabel>Título del Hero</FormLabel>
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
                      <FormLabel>Subtítulo del Hero</FormLabel>
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
                      <FormLabel>Biografía Párrafo 1</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4} 
                          placeholder="Primer párrafo de la biografía..."
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
                      <FormLabel>Biografía Párrafo 2</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4} 
                          placeholder="Segundo párrafo de la biografía..."
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
                      <FormLabel>Biografía Párrafo 3</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4} 
                          placeholder="Tercer párrafo de la biografía..."
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
                        <FormLabel>Instagram URL</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://instagram.com/..." {...field} data-testid="input-instagram" />
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
                          <Input type="url" placeholder="https://twitter.com/..." {...field} data-testid="input-twitter" />
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
                          <Input type="url" placeholder="https://facebook.com/..." {...field} data-testid="input-facebook" />
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
                        <FormLabel>Amazon Author Page</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://amazon.com/author/..." {...field} data-testid="input-amazon" />
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
                    {updateAuthorMutation.isPending ? "Guardando..." : "Guardar Cambios"}
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
