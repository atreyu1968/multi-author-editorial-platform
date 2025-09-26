import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTestimonialSchema, type Testimonial, type InsertTestimonial } from "@shared/schema";

export default function TestimonialManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"]
  });

  const form = useForm<InsertTestimonial>({
    resolver: zodResolver(insertTestimonialSchema),
    defaultValues: {
      content: "",
      authorName: "",
      authorType: "Lectora verificada",
      authorPhoto: "",
      rating: 5,
      isFeatured: false,
      isPublished: true
    },
  });

  const createTestimonialMutation = useMutation({
    mutationFn: async (data: InsertTestimonial) => {
      const response = await apiRequest("POST", "/api/testimonials", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Testimonio creado",
        description: "El testimonio ha sido agregado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el testimonio.",
        variant: "destructive",
      });
    },
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTestimonial> }) => {
      const response = await apiRequest("PUT", `/api/testimonials/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Testimonio actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      setIsDialogOpen(false);
      setEditingTestimonial(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    },
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (testimonialId: string) => {
      await apiRequest("DELETE", `/api/testimonials/${testimonialId}`);
    },
    onSuccess: () => {
      toast({
        title: "Testimonio eliminado",
        description: "El testimonio ha sido eliminado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el testimonio.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    form.reset({
      content: testimonial.content,
      authorName: testimonial.authorName,
      authorType: testimonial.authorType,
      authorPhoto: testimonial.authorPhoto || "",
      rating: testimonial.rating,
      isFeatured: testimonial.isFeatured,
      isPublished: testimonial.isPublished
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (testimonialId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este testimonio?")) {
      deleteTestimonialMutation.mutate(testimonialId);
    }
  };

  const onSubmit = (data: InsertTestimonial) => {
    if (editingTestimonial) {
      updateTestimonialMutation.mutate({ id: editingTestimonial.id, data });
    } else {
      createTestimonialMutation.mutate(data);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTestimonial(null);
    form.reset();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">Gestión de Testimonios</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-testimonial">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Testimonio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial ? "Editar Testimonio" : "Nuevo Testimonio"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="testimonial-form">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenido del Testimonio</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4} 
                          placeholder="Escribe el testimonio aquí..."
                          {...field} 
                          data-testid="textarea-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Autor</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre completo" {...field} data-testid="input-author-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="authorType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Lector</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-author-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Lectora verificada">Lectora verificada</SelectItem>
                            <SelectItem value="Lector verificado">Lector verificado</SelectItem>
                            <SelectItem value="Fan #1">Fan #1</SelectItem>
                            <SelectItem value="Amante de la fantasía">Amante de la fantasía</SelectItem>
                            <SelectItem value="Bibliotecaria">Bibliotecaria</SelectItem>
                            <SelectItem value="Blogger literario">Blogger literario</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="authorPhoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto del Autor (URL)</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="https://example.com/photo.jpg"
                          {...field} 
                          data-testid="input-author-photo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calificación</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-rating">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="5">5 estrellas</SelectItem>
                          <SelectItem value="4">4 estrellas</SelectItem>
                          <SelectItem value="3">3 estrellas</SelectItem>
                          <SelectItem value="2">2 estrellas</SelectItem>
                          <SelectItem value="1">1 estrella</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Destacado</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Mostrar en la página principal
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-featured"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publicado</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Visible al público
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-published"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTestimonialMutation.isPending || updateTestimonialMutation.isPending}
                    data-testid="button-save-testimonial"
                  >
                    {editingTestimonial ? "Actualizar" : "Crear"} Testimonio
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {testimonials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground" data-testid="no-testimonials-message">No hay testimonios disponibles.</p>
            </CardContent>
          </Card>
        ) : (
          testimonials.map((testimonial) => (
            <Card key={testimonial.id} data-testid={`testimonial-card-${testimonial.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.authorPhoto || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                      alt={`Foto de ${testimonial.authorName}`}
                      className="w-12 h-12 rounded-full object-cover" 
                    />
                    <div>
                      <CardTitle className="font-semibold">{testimonial.authorName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{testimonial.authorType}</p>
                    </div>
                    <div className="flex text-accent">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(testimonial)}
                      className="text-primary hover:text-primary/80"
                      data-testid={`button-edit-testimonial-${testimonial.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(testimonial.id)}
                      disabled={deleteTestimonialMutation.isPending}
                      className="text-red-500 hover:text-red-700"
                      data-testid={`button-delete-testimonial-${testimonial.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic mb-4">
                  "{testimonial.content}"
                </p>
                <div className="flex gap-2">
                  <Badge className={testimonial.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {testimonial.isPublished ? "Publicado" : "Borrador"}
                  </Badge>
                  {testimonial.isFeatured && (
                    <Badge className="bg-blue-100 text-blue-800">Destacado</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
