import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save } from "lucide-react";

const LOCALES = [
  { code: "es-ES", name: "Español" },
  { code: "ca-ES", name: "Català" },
  { code: "en-US", name: "English" },
  { code: "fr-FR", name: "Français" },
  { code: "de-DE", name: "Deutsch" },
  { code: "it-IT", name: "Italiano" },
  { code: "pt-PT", name: "Português" }
];

interface TranslationField {
  key: string;
  label: string;
  type: "text" | "textarea";
}

interface TranslationEditorProps {
  entityType: "authors" | "books" | "series" | "testimonials" | "blog-posts";
  entityId: string;
  fields: TranslationField[];
}

export function TranslationEditor({ entityType, entityId, fields }: TranslationEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeLocale, setActiveLocale] = useState("es-ES");

  const { data: translations = [], isLoading } = useQuery({
    queryKey: [`/api/${entityType}/${entityId}/translations`],
    enabled: !!entityId,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/${entityType}/${entityId}/translations`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}/${entityId}/translations`] });
      toast({ title: "Translation saved successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to save translation",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      [`${entityType === "authors" ? "author" : entityType === "books" ? "book" : entityType === "series" ? "series" : entityType === "testimonials" ? "testimonial" : "blogPost"}Id`]: entityId,
      locale: activeLocale
    };
    
    fields.forEach(field => {
      const value = formData.get(field.key) as string;
      if (value) {
        data[field.key] = value;
      }
    });

    mutation.mutate(data);
  };

  const getTranslationForLocale = (locale: string) => {
    return translations.find((t: any) => t.locale === locale);
  };

  const hasTranslation = (locale: string) => {
    const translation = getTranslationForLocale(locale);
    if (!translation) return false;
    return fields.some(field => translation[field.key]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="translation-editor-loading">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const currentTranslation = getTranslationForLocale(activeLocale);

  return (
    <Card data-testid="translation-editor">
      <CardHeader>
        <CardTitle>Translations</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeLocale} onValueChange={setActiveLocale}>
          <TabsList className="grid grid-cols-7 w-full">
            {LOCALES.map(locale => (
              <TabsTrigger 
                key={locale.code} 
                value={locale.code}
                className="relative"
                data-testid={`locale-tab-${locale.code}`}
              >
                {locale.name}
                {!hasTranslation(locale.code) && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 text-xs"
                    data-testid={`badge-missing-${locale.code}`}
                  >
                    Missing
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {LOCALES.map(locale => (
            <TabsContent key={locale.code} value={locale.code} className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`${locale.code}-${field.key}`}>
                      {field.label}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={`${locale.code}-${field.key}`}
                        name={field.key}
                        defaultValue={currentTranslation?.[field.key] || ""}
                        rows={4}
                        data-testid={`input-${field.key}-${locale.code}`}
                      />
                    ) : (
                      <Input
                        id={`${locale.code}-${field.key}`}
                        name={field.key}
                        defaultValue={currentTranslation?.[field.key] || ""}
                        data-testid={`input-${field.key}-${locale.code}`}
                      />
                    )}
                  </div>
                ))}
                
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  data-testid={`button-save-${locale.code}`}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save {locale.name} Translation
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
