import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BookSeries, Book } from "@shared/schema";

export default function SeriesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: series = [] } = useQuery<BookSeries[]>({
    queryKey: ["/api/book-series"]
  });

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"]
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">Gestión de Series</h3>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-series">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Serie
        </Button>
      </div>

      <div className="grid gap-6">
        {series.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground" data-testid="no-series-message">No hay series disponibles.</p>
            </CardContent>
          </Card>
        ) : (
          series.map((serie) => {
            const bookCount = getSeriesBookCount(serie.id);
            
            return (
              <Card key={serie.id} data-testid={`series-card-${serie.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-primary">{serie.title}</CardTitle>
                      <p className="text-muted-foreground">{bookCount} {bookCount === 1 ? 'libro' : 'libros'} • {serie.genre}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary/80"
                        data-testid={`button-edit-series-${serie.id}`}
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
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{serie.description}</p>
                  <div className="flex gap-2 mb-4">
                    <Badge className={serie.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {serie.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      {bookCount} {bookCount === 1 ? 'libro' : 'libros'}
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    className="text-primary hover:text-primary/80"
                    data-testid={`button-manage-books-${serie.id}`}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Gestionar libros de la serie
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
