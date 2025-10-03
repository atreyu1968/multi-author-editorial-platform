import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Users, User, Star, Settings, FileText, Mail, QrCode, Image, Upload } from "lucide-react";

export default function HelpInstructions() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg" data-testid="header-help">
        <h2 className="text-3xl font-bold mb-2" data-testid="title-help">Ayuda e Instrucciones</h2>
        <p className="text-primary-foreground/90" data-testid="description-help">
          Guía completa para usar todas las funcionalidades del panel de administración
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        <AccordionItem value="books" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-books">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Gestión de Libros</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">Cómo agregar un libro:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Haz clic en el botón "Agregar Libro"</li>
                <li>En la pestaña "Información Básica", completa los datos esenciales:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Título del libro (obligatorio)</li>
                    <li>Género (obligatorio)</li>
                    <li>Descripción breve</li>
                    <li>Precio (si aplica)</li>
                    <li>URL de Amazon (para enlace de compra)</li>
                  </ul>
                </li>
                <li>Sube la imagen de portada usando el botón "Subir Imagen"</li>
                <li>Si el libro pertenece a una serie, selecciónala y asigna el orden</li>
                <li>En la pestaña "Landing Page", configura el contenido promocional:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Imagen hero (recomendado: 1920×600px, máx 1MB)</li>
                    <li>Tagline o frase gancho</li>
                    <li>Sinopsis extendida</li>
                    <li>Características destacadas (una por línea)</li>
                    <li>Citas o extractos del libro</li>
                    <li>Llamado a la acción (CTA)</li>
                    <li>Galería de imágenes</li>
                    <li>Premios y reconocimientos</li>
                  </ul>
                </li>
                <li>Haz clic en "Crear" para guardar</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Códigos QR y Enlaces Promocionales:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Edita un libro existente</li>
                <li>Ve a la pestaña "QR y Enlaces"</li>
                <li>El código QR se genera automáticamente</li>
                <li>Descarga el QR como PNG para materiales impresos</li>
                <li>Copia el enlace de la landing page para redes sociales</li>
                <li><strong>Usos sugeridos:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Incluye el QR en la última página de tu libro impreso</li>
                    <li>Agrega el QR a flyers y material promocional</li>
                    <li>Comparte el enlace en biografías de autor</li>
                    <li>Usa en tarjetas de presentación</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Especificaciones de imágenes:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Portada: 400×600px (máx 500KB)</li>
                <li>Hero de landing: 1920×600px (máx 1MB)</li>
                <li>Formatos soportados: JPG, PNG</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="series" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-series">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Gestión de Series</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">Cómo crear una serie:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Haz clic en "Agregar Serie"</li>
                <li>Ingresa el título de la serie</li>
                <li>Escribe una descripción atractiva</li>
                <li>Sube la imagen de portada de la serie</li>
                <li>Opcionalmente, sube una imagen de fondo para las tarjetas (1920×600px)</li>
                <li>Marca como publicada si quieres que aparezca en el sitio</li>
                <li>Guarda la serie</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Imagen de fondo degradada:</h4>
              <p className="text-muted-foreground">
                La imagen de fondo aparece en las tarjetas de series con un degradado que va de 
                transparente (izquierda) a opaco (derecha), mejorando la legibilidad del texto.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bio" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-bio">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Biografía del Autor</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">Cómo editar tu biografía:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>En la sección de Biografía, encontrarás el formulario de edición</li>
                <li>Ingresa tu nombre completo</li>
                <li>Sube tu foto de perfil (recomendado: cuadrada, 500×500px)</li>
                <li>Escribe tu biografía completa (puedes usar múltiples párrafos)</li>
                <li>Haz clic en "Guardar Cambios"</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Consejos para una buena biografía:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Incluye tus logros literarios principales</li>
                <li>Menciona tu trayectoria como escritor</li>
                <li>Añade datos personales que conecten con los lectores</li>
                <li>Mantén un tono profesional pero accesible</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="testimonials" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-testimonials">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Testimonios</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">Cómo agregar testimonios:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Haz clic en "Agregar Testimonio"</li>
                <li>Ingresa el nombre del lector/crítico</li>
                <li>Escribe el testimonio o reseña</li>
                <li>Asigna una calificación de 1 a 5 estrellas</li>
                <li>Opcionalmente, sube una foto del testimoniante</li>
                <li>Si es una reseña de un libro específico, selecciónalo</li>
                <li>Marca como destacado si quieres que aparezca en la página principal</li>
                <li>Guarda el testimonio</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Buenas prácticas:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Usa testimonios reales y verificables</li>
                <li>Destaca solo los mejores (4-5 estrellas)</li>
                <li>Incluye variedad de fuentes (lectores, críticos, autores)</li>
                <li>Mantén los testimonios concisos y relevantes</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="blog" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-blog">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Blog</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">Cómo crear un artículo de blog:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Haz clic en "Agregar Artículo"</li>
                <li>Escribe un título atractivo y descriptivo</li>
                <li>Redacta el contenido del artículo</li>
                <li>Sube una imagen destacada (recomendado: 1200×630px)</li>
                <li>Escribe un resumen o extracto del artículo</li>
                <li>Marca como publicado cuando esté listo</li>
                <li>Guarda el artículo</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Ideas para contenido del blog:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Proceso de escritura y consejos para autores</li>
                <li>Detrás de escena de tus libros</li>
                <li>Inspiración para tus historias</li>
                <li>Actualizaciones sobre nuevos proyectos</li>
                <li>Recomendaciones de lecturas</li>
                <li>Eventos y presentaciones</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="settings" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-settings">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Configuración del Sitio</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">Configuraciones generales:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><strong>Nombre del Autor:</strong> Aparece en el encabezado y pie de página del sitio</li>
                <li><strong>Título del Sitio:</strong> Aparece en la pestaña del navegador</li>
                <li><strong>Descripción del Sitio:</strong> Usado para SEO y redes sociales</li>
                <li><strong>Enlaces de Redes Sociales:</strong> Agrega tus perfiles (Facebook, Instagram, Twitter, Amazon)</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Sistema de Newsletter y Libro de Regalo:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><strong>Configurar Email:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Elige tu proveedor de email (Resend o SendGrid)</li>
                    <li>Configura tu email de remitente</li>
                    <li>Proporciona la clave API (debe estar configurada como secret EMAIL_API_KEY)</li>
                  </ul>
                </li>
                <li><strong>Configurar Libro de Regalo:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Sube el archivo del libro (PDF o EPUB, máx 10MB)</li>
                    <li>Selecciona el formato del archivo</li>
                    <li>Escribe una descripción atractiva del regalo</li>
                  </ul>
                </li>
                <li><strong>Funcionamiento:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Cuando alguien se suscribe al newsletter, recibe automáticamente un email de bienvenida</li>
                    <li>El email incluye el enlace de descarga del libro de regalo</li>
                    <li>El archivo se almacena de forma segura en Replit Object Storage</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">⚠️ Importante - Configuración de EMAIL_API_KEY:</h4>
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  Para que el sistema de email funcione, debes configurar el secret <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">EMAIL_API_KEY</code> con la clave API de tu proveedor de email (Resend o SendGrid). Sin esta configuración, los emails no se enviarán.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="images" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-images">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Gestión de Imágenes</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Sistema de carga de imágenes:
              </h4>
              <p className="text-muted-foreground mb-3">
                Todas las imágenes se suben directamente al servidor usando Replit Object Storage, 
                lo que garantiza que tus imágenes estén siempre disponibles.
              </p>
              
              <h4 className="font-semibold mb-2">Especificaciones recomendadas:</h4>
              <div className="space-y-2 text-muted-foreground">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">Portadas de libros:</p>
                    <p className="text-sm">400×600px</p>
                    <p className="text-sm">Máx. 500KB</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">Imágenes hero/banner:</p>
                    <p className="text-sm">1920×600px</p>
                    <p className="text-sm">Máx. 1MB</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">Foto de perfil:</p>
                    <p className="text-sm">500×500px (cuadrada)</p>
                    <p className="text-sm">Máx. 500KB</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">Imágenes de blog:</p>
                    <p className="text-sm">1200×630px</p>
                    <p className="text-sm">Máx. 1MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Consejos para mejores resultados:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Usa imágenes de alta calidad y buena resolución</li>
                <li>Optimiza el tamaño de archivo antes de subir</li>
                <li>Usa formatos JPG para fotografías y PNG para gráficos con transparencia</li>
                <li>Mantén la consistencia en el estilo visual de tus imágenes</li>
                <li>Asegúrate de tener los derechos de uso de las imágenes</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="workflow" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-workflow">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Flujo de Trabajo Recomendado</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">Para configuración inicial:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Completa la configuración del sitio (nombre, título, descripción)</li>
                <li>Configura el sistema de email y libro de regalo</li>
                <li>Agrega tu biografía y foto de perfil</li>
                <li>Crea tus series (si aplica)</li>
                <li>Agrega tus libros con toda la información</li>
                <li>Añade testimonios y reseñas</li>
                <li>Comienza a escribir artículos para el blog</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Para promocionar un nuevo libro:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Crea el libro en Gestión de Libros con toda la información</li>
                <li>Configura la landing page completa (hero, sinopsis, galería, etc.)</li>
                <li>Ve a la pestaña "QR y Enlaces" y descarga el código QR</li>
                <li>Incluye el QR en la última página del libro impreso</li>
                <li>Copia el enlace de la landing page para redes sociales</li>
                <li>Escribe un artículo de blog sobre el nuevo libro</li>
                <li>Agrega testimonios a medida que lleguen reseñas</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" data-testid="card-final-tip">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">💡 Consejo Final</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200" data-testid="content-final-tip">
          <p>
            Mantén tu contenido actualizado regularmente. Un sitio web activo con nuevos artículos 
            de blog, testimonios recientes y actualizaciones sobre tus libros genera más interés 
            y confianza en tus lectores. Revisa y actualiza tu biografía periódicamente para 
            reflejar tus últimos logros.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
