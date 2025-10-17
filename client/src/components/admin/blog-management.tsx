import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Eye, Calendar } from "lucide-react";
import { useAdminAuthor } from "@/contexts/admin-author-context";
import { useUiText } from "@/contexts/ui-text-context";
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

  const t = {
    toastCreateTitle: useUiText("admin.blog", "toast_create_title", "Artículo creado"),
    toastCreateDescription: useUiText("admin.blog", "toast_create_description", "El artículo ha sido creado exitosamente."),
    toastCreateErrorTitle: useUiText("admin.blog", "toast_create_error_title", "Error"),
    toastCreateErrorDescription: useUiText("admin.blog", "toast_create_error_description", "No se pudo crear el artículo."),
    toastUpdateTitle: useUiText("admin.blog", "toast_update_title", "Artículo actualizado"),
    toastUpdateDescription: useUiText("admin.blog", "toast_update_description", "El artículo ha sido actualizado exitosamente."),
    toastUpdateErrorTitle: useUiText("admin.blog", "toast_update_error_title", "Error"),
    toastUpdateErrorDescription: useUiText("admin.blog", "toast_update_error_description", "No se pudo actualizar el artículo."),
    toastDeleteTitle: useUiText("admin.blog", "toast_delete_title", "Artículo eliminado"),
    toastDeleteDescription: useUiText("admin.blog", "toast_delete_description", "El artículo ha sido eliminado exitosamente."),
    toastDeleteErrorTitle: useUiText("admin.blog", "toast_delete_error_title", "Error"),
    toastDeleteErrorDescription: useUiText("admin.blog", "toast_delete_error_description", "No se pudo eliminar el artículo."),
    confirmDelete: useUiText("admin.blog", "confirm_delete", "¿Estás seguro de que quieres eliminar este artículo?"),
    pageTitle: useUiText("admin.blog", "page_title", "Gestión de Blog"),
    buttonAddPost: useUiText("admin.blog", "button_add_post", "Nuevo Artículo"),
    placeholderSearch: useUiText("admin.blog", "placeholder_search", "Buscar artículos..."),
    placeholderCategoryFilter: useUiText("admin.blog", "placeholder_category_filter", "Filtrar por categoría"),
    filterAllCategories: useUiText("admin.blog", "filter_all_categories", "Todas las categorías"),
    placeholderStatusFilter: useUiText("admin.blog", "placeholder_status_filter", "Filtrar por estado"),
    filterAllStatuses: useUiText("admin.blog", "filter_all_statuses", "Todos los estados"),
    statusPublished: useUiText("admin.blog", "status_published", "Publicado"),
    statusDraft: useUiText("admin.blog", "status_draft", "Borrador"),
    tableHeaderTitle: useUiText("admin.blog", "table_header_title", "Título"),
    tableHeaderCategory: useUiText("admin.blog", "table_header_category", "Categoría"),
    tableHeaderStatus: useUiText("admin.blog", "table_header_status", "Estado"),
    tableHeaderDate: useUiText("admin.blog", "table_header_date", "Fecha"),
    tableHeaderActions: useUiText("admin.blog", "table_header_actions", "Acciones"),
    dateNotPublished: useUiText("admin.blog", "date_not_published", "No publicado"),
    emptyStateFiltered: useUiText("admin.blog", "empty_state_filtered", "No se encontraron artículos con los filtros aplicados."),
    emptyStateDefault: useUiText("admin.blog", "empty_state_default", "No hay artículos disponibles."),
    dialogTitleEdit: useUiText("admin.blog", "dialog_title_edit", "Editar Artículo"),
    dialogTitleAdd: useUiText("admin.blog", "dialog_title_add", "Nuevo Artículo"),
    labelTitle: useUiText("admin.blog", "label_title", "Título *"),
    labelCategory: useUiText("admin.blog", "label_category", "Categoría *"),
    labelExcerpt: useUiText("admin.blog", "label_excerpt", "Resumen *"),
    labelContent: useUiText("admin.blog", "label_content", "Contenido *"),
    labelFeaturedImage: useUiText("admin.blog", "label_featured_image", "Imagen Destacada"),
    labelPublish: useUiText("admin.blog", "label_publish", "Publicar artículo"),
    placeholderTitle: useUiText("admin.blog", "placeholder_title", "Título del artículo"),
    placeholderCategory: useUiText("admin.blog", "placeholder_category", "Categoría del artículo"),
    placeholderExcerpt: useUiText("admin.blog", "placeholder_excerpt", "Breve resumen del artículo"),
    placeholderContent: useUiText("admin.blog", "placeholder_content", "Contenido completo del artículo"),
    placeholderUrl: useUiText("admin.blog", "placeholder_url", "https://..."),
    buttonCancel: useUiText("admin.blog", "button_cancel", "Cancelar"),
    buttonSaving: useUiText("admin.blog", "button_saving", "Guardando..."),
    buttonUpdate: useUiText("admin.blog", "button_update", "Actualizar Artículo"),
    buttonCreate: useUiText("admin.blog", "button_create", "Crear Artículo"),
  };

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
    queryKey: ["/api/blog-posts", { authorId: selectedAuthorId }],
    enabled: !!selectedAuthorId,
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: BlogPostFormData) => {
      const response = await apiRequest("POST", "/api/blog-posts", { ...postData, authorId: selectedAuthorId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.toastCreateTitle,
        description: t.toastCreateDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", { authorId: selectedAuthorId }] });
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

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BlogPostFormData }) => {
      const response = await apiRequest("PUT", `/api/blog-posts/${id}`, { ...data, authorId: selectedAuthorId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.toastUpdateTitle,
        description: t.toastUpdateDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", { authorId: selectedAuthorId }] });
      setIsModalOpen(false);
      setEditingPost(null);
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

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/blog-posts/${postId}`);
    },
    onSuccess: () => {
      toast({
        title: t.toastDeleteTitle,
        description: t.toastDeleteDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", { authorId: selectedAuthorId }] });
    },
    onError: () => {
      toast({
        title: t.toastDeleteErrorTitle,
        description: t.toastDeleteErrorDescription,
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
    if (window.confirm(t.confirmDelete)) {
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
    if (!dateString) return t.dateNotPublished;
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">{t.pageTitle}</h3>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          data-testid="button-add-post"
          onClick={handleOpenAddModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.buttonAddPost}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                type="text"
                placeholder={t.placeholderSearch}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input"
                data-testid="input-search-posts"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder={t.placeholderCategoryFilter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filterAllCategories}</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder={t.placeholderStatusFilter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filterAllStatuses}</SelectItem>
                <SelectItem value="published">{t.statusPublished}</SelectItem>
                <SelectItem value="draft">{t.statusDraft}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">{t.tableHeaderTitle}</th>
                  <th className="text-left p-4">{t.tableHeaderCategory}</th>
                  <th className="text-left p-4">{t.tableHeaderStatus}</th>
                  <th className="text-left p-4">{t.tableHeaderDate}</th>
                  <th className="text-left p-4">{t.tableHeaderActions}</th>
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
                        {post.isPublished ? t.statusPublished : t.statusDraft}
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
                  ? t.emptyStateFiltered
                  : t.emptyStateDefault
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
              {editingPost ? t.dialogTitleEdit : t.dialogTitleAdd}
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
                      <FormLabel>{t.labelTitle}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t.placeholderTitle}
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
                      <FormLabel>{t.labelCategory}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t.placeholderCategory}
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
                    <FormLabel>{t.labelExcerpt}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t.placeholderExcerpt}
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
                    <FormLabel>{t.labelContent}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t.placeholderContent}
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
                    <FormLabel>{t.labelFeaturedImage}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t.placeholderUrl}
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
                      <FormLabel>{t.labelPublish}</FormLabel>
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
                  {t.buttonCancel}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPostMutation.isPending || updatePostMutation.isPending}
                  data-testid="button-submit-post"
                >
                  {createPostMutation.isPending || updatePostMutation.isPending ? (
                    t.buttonSaving
                  ) : (
                    editingPost ? t.buttonUpdate : t.buttonCreate
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