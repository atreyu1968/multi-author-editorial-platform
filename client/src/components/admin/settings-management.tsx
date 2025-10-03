import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Save, Upload, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SiteSettings, Newsletter } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SettingsFormData {
  heroTitle: string;
  heroSubtitle: string;
  contactEmail: string;
  freeBookTitle: string;
  freeBookFile: string;
  freeBookFormat: string;
  freeBookDescription: string;
  emailProvider: string;
  emailFromName: string;
  emailFromAddress: string;
  instagramUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  amazonUrl: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

function EmailProviderInstructions({ provider }: { provider: string }) {
  const instructions: Record<string, { url: string; steps: string[] }> = {
    "Resend": {
      url: "https://resend.com/api-keys",
      steps: [
        "Crea una cuenta en resend.com",
        "Ve a 'API Keys' en el dashboard",
        "Crea una nueva API key",
        "Copia la key que empieza con 're_'",
        "Configura el secret EMAIL_API_KEY en Replit con tu API key",
        "Verifica tu dominio en Resend antes de enviar emails"
      ]
    },
    "SendGrid": {
      url: "https://app.sendgrid.com/settings/api_keys",
      steps: [
        "Crea una cuenta en sendgrid.com",
        "Ve a Settings → API Keys",
        "Crea una nueva API key con permisos 'Mail Send'",
        "Copia la key que empieza con 'SG.'",
        "Configura el secret EMAIL_API_KEY en Replit con tu API key",
        "Verifica tu dominio o email del remitente en SendGrid"
      ]
    },
    "Mailchimp": {
      url: "https://mandrillapp.com/settings/index",
      steps: [
        "Crea una cuenta en Mailchimp Transactional (Mandrill)",
        "Accede a Settings en el dashboard",
        "Ve a la sección 'API Keys'",
        "Crea una nueva API key",
        "Copia la API key generada",
        "Configura el secret EMAIL_API_KEY en Replit con tu API key",
        "Agrega y verifica tu dominio de envío"
      ]
    },
    "Brevo": {
      url: "https://app.brevo.com/settings/keys/api",
      steps: [
        "Crea una cuenta en brevo.com (antes Sendinblue)",
        "Ve a Settings → API Keys",
        "Crea una nueva API key v3",
        "Copia la API key generada",
        "Configura el secret EMAIL_API_KEY en Replit con tu API key",
        "Verifica tu dominio o email del remitente"
      ]
    },
    "Postmark": {
      url: "https://account.postmarkapp.com/servers",
      steps: [
        "Crea una cuenta en postmarkapp.com",
        "Crea un nuevo Server o selecciona uno existente",
        "Ve a 'API Tokens' en el server",
        "Copia el 'Server API token'",
        "Configura el secret EMAIL_API_KEY en Replit con el token",
        "Agrega y verifica tu dominio del remitente"
      ]
    },
    "Mailgun": {
      url: "https://app.mailgun.com/app/account/security/api_keys",
      steps: [
        "Crea una cuenta en mailgun.com",
        "Ve a Settings → API Keys",
        "Copia tu 'Private API key'",
        "Anota también tu dominio de envío (ej: mg.tudominio.com)",
        "Configura el secret EMAIL_API_KEY en Replit como 'APIKEY:DOMINIO'",
        "Ejemplo: key-abc123:mg.tudominio.com",
        "Verifica tu dominio en Mailgun"
      ]
    }
  };

  const config = instructions[provider];
  if (!config) return null;

  return (
    <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription>
        <div className="space-y-3">
          <p className="font-semibold text-blue-900 dark:text-blue-100">
            Configuración de {provider}:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-blue-800 dark:text-blue-200">
            {config.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          <a 
            href={config.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Ir a {provider} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </AlertDescription>
    </Alert>
  );
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
      freeBookFile: "",
      freeBookFormat: "PDF",
      freeBookDescription: "",
      emailProvider: "Resend",
      emailFromName: "",
      emailFromAddress: "",
      instagramUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      amazonUrl: "",
      logoUrl: "",
      faviconUrl: "",
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      accentColor: "#f59e0b",
      backgroundColor: "#ffffff",
      textColor: "#1f2937"
    },
  });

  // Load settings into form when data is available
  React.useEffect(() => {
    if (settings.length > 0) {
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      form.reset({
        heroTitle: settingsMap.heroTitle || "",
        heroSubtitle: settingsMap.heroSubtitle || "",
        contactEmail: settingsMap.contactEmail || "",
        freeBookTitle: settingsMap.freeBookTitle || "Primeros Encuentros",
        freeBookFile: settingsMap.freeBookFile || "",
        freeBookFormat: settingsMap.freeBookFormat || "PDF",
        freeBookDescription: settingsMap.freeBookDescription || "",
        emailProvider: settingsMap.emailProvider || "Resend",
        emailFromName: settingsMap.emailFromName || "",
        emailFromAddress: settingsMap.emailFromAddress || "",
        instagramUrl: settingsMap.instagramUrl || "",
        twitterUrl: settingsMap.twitterUrl || "",
        facebookUrl: settingsMap.facebookUrl || "",
        amazonUrl: settingsMap.amazonUrl || "",
        logoUrl: settingsMap.logoUrl || "",
        faviconUrl: settingsMap.faviconUrl || "",
        primaryColor: settingsMap.primaryColor || "#6366f1",
        secondaryColor: settingsMap.secondaryColor || "#8b5cf6",
        accentColor: settingsMap.accentColor || "#f59e0b",
        backgroundColor: settingsMap.backgroundColor || "#ffffff",
        textColor: settingsMap.textColor || "#1f2937"
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const results = await Promise.allSettled(
        Object.entries(data).map(async ([key, value]) => {
          try {
            const response = await apiRequest("PUT", `/api/settings/${key}`, { value });
            const result = await response.json();
            return { key, status: 'success', data: result };
          } catch (error: any) {
            return { key, status: 'error', error: error.message || 'Failed to update' };
          }
        })
      );
      
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success');
      const failures = results.filter(r => r.status === 'fulfilled' && r.value.status === 'error');
      
      if (failures.length > 0 && successes.length === 0) {
        throw new Error('All settings failed to update');
      }
      
      return { successes, failures };
    },
    onSuccess: (result) => {
      const { successes, failures } = result;
      
      if (failures.length > 0) {
        toast({
          title: "Configuración parcialmente guardada",
          description: `${successes.length} configuraciones guardadas, ${failures.length} fallaron.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Configuración guardada",
          description: "Los cambios han sido guardados exitosamente.",
        });
      }
      
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

  // Helper functions for file upload
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleFileUploadComplete = async (fieldName: keyof SettingsFormData, result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileURL = uploadedFile.uploadURL;
      
      try {
        const response = await apiRequest("POST", "/api/images/upload", { imageURL: fileURL });
        const data = await response.json();
        
        form.setValue(fieldName, data.objectPath);
        
        toast({
          title: "Archivo subido",
          description: "El archivo ha sido subido exitosamente.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al procesar el archivo subido.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div>
      <h3 className="text-3xl font-bold text-primary mb-6">Configuración del Sitio</h3>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">Apariencia</TabsTrigger>
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

        <TabsContent value="appearance">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo y Favicon</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="appearance-settings-form">
                    <div className="space-y-4">
                      <h4 className="font-medium">Logo del Header</h4>
                      <p className="text-sm text-muted-foreground">
                        Si subes un logo, se mostrará en lugar del nombre de la autora en la navegación
                      </p>
                      {form.watch("logoUrl") && (
                        <div className="border rounded-lg p-4 bg-muted/50">
                          <img 
                            src={form.watch("logoUrl")} 
                            alt="Logo preview" 
                            className="h-12 object-contain"
                          />
                        </div>
                      )}
                      <ObjectUploader
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={(result) => handleFileUploadComplete("logoUrl", result)}
                        allowedFileTypes={["image/png", "image/jpeg", "image/svg+xml"]}
                        maxFileSize={2 * 1024 * 1024}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Logo
                      </ObjectUploader>
                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL del Logo</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://..." data-testid="input-logo-url" />
                            </FormControl>
                            <FormDescription>
                              O puedes pegar una URL directamente
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4 pt-6 border-t">
                      <h4 className="font-medium">Favicon</h4>
                      <p className="text-sm text-muted-foreground">
                        El favicon es el pequeño ícono que aparece en la pestaña del navegador
                      </p>
                      {form.watch("faviconUrl") && (
                        <div className="border rounded-lg p-4 bg-muted/50 flex items-center gap-4">
                          <img 
                            src={form.watch("faviconUrl")} 
                            alt="Favicon preview" 
                            className="w-8 h-8 object-contain"
                          />
                          <span className="text-sm text-muted-foreground">Vista previa del favicon</span>
                        </div>
                      )}
                      <ObjectUploader
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={(result) => handleFileUploadComplete("faviconUrl", result)}
                        allowedFileTypes={["image/png", "image/x-icon", "image/vnd.microsoft.icon"]}
                        maxFileSize={100 * 1024}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Favicon
                      </ObjectUploader>
                      <FormField
                        control={form.control}
                        name="faviconUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL del Favicon</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://..." data-testid="input-favicon-url" />
                            </FormControl>
                            <FormDescription>
                              Formato recomendado: PNG o ICO, 32x32px
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={updateSettingsMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-save-appearance"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Apariencia"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Colores Personalizados</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="colors-settings-form">
                    <p className="text-sm text-muted-foreground mb-4">
                      Personaliza los colores principales del sitio web
                    </p>
                    
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Primario</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-20 h-10" data-testid="input-primary-color" />
                            </FormControl>
                            <Input 
                              type="text" 
                              value={field.value} 
                              onChange={field.onChange}
                              className="flex-1"
                              placeholder="#6366f1"
                            />
                          </div>
                          <FormDescription>
                            Color principal de botones y elementos destacados
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Secundario</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-20 h-10" data-testid="input-secondary-color" />
                            </FormControl>
                            <Input 
                              type="text" 
                              value={field.value} 
                              onChange={field.onChange}
                              className="flex-1"
                              placeholder="#8b5cf6"
                            />
                          </div>
                          <FormDescription>
                            Color secundario para elementos complementarios
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color de Acento</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-20 h-10" data-testid="input-accent-color" />
                            </FormControl>
                            <Input 
                              type="text" 
                              value={field.value} 
                              onChange={field.onChange}
                              className="flex-1"
                              placeholder="#f59e0b"
                            />
                          </div>
                          <FormDescription>
                            Color para llamadas a la acción y elementos especiales
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={updateSettingsMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-save-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Colores"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
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
              <CardTitle>Newsletter y Libro de Regalo</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="newsletter-settings-form">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Libro de Regalo</h4>
                    
                    <FormField
                      control={form.control}
                      name="freeBookTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título del Libro</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: Primeros Encuentros" data-testid="input-free-book-title" />
                          </FormControl>
                          <FormDescription>
                            El nombre del libro que se enviará como regalo de bienvenida
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="freeBookFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Archivo del Libro (PDF/EPUB, máx 10 MB)</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder="https://... o /objects/..."
                                {...field}
                                value={field.value || ""} 
                                className="flex-1"
                                data-testid="input-free-book-file"
                              />
                            </FormControl>
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={10485760}
                              allowedFileTypes={['application/pdf', 'application/epub+zip']}
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleFileUploadComplete('freeBookFile', result)}
                              buttonClassName="shrink-0"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Subir
                            </ObjectUploader>
                          </div>
                          <FormDescription>
                            Sube el archivo del libro que se enviará por email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="freeBookFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formato del Libro</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-book-format">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PDF">PDF</SelectItem>
                              <SelectItem value="EPUB">EPUB</SelectItem>
                              <SelectItem value="MOBI">MOBI</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="freeBookDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción del Libro</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Una breve historia romántica que te atrapará desde la primera página..."
                              rows={3}
                              data-testid="textarea-book-description"
                            />
                          </FormControl>
                          <FormDescription>
                            Esta descripción aparecerá en el email de bienvenida
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-semibold text-lg">Configuración de Email</h4>
                    
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
                              <SelectItem value="Resend">Resend (Recomendado)</SelectItem>
                              <SelectItem value="SendGrid">SendGrid</SelectItem>
                              <SelectItem value="Mailchimp">Mailchimp Transactional</SelectItem>
                              <SelectItem value="Brevo">Brevo (Sendinblue)</SelectItem>
                              <SelectItem value="Postmark">Postmark</SelectItem>
                              <SelectItem value="Mailgun">Mailgun</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Instrucciones dinámicas según el proveedor */}
                    <EmailProviderInstructions provider={form.watch("emailProvider")} />

                    <FormField
                      control={form.control}
                      name="emailFromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Remitente</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: María González" data-testid="input-email-from-name" />
                          </FormControl>
                          <FormDescription>
                            El nombre que aparecerá como remitente del email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailFromAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email del Remitente</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Ej: hola@mariagonzalez.com" data-testid="input-email-from-address" />
                          </FormControl>
                          <FormDescription>
                            La dirección de email desde la que se enviarán los mensajes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-save-newsletter"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Configuración"}
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
