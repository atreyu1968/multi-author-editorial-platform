import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Eye, Calendar } from "lucide-react";
import { useAdminAuthor } from "@/contexts/admin-author-context";
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
import { insertBlogPostSchema } from "@shared/schema";
import { z } from "zod";
import type { BlogPost } from "@shared/schema";

type BlogPostFormData = z.infer<typeof insertBlogPostSchema>;

export default function BlogManagement() {
  const { selectedAuthorId } = useAdminAuthor();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(insertBlogPostSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      featuredImage: "",
      category: "",
      tags: [],
      isPublished: false,
      publishedAt: null,
    },
  });

  const { data: posts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts", selectedAuthorId],
    enabled: !!selectedAuthorId,
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: BlogPostFormData) => {
      const response = await apiRequest("POST", "/api/blog-posts", { ...postData, authorId: selectedAuthorId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Artículo creado",
        description: "El artículo ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", selectedAuthorId] });
      setIsModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el artículo.",
        variant: "destructive",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BlogPostFormData }) => {
      const response = await apiRequest("PUT", `/api/blog-posts/${id}`, { ...data, authorId: selectedAuthorId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Artículo actualizado",
        description: "El artículo ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", selectedAuthorId] });
      setIsModalOpen(false);
      setEditingPost(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el artículo.",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/blog-posts/${postId}`);
    },
    onSuccess: () => {
      toast({
        title: "Artículo eliminado",
        description: "El artículo ha sido eliminado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", selectedAuthorId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el artículo.",
        variant: "destructive",
      });
    },
  });

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "published" && post.isPublished) ||
                         (selectedStatus === "draft" && !post.isPublished);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(posts.map(post => post.category).filter(category => category && category.trim() !== "")));

  const handleDeletePost = (postId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este artículo?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleOpenAddModal = () => {
    setEditingPost(null);
    form.reset({
      title: "",
      content: "",
      excerpt: "",
      featuredImage: "",
      category: "",
      tags: [],
      isPublished: false,
      publishedAt: null,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: BlogPost) => {
    setEditingPost(post);
    form.reset({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage || "",
      category: post.category,
      tags: post.tags || [],
      isPublished: post.isPublished || false,
      publishedAt: post.publishedAt,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (data: BlogPostFormData) => {
    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, data });
    } else {
      createPostMutation.mutate(data);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No publicado";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">Gestión de Blog</h3>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          data-testid="button-add-post"
          onClick={handleOpenAddModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Artículo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Buscar artículos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input"
                data-testid="input-search-posts"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">Título</th>
                  <th className="text-left p-4">Categoría</th>
                  <th className="text-left p-4">Estado</th>
                  <th className="text-left p-4">Fecha</th>
                  <th className="text-left p-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/30" data-testid={`post-row-${post.id}`}>
                    <td className="p-4">
                      <div>
                        <h4 className="font-semibold">{post.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className="bg-accent/20 text-accent-foreground">{post.category}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge 
                        className={post.isPublished 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {post.isPublished ? "Publicado" : "Borrador"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(post.publishedAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary/80"
                          data-testid={`button-edit-${post.id}`}
                          onClick={() => handleOpenEditModal(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deletePostMutation.isPending}
                          data-testid={`button-delete-${post.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPosts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" data-testid="no-posts-message">
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                  ? "No se encontraron artículos con los filtros aplicados." 
                  : "No hay artículos disponibles."
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blog Post Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-post">
              {editingPost ? "Editar Artículo" : "Nuevo Artículo"}
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
                          placeholder="Título del artículo"
                          data-testid="input-post-title"
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Categoría del artículo"
                          data-testid="input-post-category"
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
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resumen *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Breve resumen del artículo"
                        data-testid="textarea-post-excerpt"
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
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenido *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Contenido completo del artículo"
                        className="min-h-[200px]"
                        data-testid="textarea-post-content"
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
                name="featuredImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen Destacada</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://..."
                        data-testid="input-post-image"
                        {...field}
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-6">
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-post-published"
                        />
                      </FormControl>
                      <FormLabel>Publicar artículo</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  data-testid="button-cancel-post"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPostMutation.isPending || updatePostMutation.isPending}
                  data-testid="button-submit-post"
                >
                  {createPostMutation.isPending || updatePostMutation.isPending ? (
                    "Guardando..."
                  ) : (
                    editingPost ? "Actualizar Artículo" : "Crear Artículo"
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