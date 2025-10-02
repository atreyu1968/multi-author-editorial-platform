import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { insertBookSchema } from "@shared/schema";
import { z } from "zod";
import type { Book, BookSeries } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

type BookFormData = z.infer<typeof insertBookSchema>;

export default function BookManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BookFormData>({
    resolver: zodResolver(insertBookSchema),
    defaultValues: {
      title: "",
      description: "",
      coverImage: "",
      genre: "",
      price: 0,
      amazonUrl: "",
      seriesId: "none",
      orderInSeries: undefined,
      isStandalone: false,
      isPublished: true,
      landingHeroImage: "",
      landingTagline: "",
      landingSynopsis: "",
      landingFeatures: [],
      landingQuotes: [],
      landingCTA: "",
      landingGallery: [],
      landingAwards: [],
    },
  });

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"]
  });

  const { data: series = [] } = useQuery<BookSeries[]>({
    queryKey: ["/api/book-series"]
  });

  const createBookMutation = useMutation({
    mutationFn: async (bookData: BookFormData) => {
      const response = await apiRequest("POST", "/api/books", bookData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Libro creado",
        description: "El libro ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el libro.",
        variant: "destructive",
      });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BookFormData }) => {
      const response = await apiRequest("PUT", `/api/books/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Libro actualizado",
        description: "El libro ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsModalOpen(false);
      setEditingBook(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el libro.",
        variant: "destructive",
      });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      await apiRequest("DELETE", `/api/books/${bookId}`);
    },
    onSuccess: () => {
      toast({
        title: "Libro eliminado",
        description: "El libro ha sido eliminado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el libro.",
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

  const handleImageUploadComplete = async (fieldName: keyof BookFormData, result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
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

  const getSeriesTitle = (seriesId: string | null) => {
    if (!seriesId) return "Independiente";
    const serie = series.find(s => s.id === seriesId);
    return serie?.title || "Serie desconocida";
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === "all" || book.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const genres = Array.from(new Set(books.map(book => book.genre).filter(genre => genre && genre.trim() !== "")));

  const handleDeleteBook = (bookId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este libro?")) {
      deleteBookMutation.mutate(bookId);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBook(null);
    form.reset({
      title: "",
      description: "",
      coverImage: "",
      genre: "",
      price: 0,
      amazonUrl: "",
      seriesId: "none",
      orderInSeries: undefined,
      isStandalone: false,
      isPublished: true,
      landingHeroImage: "",
      landingTagline: "",
      landingSynopsis: "",
      landingFeatures: [],
      landingQuotes: [],
      landingCTA: "",
      landingGallery: [],
      landingAwards: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBook(book);
    form.reset({
      title: book.title,
      description: book.description || "",
      coverImage: book.coverImage || "",
      genre: book.genre,
      price: book.price || 0,
      amazonUrl: book.amazonUrl || "",
      seriesId: book.seriesId || "none",
      orderInSeries: book.orderInSeries || undefined,
      isStandalone: book.isStandalone || false,
      isPublished: book.isPublished || true,
      landingHeroImage: book.landingHeroImage || "",
      landingTagline: book.landingTagline || "",
      landingSynopsis: book.landingSynopsis || "",
      landingFeatures: book.landingFeatures || [],
      landingQuotes: book.landingQuotes || [],
      landingCTA: book.landingCTA || "",
      landingGallery: book.landingGallery || [],
      landingAwards: book.landingAwards || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (data: BookFormData) => {
    const processedData = {
      ...data,
      seriesId: data.seriesId === "none" ? null : data.seriesId,
    };
    
    if (editingBook) {
      updateBookMutation.mutate({ id: editingBook.id, data: processedData });
    } else {
      createBookMutation.mutate(processedData);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">Gestión de Libros</h3>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          data-testid="button-add-book"
          onClick={handleOpenAddModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Libro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar libros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input"
                data-testid="input-search-books"
              />
            </div>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-48" data-testid="select-genre-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los géneros</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">Portada</th>
                  <th className="text-left p-4">Título</th>
                  <th className="text-left p-4">Serie</th>
                  <th className="text-left p-4">Género</th>
                  <th className="text-left p-4">Estado</th>
                  <th className="text-left p-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-muted/30" data-testid={`book-row-${book.id}`}>
                    <td className="p-4">
                      <img 
                        src={book.coverImage || "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=90"} 
                        alt={`Portada de ${book.title}`}
                        className="w-12 h-18 rounded object-cover" 
                      />
                    </td>
                    <td className="p-4 font-semibold">{book.title}</td>
                    <td className="p-4 text-muted-foreground">{getSeriesTitle(book.seriesId)}</td>
                    <td className="p-4">
                      <Badge className="bg-accent/20 text-accent-foreground">{book.genre}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge 
                        className={book.isPublished 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {book.isPublished ? "Publicado" : "Borrador"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary/80"
                          data-testid={`button-edit-${book.id}`}
                          onClick={() => handleOpenEditModal(book)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteBook(book.id)}
                          disabled={deleteBookMutation.isPending}
                          data-testid={`button-delete-${book.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBooks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" data-testid="no-books-message">
                {searchTerm || selectedGenre !== "all" 
                  ? "No se encontraron libros con los filtros aplicados." 
                  : "No hay libros disponibles."
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-book">
              {editingBook ? "Editar Libro" : "Agregar Libro"}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Título del libro"
                              data-testid="input-book-title"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="genre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Género *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Género del libro"
                              data-testid="input-book-genre"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descripción del libro"
                            data-testid="textarea-book-description"
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="coverImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portada (400×600px, máx 500 KB)</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder="https://... o /objects/..."
                                data-testid="input-book-cover"
                                {...field}
                                value={field.value || ""} 
                                className="flex-1"
                              />
                            </FormControl>
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={524288}
                              allowedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleImageUploadComplete('coverImage', result)}
                              buttonClassName="shrink-0"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Subir
                            </ObjectUploader>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              data-testid="input-book-price"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="amazonUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de Amazon</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://amazon.com/..."
                            data-testid="input-book-amazon"
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seriesId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serie</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-book-series">
                              <SelectValue placeholder="Selecciona una serie (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Libro independiente</SelectItem>
                            {series.map((serie) => (
                              <SelectItem key={serie.id} value={serie.id}>
                                {serie.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="orderInSeries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orden en Serie</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="1, 2, 3..."
                              data-testid="input-book-order"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center space-x-6">
                      <FormField
                        control={form.control}
                        name="isStandalone"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                                data-testid="switch-book-standalone"
                              />
                            </FormControl>
                            <FormLabel>Libro independiente</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                                data-testid="switch-book-published"
                              />
                            </FormControl>
                            <FormLabel>Publicado</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
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
                            placeholder="Un eslogan atractivo..."
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
                    name="landingSynopsis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sinopsis Extendida</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Una sinopsis más detallada del libro..."
                            rows={6}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Versión más detallada de la sinopsis para la landing page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingCTA"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Call To Action</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Comprar ahora en Amazon"
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Texto del botón de acción principal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingFeatures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Características Destacadas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Una característica por línea..."
                            rows={4}
                            value={(field.value as string[] || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          Una característica o aspecto destacado por línea
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingQuotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Citas Memorables</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Una cita por línea..."
                            rows={4}
                            value={(field.value as string[] || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          Citas o extractos destacados del libro (una por línea)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingGallery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Galería de Imágenes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="https://imagen1.jpg&#10;https://imagen2.jpg&#10;https://imagen3.jpg"
                            rows={4}
                            value={(field.value as string[] || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          URLs de imágenes para la galería (una por línea)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingAwards"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Premios y Reconocimientos</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Premio al mejor libro del año&#10;Finalista en..."
                            rows={4}
                            value={(field.value as string[] || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          Premios o reconocimientos recibidos (uno por línea)
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
                  data-testid="button-cancel-book"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createBookMutation.isPending || updateBookMutation.isPending}
                  data-testid="button-save-book"
                >
                  {editingBook ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
