import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SiteSettings, Newsletter } from "@shared/schema";

interface SettingsFormData {
  heroTitle: string;
  heroSubtitle: string;
  contactEmail: string;
  freeBookTitle: string;
  emailProvider: string;
  instagramUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  amazonUrl: string;
}

export default function SettingsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery<SiteSettings[]>({
    queryKey: ["/api/settings"]
  });

  const { data: subscribers = [] } = useQuery<Newsletter[]>({
    queryKey: ["/api/newsletter"]
  });

  const form = useForm<SettingsFormData>({
    defaultValues: {
      heroTitle: "",
      heroSubtitle: "",
      contactEmail: "",
      freeBookTitle: "Primeros Encuentros",
      emailProvider: "MailChimp",
      instagramUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      amazonUrl: ""
    },
  });

  // Load settings into form when data is available
  React.useEffect(() => {
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    form.reset({
      heroTitle: settingsMap.heroTitle || "",
      heroSubtitle: settingsMap.heroSubtitle || "",
      contactEmail: settingsMap.contactEmail || "",
      freeBookTitle: settingsMap.freeBookTitle || "Primeros Encuentros",
      emailProvider: settingsMap.emailProvider || "MailChimp",
      instagramUrl: settingsMap.instagramUrl || "",
      twitterUrl: settingsMap.twitterUrl || "",
      facebookUrl: settingsMap.facebookUrl || "",
      amazonUrl: settingsMap.amazonUrl || ""
    });
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const promises = Object.entries(data).map(async ([key, value]) => {
        try {
          // Try to update existing setting
          const response = await apiRequest("PUT", `/api/settings/${key}`, { value });
          return response.json();
        } catch (error) {
          // If setting doesn't exist, create it
          const response = await apiRequest("POST", "/api/settings", { key, value });
          return response.json();
        }
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "Los cambios han sido guardados exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  return (
    <div>
      <h3 className="text-3xl font-bold text-primary mb-6">Configuración del Sitio</h3>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
          <TabsTrigger value="social" data-testid="tab-social">Redes Sociales</TabsTrigger>
          <TabsTrigger value="newsletter" data-testid="tab-newsletter">Newsletter</TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="general-settings-form">
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
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de Contacto</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-contact-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-save-general"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Configuración"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="social-settings-form">
                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://instagram.com/mariagonzalez" 
                            {...field} 
                            data-testid="input-instagram-url"
                          />
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
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://twitter.com/mariagonzalez" 
                            {...field} 
                            data-testid="input-twitter-url"
                          />
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
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://facebook.com/mariagonzalez" 
                            {...field} 
                            data-testid="input-facebook-url"
                          />
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
                          <Input 
                            type="url" 
                            placeholder="https://amazon.com/author/mariagonzalez" 
                            {...field} 
                            data-testid="input-amazon-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-save-social"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Redes Sociales"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="newsletter">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="newsletter-settings-form">
                  <FormField
                    control={form.control}
                    name="freeBookTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Libro Gratuito</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-free-book-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedor de Email</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-email-provider">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MailChimp">MailChimp</SelectItem>
                            <SelectItem value="ConvertKit">ConvertKit</SelectItem>
                            <SelectItem value="EmailOctopus">EmailOctopus</SelectItem>
                            <SelectItem value="MailerLite">MailerLite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-save-newsletter"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Newsletter"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas del Newsletter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-semibold">Total de Suscriptores</span>
                    <span className="text-2xl font-bold text-primary" data-testid="stat-total-subscribers">
                      {subscribers.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-semibold">Suscriptores este mes</span>
                    <span className="text-2xl font-bold text-accent" data-testid="stat-monthly-subscribers">
                      {subscribers.filter(sub => {
                        if (!sub.subscribedAt) return false;
                        const subDate = new Date(sub.subscribedAt);
                        const now = new Date();
                        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
                        return subDate >= monthAgo;
                      }).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suscriptores Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {subscribers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4" data-testid="no-subscribers-message">
                    No hay suscriptores aún.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subscribers
                      .sort((a, b) => new Date(b.subscribedAt || '').getTime() - new Date(a.subscribedAt || '').getTime())
                      .slice(0, 10)
                      .map((subscriber, index) => (
                        <div key={subscriber.id} className="flex justify-between items-center p-3 bg-muted rounded-lg" data-testid={`subscriber-${index}`}>
                          <div>
                            <div className="font-semibold">{subscriber.name}</div>
                            <div className="text-sm text-muted-foreground">{subscriber.email}</div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscriber.subscribedAt ? new Date(subscriber.subscribedAt).toLocaleDateString() : 'Fecha no disponible'}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
