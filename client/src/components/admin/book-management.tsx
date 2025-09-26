import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookSchema } from "@shared/schema";
import { z } from "zod";
import type { Book, BookSeries } from "@shared/schema";

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
      seriesId: null,
      orderInSeries: null,
      isStandalone: false,
      isPublished: true,
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

  const genres = Array.from(new Set(books.map(book => book.genre)));

  const handleDeleteBook = (bookId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este libro?")) {
      deleteBookMutation.mutate(bookId);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBook(null);
    form.reset();
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
      seriesId: book.seriesId,
      orderInSeries: book.orderInSeries,
      isStandalone: book.isStandalone || false,
      isPublished: book.isPublished || true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (data: BookFormData) => {
    if (editingBook) {
      updateBookMutation.mutate({ id: editingBook.id, data });
    } else {
      createBookMutation.mutate(data);
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

      {/* Book Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-book">
              {editingBook ? "Editar Libro" : "Agregar Libro"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                      <FormLabel>URL de Portada</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..."
                          data-testid="input-book-cover"
                          {...field} 
                        />
                      </FormControl>
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
                          {...field}
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
                        <SelectItem value="">Libro independiente</SelectItem>
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
                          {...field}
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
                            checked={field.value}
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
                            checked={field.value}
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

              <div className="flex justify-end gap-3">
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
                  data-testid="button-submit-book"
                >
                  {createBookMutation.isPending || updateBookMutation.isPending ? (
                    "Guardando..."
                  ) : (
                    editingBook ? "Actualizar Libro" : "Crear Libro"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
