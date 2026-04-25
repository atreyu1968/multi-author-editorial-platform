import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Save, Upload, ExternalLink, Info } from "lucide-react";
import { useAdminAuthor } from "@/contexts/admin-author-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SiteSettings, Newsletter } from "@shared/schema";
import { FileUploader } from "@/components/FileUploader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUiText } from "@/contexts/ui-text-context";
import { AVAILABLE_LOCALES, type Locale } from "@/contexts/locale-context";

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
  defaultLocale: string;
  autoDetectLocale: boolean;
}

interface EmailProviderInstructionsProps {
  provider: string;
  instructionsTitle: string;
  instructionsLink: string;
  providerSteps: Record<string, string[]>;
}

function EmailProviderInstructions({ provider, instructionsTitle, instructionsLink, providerSteps }: EmailProviderInstructionsProps) {
  const instructions: Record<string, { url: string }> = {
    "Resend": {
      url: "https://resend.com/api-keys"
    },
    "SendGrid": {
      url: "https://app.sendgrid.com/settings/api_keys"
    },
    "Mailchimp": {
      url: "https://mandrillapp.com/settings/index"
    },
    "Brevo": {
      url: "https://app.brevo.com/settings/keys/api"
    },
    "Postmark": {
      url: "https://account.postmarkapp.com/servers"
    },
    "Mailgun": {
      url: "https://app.mailgun.com/app/account/security/api_keys"
    }
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

export default function SettingsManagement() {
  const { selectedAuthorId } = useAdminAuthor();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const t = {
    pageTitleMain: useUiText("admin.settings", "page_title_main", "Configuración"),
    pageTitle: useUiText("admin.settings", "page_title", "Configuración del Autor"),
    tabGeneral: useUiText("admin.settings", "tab_general", "General"),
    tabAppearance: useUiText("admin.settings", "tab_appearance", "Apariencia"),
    tabSocial: useUiText("admin.settings", "tab_social", "Redes"),
    tabNewsletter: useUiText("admin.settings", "tab_newsletter", "Newsletter"),
    tabStats: useUiText("admin.settings", "tab_stats", "Estadísticas"),
    cardGeneralTitle: useUiText("admin.settings", "card_general_title"),
    labelHeroTitle: useUiText("admin.settings", "label_hero_title"),
    labelHeroSubtitle: useUiText("admin.settings", "label_hero_subtitle"),
    labelContactEmail: useUiText("admin.settings", "label_contact_email"),
    buttonSaveGeneralPending: useUiText("admin.settings", "button_save_general_pending"),
    buttonSaveGeneral: useUiText("admin.settings", "button_save_general"),
    cardLogoFaviconTitle: useUiText("admin.settings", "card_logo_favicon_title"),
    headingLogo: useUiText("admin.settings", "heading_logo"),
    descLogoHeader: useUiText("admin.settings", "desc_logo_header"),
    altLogoPreview: useUiText("admin.settings", "alt_logo_preview"),
    buttonUploadLogo: useUiText("admin.settings", "button_upload_logo"),
    labelLogoUrl: useUiText("admin.settings", "label_logo_url"),
    placeholderLogoUrl: useUiText("admin.settings", "placeholder_logo_url"),
    descLogoUrl: useUiText("admin.settings", "desc_logo_url"),
    headingFavicon: useUiText("admin.settings", "heading_favicon"),
    descFaviconHeader: useUiText("admin.settings", "desc_favicon_header"),
    altFaviconPreview: useUiText("admin.settings", "alt_favicon_preview"),
    textFaviconPreview: useUiText("admin.settings", "text_favicon_preview"),
    buttonUploadFavicon: useUiText("admin.settings", "button_upload_favicon"),
    labelFaviconUrl: useUiText("admin.settings", "label_favicon_url"),
    placeholderFaviconUrl: useUiText("admin.settings", "placeholder_favicon_url"),
    descFaviconUrl: useUiText("admin.settings", "desc_favicon_url"),
    buttonSaveAppearancePending: useUiText("admin.settings", "button_save_appearance_pending"),
    buttonSaveAppearance: useUiText("admin.settings", "button_save_appearance"),
    cardColorsTitle: useUiText("admin.settings", "card_colors_title"),
    descColorsHeader: useUiText("admin.settings", "desc_colors_header"),
    labelPrimaryColor: useUiText("admin.settings", "label_primary_color"),
    placeholderPrimaryColor: useUiText("admin.settings", "placeholder_primary_color"),
    descPrimaryColor: useUiText("admin.settings", "desc_primary_color"),
    labelSecondaryColor: useUiText("admin.settings", "label_secondary_color"),
    placeholderSecondaryColor: useUiText("admin.settings", "placeholder_secondary_color"),
    descSecondaryColor: useUiText("admin.settings", "desc_secondary_color"),
    labelAccentColor: useUiText("admin.settings", "label_accent_color"),
    placeholderAccentColor: useUiText("admin.settings", "placeholder_accent_color"),
    descAccentColor: useUiText("admin.settings", "desc_accent_color"),
    labelBgColor: useUiText("admin.settings", "label_bg_color"),
    placeholderBgColor: useUiText("admin.settings", "placeholder_bg_color"),
    descBgColor: useUiText("admin.settings", "desc_bg_color"),
    labelTextColor: useUiText("admin.settings", "label_text_color"),
    placeholderTextColor: useUiText("admin.settings", "placeholder_text_color"),
    descTextColor: useUiText("admin.settings", "desc_text_color"),
    buttonSaveColorsPending: useUiText("admin.settings", "button_save_colors_pending"),
    buttonSaveColors: useUiText("admin.settings", "button_save_colors"),
    cardSocialTitle: useUiText("admin.settings", "card_social_title"),
    labelInstagram: useUiText("admin.settings", "label_instagram"),
    placeholderInstagram: useUiText("admin.settings", "placeholder_instagram"),
    labelTwitter: useUiText("admin.settings", "label_twitter"),
    placeholderTwitter: useUiText("admin.settings", "placeholder_twitter"),
    labelFacebook: useUiText("admin.settings", "label_facebook"),
    placeholderFacebook: useUiText("admin.settings", "placeholder_facebook"),
    labelAmazon: useUiText("admin.settings", "label_amazon"),
    placeholderAmazon: useUiText("admin.settings", "placeholder_amazon"),
    buttonSaveSocialPending: useUiText("admin.settings", "button_save_social_pending"),
    buttonSaveSocial: useUiText("admin.settings", "button_save_social"),
    cardNewsletterTitle: useUiText("admin.settings", "card_newsletter_title"),
    headingFreeBook: useUiText("admin.settings", "heading_free_book"),
    labelFreeBookTitle: useUiText("admin.settings", "label_free_book_title"),
    placeholderFreeBookTitle: useUiText("admin.settings", "placeholder_free_book_title"),
    descFreeBookTitle: useUiText("admin.settings", "desc_free_book_title"),
    labelFreeBookFile: useUiText("admin.settings", "label_free_book_file"),
    placeholderFreeBookFile: useUiText("admin.settings", "placeholder_free_book_file"),
    buttonUploadFile: useUiText("admin.settings", "button_upload_file"),
    descFreeBookFile: useUiText("admin.settings", "desc_free_book_file"),
    labelBookFormat: useUiText("admin.settings", "label_book_format"),
    formatEpub: useUiText("admin.settings", "format_epub"),
    formatAzw3: useUiText("admin.settings", "format_azw3", "AZW3"),
    labelBookDescription: useUiText("admin.settings", "label_book_description"),
    placeholderBookDescription: useUiText("admin.settings", "placeholder_book_description"),
    descBookDescription: useUiText("admin.settings", "desc_book_description"),
    headingEmailConfig: useUiText("admin.settings", "heading_email_config"),
    labelEmailProvider: useUiText("admin.settings", "label_email_provider"),
    providerResend: useUiText("admin.settings", "provider_resend"),
    providerSendgrid: useUiText("admin.settings", "provider_sendgrid"),
    providerMailchimp: useUiText("admin.settings", "provider_mailchimp"),
    providerBrevo: useUiText("admin.settings", "provider_brevo"),
    providerPostmark: useUiText("admin.settings", "provider_postmark"),
    providerMailgun: useUiText("admin.settings", "provider_mailgun"),
    labelEmailFromName: useUiText("admin.settings", "label_email_from_name"),
    placeholderEmailFromName: useUiText("admin.settings", "placeholder_email_from_name"),
    descEmailFromName: useUiText("admin.settings", "desc_email_from_name"),
    labelEmailFromAddress: useUiText("admin.settings", "label_email_from_address"),
    placeholderEmailFromAddress: useUiText("admin.settings", "placeholder_email_from_address"),
    descEmailFromAddress: useUiText("admin.settings", "desc_email_from_address"),
    buttonSaveNewsletterPending: useUiText("admin.settings", "button_save_newsletter_pending"),
    buttonSaveNewsletter: useUiText("admin.settings", "button_save_newsletter"),
    cardStatsTitle: useUiText("admin.settings", "card_stats_title"),
    labelTotalSubscribers: useUiText("admin.settings", "label_total_subscribers"),
    labelMonthlySubscribers: useUiText("admin.settings", "label_monthly_subscribers"),
    cardRecentSubscribersTitle: useUiText("admin.settings", "card_recent_subscribers_title"),
    emptySubscribers: useUiText("admin.settings", "empty_subscribers"),
    labelDateUnavailable: useUiText("admin.settings", "label_date_unavailable"),
    toastPartialSaveTitle: useUiText("admin.settings", "toast_partial_save_title"),
    toastPartialSaveDescription: useUiText("admin.settings", "toast_partial_save_description"),
    toastSuccessTitle: useUiText("admin.settings", "toast_success_title"),
    toastSuccessDescription: useUiText("admin.settings", "toast_success_description"),
    toastErrorTitle: useUiText("admin.settings", "toast_error_title"),
    toastErrorDescription: useUiText("admin.settings", "toast_error_description"),
    toastFileUploadTitle: useUiText("admin.settings", "toast_file_upload_title"),
    toastFileUploadDescription: useUiText("admin.settings", "toast_file_upload_description"),
    toastFileUploadErrorTitle: useUiText("admin.settings", "toast_file_upload_error_title"),
    toastFileUploadErrorDescription: useUiText("admin.settings", "toast_file_upload_error_description"),
    emailInstructionsTitle: useUiText("admin.settings", "email_instructions_title"),
    emailInstructionsLink: useUiText("admin.settings", "email_instructions_link"),
    providerResendStep1: useUiText("admin.settings", "provider_resend_step_1"),
    providerResendStep2: useUiText("admin.settings", "provider_resend_step_2"),
    providerResendStep3: useUiText("admin.settings", "provider_resend_step_3"),
    providerResendStep4: useUiText("admin.settings", "provider_resend_step_4"),
    providerResendStep5: useUiText("admin.settings", "provider_resend_step_5"),
    providerResendStep6: useUiText("admin.settings", "provider_resend_step_6"),
    providerSendgridStep1: useUiText("admin.settings", "provider_sendgrid_step_1"),
    providerSendgridStep2: useUiText("admin.settings", "provider_sendgrid_step_2"),
    providerSendgridStep3: useUiText("admin.settings", "provider_sendgrid_step_3"),
    providerSendgridStep4: useUiText("admin.settings", "provider_sendgrid_step_4"),
    providerSendgridStep5: useUiText("admin.settings", "provider_sendgrid_step_5"),
    providerSendgridStep6: useUiText("admin.settings", "provider_sendgrid_step_6"),
    providerMailchimpStep1: useUiText("admin.settings", "provider_mailchimp_step_1"),
    providerMailchimpStep2: useUiText("admin.settings", "provider_mailchimp_step_2"),
    providerMailchimpStep3: useUiText("admin.settings", "provider_mailchimp_step_3"),
    providerMailchimpStep4: useUiText("admin.settings", "provider_mailchimp_step_4"),
    providerMailchimpStep5: useUiText("admin.settings", "provider_mailchimp_step_5"),
    providerMailchimpStep6: useUiText("admin.settings", "provider_mailchimp_step_6"),
    providerMailchimpStep7: useUiText("admin.settings", "provider_mailchimp_step_7"),
    providerBrevoStep1: useUiText("admin.settings", "provider_brevo_step_1"),
    providerBrevoStep2: useUiText("admin.settings", "provider_brevo_step_2"),
    providerBrevoStep3: useUiText("admin.settings", "provider_brevo_step_3"),
    providerBrevoStep4: useUiText("admin.settings", "provider_brevo_step_4"),
    providerBrevoStep5: useUiText("admin.settings", "provider_brevo_step_5"),
    providerBrevoStep6: useUiText("admin.settings", "provider_brevo_step_6"),
    providerPostmarkStep1: useUiText("admin.settings", "provider_postmark_step_1"),
    providerPostmarkStep2: useUiText("admin.settings", "provider_postmark_step_2"),
    providerPostmarkStep3: useUiText("admin.settings", "provider_postmark_step_3"),
    providerPostmarkStep4: useUiText("admin.settings", "provider_postmark_step_4"),
    providerPostmarkStep5: useUiText("admin.settings", "provider_postmark_step_5"),
    providerPostmarkStep6: useUiText("admin.settings", "provider_postmark_step_6"),
    providerMailgunStep1: useUiText("admin.settings", "provider_mailgun_step_1"),
    providerMailgunStep2: useUiText("admin.settings", "provider_mailgun_step_2"),
    providerMailgunStep3: useUiText("admin.settings", "provider_mailgun_step_3"),
    providerMailgunStep4: useUiText("admin.settings", "provider_mailgun_step_4"),
    providerMailgunStep5: useUiText("admin.settings", "provider_mailgun_step_5"),
    providerMailgunStep6: useUiText("admin.settings", "provider_mailgun_step_6"),
    providerMailgunStep7: useUiText("admin.settings", "provider_mailgun_step_7"),
    tabLanguage: useUiText("admin.settings", "tab_language", "Idioma"),
    cardLanguageTitle: useUiText("admin.settings", "card_language_title"),
    labelDefaultLocale: useUiText("admin.settings", "label_default_locale"),
    descDefaultLocale: useUiText("admin.settings", "desc_default_locale"),
    labelAutoDetect: useUiText("admin.settings", "label_auto_detect"),
    descAutoDetect: useUiText("admin.settings", "desc_auto_detect"),
    buttonSaveLanguagePending: useUiText("admin.settings", "button_save_language_pending"),
    buttonSaveLanguage: useUiText("admin.settings", "button_save_language"),
  };

  const { data: settings = [] } = useQuery<SiteSettings[]>({
    queryKey: selectedAuthorId ? ["/api/settings", { authorId: selectedAuthorId }] : ["/api/settings"],
    enabled: !!selectedAuthorId,
  });

  const { data: subscribers = [] } = useQuery<Newsletter[]>({
    queryKey: ["/api/newsletter", { authorId: selectedAuthorId }],
    enabled: !!selectedAuthorId,
  });

  const form = useForm<SettingsFormData>({
    defaultValues: {
      heroTitle: "",
      heroSubtitle: "",
      contactEmail: "",
      freeBookTitle: "Primeros Encuentros",
      freeBookFile: "",
      freeBookFormat: "EPUB",
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
      textColor: "#1f2937",
      defaultLocale: "es-ES",
      autoDetectLocale: true
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
        freeBookFormat: settingsMap.freeBookFormat || "EPUB",
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
        textColor: settingsMap.textColor || "#1f2937",
        defaultLocale: settings[0]?.defaultLocale || "es-ES",
        autoDetectLocale: settings[0]?.autoDetectLocale ?? true
      });
    }
  }, [settings]);

  const createUpdateMutation = (settingsToUpdate: string[]) => useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const filteredData = Object.entries(data)
        .filter(([key]) => settingsToUpdate.includes(key));
      
      const results = await Promise.allSettled(
        filteredData.map(async ([key, value]) => {
          try {
            const apiValue = (key === 'autoDetectLocale') ? value : (value != null ? String(value) : '');
            const response = await apiRequest("PUT", `/api/settings/${key}`, { value: apiValue, authorId: selectedAuthorId });
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
          title: t.toastPartialSaveTitle,
          description: t.toastPartialSaveDescription.replace("{successes}", String(successes.length)).replace("{failures}", String(failures.length)),
          variant: "destructive",
        });
      } else {
        toast({
          title: t.toastSuccessTitle,
          description: t.toastSuccessDescription,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: selectedAuthorId ? ["/api/settings", { authorId: selectedAuthorId }] : ["/api/settings"] });
    },
    onError: () => {
      toast({
        title: t.toastErrorTitle,
        description: t.toastErrorDescription,
        variant: "destructive",
      });
    },
  });

  const updateGeneralSettingsMutation = createUpdateMutation([
    'heroTitle', 'heroSubtitle', 'contactEmail', 'freeBookTitle', 'freeBookFile', 
    'freeBookFormat', 'freeBookDescription', 'emailProvider', 'emailFromName', 'emailFromAddress'
  ]);

  const updateAppearanceMutation = createUpdateMutation(['logoUrl', 'faviconUrl']);
  
  const updateColorsMutation = createUpdateMutation([
    'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor'
  ]);

  const updateSocialMutation = createUpdateMutation([
    'instagramUrl', 'twitterUrl', 'facebookUrl', 'amazonUrl'
  ]);

  const updateLanguageMutation = createUpdateMutation([
    'defaultLocale', 'autoDetectLocale'
  ]);

  const onSubmit = (data: SettingsFormData) => {
    updateGeneralSettingsMutation.mutate(data);
  };

  const onSubmitAppearance = (data: SettingsFormData) => {
    updateAppearanceMutation.mutate(data);
  };

  const onSubmitColors = (data: SettingsFormData) => {
    updateColorsMutation.mutate(data);
  };

  const onSubmitSocial = (data: SettingsFormData) => {
    updateSocialMutation.mutate(data);
  };

  const onSubmitLanguage = (data: SettingsFormData) => {
    updateLanguageMutation.mutate(data);
  };

  const handleFileUploadComplete = (fieldName: string, result: { url: string; objectPath: string }) => {
    form.setValue(fieldName as keyof SettingsFormData, result.objectPath);
    toast({
      title: t.toastFileUploadTitle,
      description: t.toastFileUploadDescription,
    });
  };

  const providerSteps: Record<string, string[]> = {
    "Resend": [
      t.providerResendStep1,
      t.providerResendStep2,
      t.providerResendStep3,
      t.providerResendStep4,
      t.providerResendStep5,
      t.providerResendStep6
    ],
    "SendGrid": [
      t.providerSendgridStep1,
      t.providerSendgridStep2,
      t.providerSendgridStep3,
      t.providerSendgridStep4,
      t.providerSendgridStep5,
      t.providerSendgridStep6
    ],
    "Mailchimp": [
      t.providerMailchimpStep1,
      t.providerMailchimpStep2,
      t.providerMailchimpStep3,
      t.providerMailchimpStep4,
      t.providerMailchimpStep5,
      t.providerMailchimpStep6,
      t.providerMailchimpStep7
    ],
    "Brevo": [
      t.providerBrevoStep1,
      t.providerBrevoStep2,
      t.providerBrevoStep3,
      t.providerBrevoStep4,
      t.providerBrevoStep5,
      t.providerBrevoStep6
    ],
    "Postmark": [
      t.providerPostmarkStep1,
      t.providerPostmarkStep2,
      t.providerPostmarkStep3,
      t.providerPostmarkStep4,
      t.providerPostmarkStep5,
      t.providerPostmarkStep6
    ],
    "Mailgun": [
      t.providerMailgunStep1,
      t.providerMailgunStep2,
      t.providerMailgunStep3,
      t.providerMailgunStep4,
      t.providerMailgunStep5,
      t.providerMailgunStep6,
      t.providerMailgunStep7
    ]
  };

  return (
    <div>
      <h3 className="text-3xl font-bold text-primary mb-6">{t.pageTitleMain}</h3>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" data-testid="tab-general">{t.tabGeneral}</TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">{t.tabAppearance}</TabsTrigger>
          <TabsTrigger value="social" data-testid="tab-social">{t.tabSocial}</TabsTrigger>
          <TabsTrigger value="language" data-testid="tab-language">{t.tabLanguage}</TabsTrigger>
          <TabsTrigger value="newsletter" data-testid="tab-newsletter">{t.tabNewsletter}</TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats">{t.tabStats}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t.cardGeneralTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="general-settings-form">
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
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelContactEmail}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-contact-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateGeneralSettingsMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-save-general"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateGeneralSettingsMutation.isPending ? t.buttonSaveGeneralPending : t.buttonSaveGeneral}
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
                <CardTitle>{t.cardLogoFaviconTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitAppearance)} className="space-y-6" data-testid="appearance-settings-form">
                    <div className="space-y-4">
                      <h4 className="font-medium">{t.headingLogo}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t.descLogoHeader}
                      </p>
                      {form.watch("logoUrl") && (
                        <div className="border rounded-lg p-4 bg-muted/50">
                          <img 
                            src={form.watch("logoUrl")} 
                            alt={t.altLogoPreview} 
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
                        {t.buttonUploadLogo}
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
                    </div>

                    <div className="space-y-4 pt-6 border-t">
                      <h4 className="font-medium">{t.headingFavicon}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t.descFaviconHeader}
                      </p>
                      {form.watch("faviconUrl") && (
                        <div className="border rounded-lg p-4 bg-muted/50 flex items-center gap-4">
                          <img 
                            src={form.watch("faviconUrl")} 
                            alt={t.altFaviconPreview} 
                            className="w-8 h-8 object-contain"
                          />
                          <span className="text-sm text-muted-foreground">{t.textFaviconPreview}</span>
                        </div>
                      )}
                      <FileUploader
                        onComplete={(result) => handleFileUploadComplete("faviconUrl", result)}
                        allowedFileTypes={["image/png", "image/x-icon", "image/vnd.microsoft.icon"]}
                        maxFileSize={100 * 1024}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t.buttonUploadFavicon}
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
                    </div>

                    <Button 
                      type="submit" 
                      disabled={updateAppearanceMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-save-appearance"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateAppearanceMutation.isPending ? t.buttonSaveGeneralPending : t.buttonSaveAppearance}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.cardColorsTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitColors)} className="space-y-4" data-testid="colors-settings-form">
                    <p className="text-sm text-muted-foreground mb-4">
                      {t.descColorsHeader}
                    </p>
                    
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelPrimaryColor}</FormLabel>
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
                            {t.descPrimaryColor}
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
                          <FormLabel>{t.labelSecondaryColor}</FormLabel>
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
                            {t.descSecondaryColor}
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
                          <FormLabel>{t.labelAccentColor}</FormLabel>
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
                            {t.descAccentColor}
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
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-20 h-10" data-testid="input-background-color" />
                            </FormControl>
                            <Input 
                              type="text" 
                              value={field.value} 
                              onChange={field.onChange}
                              className="flex-1"
                              placeholder="#ffffff"
                            />
                          </div>
                          <FormDescription>
                            {t.descBgColor}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="textColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelTextColor}</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-20 h-10" data-testid="input-text-color" />
                            </FormControl>
                            <Input 
                              type="text" 
                              value={field.value} 
                              onChange={field.onChange}
                              className="flex-1"
                              placeholder="#1f2937"
                            />
                          </div>
                          <FormDescription>
                            {t.descTextColor}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={updateColorsMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-save-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateColorsMutation.isPending ? t.buttonSaveGeneralPending : t.buttonSaveColors}
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
              <CardTitle>{t.cardSocialTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="social-settings-form">
                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelInstagram}</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder={t.placeholderInstagram} 
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
                        <FormLabel>{t.labelTwitter}</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder={t.placeholderTwitter} 
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
                        <FormLabel>{t.labelFacebook}</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder={t.placeholderFacebook} 
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
                        <FormLabel>{t.labelAmazon}</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder={t.placeholderAmazon} 
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
                    disabled={updateSocialMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-save-social"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSocialMutation.isPending ? t.buttonSaveGeneralPending : t.buttonSaveSocial}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>{t.cardLanguageTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitLanguage)} className="space-y-4" data-testid="language-settings-form">
                  <FormField
                    control={form.control}
                    name="defaultLocale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelDefaultLocale}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-default-locale">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AVAILABLE_LOCALES.map((locale) => (
                              <SelectItem key={locale.code} value={locale.code}>
                                {locale.flag} {locale.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t.descDefaultLocale}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoDetectLocale"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t.labelAutoDetect}</FormLabel>
                          <FormDescription>
                            {t.descAutoDetect}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-auto-detect"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateLanguageMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-save-language"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateLanguageMutation.isPending ? t.buttonSaveLanguagePending : t.buttonSaveLanguage}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="newsletter">
          <Card>
            <CardHeader>
              <CardTitle>{t.cardNewsletterTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="newsletter-settings-form">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">{t.headingFreeBook}</h4>
                    
                    <FormField
                      control={form.control}
                      name="freeBookTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelFreeBookTitle}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t.placeholderFreeBookTitle} data-testid="input-free-book-title" />
                          </FormControl>
                          <FormDescription>
                            {t.descFreeBookTitle}
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
                          <FormLabel>{t.labelFreeBookFile}</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder={t.placeholderFreeBookFile}
                                {...field}
                                value={field.value || ""} 
                                className="flex-1"
                                data-testid="input-free-book-file"
                              />
                            </FormControl>
                            <FileUploader
                              onComplete={(result) => handleFileUploadComplete("freeBookFile", result)}
                              allowedFileTypes={['application/epub+zip', 'application/vnd.amazon.ebook', 'application/octet-stream']}
                              maxFileSize={10485760}
                              buttonClassName="shrink-0"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {t.buttonUploadFile}
                            </FileUploader>
                          </div>
                          <FormDescription>
                            {t.descFreeBookFile}
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
                          <FormLabel>{t.labelBookFormat}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-book-format">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EPUB">{t.formatEpub}</SelectItem>
                              <SelectItem value="AZW3">{t.formatAzw3}</SelectItem>
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
                          <FormLabel>{t.labelBookDescription}</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder={t.placeholderBookDescription}
                              rows={3}
                              data-testid="textarea-book-description"
                            />
                          </FormControl>
                          <FormDescription>
                            {t.descBookDescription}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-semibold text-lg">{t.headingEmailConfig}</h4>
                    
                    <FormField
                      control={form.control}
                      name="emailProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelEmailProvider}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-email-provider">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Resend">{t.providerResend}</SelectItem>
                              <SelectItem value="SendGrid">{t.providerSendgrid}</SelectItem>
                              <SelectItem value="Mailchimp">{t.providerMailchimp}</SelectItem>
                              <SelectItem value="Brevo">{t.providerBrevo}</SelectItem>
                              <SelectItem value="Postmark">{t.providerPostmark}</SelectItem>
                              <SelectItem value="Mailgun">{t.providerMailgun}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Instrucciones dinámicas según el proveedor */}
                    <EmailProviderInstructions 
                      provider={form.watch("emailProvider")} 
                      instructionsTitle={t.emailInstructionsTitle}
                      instructionsLink={t.emailInstructionsLink}
                      providerSteps={providerSteps}
                    />

                    <FormField
                      control={form.control}
                      name="emailFromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelEmailFromName}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t.placeholderEmailFromName} data-testid="input-email-from-name" />
                          </FormControl>
                          <FormDescription>
                            {t.descEmailFromName}
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
                          <FormLabel>{t.labelEmailFromAddress}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder={t.placeholderEmailFromAddress} data-testid="input-email-from-address" />
                          </FormControl>
                          <FormDescription>
                            {t.descEmailFromAddress}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateGeneralSettingsMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-save-newsletter"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateGeneralSettingsMutation.isPending ? t.buttonSaveGeneralPending : t.buttonSaveGeneral}
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
                <CardTitle>{t.cardStatsTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-semibold">{t.labelTotalSubscribers}</span>
                    <span className="text-2xl font-bold text-primary" data-testid="stat-total-subscribers">
                      {subscribers.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-semibold">{t.labelMonthlySubscribers}</span>
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
                <CardTitle>{t.cardRecentSubscribersTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                {subscribers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4" data-testid="no-subscribers-message">
                    {t.emptySubscribers}
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
                            {subscriber.subscribedAt ? new Date(subscriber.subscribedAt).toLocaleDateString() : t.labelDateUnavailable}
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
