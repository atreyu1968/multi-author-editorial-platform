import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
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
      landingHeroImage: "",
      landingTagline: "",
      landingWorldDescription: "",
      landingCharacters: "",
      landingReadingOrder: "",
      landingThemes: [],
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
      landingHeroImage: "",
      landingTagline: "",
      landingWorldDescription: "",
      landingCharacters: "",
      landingReadingOrder: "",
      landingThemes: [],
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
      landingHeroImage: serie.landingHeroImage || "",
      landingTagline: serie.landingTagline || "",
      landingWorldDescription: serie.landingWorldDescription || "",
      landingCharacters: serie.landingCharacters || "",
      landingReadingOrder: serie.landingReadingOrder || "",
      landingThemes: serie.landingThemes || [],
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Información Básica</TabsTrigger>
                  <TabsTrigger value="landing">Landing Page</TabsTrigger>
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
                        <FormLabel>Imagen Hero</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://..."
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
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
