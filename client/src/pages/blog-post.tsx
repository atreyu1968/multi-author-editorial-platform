import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Newsletter from "@/components/newsletter";
import { SEOHead, generateStructuredData } from "@/components/seo/seo-head";
import { useUiText } from "@/contexts/ui-text-context";
import type { BlogPost } from "@shared/schema";

export default function BlogPostDetail() {
  const [match, params] = useRoute("/blog/:id");
  const postId = params?.id;

  // Load all UI texts
  const t = {
    articleNotFoundTitle: useUiText("blog", "article_not_found_title", "Artículo no encontrado"),
    articleNotFoundMessage: useUiText("blog", "article_not_found_message", "El artículo que buscas no existe o no está publicado."),
    backToBlog: useUiText("blog", "back_to_blog", "Volver al blog"),
    authorName: useUiText("blog", "author_name", "María González"),
    readingTimeSuffix: useUiText("blog", "reading_time_suffix", "min de lectura"),
    featuredImageAltPrefix: useUiText("blog", "featured_image_alt_prefix", "Imagen destacada de:"),
    ogImageAltPrefix: useUiText("blog", "og_image_alt_prefix", "Imagen destacada de:"),
    tagsLabel: useUiText("blog", "tags_label", "Etiquetas:"),
    articleLikedQuestion: useUiText("blog", "article_liked_question", "¿Te ha gustado este artículo?"),
    subscribeMessage: useUiText("blog", "subscribe_message", "Suscríbete a mi newsletter para recibir más contenido como este y actualizaciones sobre mis próximos libros."),
    subscribeButton: useUiText("blog", "subscribe_button", "Suscribirse al Newsletter"),
    moreArticlesButton: useUiText("blog", "more_articles_button", "Ver más artículos"),
    footerName: useUiText("blog", "footer_name", "María González"),
    footerBio: useUiText("blog", "footer_bio", "Autora bestseller especializada en romance, thriller y fantasía. Creando historias que tocan el corazón desde 2012."),
    footerCopyright: useUiText("blog", "footer_copyright", "© 2024 María González. Todos los derechos reservados."),
  };

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog-posts/${postId}`],
    enabled: !!postId,
  });

  if (isLoading) {
    return (
      <div className="bg-background text-foreground font-sans">
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !post || !post.isPublished) {
    return (
      <div className="bg-background text-foreground font-sans">
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{t.articleNotFoundTitle}</h1>
            <p className="text-muted-foreground mb-8">
              {t.articleNotFoundMessage}
            </p>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.backToBlog}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt || new Date());
  const readingTime = Math.ceil(post.content.length / 1000); // Rough estimate: 1000 chars per minute

  return (
    <div className="bg-background text-foreground font-sans">
      <SEOHead
        title={post.title}
        description={post.excerpt}
        keywords={post.tags || []}
        ogType="article"
        ogImage={post.featuredImage || undefined}
        ogImageAlt={`${t.ogImageAltPrefix} ${post.title}`}
        articleAuthor={t.authorName}
        articlePublishedTime={post.publishedAt || post.createdAt || new Date().toISOString()}
        articleModifiedTime={post.updatedAt || new Date().toISOString()}
        articleSection={post.category || undefined}
        articleTags={post.tags || []}
        structuredData={generateStructuredData.article(post)}
      />
      
      <Navigation />
      
      <main className="min-h-screen">
        {/* Back Navigation */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link href="/blog">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.backToBlog}
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Category Badge */}
            {post.category && (
              <div className="mb-6">
                <Badge variant="secondary" data-testid="post-category">
                  {post.category}
                </Badge>
              </div>
            )}
            
            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-6 text-primary leading-tight" data-testid="post-title">
              {post.title}
            </h1>
            
            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-8 font-light leading-relaxed" data-testid="post-excerpt">
                {post.excerpt}
              </p>
            )}
            
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{t.authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span data-testid="post-date">
                  {publishedDate.toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readingTime} {t.readingTimeSuffix}</span>
              </div>
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="mb-12">
                <img
                  src={post.featuredImage}
                  alt={`${t.featuredImageAltPrefix} ${post.title}`}
                  className="w-full h-64 lg:h-96 object-cover rounded-lg shadow-lg"
                  data-testid="post-featured-image"
                />
              </div>
            )}
          </div>
        </header>

        {/* Article Content */}
        <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-primary prose-headings:font-serif prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:rounded-lg prose-blockquote:p-6"
              data-testid="post-content"
              dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
            />
          </div>
        </article>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              <Separator className="mb-8" />
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">{t.tagsLabel}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" data-testid={`tag-${index}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <Separator className="my-12" />

        {/* Call to Action */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-serif font-bold mb-4 text-primary">
              {t.articleLikedQuestion}
            </h3>
            <p className="text-muted-foreground mb-8">
              {t.subscribeMessage}
            </p>
            <div className="flex justify-center gap-4">
              <Link href="#newsletter">
                <Button size="lg">
                  {t.subscribeButton}
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="outline" size="lg">
                  {t.moreArticlesButton}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Newsletter />

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-primary mb-4">
              {t.footerName}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t.footerBio}
            </p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <i className="fab fa-amazon text-xl"></i>
              </a>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>{t.footerCopyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}