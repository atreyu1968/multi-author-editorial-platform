import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, BookOpen, Upload } from "lucide-react";
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
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

type SeriesFormData = z.infer<typeof insertBookSeriesSchema>;

export default function SeriesManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<BookSeries | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    },
  });

  const { data: series = [] } = useQuery<BookSeries[]>({
    queryKey: ["/api/book-series"]
  });

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"]
  });

  const createSeriesMutation = useMutation({
    mutationFn: async (seriesData: SeriesFormData) => {
      const response = await apiRequest("POST", "/api/book-series", seriesData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Serie creada",
        description: "La serie ha sido creada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] });
      setIsModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la serie.",
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
        title: "Serie actualizada",
        description: "La serie ha sido actualizada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] });
      setIsModalOpen(false);
      setEditingSeries(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la serie.",
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
        title: "Serie eliminada",
        description: "La serie ha sido eliminada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la serie.",
        variant: "destructive",
      });
    },
  });

  // Helper functions for image upload
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleImageUploadComplete = async (fieldName: keyof SeriesFormData, result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageURL = uploadedFile.uploadURL;
      
      try {
        const response = await apiRequest("POST", "/api/images/upload", { imageURL });
        const data = await response.json();
        
        form.setValue(fieldName, data.objectPath);
        
        toast({
          title: "Imagen subida",
          description: "La imagen ha sido subida exitosamente.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al procesar la imagen subida.",
          variant: "destructive",
        });
      }
    }
  };

  const getSeriesBookCount = (seriesId: string) => {
    return books.filter(book => book.seriesId === seriesId).length;
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
    });
    setIsModalOpen(true);
  };

  const handleDeleteSeries = (seriesId: string) => {
    const bookCount = getSeriesBookCount(seriesId);
    if (bookCount > 0) {
      toast({
        title: "No se puede eliminar",
        description: "No puedes eliminar una serie que tiene libros asociados.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm("¿Estás seguro de que quieres eliminar esta serie?")) {
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
        <h3 className="text-3xl font-bold text-primary">Gestión de Series</h3>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          data-testid="button-add-series"
          onClick={handleOpenAddModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Serie
        </Button>
      </div>

      <div className="grid gap-6">
        {series.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No hay series disponibles</p>
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
                        Inactiva
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
                  <span>{getSeriesBookCount(serie.id)} libros en esta serie</span>
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
              {editingSeries ? "Editar Serie" : "Nueva Serie"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Información Básica</TabsTrigger>
                  <TabsTrigger value="landing">Landing Page</TabsTrigger>
                  <TabsTrigger value="promo" data-testid="tab-promo-series">Contenido Promocional</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-6 mt-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Título de la serie"
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
                        <FormLabel>Descripción *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descripción de la serie"
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
                          <FormLabel>Género *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Género de la serie"
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
                          <FormLabel>URL de Amazon</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://amazon.com/..."
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
                        <FormLabel>Imagen de Fondo de Tarjeta (1920×600px, máx 1 MB)</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder="https://... o /objects/..."
                              {...field}
                              value={field.value || ""} 
                              className="flex-1"
                              data-testid="input-series-card-background"
                            />
                          </FormControl>
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={1048576}
                            allowedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleImageUploadComplete('cardBackgroundImage', result)}
                            buttonClassName="shrink-0"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Subir
                          </ObjectUploader>
                        </div>
                        <FormDescription>
                          Imagen de fondo para la tarjeta de la serie en la página principal (degradado de izquierda a derecha)
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
                        <FormLabel>Serie activa</FormLabel>
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
                        <FormLabel>Imagen Hero (1920×600px, máx 1 MB)</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder="https://... o /objects/..."
                              {...field}
                              value={field.value || ""} 
                              className="flex-1"
                            />
                          </FormControl>
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={1048576}
                            allowedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleImageUploadComplete('landingHeroImage', result)}
                            buttonClassName="shrink-0"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Subir
                          </ObjectUploader>
                        </div>
                        <FormDescription>
                          Imagen de fondo para la sección hero de la landing page
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
                        <FormLabel>Eslogan</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Un eslogan atractivo para la serie..."
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Frase destacada que aparecerá en la landing page
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
                        <FormLabel>Descripción del Mundo</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe el mundo y ambientación de la serie..."
                            rows={6}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Información sobre el mundo, ambientación o contexto de la serie
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
                        <FormLabel>Personajes Principales</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe los personajes principales de la serie..."
                            rows={6}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Información sobre los personajes principales que aparecen en la serie
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
                        <FormLabel>Orden de Lectura</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Explica el orden recomendado de lectura..."
                            rows={4}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Guía sobre el orden en que los lectores deben leer los libros
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
                        <FormLabel>Temas Principales</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Un tema por línea..."
                            rows={4}
                            value={(field.value as string[] || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          Temas o conceptos principales explorados en la serie (uno por línea)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="promo" className="space-y-6 mt-6">
                  <div className="bg-muted/30 p-4 rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground">
                      Agrega contenido promocional adicional para enriquecer la experiencia de tus lectores. 
                      Todos estos campos son opcionales. Usa los switches para controlar qué contenidos se muestran en la landing page.
                    </p>
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="promoConceptMap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mapa Conceptual</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="URL del mapa conceptual (ej: enlace a imagen o PDF interactivo)"
                              data-testid="input-promo-concept-map-series"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlace a un mapa conceptual del mundo, la historia o los conceptos de la serie
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
                            <FormLabel>Mostrar Mapa Conceptual</FormLabel>
                            <FormDescription>
                              Activa para mostrar este contenido en la landing page
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
                          <FormLabel>Árbol Genealógico</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="URL del árbol genealógico (ej: enlace a imagen o diagrama interactivo)"
                              data-testid="input-promo-family-tree-series"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlace a un árbol genealógico de los personajes de la serie
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
                            <FormLabel>Mostrar Árbol Genealógico</FormLabel>
                            <FormDescription>
                              Activa para mostrar este contenido en la landing page
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
                          <FormLabel>Booktrailer de YouTube</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="URL del video de YouTube (ej: https://www.youtube.com/watch?v=...)"
                              data-testid="input-promo-youtube-series"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlace a un booktrailer o video promocional de la serie en YouTube (se mostrará embebido)
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
                            <FormLabel>Mostrar Booktrailer</FormLabel>
                            <FormDescription>
                              Activa para mostrar el video embebido en la landing page
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
                          <FormLabel>Lista de Reproducción de Spotify</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="URL de la playlist de Spotify (ej: https://open.spotify.com/playlist/...)"
                              data-testid="input-promo-spotify-series"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlace a una playlist de Spotify que acompaña la lectura de la serie (se mostrará embebida)
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
                            <FormLabel>Mostrar Playlist de Spotify</FormLabel>
                            <FormDescription>
                              Activa para mostrar la playlist embebida en la landing page
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
                          <FormLabel>Notas de Prensa</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enlace 1&#10;Enlace 2&#10;Enlace 3"
                              rows={4}
                              data-testid="textarea-promo-press-notes-series"
                              value={(field.value as string[] || []).join('\n')}
                              onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlaces a notas de prensa, reseñas o artículos sobre la serie (uno por línea)
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
                            <FormLabel>Mostrar Notas de Prensa</FormLabel>
                            <FormDescription>
                              Activa para mostrar estos enlaces en la landing page
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
                          <FormLabel>Material Gráfico Adicional</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="URL de imagen 1&#10;URL de imagen 2&#10;URL de PDF o infografía"
                              rows={4}
                              data-testid="textarea-promo-additional-media-series"
                              value={(field.value as string[] || []).join('\n')}
                              onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlaces a ilustraciones, infografías, mapas u otro material visual de la serie (uno por línea)
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
                            <FormLabel>Mostrar Material Gráfico</FormLabel>
                            <FormDescription>
                              Activa para mostrar este contenido en la landing page
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
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createSeriesMutation.isPending || updateSeriesMutation.isPending}
                  data-testid="button-save-series"
                >
                  {editingSeries ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
