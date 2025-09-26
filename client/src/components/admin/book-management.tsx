import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Book, BookSeries } from "@shared/schema";

export default function BookManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"]
  });

  const { data: series = [] } = useQuery<BookSeries[]>({
    queryKey: ["/api/book-series"]
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">Gestión de Libros</h3>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-book">
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
    </div>
  );
}
