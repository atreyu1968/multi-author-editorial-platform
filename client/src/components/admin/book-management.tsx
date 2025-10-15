import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Upload, Copy, Download, QrCode } from "lucide-react";
import { useAdminAuthor } from "@/contexts/admin-author-context";
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
import QRCode from "qrcode";

type BookFormData = z.infer<typeof insertBookSchema>;

export default function BookManagement() {
  const { selectedAuthorId } = useAdminAuthor();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
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
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      backgroundImageUrl: "",
      backgroundColor: "",
      digitalFileUrl: "",
      digitalFileFormat: "",
      isDigitalProduct: false,
    },
  });

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books", selectedAuthorId],
    enabled: !!selectedAuthorId,
  });

  // Get all series (not filtered by author) since books from any author can be added to any series
  const { data: series = [] } = useQuery<BookSeries[]>({
    queryKey: ["/api/book-series"],
  });

  const createBookMutation = useMutation({
    mutationFn: async (bookData: BookFormData) => {
      const response = await apiRequest("POST", "/api/books", { ...bookData, authorId: selectedAuthorId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Libro creado",
        description: "El libro ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books", selectedAuthorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] }); // Invalidate global books for series management
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] }); // Invalidate series as they may now include this book
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
      const response = await apiRequest("PUT", `/api/books/${id}`, { ...data, authorId: selectedAuthorId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Libro actualizado",
        description: "El libro ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books", selectedAuthorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] }); // Invalidate global books for series management
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] }); // Invalidate series as they may now include this book
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
      queryClient.invalidateQueries({ queryKey: ["/api/books", selectedAuthorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] }); // Invalidate global books for series management
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] }); // Invalidate series as the deleted book may have been in a series
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

  const handleDigitalFileUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileURL = uploadedFile.uploadURL;
      
      // Store the URL directly - no need to set public ACL for private files
      form.setValue('digitalFileUrl', fileURL);
      
      toast({
        title: "Archivo subido",
        description: "El archivo digital ha sido subido exitosamente.",
      });
    }
  };

  const getSeriesTitle = (seriesId: string | null) => {
    if (!seriesId) return "Independiente";
    const serie = series.find(s => s.id === seriesId);
    return serie?.title || "Serie desconocida";
  };

  // QR Code and Landing Page URL functions
  const getBookLandingPageUrl = (bookId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/libro/${bookId}`;
  };

  const generateQRCode = async (bookId: string) => {
    const url = getBookLandingPageUrl(bookId);
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el código QR",
        variant: "destructive",
      });
    }
  };

  const copyLandingPageUrl = () => {
    if (!editingBook) return;
    const url = getBookLandingPageUrl(editingBook.id);
    navigator.clipboard.writeText(url);
    toast({
      title: "Enlace copiado",
      description: "La URL de la landing page se ha copiado al portapapeles.",
    });
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl || !editingBook) return;
    const link = document.createElement('a');
    link.download = `qr-${editingBook.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    toast({
      title: "QR descargado",
      description: "El código QR se ha descargado exitosamente.",
    });
  };

  // Generate QR code when editing book changes
  useEffect(() => {
    if (editingBook) {
      generateQRCode(editingBook.id);
    } else {
      setQrCodeDataUrl("");
    }
  }, [editingBook]);

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
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      backgroundImageUrl: "",
      backgroundColor: "",
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
      promoConceptMap: book.promoConceptMap || "",
      promoShowConceptMap: book.promoShowConceptMap ?? true,
      promoFamilyTree: book.promoFamilyTree || "",
      promoShowFamilyTree: book.promoShowFamilyTree ?? true,
      promoPressNotes: book.promoPressNotes || [],
      promoShowPressNotes: book.promoShowPressNotes ?? true,
      promoAdditionalMedia: book.promoAdditionalMedia || [],
      promoShowAdditionalMedia: book.promoShowAdditionalMedia ?? true,
      promoSpotifyPlaylist: book.promoSpotifyPlaylist || "",
      promoShowSpotifyPlaylist: book.promoShowSpotifyPlaylist ?? true,
      promoYoutubeBooktrailer: book.promoYoutubeBooktrailer || "",
      promoShowYoutubeBooktrailer: book.promoShowYoutubeBooktrailer ?? true,
      seoTitle: book.seoTitle || "",
      seoDescription: book.seoDescription || "",
      seoKeywords: book.seoKeywords || "",
      backgroundImageUrl: book.backgroundImageUrl || "",
      backgroundColor: book.backgroundColor || "",
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Información Básica</TabsTrigger>
                  <TabsTrigger value="landing">Landing Page</TabsTrigger>
                  <TabsTrigger value="promo" data-testid="tab-promo">Contenido Promocional</TabsTrigger>
                  <TabsTrigger value="qr" disabled={!editingBook} data-testid="tab-qr">QR y Enlaces</TabsTrigger>
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

                  <div className="space-y-4 border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold">Archivo Digital</h3>
                    <p className="text-sm text-muted-foreground">Configura el archivo digital para descarga después de la compra.</p>
                    
                    <FormField
                      control={form.control}
                      name="isDigitalProduct"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-book-digital"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Es producto digital</FormLabel>
                            <FormDescription>
                              Marca si este libro es un producto digital descargable
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch('isDigitalProduct') && (
                      <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                        <FormField
                          control={form.control}
                          name="digitalFileFormat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formato del archivo *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-digital-format">
                                    <SelectValue placeholder="Selecciona el formato" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="EPUB">EPUB</SelectItem>
                                  <SelectItem value="PDF">PDF</SelectItem>
                                  <SelectItem value="MOBI">MOBI</SelectItem>
                                  <SelectItem value="AZW3">AZW3</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="digitalFileUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Archivo Digital (máx 50 MB)</FormLabel>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <FormControl>
                                    <Input 
                                      placeholder="URL del archivo digital"
                                      data-testid="input-digital-file"
                                      {...field}
                                      value={field.value || ""} 
                                      className="flex-1"
                                      readOnly
                                    />
                                  </FormControl>
                                  <ObjectUploader
                                    maxNumberOfFiles={1}
                                    maxFileSize={52428800}
                                    allowedFileTypes={[
                                      'application/epub+zip',
                                      'application/pdf',
                                      'application/x-mobipocket-ebook',
                                      'application/vnd.amazon.ebook'
                                    ]}
                                    onGetUploadParameters={handleGetUploadParameters}
                                    onComplete={handleDigitalFileUploadComplete}
                                    buttonClassName="shrink-0"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Subir
                                  </ObjectUploader>
                                  {field.value && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => form.setValue('digitalFileUrl', '')}
                                      data-testid="button-clear-digital-file"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <FormDescription>
                                  Archivo almacenado de forma segura en Object Storage privado
                                </FormDescription>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold">SEO - Optimización para Buscadores</h3>
                    <p className="text-sm text-muted-foreground">Configura cómo aparecerá la página del libro en Google y redes sociales.</p>
                    
                    <FormField
                      control={form.control}
                      name="seoTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título SEO</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder={`${form.watch('title')}${form.watch('genre') ? ` - Novela ${form.watch('genre')}` : ''}`} data-testid="input-book-seo-title" />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            Deja vacío para usar automáticamente: "{form.watch('title')}{form.watch('genre') ? ` - Novela ${form.watch('genre')}` : ''}"
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seoDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción SEO</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} rows={3} placeholder="Descripción breve para buscadores (150-160 caracteres)" data-testid="textarea-book-seo-description" />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            {field.value?.length || 0}/160 caracteres. Deja vacío para usar la descripción del libro.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seoKeywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Palabras Clave SEO</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="novela, fantasía, aventura, etc." data-testid="input-book-seo-keywords" />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            Separa las palabras clave con comas. Se incluirá automáticamente el título y género.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold">Personalización de Fondo</h3>
                      <p className="text-sm text-muted-foreground">Configura el fondo personalizado para la página del libro.</p>
                      
                      <FormField
                        control={form.control}
                        name="backgroundImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL de Imagen de Fondo</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="https://... o /objects/..." data-testid="input-book-bg-image" />
                            </FormControl>
                            <FormDescription>
                              Imagen de fondo para la página del libro (opcional)
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
                            <FormLabel>Color de Fondo</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="#ffffff o rgb(255,255,255)" data-testid="input-book-bg-color" />
                            </FormControl>
                            <FormDescription>
                              Color de fondo para la página del libro (opcional, se usa si no hay imagen)
                            </FormDescription>
                            <FormMessage />
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
                              data-testid="input-promo-concept-map"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlace a un mapa conceptual del mundo, la historia o los conceptos del libro
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
                              data-testid="input-promo-family-tree"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlace a un árbol genealógico de los personajes
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
                              data-testid="input-promo-youtube"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlace a un booktrailer o video promocional en YouTube (se mostrará embebido)
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
                              data-testid="input-promo-spotify"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlace a una playlist de Spotify que acompaña la lectura (se mostrará embebida)
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
                              data-testid="textarea-promo-press-notes"
                              value={(field.value as string[] || []).join('\n')}
                              onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlaces a notas de prensa, reseñas o artículos sobre el libro (uno por línea)
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
                              data-testid="textarea-promo-additional-media"
                              value={(field.value as string[] || []).join('\n')}
                              onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                            />
                          </FormControl>
                          <FormDescription>
                            Enlaces a ilustraciones, infografías, mapas u otro material visual (uno por línea)
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
                              Activa para mostrar estos enlaces en la landing page
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

                <TabsContent value="qr" className="space-y-6 mt-6">
                  {editingBook && (
                    <div className="space-y-6">
                      <div className="bg-muted/30 p-6 rounded-lg">
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <QrCode className="h-5 w-5" />
                          Código QR y Enlace de Landing Page
                        </h4>
                        <p className="text-sm text-muted-foreground mb-6">
                          Usa estos recursos para promocionar tu libro. Puedes incluir el código QR al final del libro impreso o en materiales promocionales.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* QR Code Display */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Código QR</h5>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={downloadQRCode}
                                disabled={!qrCodeDataUrl}
                                data-testid="button-download-qr"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar QR
                              </Button>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-border flex items-center justify-center">
                              {qrCodeDataUrl ? (
                                <img 
                                  src={qrCodeDataUrl} 
                                  alt="QR Code" 
                                  className="w-64 h-64"
                                  data-testid="qr-code-image"
                                />
                              ) : (
                                <div className="w-64 h-64 flex items-center justify-center text-muted-foreground">
                                  Generando QR...
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Este código QR lleva directamente a la landing page del libro
                            </p>
                          </div>

                          {/* URL Display and Copy */}
                          <div className="space-y-4">
                            <h5 className="font-medium">Enlace de la Landing Page</h5>
                            <div className="space-y-3">
                              <div className="p-4 bg-muted rounded-lg border border-border">
                                <p className="text-sm font-mono break-all" data-testid="landing-page-url">
                                  {getBookLandingPageUrl(editingBook.id)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={copyLandingPageUrl}
                                data-testid="button-copy-url"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Enlace
                              </Button>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h6 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                💡 Sugerencias de uso
                              </h6>
                              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                <li>• Incluye el QR en la última página de tu libro</li>
                                <li>• Comparte el enlace en redes sociales</li>
                                <li>• Agrega el QR a materiales promocionales</li>
                                <li>• Usa el enlace en tu biografía de autor</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
