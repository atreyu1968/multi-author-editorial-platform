import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Save, Info, ExternalLink, Upload, Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EditorialSettings } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEditorialSettingsSchema } from "@shared/schema";
import { getCurrencySymbol } from "@/lib/format-currency";
import { useEffect, useState } from "react";
import { useUiText } from "@/contexts/ui-text-context";
import { FileUploader } from "@/components/FileUploader";

interface EmailProviderInstructionsProps {
  provider: string;
  instructionsTitle: string;
  instructionsLink: string;
  providerSteps: Record<string, string[]>;
}

function EmailProviderInstructions({ provider, instructionsTitle, instructionsLink, providerSteps }: EmailProviderInstructionsProps) {
  const instructions: Record<string, { url: string }> = {
    "Resend": { url: "https://resend.com/api-keys" },
    "SendGrid": { url: "https://app.sendgrid.com/settings/api_keys" },
    "Mailchimp": { url: "https://mandrillapp.com/settings/index" },
    "Brevo": { url: "https://app.brevo.com/settings/keys/api" },
    "Postmark": { url: "https://account.postmarkapp.com/servers" },
    "Mailgun": { url: "https://app.mailgun.com/app/account/security/api_keys" },
    "Gmail": { url: "https://myaccount.google.com/apppasswords" }
  };

  const config = instructions[provider];
  const steps = providerSteps[provider];
  
  if (!config || !steps) return null;

  return (
    <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription>
        <div className="space-y-3">
          <p className="font-semibold text-blue-900 dark:text-blue-100">
            {instructionsTitle.replace("{provider}", provider)}
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-blue-800 dark:text-blue-200">
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          <a 
            href={config.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {instructionsLink.replace("{provider}", provider)} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default function EditorialSettingsManagement() {
  const { toast } = useToast();
  const [isSeedingTexts, setIsSeedingTexts] = useState(false);

  const emailProviderSteps: Record<string, string[]> = {
    "Resend": ["Ve a tu cuenta de Resend", "Genera una nueva API Key en Settings", "Copia la key y pégala aquí"],
    "SendGrid": ["Accede a Settings > API Keys", "Crea una nueva API Key con permisos de envío", "Copia y pega la key aquí"],
    "Mailchimp": ["Accede a tu cuenta de Mailchimp Transactional", "Ve a Settings > SMTP & API Info", "Genera y copia tu API key"],
    "Brevo": ["Ve a Settings > SMTP & API", "Genera una nueva API key", "Copia la key aquí"],
    "Postmark": ["Accede a tu servidor en Postmark", "Ve a API Tokens", "Genera un nuevo Server API Token"],
    "Mailgun": ["Ve a Settings > API Keys", "Usa formato: TU_API_KEY:TU_DOMINIO", "Ejemplo: key-abc123:mg.tudominio.com"],
    "Gmail": ["1. Habilita la verificación en dos pasos en tu cuenta de Gmail", "2. Ve a Configuración de Google → Seguridad → Contraseñas de aplicaciones", "3. Genera una nueva contraseña de aplicación para 'Correo'", "4. En API Key, introduce: tu-email@gmail.com:contraseña-aplicacion", "5. Ejemplo: juanperez@gmail.com:abcdefghijklmnop (elimina espacios de la contraseña)"]
  };

  const t = {
    loading: useUiText("admin.editorial_settings", "loading", "Cargando..."),
    pageTitle: useUiText("admin.editorial_settings", "page_title", "Configuración Editorial"),
    pageDescription: useUiText("admin.editorial_settings", "page_description", "Gestiona la configuración global de tu editorial"),
    tabBranding: useUiText("admin.editorial_settings", "tab_branding", "Marca"),
    tabHero: useUiText("admin.editorial_settings", "tab_hero", "Portada"),
    tabFeatures: useUiText("admin.editorial_settings", "tab_features", "Secciones"),
    tabAuthors: useUiText("admin.editorial_settings", "tab_authors", "Autores"),
    tabFooter: useUiText("admin.editorial_settings", "tab_footer", "Footer"),
    tabSeo: useUiText("admin.editorial_settings", "tab_seo", "SEO"),
    tabPaypal: useUiText("admin.editorial_settings", "tab_paypal", "PayPal"),
    tabEmail: useUiText("admin.editorial_settings", "tabEmail", "Email"),
    cardIdentityTitle: useUiText("admin.editorial_settings", "card_identity_title"),
    labelName: useUiText("admin.editorial_settings", "label_name"),
    placeholderName: useUiText("admin.editorial_settings", "placeholder_name"),
    descName: useUiText("admin.editorial_settings", "desc_name"),
    labelLogoUrl: useUiText("admin.editorial_settings", "label_logo_url"),
    placeholderLogoUrl: useUiText("admin.editorial_settings", "placeholder_logo_url"),
    descLogoUrl: useUiText("admin.editorial_settings", "desc_logo_url"),
    labelFaviconUrl: useUiText("admin.editorial_settings", "label_favicon_url"),
    placeholderFaviconUrl: useUiText("admin.editorial_settings", "placeholder_favicon_url"),
    descFaviconUrl: useUiText("admin.editorial_settings", "desc_favicon_url"),
    cardFooterLinksTitle: useUiText("admin.editorial_settings", "card_footer_links_title"),
    labelFooterLinks: useUiText("admin.editorial_settings", "label_footer_links"),
    placeholderFooterLinks: useUiText("admin.editorial_settings", "placeholder_footer_links"),
    descFooterLinks: useUiText("admin.editorial_settings", "desc_footer_links"),
    cardBackgroundTitle: useUiText("admin.editorial_settings", "card_background_title"),
    labelBgImage: useUiText("admin.editorial_settings", "label_bg_image"),
    placeholderBgImage: useUiText("admin.editorial_settings", "placeholder_bg_image"),
    descBgImage: useUiText("admin.editorial_settings", "desc_bg_image"),
    labelBgColor: useUiText("admin.editorial_settings", "label_bg_color"),
    placeholderBgColor: useUiText("admin.editorial_settings", "placeholder_bg_color"),
    descBgColor: useUiText("admin.editorial_settings", "desc_bg_color"),
    cardHeroTitle: useUiText("admin.editorial_settings", "card_hero_title"),
    labelHeroTitle: useUiText("admin.editorial_settings", "label_hero_title"),
    placeholderHeroTitle: useUiText("admin.editorial_settings", "placeholder_hero_title"),
    labelHeroSubtitle: useUiText("admin.editorial_settings", "label_hero_subtitle"),
    placeholderHeroSubtitle: useUiText("admin.editorial_settings", "placeholder_hero_subtitle"),
    labelHeroPrimaryBtn: useUiText("admin.editorial_settings", "label_hero_primary_btn"),
    placeholderHeroPrimaryBtn: useUiText("admin.editorial_settings", "placeholder_hero_primary_btn"),
    labelHeroSecondaryBtn: useUiText("admin.editorial_settings", "label_hero_secondary_btn"),
    placeholderHeroSecondaryBtn: useUiText("admin.editorial_settings", "placeholder_hero_secondary_btn"),
    cardOfferTitle: useUiText("admin.editorial_settings", "card_offer_title"),
    labelOfferSectionTitle: useUiText("admin.editorial_settings", "label_offer_section_title"),
    placeholderOfferTitle: useUiText("admin.editorial_settings", "placeholder_offer_title"),
    labelOfferDescription: useUiText("admin.editorial_settings", "label_offer_description"),
    placeholderOfferDescription: useUiText("admin.editorial_settings", "placeholder_offer_description"),
    cardFeature1Title: useUiText("admin.editorial_settings", "card_feature1_title"),
    labelFeatureTitle: useUiText("admin.editorial_settings", "label_feature_title"),
    placeholderFeature1Title: useUiText("admin.editorial_settings", "placeholder_feature1_title"),
    labelFeatureDescription: useUiText("admin.editorial_settings", "label_feature_description"),
    labelFeatureIcon: useUiText("admin.editorial_settings", "label_feature_icon"),
    placeholderFeature1Icon: useUiText("admin.editorial_settings", "placeholder_feature1_icon"),
    descFeature1Icon: useUiText("admin.editorial_settings", "desc_feature1_icon"),
    cardFeature2Title: useUiText("admin.editorial_settings", "card_feature2_title"),
    placeholderFeature2Title: useUiText("admin.editorial_settings", "placeholder_feature2_title"),
    placeholderFeature2Icon: useUiText("admin.editorial_settings", "placeholder_feature2_icon"),
    descFeature2Icon: useUiText("admin.editorial_settings", "desc_feature2_icon"),
    cardFeature3Title: useUiText("admin.editorial_settings", "card_feature3_title"),
    placeholderFeature3Title: useUiText("admin.editorial_settings", "placeholder_feature3_title"),
    placeholderFeature3Icon: useUiText("admin.editorial_settings", "placeholder_feature3_icon"),
    descFeature3Icon: useUiText("admin.editorial_settings", "desc_feature3_icon"),
    cardFeaturedAuthorsTitle: useUiText("admin.editorial_settings", "card_featured_authors_title"),
    labelFeaturedTitle: useUiText("admin.editorial_settings", "label_featured_title"),
    placeholderFeaturedTitle: useUiText("admin.editorial_settings", "placeholder_featured_title"),
    labelFeaturedDescription: useUiText("admin.editorial_settings", "label_featured_description"),
    placeholderFeaturedDescription: useUiText("admin.editorial_settings", "placeholder_featured_description"),
    cardFooterTitle: useUiText("admin.editorial_settings", "card_footer_title"),
    labelFooterDescription: useUiText("admin.editorial_settings", "label_footer_description"),
    placeholderFooterDescription: useUiText("admin.editorial_settings", "placeholder_footer_description"),
    labelFooterEmail: useUiText("admin.editorial_settings", "label_footer_email"),
    placeholderFooterEmail: useUiText("admin.editorial_settings", "placeholder_footer_email"),
    labelFooterLocation: useUiText("admin.editorial_settings", "label_footer_location"),
    placeholderFooterLocation: useUiText("admin.editorial_settings", "placeholder_footer_location"),
    labelFooterInstagram: useUiText("admin.editorial_settings", "label_footer_instagram"),
    placeholderFooterInstagram: useUiText("admin.editorial_settings", "placeholder_footer_instagram"),
    labelFooterTwitter: useUiText("admin.editorial_settings", "label_footer_twitter"),
    placeholderFooterTwitter: useUiText("admin.editorial_settings", "placeholder_footer_twitter"),
    labelFooterFacebook: useUiText("admin.editorial_settings", "label_footer_facebook"),
    placeholderFooterFacebook: useUiText("admin.editorial_settings", "placeholder_footer_facebook"),
    labelFooterCopyright: useUiText("admin.editorial_settings", "label_footer_copyright"),
    placeholderFooterCopyright: useUiText("admin.editorial_settings", "placeholder_footer_copyright"),
    cardSeoTitle: useUiText("admin.editorial_settings", "card_seo_title"),
    labelSeoTitle: useUiText("admin.editorial_settings", "label_seo_title"),
    placeholderSeoTitle: useUiText("admin.editorial_settings", "placeholder_seo_title"),
    descSeoTitle: useUiText("admin.editorial_settings", "desc_seo_title"),
    labelSeoDescription: useUiText("admin.editorial_settings", "label_seo_description"),
    placeholderSeoDescription: useUiText("admin.editorial_settings", "placeholder_seo_description"),
    descSeoDescription: useUiText("admin.editorial_settings", "desc_seo_description"),
    labelSeoKeywords: useUiText("admin.editorial_settings", "label_seo_keywords"),
    placeholderSeoKeywords: useUiText("admin.editorial_settings", "placeholder_seo_keywords"),
    descSeoKeywords: useUiText("admin.editorial_settings", "desc_seo_keywords"),
    cardCurrencyTitle: useUiText("admin.editorial_settings", "card_currency_title"),
    labelCurrency: useUiText("admin.editorial_settings", "label_currency"),
    placeholderCurrency: useUiText("admin.editorial_settings", "placeholder_currency"),
    currencyUsd: useUiText("admin.editorial_settings", "currency_usd"),
    currencyEur: useUiText("admin.editorial_settings", "currency_eur"),
    currencyMxn: useUiText("admin.editorial_settings", "currency_mxn"),
    currencyArs: useUiText("admin.editorial_settings", "currency_ars"),
    currencyCop: useUiText("admin.editorial_settings", "currency_cop"),
    currencyClp: useUiText("admin.editorial_settings", "currency_clp"),
    currencyPen: useUiText("admin.editorial_settings", "currency_pen"),
    currencyBrl: useUiText("admin.editorial_settings", "currency_brl"),
    descCurrency: useUiText("admin.editorial_settings", "desc_currency"),
    labelCurrencySymbol: useUiText("admin.editorial_settings", "label_currency_symbol"),
    placeholderCurrencySymbol: useUiText("admin.editorial_settings", "placeholder_currency_symbol"),
    descCurrencySymbol: useUiText("admin.editorial_settings", "desc_currency_symbol"),
    cardPaypalTitle: useUiText("admin.editorial_settings", "card_paypal_title"),
    labelPaypalClientId: useUiText("admin.editorial_settings", "label_paypal_client_id"),
    placeholderPaypalClientId: useUiText("admin.editorial_settings", "placeholder_paypal_client_id"),
    descPaypalClientId: useUiText("admin.editorial_settings", "desc_paypal_client_id"),
    labelPaypalClientSecret: useUiText("admin.editorial_settings", "label_paypal_client_secret"),
    placeholderPaypalClientSecret: useUiText("admin.editorial_settings", "placeholder_paypal_client_secret"),
    descPaypalClientSecret: useUiText("admin.editorial_settings", "desc_paypal_client_secret"),
    labelPaypalEnvironment: useUiText("admin.editorial_settings", "label_paypal_environment"),
    paypalEnvSandbox: useUiText("admin.editorial_settings", "paypal_env_sandbox"),
    paypalEnvProduction: useUiText("admin.editorial_settings", "paypal_env_production"),
    descPaypalEnvironment: useUiText("admin.editorial_settings", "desc_paypal_environment"),
    buttonSavePending: useUiText("admin.editorial_settings", "button_save_pending"),
    buttonSave: useUiText("admin.editorial_settings", "button_save"),
    toastSuccessTitle: useUiText("admin.editorial_settings", "toast_success_title"),
    toastSuccessDescription: useUiText("admin.editorial_settings", "toast_success_description"),
    toastErrorTitle: useUiText("admin.editorial_settings", "toast_error_title"),
    toastErrorDescription: useUiText("admin.editorial_settings", "toast_error_description"),
    cardEmailNewsletterTitle: useUiText("admin.editorial_settings", "card_email_newsletter_title"),
    cardEmailDigitalTitle: useUiText("admin.editorial_settings", "card_email_digital_title"),
    cardEmailInvoiceTitle: useUiText("admin.editorial_settings", "card_email_invoice_title"),
    labelEmailProvider: useUiText("admin.editorial_settings", "label_email_provider"),
    placeholderEmailProvider: useUiText("admin.editorial_settings", "placeholder_email_provider"),
    descEmailProvider: useUiText("admin.editorial_settings", "desc_email_provider"),
    labelEmailApiKey: useUiText("admin.editorial_settings", "label_email_api_key"),
    placeholderEmailApiKey: useUiText("admin.editorial_settings", "placeholder_email_api_key"),
    descEmailApiKey: useUiText("admin.editorial_settings", "desc_email_api_key"),
    labelEmailFromName: useUiText("admin.editorial_settings", "label_email_from_name"),
    placeholderEmailFromName: useUiText("admin.editorial_settings", "placeholder_email_from_name"),
    descEmailFromName: useUiText("admin.editorial_settings", "desc_email_from_name"),
    labelEmailFromEmail: useUiText("admin.editorial_settings", "label_email_from_email"),
    placeholderEmailFromEmail: useUiText("admin.editorial_settings", "placeholder_email_from_email"),
    descEmailFromEmail: useUiText("admin.editorial_settings", "desc_email_from_email"),
    emailInstructionsTitle: useUiText("admin.editorial_settings", "email_instructions_title"),
    emailInstructionsLink: useUiText("admin.editorial_settings", "email_instructions_link"),
  };

  const { data: settings, isLoading } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings/admin"],
  });

  const form = useForm({
    resolver: zodResolver(insertEditorialSettingsSchema.partial()),
    defaultValues: {
      name: "",
      logoUrl: "",
      faviconUrl: "",
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
      footerLogoUrl: "",
      footerDescription: "",
      footerEmail: "",
      footerLocation: "",
      footerInstagramUrl: "",
      footerTwitterUrl: "",
      footerFacebookUrl: "",
      footerCopyright: "",
      footerQuickLinks: [] as string[],
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      backgroundImageUrl: "",
      backgroundColor: "",
      primaryColor: "",
      secondaryColor: "",
      accentColor: "",
      textColor: "",
      paypalClientId: "",
      paypalClientSecret: "",
      paypalEnvironment: "sandbox",
      currency: "USD",
      currencySymbol: "$",
      emailNewsletterProvider: "",
      emailNewsletterApiKey: "",
      emailNewsletterFromName: "",
      emailNewsletterFromEmail: "",
      emailDigitalProvider: "",
      emailDigitalApiKey: "",
      emailDigitalFromName: "",
      emailDigitalFromEmail: "",
      emailInvoiceProvider: "",
      emailInvoiceApiKey: "",
      emailInvoiceFromName: "",
      emailInvoiceFromEmail: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name || "",
        logoUrl: settings.logoUrl || "",
        faviconUrl: settings.faviconUrl || "",
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
        footerLogoUrl: settings.footerLogoUrl || "",
        footerDescription: settings.footerDescription,
        footerEmail: settings.footerEmail,
        footerLocation: settings.footerLocation,
        footerInstagramUrl: settings.footerInstagramUrl || "",
        footerTwitterUrl: settings.footerTwitterUrl || "",
        footerFacebookUrl: settings.footerFacebookUrl || "",
        footerCopyright: settings.footerCopyright,
        footerQuickLinks: (settings.footerQuickLinks || []) as string[],
        seoTitle: settings.seoTitle,
        seoDescription: settings.seoDescription,
        seoKeywords: settings.seoKeywords,
        backgroundImageUrl: settings.backgroundImageUrl || "",
        backgroundColor: settings.backgroundColor || "",
        primaryColor: settings.primaryColor || "",
        secondaryColor: settings.secondaryColor || "",
        accentColor: settings.accentColor || "",
        textColor: settings.textColor || "",
        paypalClientId: settings.paypalClientId || "",
        paypalClientSecret: settings.paypalClientSecret || "",
        paypalEnvironment: settings.paypalEnvironment || "sandbox",
        currency: settings.currency || "USD",
        currencySymbol: settings.currencySymbol || "$",
        emailNewsletterProvider: settings.emailNewsletterProvider || "",
        emailNewsletterApiKey: settings.emailNewsletterApiKey || "",
        emailNewsletterFromName: settings.emailNewsletterFromName || "",
        emailNewsletterFromEmail: settings.emailNewsletterFromEmail || "",
        emailDigitalProvider: settings.emailDigitalProvider || "",
        emailDigitalApiKey: settings.emailDigitalApiKey || "",
        emailDigitalFromName: settings.emailDigitalFromName || "",
        emailDigitalFromEmail: settings.emailDigitalFromEmail || "",
        emailInvoiceProvider: settings.emailInvoiceProvider || "",
        emailInvoiceApiKey: settings.emailInvoiceApiKey || "",
        emailInvoiceFromName: settings.emailInvoiceFromName || "",
        emailInvoiceFromEmail: settings.emailInvoiceFromEmail || "",
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/editorial-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial-settings/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/editorial-settings"] });
      toast({
        title: t.toastSuccessTitle,
        description: t.toastSuccessDescription,
      });
    },
    onError: () => {
      toast({
        title: t.toastErrorTitle,
        description: t.toastErrorDescription,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleFileUploadComplete = (fieldName: string, result: { url: string; objectPath: string }) => {
    const imageUrl = result.url || result.objectPath;
    form.setValue(fieldName as any, imageUrl);
    
    // Auto-save after upload
    const currentValues = form.getValues();
    updateMutation.mutate({ ...currentValues, [fieldName]: imageUrl });
  };

  const handleSeedTexts = async () => {
    setIsSeedingTexts(true);
    try {
      const response = await apiRequest("POST", "/api/admin/force-seed-ui-texts", {});
      const data = await response.json();
      
      toast({
        title: "Textos actualizados",
        description: "Los textos de UI se han actualizado correctamente. Recarga la página para ver los cambios.",
      });
      
      // Invalidar cache para forzar recarga de textos
      queryClient.invalidateQueries({ queryKey: ["/api/ui-texts"] });
      
      // Recargar página después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los textos de UI",
        variant: "destructive",
      });
    } finally {
      setIsSeedingTexts(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">{t.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold text-primary mb-2">
          {t.pageTitle}
        </h2>
        <p className="text-muted-foreground">
          {t.pageDescription}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9 mb-6">
              <TabsTrigger value="branding" data-testid="tab-branding">{t.tabBranding}</TabsTrigger>
              <TabsTrigger value="hero" data-testid="tab-hero">{t.tabHero}</TabsTrigger>
              <TabsTrigger value="features" data-testid="tab-features">{t.tabFeatures}</TabsTrigger>
              <TabsTrigger value="authors" data-testid="tab-authors">{t.tabAuthors}</TabsTrigger>
              <TabsTrigger value="footer" data-testid="tab-footer">{t.tabFooter}</TabsTrigger>
              <TabsTrigger value="seo" data-testid="tab-seo">{t.tabSeo}</TabsTrigger>
              <TabsTrigger value="paypal" data-testid="tab-paypal">{t.tabPaypal}</TabsTrigger>
              <TabsTrigger value="email" data-testid="tab-email">{t.tabEmail}</TabsTrigger>
              <TabsTrigger value="system" data-testid="tab-system">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.cardIdentityTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelName}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderName} data-testid="input-editorial-name" />
                        </FormControl>
                        <FormDescription>
                          {t.descName}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("logoUrl") && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <img 
                        src={form.watch("logoUrl")} 
                        alt="Logo preview" 
                        className="h-12 object-contain"
                      />
                    </div>
                  )}
                  <FileUploader
                    onComplete={(result) => handleFileUploadComplete("logoUrl", result)}
                    allowedFileTypes={["image/png", "image/jpeg", "image/svg+xml"]}
                    maxFileSize={2 * 1024 * 1024}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Logo
                  </FileUploader>
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelLogoUrl}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderLogoUrl} data-testid="input-logo-url" />
                        </FormControl>
                        <FormDescription>
                          {t.descLogoUrl}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                  <FileUploader
                    onComplete={(result) => handleFileUploadComplete("faviconUrl", result)}
                    allowedFileTypes={["image/png", "image/x-icon", "image/vnd.microsoft.icon"]}
                    maxFileSize={100 * 1024}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Favicon
                  </FileUploader>
                  <FormField
                    control={form.control}
                    name="faviconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelFaviconUrl}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFaviconUrl} data-testid="input-favicon-url" />
                        </FormControl>
                        <FormDescription>
                          {t.descFaviconUrl}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.cardFooterLinksTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="footerQuickLinks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelFooterLinks}</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value?.join('\n') || ''} 
                            onChange={(e) => {
                              const lines = e.target.value.split('\n').filter(line => line.trim());
                              field.onChange(lines);
                            }}
                            placeholder={t.placeholderFooterLinks}
                            rows={5} 
                            data-testid="input-footer-links" 
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descFooterLinks}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.cardBackgroundTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.watch("backgroundImageUrl") && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <img 
                        src={form.watch("backgroundImageUrl")} 
                        alt="Vista previa de imagen de fondo" 
                        className="w-full max-h-48 object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <FileUploader
                      onComplete={(result) => handleFileUploadComplete("backgroundImageUrl", result)}
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
                          <Input {...field} placeholder={t.placeholderBgImage} data-testid="input-bg-image" />
                        </FormControl>
                        <FormDescription>
                          {t.descBgImage}
                        </FormDescription>
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
                          <Input {...field} placeholder={t.placeholderBgColor} data-testid="input-bg-color" />
                        </FormControl>
                        <FormDescription>
                          {t.descBgColor}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold mb-4">Colores del Tema Editorial (independiente de los autores)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color Primario</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input {...field} placeholder="#3b82f6" data-testid="input-primary-color" />
                                <input type="color" value={field.value || "#3b82f6"} onChange={(e) => field.onChange(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                              </div>
                            </FormControl>
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
                            <FormControl>
                              <div className="flex gap-2">
                                <Input {...field} placeholder="#64748b" data-testid="input-secondary-color" />
                                <input type="color" value={field.value || "#64748b"} onChange={(e) => field.onChange(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                              </div>
                            </FormControl>
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
                            <FormControl>
                              <div className="flex gap-2">
                                <Input {...field} placeholder="#f59e0b" data-testid="input-accent-color" />
                                <input type="color" value={field.value || "#f59e0b"} onChange={(e) => field.onChange(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="textColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color de Texto</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input {...field} placeholder="#1e293b" data-testid="input-text-color" />
                                <input type="color" value={field.value || "#1e293b"} onChange={(e) => field.onChange(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hero" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.cardHeroTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="heroTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelHeroTitle}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderHeroTitle} data-testid="input-hero-title" />
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
                          <Textarea {...field} placeholder={t.placeholderHeroSubtitle} rows={3} data-testid="input-hero-subtitle" />
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
                        <FormLabel>{t.labelHeroPrimaryBtn}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderHeroPrimaryBtn} data-testid="input-hero-primary-button" />
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
                        <FormLabel>{t.labelHeroSecondaryBtn}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderHeroSecondaryBtn} data-testid="input-hero-secondary-button" />
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
                  <CardTitle>{t.cardOfferTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="offerSectionTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelOfferSectionTitle}</FormLabel>
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
                        <FormLabel>{t.labelFeatureDescription}</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder={t.placeholderOfferDescription} rows={2} data-testid="input-offer-description" />
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
                        <FormLabel>{t.labelFeatureTitle}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFeature1Title} data-testid="input-feature1-title" />
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
                        <FormLabel>{t.labelFeatureDescription}</FormLabel>
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
                        <FormLabel>{t.labelFeatureIcon}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFeature1Icon} data-testid="input-feature1-icon" />
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
                        <FormLabel>{t.labelFeatureTitle}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFeature2Title} data-testid="input-feature2-title" />
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
                        <FormLabel>{t.labelFeatureDescription}</FormLabel>
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
                        <FormLabel>{t.labelFeatureIcon}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFeature2Icon} data-testid="input-feature2-icon" />
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
                        <FormLabel>{t.labelFeatureTitle}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFeature3Title} data-testid="input-feature3-title" />
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
                        <FormLabel>{t.labelFeatureDescription}</FormLabel>
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
                        <FormLabel>{t.labelFeatureIcon}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFeature3Icon} data-testid="input-feature3-icon" />
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
                  <CardTitle>{t.cardFeaturedAuthorsTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="featuredSectionTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelFeatureTitle}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFeaturedTitle} data-testid="input-featured-title" />
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
                        <FormLabel>{t.labelFeatureDescription}</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder={t.placeholderFeaturedDescription} rows={3} data-testid="input-featured-description" />
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
                  <CardTitle>{t.cardFooterTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Logo del Footer</FormLabel>
                    {form.watch("footerLogoUrl") && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <img 
                          src={form.watch("footerLogoUrl")} 
                          alt="Footer logo preview" 
                          className="h-10 object-contain"
                          data-testid="img-footer-logo-preview"
                        />
                      </div>
                    )}
                    <FileUploader
                      onComplete={(result) => handleFileUploadComplete("footerLogoUrl", result)}
                      allowedFileTypes={["image/png", "image/jpeg", "image/svg+xml"]}
                      maxFileSize={2 * 1024 * 1024}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Logo Footer
                    </FileUploader>
                    <FormField
                      control={form.control}
                      name="footerLogoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL del Logo Footer</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="URL del logo para el pie de página" data-testid="input-footer-logo-url" />
                          </FormControl>
                          <FormDescription>
                            Logo que aparece en el pie de página del sitio
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="footerDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelFeatureDescription}</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder={t.placeholderFooterDescription} rows={3} data-testid="input-footer-description" />
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
                        <FormLabel>{t.labelFooterEmail}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder={t.placeholderFooterEmail} data-testid="input-footer-email" />
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
                        <FormLabel>{t.labelFooterLocation}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFooterLocation} data-testid="input-footer-location" />
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
                        <FormLabel>{t.labelFooterInstagram}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFooterInstagram} data-testid="input-footer-instagram" />
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
                        <FormLabel>{t.labelFooterTwitter}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFooterTwitter} data-testid="input-footer-twitter" />
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
                        <FormLabel>{t.labelFooterFacebook}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFooterFacebook} data-testid="input-footer-facebook" />
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
                        <FormLabel>{t.labelFooterCopyright}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderFooterCopyright} data-testid="input-footer-copyright" />
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
                  <CardTitle>{t.cardSeoTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelSeoTitle}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderSeoTitle} data-testid="input-seo-title" />
                        </FormControl>
                        <FormDescription>{t.descSeoTitle}</FormDescription>
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
                          <Textarea {...field} placeholder={t.placeholderSeoDescription} rows={3} data-testid="input-seo-description" />
                        </FormControl>
                        <FormDescription>{t.descSeoDescription}</FormDescription>
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
                          <Input {...field} placeholder={t.placeholderSeoKeywords} data-testid="input-seo-keywords" />
                        </FormControl>
                        <FormDescription>{t.descSeoKeywords}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paypal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.cardCurrencyTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelCurrency}</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("currencySymbol", getCurrencySymbol(value));
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue placeholder={t.placeholderCurrency} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">{t.currencyUsd}</SelectItem>
                            <SelectItem value="EUR">{t.currencyEur}</SelectItem>
                            <SelectItem value="MXN">{t.currencyMxn}</SelectItem>
                            <SelectItem value="ARS">{t.currencyArs}</SelectItem>
                            <SelectItem value="COP">{t.currencyCop}</SelectItem>
                            <SelectItem value="CLP">{t.currencyClp}</SelectItem>
                            <SelectItem value="PEN">{t.currencyPen}</SelectItem>
                            <SelectItem value="BRL">{t.currencyBrl}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t.descCurrency}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currencySymbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelCurrencySymbol}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderCurrencySymbol} data-testid="input-currency-symbol" />
                        </FormControl>
                        <FormDescription>
                          {t.descCurrencySymbol}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.cardPaypalTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paypalClientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelPaypalClientId}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderPaypalClientId} data-testid="input-paypal-client-id" />
                        </FormControl>
                        <FormDescription>
                          {t.descPaypalClientId}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paypalClientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelPaypalClientSecret}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder={t.placeholderPaypalClientSecret} data-testid="input-paypal-client-secret" />
                        </FormControl>
                        <FormDescription>
                          {t.descPaypalClientSecret}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paypalEnvironment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelPaypalEnvironment}</FormLabel>
                        <FormControl>
                          <select 
                            {...field} 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            data-testid="select-paypal-environment"
                          >
                            <option value="sandbox">{t.paypalEnvSandbox}</option>
                            <option value="production">{t.paypalEnvProduction}</option>
                          </select>
                        </FormControl>
                        <FormDescription>
                          {t.descPaypalEnvironment}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.cardEmailNewsletterTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emailNewsletterProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailProvider}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-email-newsletter-provider">
                              <SelectValue placeholder={t.placeholderEmailProvider} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Resend">Resend</SelectItem>
                            <SelectItem value="SendGrid">SendGrid</SelectItem>
                            <SelectItem value="Mailchimp">Mailchimp</SelectItem>
                            <SelectItem value="Brevo">Brevo</SelectItem>
                            <SelectItem value="Postmark">Postmark</SelectItem>
                            <SelectItem value="Mailgun">Mailgun</SelectItem>
                            <SelectItem value="Gmail">Gmail</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t.descEmailProvider}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("emailNewsletterProvider") && (
                    <EmailProviderInstructions
                      provider={form.watch("emailNewsletterProvider")}
                      instructionsTitle={t.emailInstructionsTitle}
                      instructionsLink={t.emailInstructionsLink}
                      providerSteps={emailProviderSteps}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="emailNewsletterApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailApiKey}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder={t.placeholderEmailApiKey} data-testid="input-email-newsletter-api-key" />
                        </FormControl>
                        <FormDescription>{t.descEmailApiKey}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailNewsletterFromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailFromName}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderEmailFromName} data-testid="input-email-newsletter-from-name" />
                        </FormControl>
                        <FormDescription>{t.descEmailFromName}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailNewsletterFromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailFromEmail}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder={t.placeholderEmailFromEmail} data-testid="input-email-newsletter-from-email" />
                        </FormControl>
                        <FormDescription>{t.descEmailFromEmail}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.cardEmailDigitalTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emailDigitalProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailProvider}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-email-digital-provider">
                              <SelectValue placeholder={t.placeholderEmailProvider} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Resend">Resend</SelectItem>
                            <SelectItem value="SendGrid">SendGrid</SelectItem>
                            <SelectItem value="Mailchimp">Mailchimp</SelectItem>
                            <SelectItem value="Brevo">Brevo</SelectItem>
                            <SelectItem value="Postmark">Postmark</SelectItem>
                            <SelectItem value="Mailgun">Mailgun</SelectItem>
                            <SelectItem value="Gmail">Gmail</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t.descEmailProvider}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("emailDigitalProvider") && (
                    <EmailProviderInstructions
                      provider={form.watch("emailDigitalProvider")}
                      instructionsTitle={t.emailInstructionsTitle}
                      instructionsLink={t.emailInstructionsLink}
                      providerSteps={emailProviderSteps}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="emailDigitalApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailApiKey}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder={t.placeholderEmailApiKey} data-testid="input-email-digital-api-key" />
                        </FormControl>
                        <FormDescription>{t.descEmailApiKey}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailDigitalFromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailFromName}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderEmailFromName} data-testid="input-email-digital-from-name" />
                        </FormControl>
                        <FormDescription>{t.descEmailFromName}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailDigitalFromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailFromEmail}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder={t.placeholderEmailFromEmail} data-testid="input-email-digital-from-email" />
                        </FormControl>
                        <FormDescription>{t.descEmailFromEmail}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.cardEmailInvoiceTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emailInvoiceProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailProvider}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-email-invoice-provider">
                              <SelectValue placeholder={t.placeholderEmailProvider} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Resend">Resend</SelectItem>
                            <SelectItem value="SendGrid">SendGrid</SelectItem>
                            <SelectItem value="Mailchimp">Mailchimp</SelectItem>
                            <SelectItem value="Brevo">Brevo</SelectItem>
                            <SelectItem value="Postmark">Postmark</SelectItem>
                            <SelectItem value="Mailgun">Mailgun</SelectItem>
                            <SelectItem value="Gmail">Gmail</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t.descEmailProvider}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("emailInvoiceProvider") && (
                    <EmailProviderInstructions
                      provider={form.watch("emailInvoiceProvider")}
                      instructionsTitle={t.emailInstructionsTitle}
                      instructionsLink={t.emailInstructionsLink}
                      providerSteps={emailProviderSteps}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="emailInvoiceApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailApiKey}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder={t.placeholderEmailApiKey} data-testid="input-email-invoice-api-key" />
                        </FormControl>
                        <FormDescription>{t.descEmailApiKey}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailInvoiceFromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailFromName}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.placeholderEmailFromName} data-testid="input-email-invoice-from-name" />
                        </FormControl>
                        <FormDescription>{t.descEmailFromName}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailInvoiceFromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmailFromEmail}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder={t.placeholderEmailFromEmail} data-testid="input-email-invoice-from-email" />
                        </FormControl>
                        <FormDescription>{t.descEmailFromEmail}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Mantenimiento de Base de Datos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Si los textos del panel de administración no se muestran correctamente (aparecen como "admin.editorial_settings.label_name"), 
                      usa este botón para actualizar todos los textos de la interfaz.
                    </p>
                    <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900">
                      <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                        Este proceso insertará aproximadamente 8,000 textos faltantes en la base de datos. 
                        Puede tomar 1-2 minutos. La página se recargará automáticamente al finalizar.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      type="button"
                      onClick={handleSeedTexts}
                      disabled={isSeedingTexts}
                      variant="default"
                      className="w-full sm:w-auto"
                      data-testid="button-seed-texts"
                    >
                      {isSeedingTexts ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Actualizando textos...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4 mr-2" />
                          Actualizar Textos de UI
                        </>
                      )}
                    </Button>
                  </div>
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
              {updateMutation.isPending ? t.buttonSavePending : t.buttonSave}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
