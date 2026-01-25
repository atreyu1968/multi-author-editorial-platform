import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, BookOpen, Upload } from "lucide-react";
import { useAdminAuthor } from "@/contexts/admin-author-context";
import { useUiText } from "@/contexts/ui-text-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookSeriesSchema } from "@shared/schema";
import { z } from "zod";
import type { BookSeries, Book } from "@shared/schema";
import { FileUploader } from "@/components/FileUploader";

type SeriesFormData = z.infer<typeof insertBookSeriesSchema>;

export default function SeriesManagement() {
  const { selectedAuthorId } = useAdminAuthor();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<BookSeries | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const t = {
    // Toast Messages - Create
    toastCreateTitle: useUiText("admin.series", "toast_create_title", "Serie creada"),
    toastCreateDescription: useUiText("admin.series", "toast_create_description", "La serie ha sido creada exitosamente."),
    toastCreateErrorTitle: useUiText("admin.series", "toast_create_error_title", "Error"),
    toastCreateErrorDescription: useUiText("admin.series", "toast_create_error_description", "No se pudo crear la serie."),
    // Toast Messages - Update
    toastUpdateTitle: useUiText("admin.series", "toast_update_title", "Serie actualizada"),
    toastUpdateDescription: useUiText("admin.series", "toast_update_description", "La serie ha sido actualizada exitosamente."),
    toastUpdateErrorTitle: useUiText("admin.series", "toast_update_error_title", "Error"),
    toastUpdateErrorDescription: useUiText("admin.series", "toast_update_error_description", "No se pudo actualizar la serie."),
    // Toast Messages - Delete
    toastDeleteTitle: useUiText("admin.series", "toast_delete_title", "Serie eliminada"),
    toastDeleteDescription: useUiText("admin.series", "toast_delete_description", "La serie ha sido eliminada exitosamente."),
    toastDeleteErrorTitle: useUiText("admin.series", "toast_delete_error_title", "Error"),
    toastDeleteErrorDescription: useUiText("admin.series", "toast_delete_error_description", "No se pudo eliminar la serie."),
    // Toast Messages - Image Upload
    toastImageUploadTitle: useUiText("admin.series", "toast_image_upload_title", "Imagen subida"),
    toastImageUploadDescription: useUiText("admin.series", "toast_image_upload_description", "La imagen ha sido subida exitosamente."),
    toastImageUploadErrorTitle: useUiText("admin.series", "toast_image_upload_error_title", "Error"),
    toastImageUploadErrorDescription: useUiText("admin.series", "toast_image_upload_error_description", "Error al procesar la imagen subida."),
    // Toast Messages - Validation
    toastCannotDeleteTitle: useUiText("admin.series", "toast_cannot_delete_title", "No se puede eliminar"),
    toastCannotDeleteDescription: useUiText("admin.series", "toast_cannot_delete_description", "No puedes eliminar una serie que tiene libros asociados."),
    // Window Confirm
    confirmDelete: useUiText("admin.series", "confirm_delete", "¿Estás seguro de que quieres eliminar esta serie?"),
    // Page Header
    pageTitle: useUiText("admin.series", "page_title", "Gestión de Series"),
    buttonAddSeries: useUiText("admin.series", "button_add_series", "Nueva Serie"),
    // Empty State
    emptyState: useUiText("admin.series", "empty_state", "No hay series disponibles"),
    // Series Card
    badgeInactive: useUiText("admin.series", "badge_inactive", "Inactiva"),
    booksCount: useUiText("admin.series", "books_count", "libros en esta serie"),
    // Dialog Titles
    dialogTitleEdit: useUiText("admin.series", "dialog_title_edit", "Editar Serie"),
    dialogTitleAdd: useUiText("admin.series", "dialog_title_add", "Nueva Serie"),
    // Tabs
    tabBasicInfo: useUiText("admin.series", "tab_basic_info", "Información Básica"),
    tabLandingPage: useUiText("admin.series", "tab_landing_page", "Landing Page"),
    tabPromo: useUiText("admin.series", "tab_promo", "Contenido Promocional"),
    // Basic Info Tab
    labelTitle: useUiText("admin.series", "label_title", "Título *"),
    placeholderTitle: useUiText("admin.series", "placeholder_title", "Título de la serie"),
    labelDescription: useUiText("admin.series", "label_description", "Descripción *"),
    placeholderDescription: useUiText("admin.series", "placeholder_description", "Descripción de la serie"),
    labelGenre: useUiText("admin.series", "label_genre", "Género *"),
    placeholderGenre: useUiText("admin.series", "placeholder_genre", "Género de la serie"),
    labelAmazonUrl: useUiText("admin.series", "label_amazon_url", "URL de Amazon"),
    placeholderAmazonUrl: useUiText("admin.series", "placeholder_amazon_url", "https://amazon.com/..."),
    labelCardBackgroundImage: useUiText("admin.series", "label_card_background_image", "Imagen de Fondo de Tarjeta (1920×600px, máx 1 MB)"),
    placeholderUrl: useUiText("admin.series", "placeholder_url", "https://... o /objects/..."),
    buttonUpload: useUiText("admin.series", "button_upload", "Subir"),
    descriptionCardBackground: useUiText("admin.series", "description_card_background", "Imagen de fondo para la tarjeta de la serie en la página principal (degradado de izquierda a derecha)"),
    labelIsActive: useUiText("admin.series", "label_is_active", "Serie activa"),
    // Landing Page Tab
    labelLandingHeroImage: useUiText("admin.series", "label_landing_hero_image", "Imagen Hero (1920×600px, máx 1 MB)"),
    descriptionLandingHero: useUiText("admin.series", "description_landing_hero", "Imagen de fondo para la sección hero de la landing page"),
    labelTagline: useUiText("admin.series", "label_tagline", "Eslogan"),
    placeholderTagline: useUiText("admin.series", "placeholder_tagline", "Un eslogan atractivo para la serie..."),
    descriptionTagline: useUiText("admin.series", "description_tagline", "Frase destacada que aparecerá en la landing page"),
    labelWorldDescription: useUiText("admin.series", "label_world_description", "Descripción del Mundo"),
    placeholderWorldDescription: useUiText("admin.series", "placeholder_world_description", "Describe el mundo y ambientación de la serie..."),
    descriptionWorld: useUiText("admin.series", "description_world", "Información sobre el mundo, ambientación o contexto de la serie"),
    labelCharacters: useUiText("admin.series", "label_characters", "Personajes Principales"),
    placeholderCharacters: useUiText("admin.series", "placeholder_characters", "Describe los personajes principales de la serie..."),
    descriptionCharacters: useUiText("admin.series", "description_characters", "Información sobre los personajes principales que aparecen en la serie"),
    labelReadingOrder: useUiText("admin.series", "label_reading_order", "Orden de Lectura"),
    placeholderReadingOrder: useUiText("admin.series", "placeholder_reading_order", "Explica el orden recomendado de lectura..."),
    descriptionReadingOrder: useUiText("admin.series", "description_reading_order", "Guía sobre el orden en que los lectores deben leer los libros"),
    labelThemes: useUiText("admin.series", "label_themes", "Temas Principales"),
    placeholderThemes: useUiText("admin.series", "placeholder_themes", "Un tema por línea..."),
    descriptionThemes: useUiText("admin.series", "description_themes", "Temas o conceptos principales explorados en la serie (uno por línea)"),
    // Customization Section
    sectionCustomization: useUiText("admin.series", "section_customization", "Personalización de Fondo"),
    customizationIntro: useUiText("admin.series", "customization_intro", "Configura el fondo personalizado para la página de la serie."),
    labelBgImageUrl: useUiText("admin.series", "label_bg_image_url", "URL de Imagen de Fondo"),
    descriptionBgImage: useUiText("admin.series", "description_bg_image", "Imagen de fondo para la página de la serie (opcional)"),
    labelBgColor: useUiText("admin.series", "label_bg_color", "Color de Fondo"),
    placeholderBgColor: useUiText("admin.series", "placeholder_bg_color", "#ffffff o rgb(255,255,255)"),
    descriptionBgColor: useUiText("admin.series", "description_bg_color", "Color de fondo para la página de la serie (opcional, se usa si no hay imagen)"),
    // Promo Tab
    promoIntro: useUiText("admin.series", "promo_intro", "Agrega contenido promocional adicional para enriquecer la experiencia de tus lectores. Todos estos campos son opcionales. Usa los switches para controlar qué contenidos se muestran en la landing page."),
    // Promo - Concept Map
    labelConceptMap: useUiText("admin.series", "label_concept_map", "Mapa Conceptual"),
    placeholderConceptMap: useUiText("admin.series", "placeholder_concept_map", "URL del mapa conceptual (ej: enlace a imagen o PDF interactivo)"),
    descriptionConceptMap: useUiText("admin.series", "description_concept_map", "Enlace a un mapa conceptual del mundo, la historia o los conceptos de la serie"),
    labelShowConceptMap: useUiText("admin.series", "label_show_concept_map", "Mostrar Mapa Conceptual"),
    descriptionShowContent: useUiText("admin.series", "description_show_content", "Activa para mostrar este contenido en la landing page"),
    // Promo - Family Tree
    labelFamilyTree: useUiText("admin.series", "label_family_tree", "Árbol Genealógico"),
    placeholderFamilyTree: useUiText("admin.series", "placeholder_family_tree", "URL del árbol genealógico (ej: enlace a imagen o diagrama interactivo)"),
    descriptionFamilyTree: useUiText("admin.series", "description_family_tree", "Enlace a un árbol genealógico de los personajes de la serie"),
    labelShowFamilyTree: useUiText("admin.series", "label_show_family_tree", "Mostrar Árbol Genealógico"),
    // Promo - YouTube
    labelYoutubeBooktrailer: useUiText("admin.series", "label_youtube_booktrailer", "Booktrailer de YouTube"),
    placeholderYoutube: useUiText("admin.series", "placeholder_youtube", "URL del video de YouTube (ej: https://www.youtube.com/watch?v=...)"),
    descriptionYoutube: useUiText("admin.series", "description_youtube", "Enlace a un booktrailer o video promocional de la serie en YouTube (se mostrará embebido)"),
    labelShowBooktrailer: useUiText("admin.series", "label_show_booktrailer", "Mostrar Booktrailer"),
    descriptionShowYoutube: useUiText("admin.series", "description_show_youtube", "Activa para mostrar el video embebido en la landing page"),
    // Promo - Spotify
    labelSpotifyPlaylist: useUiText("admin.series", "label_spotify_playlist", "Lista de Reproducción de Spotify"),
    placeholderSpotify: useUiText("admin.series", "placeholder_spotify", "URL de la playlist de Spotify (ej: https://open.spotify.com/playlist/...)"),
    descriptionSpotify: useUiText("admin.series", "description_spotify", "Enlace a una playlist de Spotify que acompaña la lectura de la serie (se mostrará embebida)"),
    labelShowSpotify: useUiText("admin.series", "label_show_spotify", "Mostrar Playlist de Spotify"),
    descriptionShowSpotify: useUiText("admin.series", "description_show_spotify", "Activa para mostrar la playlist embebida en la landing page"),
    // Promo - Press Notes
    labelPressNotes: useUiText("admin.series", "label_press_notes", "Notas de Prensa"),
    placeholderPressNotes: useUiText("admin.series", "placeholder_press_notes", "Enlace 1&#10;Enlace 2&#10;Enlace 3"),
    descriptionPressNotes: useUiText("admin.series", "description_press_notes", "Enlaces a notas de prensa, reseñas o artículos sobre la serie (uno por línea)"),
    labelShowPressNotes: useUiText("admin.series", "label_show_press_notes", "Mostrar Notas de Prensa"),
    descriptionShowPressNotes: useUiText("admin.series", "description_show_press_notes", "Activa para mostrar estos enlaces en la landing page"),
    // Promo - Additional Media
    labelAdditionalMedia: useUiText("admin.series", "label_additional_media", "Material Gráfico Adicional"),
    placeholderAdditionalMedia: useUiText("admin.series", "placeholder_additional_media", "URL de imagen 1&#10;URL de imagen 2&#10;URL de PDF o infografía"),
    descriptionAdditionalMedia: useUiText("admin.series", "description_additional_media", "Enlaces a ilustraciones, infografías, mapas u otro material visual de la serie (uno por línea)"),
    labelShowAdditionalMedia: useUiText("admin.series", "label_show_additional_media", "Mostrar Material Gráfico"),
    descriptionShowAdditionalMedia: useUiText("admin.series", "description_show_additional_media", "Activa para mostrar este contenido en la landing page"),
    // Form Buttons
    buttonCancel: useUiText("admin.series", "button_cancel", "Cancelar"),
    buttonUpdate: useUiText("admin.series", "button_update", "Actualizar"),
    buttonCreate: useUiText("admin.series", "button_create", "Crear"),
  };

  const form = useForm<SeriesFormData>({
    resolver: zodResolver(insertBookSeriesSchema),
    defaultValues: {
      title: "",
      description: "",
      genre: "",
      amazonUrl: "",
      isActive: true,
      cardBackgroundImage: "",
      landingHeroImage: "",
      landingTagline: "",
      landingWorldDescription: "",
      landingCharacters: "",
      landingReadingOrder: "",
      landingThemes: [],
      promoConceptMap: "",
      promoShowConceptMap: true,
      promoFamilyTree: "",
      promoShowFamilyTree: true,
      promoPressNotes: [],
      promoShowPressNotes: true,
      promoAdditionalMedia: [],
      promoShowAdditionalMedia: true,
      promoSpotifyPlaylist: "",
      promoShowSpotifyPlaylist: true,
      promoYoutubeBooktrailer: "",
      promoShowYoutubeBooktrailer: true,
      backgroundImageUrl: "",
      backgroundColor: "",
    },
  });

  // Get all series (not filtered by author - series can have books from multiple authors)
  const { data: series = [] } = useQuery<BookSeries[]>({
    queryKey: ["/api/book-series"],
  });

  // Get all books to show which authors are in each series
  const { data: allBooks = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const createSeriesMutation = useMutation({
    mutationFn: async (seriesData: SeriesFormData) => {
      // Series are now global and can have books from multiple authors
      const response = await apiRequest("POST", "/api/book-series", seriesData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.toastCreateTitle,
        description: t.toastCreateDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] });
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

  const updateSeriesMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SeriesFormData }) => {
      const response = await apiRequest("PUT", `/api/book-series/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.toastUpdateTitle,
        description: t.toastUpdateDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] });
      setIsModalOpen(false);
      setEditingSeries(null);
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

  const deleteSeriesMutation = useMutation({
    mutationFn: async (seriesId: string) => {
      await apiRequest("DELETE", `/api/book-series/${seriesId}`);
    },
    onSuccess: () => {
      toast({
        title: t.toastDeleteTitle,
        description: t.toastDeleteDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] });
    },
    onError: () => {
      toast({
        title: t.toastDeleteErrorTitle,
        description: t.toastDeleteErrorDescription,
        variant: "destructive",
      });
    },
  });

  const handleImageUploadComplete = (fieldName: keyof SeriesFormData, result: { url: string; objectPath: string }) => {
    form.setValue(fieldName, result.objectPath);
    toast({
      title: t.toastImageUploadTitle,
      description: t.toastImageUploadDescription,
    });
  };

  const getSeriesBookCount = (seriesId: string) => {
    return allBooks.filter((book: Book) => book.seriesId === seriesId).length;
  };

  const handleOpenAddModal = () => {
    setEditingSeries(null);
    form.reset({
      title: "",
      description: "",
      genre: "",
      amazonUrl: "",
      isActive: true,
      cardBackgroundImage: "",
      landingHeroImage: "",
      landingTagline: "",
      landingWorldDescription: "",
      landingCharacters: "",
      landingReadingOrder: "",
      landingThemes: [],
      promoConceptMap: "",
      promoShowConceptMap: true,
      promoFamilyTree: "",
      promoShowFamilyTree: true,
      promoPressNotes: [],
      promoShowPressNotes: true,
      promoAdditionalMedia: [],
      promoShowAdditionalMedia: true,
      promoSpotifyPlaylist: "",
      promoShowSpotifyPlaylist: true,
      promoYoutubeBooktrailer: "",
      promoShowYoutubeBooktrailer: true,
      backgroundImageUrl: "",
      backgroundColor: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (serie: BookSeries) => {
    setEditingSeries(serie);
    form.reset({
      title: serie.title,
      description: serie.description,
      genre: serie.genre,
      amazonUrl: serie.amazonUrl || "",
      isActive: serie.isActive || true,
      cardBackgroundImage: serie.cardBackgroundImage || "",
      landingHeroImage: serie.landingHeroImage || "",
      landingTagline: serie.landingTagline || "",
      landingWorldDescription: serie.landingWorldDescription || "",
      landingCharacters: serie.landingCharacters || "",
      landingReadingOrder: serie.landingReadingOrder || "",
      landingThemes: serie.landingThemes || [],
      promoConceptMap: serie.promoConceptMap || "",
      promoShowConceptMap: serie.promoShowConceptMap ?? true,
      promoFamilyTree: serie.promoFamilyTree || "",
      promoShowFamilyTree: serie.promoShowFamilyTree ?? true,
      promoPressNotes: serie.promoPressNotes || [],
      promoShowPressNotes: serie.promoShowPressNotes ?? true,
      promoAdditionalMedia: serie.promoAdditionalMedia || [],
      promoShowAdditionalMedia: serie.promoShowAdditionalMedia ?? true,
      promoSpotifyPlaylist: serie.promoSpotifyPlaylist || "",
      promoShowSpotifyPlaylist: serie.promoShowSpotifyPlaylist ?? true,
      promoYoutubeBooktrailer: serie.promoYoutubeBooktrailer || "",
      promoShowYoutubeBooktrailer: serie.promoShowYoutubeBooktrailer ?? true,
      backgroundImageUrl: serie.backgroundImageUrl || "",
      backgroundColor: serie.backgroundColor || "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteSeries = (seriesId: string) => {
    const bookCount = getSeriesBookCount(seriesId);
    if (bookCount > 0) {
      toast({
        title: t.toastCannotDeleteTitle,
        description: t.toastCannotDeleteDescription,
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(t.confirmDelete)) {
      deleteSeriesMutation.mutate(seriesId);
    }
  };

  const handleSubmit = (data: SeriesFormData) => {
    if (editingSeries) {
      updateSeriesMutation.mutate({ id: editingSeries.id, data });
    } else {
      createSeriesMutation.mutate(data);
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">{t.pageTitle}</h3>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          data-testid="button-add-series"
          onClick={handleOpenAddModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.buttonAddSeries}
        </Button>
      </div>

      <div className="grid gap-6">
        {series.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">{t.emptyState}</p>
            </CardContent>
          </Card>
        ) : (
          series.map((serie) => (
            <Card key={serie.id} data-testid={`series-card-${serie.id}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-2xl font-semibold">{serie.title}</h4>
                    <Badge className="bg-accent/20 text-accent-foreground">{serie.genre}</Badge>
                    {serie.isActive === false && (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        {t.badgeInactive}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{serie.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80"
                    data-testid={`button-edit-series-${serie.id}`}
                    onClick={() => handleOpenEditModal(serie)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteSeries(serie.id)}
                    disabled={deleteSeriesMutation.isPending}
                    data-testid={`button-delete-series-${serie.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{getSeriesBookCount(serie.id)} {t.booksCount}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-series">
              {editingSeries ? t.dialogTitleEdit : t.dialogTitleAdd}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">{t.tabBasicInfo}</TabsTrigger>
                  <TabsTrigger value="landing">{t.tabLandingPage}</TabsTrigger>
                  <TabsTrigger value="promo" data-testid="tab-promo-series">{t.tabPromo}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-6 mt-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelTitle}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t.placeholderTitle}
                            data-testid="input-series-title"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelDescription}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderDescription}
                            rows={4}
                            data-testid="textarea-series-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="genre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelGenre}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderGenre}
                              data-testid="input-series-genre"
                              {...field} 
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
                          <FormLabel>{t.labelAmazonUrl}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderAmazonUrl}
                              data-testid="input-series-amazon"
                              {...field}
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="cardBackgroundImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelCardBackgroundImage}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderUrl}
                              {...field}
                              value={field.value || ""} 
                              className="flex-1"
                              data-testid="input-series-card-background"
                            />
                          </FormControl>
                          <FileUploader
                            onComplete={(result) => handleImageUploadComplete('cardBackgroundImage', result)}
                            buttonClassName="shrink-0"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {t.buttonUpload}
                          </FileUploader>
                        </div>
                        <FormDescription>
                          {t.descriptionCardBackground}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-series-active"
                          />
                        </FormControl>
                        <FormLabel>{t.labelIsActive}</FormLabel>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="landing" className="space-y-6 mt-6">
                  <FormField
                    control={form.control}
                    name="landingHeroImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelLandingHeroImage}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderUrl}
                              {...field}
                              value={field.value || ""} 
                              className="flex-1"
                            />
                          </FormControl>
                          <FileUploader
                            onComplete={(result) => handleImageUploadComplete('landingHeroImage', result)}
                            buttonClassName="shrink-0"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {t.buttonUpload}
                          </FileUploader>
                        </div>
                        <FormDescription>
                          {t.descriptionLandingHero}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingTagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelTagline}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t.placeholderTagline}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionTagline}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingWorldDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelWorldDescription}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderWorldDescription}
                            rows={6}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionWorld}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingCharacters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelCharacters}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderCharacters}
                            rows={6}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionCharacters}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingReadingOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelReadingOrder}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderReadingOrder}
                            rows={4}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionReadingOrder}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingThemes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelThemes}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderThemes}
                            rows={4}
                            value={(field.value as string[] || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionThemes}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold">{t.sectionCustomization}</h3>
                    <p className="text-sm text-muted-foreground">{t.customizationIntro}</p>
                    
                    {form.watch("backgroundImageUrl") && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <img 
                          src={form.watch("backgroundImageUrl") || ""} 
                          alt="Vista previa de imagen de fondo" 
                          className="w-full max-h-48 object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <FileUploader
                        onComplete={(result) => handleImageUploadComplete('backgroundImageUrl', result)}
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
                          <FormLabel>{t.labelBgImageUrl}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder={t.placeholderUrl} data-testid="input-series-bg-image" />
                          </FormControl>
                          <FormDescription>
                            {t.descriptionBgImage}
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
                            <Input {...field} value={field.value || ""} placeholder={t.placeholderBgColor} data-testid="input-series-bg-color" />
                          </FormControl>
                          <FormDescription>
                            {t.descriptionBgColor}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="promo" className="space-y-6 mt-6">
                  <div className="bg-muted/30 p-4 rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground">
                      {t.promoIntro}
                    </p>
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="promoConceptMap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelConceptMap}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderConceptMap}
                              data-testid="input-promo-concept-map-series"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            {t.descriptionConceptMap}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="promoShowConceptMap"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>{t.labelShowConceptMap}</FormLabel>
                            <FormDescription>
                              {t.descriptionShowContent}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-show-concept-map"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="promoFamilyTree"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelFamilyTree}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderFamilyTree}
                              data-testid="input-promo-family-tree-series"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            {t.descriptionFamilyTree}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="promoShowFamilyTree"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>{t.labelShowFamilyTree}</FormLabel>
                            <FormDescription>
                              {t.descriptionShowContent}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-show-family-tree"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="promoYoutubeBooktrailer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelYoutubeBooktrailer}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderYoutube}
                              data-testid="input-promo-youtube-series"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            {t.descriptionYoutube}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="promoShowYoutubeBooktrailer"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>{t.labelShowBooktrailer}</FormLabel>
                            <FormDescription>
                              {t.descriptionShowYoutube}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-show-youtube"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="promoSpotifyPlaylist"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelSpotifyPlaylist}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderSpotify}
                              data-testid="input-promo-spotify-series"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            {t.descriptionSpotify}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="promoShowSpotifyPlaylist"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>{t.labelShowSpotify}</FormLabel>
                            <FormDescription>
                              {t.descriptionShowSpotify}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-show-spotify"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="promoPressNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelPressNotes}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t.placeholderPressNotes}
                              rows={4}
                              data-testid="textarea-promo-press-notes-series"
                              value={(field.value as string[] || []).join('\n')}
                              onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                            />
                          </FormControl>
                          <FormDescription>
                            {t.descriptionPressNotes}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="promoShowPressNotes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>{t.labelShowPressNotes}</FormLabel>
                            <FormDescription>
                              {t.descriptionShowPressNotes}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-show-press-notes"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="promoAdditionalMedia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelAdditionalMedia}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t.placeholderAdditionalMedia}
                              rows={4}
                              data-testid="textarea-promo-additional-media-series"
                              value={(field.value as string[] || []).join('\n')}
                              onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                            />
                          </FormControl>
                          <FormDescription>
                            {t.descriptionAdditionalMedia}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="promoShowAdditionalMedia"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>{t.labelShowAdditionalMedia}</FormLabel>
                            <FormDescription>
                              {t.descriptionShowAdditionalMedia}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-show-additional-media"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  data-testid="button-cancel-series"
                >
                  {t.buttonCancel}
                </Button>
                <Button 
                  type="submit"
                  disabled={createSeriesMutation.isPending || updateSeriesMutation.isPending}
                  data-testid="button-save-series"
                >
                  {editingSeries ? t.buttonUpdate : t.buttonCreate}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
