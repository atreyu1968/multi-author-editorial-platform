import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  BookOpen, Users, User, Star, Settings, FileText, Mail, Image, Upload, Sparkles,
  Globe, Languages, BarChart3, ShoppingCart, Search, CreditCard, DollarSign, Database
} from "lucide-react";
import { useUiText } from "@/contexts/ui-text-context";

export default function HelpInstructions() {
  const t = {
    pageTitle: useUiText("admin.help", "page_title", "Ayuda e Instrucciones"),
    pageDescription: useUiText("admin.help", "page_description", "Guía completa para gestionar tu plataforma editorial"),
    
    // AUTHORS SECTION
    sectionAuthorsTitle: useUiText("admin.help", "section_authors_title", "Gestión de Autores"),
    authorsHowToCreateTitle: useUiText("admin.help", "authors_how_to_create_title", "Cómo crear y gestionar autores"),
    authorsStep1: useUiText("admin.help", "authors_step1", "Ve a la sección 'Autores' en el menú lateral"),
    authorsStep2: useUiText("admin.help", "authors_step2", "Haz clic en 'Agregar Autor'"),
    authorsStep3: useUiText("admin.help", "authors_step3", "Completa los campos obligatorios: Nombre, Slug (URL), Título Hero, Subtítulo Hero"),
    authorsStep4: useUiText("admin.help", "authors_step4", "Añade la biografía en 3 párrafos"),
    authorsStep5: useUiText("admin.help", "authors_step5", "Sube la foto del autor usando el botón de upload o introduce la URL"),
    authorsStep6: useUiText("admin.help", "authors_step6", "Configura las redes sociales (Instagram, Twitter, Facebook, Amazon)"),
    authorsStep7: useUiText("admin.help", "authors_step7", "Activa el autor para que sea visible en el sitio público"),
    authorsStep8: useUiText("admin.help", "authors_step8", "Guarda los cambios"),
    authorsSeoTitle: useUiText("admin.help", "authors_seo_title", "Configuración SEO del Autor"),
    authorsSeoDesc: useUiText("admin.help", "authors_seo_desc", "Personaliza cómo aparece el autor en buscadores: Título SEO, Descripción (150-160 caracteres) y Palabras Clave separadas por comas."),
    authorsBackgroundTitle: useUiText("admin.help", "authors_background_title", "Personalización de Fondo"),
    authorsBackgroundDesc: useUiText("admin.help", "authors_background_desc", "Puedes configurar una imagen de fondo o un color sólido para la página del autor. Si no se configura, se usará el tema global."),
    
    // BOOKS SECTION
    sectionBooksTitle: useUiText("admin.help", "section_books_title", "Gestión de Libros"),
    booksHowToAddTitle: useUiText("admin.help", "books_how_to_add_title", "Cómo agregar un libro"),
    booksStep1: useUiText("admin.help", "books_step1", "Ve a 'Libros' y haz clic en 'Agregar Libro'"),
    booksStep2: useUiText("admin.help", "books_step2", "Completa la información básica:"),
    booksStep2Item1: useUiText("admin.help", "books_step2_item1", "Título, Autor, Género"),
    booksStep2Item2: useUiText("admin.help", "books_step2_item2", "ISBN, Fecha de publicación"),
    booksStep2Item3: useUiText("admin.help", "books_step2_item3", "Descripción corta y larga"),
    booksStep2Item4: useUiText("admin.help", "books_step2_item4", "Si pertenece a una serie o es independiente"),
    booksStep2Item5: useUiText("admin.help", "books_step2_item5", "Número de páginas"),
    booksStep3: useUiText("admin.help", "books_step3", "Sube la portada del libro (recomendado: proporción 2:3)"),
    booksStep4: useUiText("admin.help", "books_step4", "Configura las opciones de venta y precio"),
    booksStep5: useUiText("admin.help", "books_step5", "Personaliza la landing page del libro:"),
    booksStep5Item1: useUiText("admin.help", "books_step5_item1", "Hero Image y Tagline"),
    booksStep5Item2: useUiText("admin.help", "books_step5_item2", "Sinopsis extendida"),
    booksStep5Item3: useUiText("admin.help", "books_step5_item3", "Características destacadas"),
    booksStep5Item4: useUiText("admin.help", "books_step5_item4", "Citas memorables"),
    booksStep5Item5: useUiText("admin.help", "books_step5_item5", "Galería de imágenes"),
    booksStep5Item6: useUiText("admin.help", "books_step5_item6", "Premios y reconocimientos"),
    booksStep5Item7: useUiText("admin.help", "books_step5_item7", "Call to Action (texto del botón principal)"),
    booksStep5Item8: useUiText("admin.help", "books_step5_item8", "Enlaces a tiendas externas"),
    booksStep6: useUiText("admin.help", "books_step6", "Activa 'Publicar' para que sea visible en el sitio"),
    booksSalesTitle: useUiText("admin.help", "books_sales_title", "Configuración de Ventas"),
    booksSalesDesc: useUiText("admin.help", "books_sales_desc", "Puedes vender libros en formato físico, digital o ambos. Para productos digitales, sube los archivos (EPUB, PDF, MOBI, AZW3) y configura el precio y stock."),
    booksQrTitle: useUiText("admin.help", "books_qr_title", "Códigos QR para promoción"),
    booksQrStep1: useUiText("admin.help", "books_qr_step1", "Edita el libro que quieres promocionar"),
    booksQrStep2: useUiText("admin.help", "books_qr_step2", "Baja hasta la sección 'Código QR'"),
    booksQrStep3: useUiText("admin.help", "books_qr_step3", "Haz clic en 'Generar Código QR'"),
    booksQrStep4: useUiText("admin.help", "books_qr_step4", "El QR aparecerá en pantalla"),
    booksQrStep5: useUiText("admin.help", "books_qr_step5", "Haz clic en 'Descargar QR' para guardar la imagen"),
    booksQrStep6Strong: useUiText("admin.help", "books_qr_step6_strong", "Usos del código QR:"),
    booksQrStep6Item1: useUiText("admin.help", "books_qr_step6_item1", "Imprimir en marcapáginas o postales promocionales"),
    booksQrStep6Item2: useUiText("admin.help", "books_qr_step6_item2", "Incluir en presentaciones o ferias del libro"),
    booksQrStep6Item3: useUiText("admin.help", "books_qr_step6_item3", "Compartir en redes sociales"),
    booksQrStep6Item4: useUiText("admin.help", "books_qr_step6_item4", "Añadir a carteles o displays"),
    booksImageSpecsTitle: useUiText("admin.help", "books_image_specs_title", "Especificaciones de imágenes"),
    booksImageSpec1: useUiText("admin.help", "books_image_spec1", "Portadas: Proporción 2:3 (ej: 800x1200px), máx 5MB"),
    booksImageSpec2: useUiText("admin.help", "books_image_spec2", "Hero Landing: 1920x1080px recomendado, máx 10MB"),
    booksImageSpec3: useUiText("admin.help", "books_image_spec3", "Galería: 1200x800px aprox, máx 5MB cada imagen"),
    
    // SERIES SECTION
    sectionSeriesTitle: useUiText("admin.help", "section_series_title", "Series de Libros"),
    seriesHowToCreateTitle: useUiText("admin.help", "series_how_to_create_title", "Cómo crear una serie"),
    seriesStep1: useUiText("admin.help", "series_step1", "Ve a 'Series' y haz clic en 'Agregar Serie'"),
    seriesStep2: useUiText("admin.help", "series_step2", "Introduce el nombre y descripción de la serie"),
    seriesStep3: useUiText("admin.help", "series_step3", "Sube una imagen representativa de la serie"),
    seriesStep4: useUiText("admin.help", "series_step4", "Agrega los libros que forman parte de la serie"),
    seriesStep5: useUiText("admin.help", "series_step5", "Ordena los libros arrastrándolos en el orden deseado"),
    seriesStep6: useUiText("admin.help", "series_step6", "Personaliza la landing page de la serie con contenido promocional"),
    seriesStep7: useUiText("admin.help", "series_step7", "Activa la serie para que sea visible públicamente"),
    seriesMultiAuthorTitle: useUiText("admin.help", "series_multi_author_title", "Series Multi-Autor"),
    seriesMultiAuthorDesc: useUiText("admin.help", "series_multi_author_desc", "Las series pueden contener libros de diferentes autores. Esto es útil para antologías o colecciones colaborativas."),
    seriesBackgroundTitle: useUiText("admin.help", "series_background_title", "Personalización visual"),
    seriesBackgroundDesc: useUiText("admin.help", "series_background_desc", "Personaliza el fondo de la landing de la serie con una imagen o color personalizado."),
    
    // BIO SECTION
    sectionBioTitle: useUiText("admin.help", "section_bio_title", "Biografías"),
    bioHowToEditTitle: useUiText("admin.help", "bio_how_to_edit_title", "Cómo editar biografías"),
    bioStep1: useUiText("admin.help", "bio_step1", "Selecciona un autor del menú superior"),
    bioStep2: useUiText("admin.help", "bio_step2", "Ve a la sección 'Biografía'"),
    bioStep3: useUiText("admin.help", "bio_step3", "Edita los tres párrafos de la biografía"),
    bioStep4: useUiText("admin.help", "bio_step4", "Actualiza la foto y enlaces sociales"),
    bioStep5: useUiText("admin.help", "bio_step5", "Usa la 'Vista Previa' para ver cómo se verá públicamente"),
    bioTipsTitle: useUiText("admin.help", "bio_tips_title", "Consejos para biografías efectivas"),
    bioTip1: useUiText("admin.help", "bio_tip1", "Párrafo 1: Presentación e historia personal del autor"),
    bioTip2: useUiText("admin.help", "bio_tip2", "Párrafo 2: Obras destacadas y logros literarios"),
    bioTip3: useUiText("admin.help", "bio_tip3", "Párrafo 3: Estilo de escritura y proyectos futuros"),
    bioTip4: useUiText("admin.help", "bio_tip4", "Mantén un tono profesional pero cercano"),
    
    // TESTIMONIALS SECTION
    sectionTestimonialsTitle: useUiText("admin.help", "section_testimonials_title", "Testimonios"),
    testimonialsHowToAddTitle: useUiText("admin.help", "testimonials_how_to_add_title", "Cómo agregar testimonios"),
    testimonialsStep1: useUiText("admin.help", "testimonials_step1", "Selecciona un autor"),
    testimonialsStep2: useUiText("admin.help", "testimonials_step2", "Ve a 'Testimonios' y haz clic en 'Agregar'"),
    testimonialsStep3: useUiText("admin.help", "testimonials_step3", "Introduce el contenido del testimonio"),
    testimonialsStep4: useUiText("admin.help", "testimonials_step4", "Escribe el nombre de quien da el testimonio"),
    testimonialsStep5: useUiText("admin.help", "testimonials_step5", "Selecciona el tipo de lector (verificado, fan, blogger, etc.)"),
    testimonialsStep6: useUiText("admin.help", "testimonials_step6", "Asigna una calificación (1-5 estrellas)"),
    testimonialsStep7: useUiText("admin.help", "testimonials_step7", "Opcionalmente, sube una foto del autor del testimonio"),
    testimonialsStep8: useUiText("admin.help", "testimonials_step8", "Marca como 'Destacado' para mostrarlo en página principal"),
    testimonialsBestPracticesTitle: useUiText("admin.help", "testimonials_best_practices_title", "Buenas prácticas"),
    testimonialsTip1: useUiText("admin.help", "testimonials_tip1", "Pide permiso antes de publicar testimonios de lectores"),
    testimonialsTip2: useUiText("admin.help", "testimonials_tip2", "Usa testimonios auténticos y verificables"),
    testimonialsTip3: useUiText("admin.help", "testimonials_tip3", "Varía los tipos de testimonios (lectores, críticos, autores)"),
    testimonialsTip4: useUiText("admin.help", "testimonials_tip4", "Los testimonios destacados aparecen en la página del autor"),
    
    // BLOG SECTION
    sectionBlogTitle: useUiText("admin.help", "section_blog_title", "Blog"),
    blogHowToCreateTitle: useUiText("admin.help", "blog_how_to_create_title", "Cómo crear artículos de blog"),
    blogStep1: useUiText("admin.help", "blog_step1", "Selecciona un autor (cada autor tiene su propio blog)"),
    blogStep2: useUiText("admin.help", "blog_step2", "Ve a 'Blog' y haz clic en 'Nuevo Artículo'"),
    blogStep3: useUiText("admin.help", "blog_step3", "Escribe un título atractivo"),
    blogStep4: useUiText("admin.help", "blog_step4", "Redacta un resumen breve (excerpt)"),
    blogStep5: useUiText("admin.help", "blog_step5", "Escribe el contenido completo del artículo"),
    blogStep6: useUiText("admin.help", "blog_step6", "Asigna una categoría y sube una imagen destacada"),
    blogStep7: useUiText("admin.help", "blog_step7", "Activa 'Publicar' cuando esté listo, o guarda como borrador"),
    blogIdeasTitle: useUiText("admin.help", "blog_ideas_title", "Ideas de contenido para el blog"),
    blogIdea1: useUiText("admin.help", "blog_idea1", "Proceso de escritura y creación de personajes"),
    blogIdea2: useUiText("admin.help", "blog_idea2", "Inspiración detrás de los libros"),
    blogIdea3: useUiText("admin.help", "blog_idea3", "Avances de próximos lanzamientos"),
    blogIdea4: useUiText("admin.help", "blog_idea4", "Recomendaciones de lectura"),
    blogIdea5: useUiText("admin.help", "blog_idea5", "Eventos y firmas de libros"),
    blogIdea6: useUiText("admin.help", "blog_idea6", "Reflexiones sobre el mundo literario"),
    
    // SETTINGS (AUTHOR) SECTION
    sectionSettingsTitle: useUiText("admin.help", "section_settings_title", "Configuración del Autor"),
    settingsGeneralTitle: useUiText("admin.help", "settings_general_title", "Configuración General"),
    settingsGeneralDesc: useUiText("admin.help", "settings_general_desc", "Personaliza la página del autor con 6 pestañas de configuración:"),
    settingsTab1: useUiText("admin.help", "settings_tab1", "General: Título hero, subtítulo, email de contacto"),
    settingsTab2: useUiText("admin.help", "settings_tab2", "Apariencia: Logo, favicon, colores del tema"),
    settingsTab3: useUiText("admin.help", "settings_tab3", "Redes: Instagram, Twitter, Facebook, Amazon"),
    settingsTab4: useUiText("admin.help", "settings_tab4", "Idioma: Idioma predeterminado y auto-detección"),
    settingsTab5: useUiText("admin.help", "settings_tab5", "Newsletter: Libro gratuito para suscriptores"),
    settingsTab6: useUiText("admin.help", "settings_tab6", "Email: Configuración de proveedor de email (7 opciones disponibles)"),
    settingsNewsletterTitle: useUiText("admin.help", "settings_newsletter_title", "Configuración de Newsletter"),
    settingsNewsletterDesc: useUiText("admin.help", "settings_newsletter_desc", "Ofrece un libro gratuito a cambio de suscripción al newsletter. Sube el archivo (EPUB, PDF, MOBI) y el sistema enviará automáticamente el link de descarga."),
    settingsApiKeyTitle: useUiText("admin.help", "settings_api_key_title", "Proveedores de Email"),
    settingsApiKeyDesc: useUiText("admin.help", "settings_api_key_desc", "El sistema soporta 7 proveedores de email: Resend, SendGrid, Mailchimp Transactional, Brevo, Postmark, Mailgun y Gmail. Cada uno tiene instrucciones específicas en el panel."),
    
    // EDITORIAL SETTINGS SECTION
    sectionEditorialTitle: useUiText("admin.help", "section_editorial_title", "Configuración Editorial Global"),
    editorialDescTitle: useUiText("admin.help", "editorial_desc_title", "¿Qué es la Configuración Editorial?"),
    editorialDescText: useUiText("admin.help", "editorial_desc_text", "Esta sección controla la configuración global de la editorial, afectando la página de inicio y configuraciones compartidas por todos los autores."),
    editorialTabsTitle: useUiText("admin.help", "editorial_tabs_title", "8 Pestañas de Configuración"),
    editorialTab1: useUiText("admin.help", "editorial_tab1", "Marca: Nombre de la editorial, logo y favicon globales"),
    editorialTab2: useUiText("admin.help", "editorial_tab2", "Portada: Sección hero de la página de inicio"),
    editorialTab3: useUiText("admin.help", "editorial_tab3", "Secciones: Configurar ofertas y características destacadas"),
    editorialTab4: useUiText("admin.help", "editorial_tab4", "Autores: Texto de la sección de autores destacados"),
    editorialTab5: useUiText("admin.help", "editorial_tab5", "Footer: Enlaces y texto del pie de página"),
    editorialTab6: useUiText("admin.help", "editorial_tab6", "SEO: Meta descripción y keywords globales"),
    editorialTab7: useUiText("admin.help", "editorial_tab7", "PayPal: Integración de pagos (Sandbox o Producción)"),
    editorialTab8: useUiText("admin.help", "editorial_tab8", "Email: Proveedor de email para la editorial"),
    editorialPaypalTitle: useUiText("admin.help", "editorial_paypal_title", "Configuración de PayPal"),
    editorialPaypalDesc: useUiText("admin.help", "editorial_paypal_desc", "Configura tus credenciales de PayPal (Client ID y Secret). Usa modo Sandbox para pruebas y Producción para ventas reales."),
    editorialCurrencyTitle: useUiText("admin.help", "editorial_currency_title", "Monedas y Conversión"),
    editorialCurrencyDesc: useUiText("admin.help", "editorial_currency_desc", "El sistema soporta 8+ monedas con conversión automática en tiempo real. Los precios se muestran en la moneda del idioma del usuario (EUR, USD, GBP, etc.)."),
    
    // TRANSLATIONS SECTION
    sectionTranslationsTitle: useUiText("admin.help", "section_translations_title", "Sistema de Traducciones"),
    translationsIntroTitle: useUiText("admin.help", "translations_intro_title", "7 Idiomas Soportados"),
    translationsIntroDesc: useUiText("admin.help", "translations_intro_desc", "La plataforma soporta: Español (es-ES), Inglés (en-US), Catalán (ca-ES), Francés (fr-FR), Italiano (it-IT), Alemán (de-DE) y Portugués (pt-PT)."),
    translationsContentTitle: useUiText("admin.help", "translations_content_title", "Traducción de Contenido"),
    translationsContentDesc: useUiText("admin.help", "translations_content_desc", "Puedes traducir: Autores, Libros, Series, Testimonios y Blog Posts. El sistema incluye siempre el contenido original en español como referencia."),
    translationsManagementTitle: useUiText("admin.help", "translations_management_title", "Panel de Traducciones"),
    translationsStep1: useUiText("admin.help", "translations_step1", "Ve a 'Traducciones' en el menú lateral (sección Editorial Global)"),
    translationsStep2: useUiText("admin.help", "translations_step2", "Revisa la cobertura: muestra qué % de textos están traducidos por idioma"),
    translationsStep3: useUiText("admin.help", "translations_step3", "Identifica traducciones faltantes con el filtro 'Missing'"),
    translationsStep4: useUiText("admin.help", "translations_step4", "Edita traducciones haciendo clic en la celda correspondiente"),
    translationsStep5: useUiText("admin.help", "translations_step5", "Usa Import/Export para trabajar con archivos JSON o CSV"),
    translationsStep6: useUiText("admin.help", "translations_step6", "Copia traducciones de un idioma base a otro para agilizar el proceso"),
    translationsUrlsTitle: useUiText("admin.help", "translations_urls_title", "URLs Localizadas"),
    translationsUrlsDesc: useUiText("admin.help", "translations_urls_desc", "Las URLs se adaptan al idioma: /es-ES/libro/1, /en-US/book/1, /ca-ES/llibre/1, /fr-FR/livre/1, /it-IT/libro/1, /de-DE/buch/1, /pt-PT/livro/1"),
    
    // UI TEXTS SECTION
    sectionUiTextsTitle: useUiText("admin.help", "section_ui_texts_title", "Textos del Sitio (UI)"),
    uiTextsWhatTitle: useUiText("admin.help", "ui_texts_what_title", "¿Qué son los Textos UI?"),
    uiTextsWhatDesc: useUiText("admin.help", "ui_texts_what_desc", "Son todos los textos visibles en botones, menús, mensajes, etiquetas, etc. Puedes personalizar más de 10,000 textos en 7 idiomas."),
    uiTextsNamespacesTitle: useUiText("admin.help", "ui_texts_namespaces_title", "Organización por Namespaces"),
    uiTextsNamespacesDesc: useUiText("admin.help", "ui_texts_namespaces_desc", "Los textos están organizados en namespaces como: navigation, homepage, book_landing, admin.books, etc. Esto facilita encontrar y editar textos relacionados."),
    uiTextsHowToTitle: useUiText("admin.help", "ui_texts_how_to_title", "Cómo editar textos UI"),
    uiTextsStep1: useUiText("admin.help", "ui_texts_step1", "Ve a 'Textos del Sitio' en el menú lateral"),
    uiTextsStep2: useUiText("admin.help", "ui_texts_step2", "Filtra por namespace para encontrar el área que quieres personalizar"),
    uiTextsStep3: useUiText("admin.help", "ui_texts_step3", "Filtra por idioma si quieres editar una traducción específica"),
    uiTextsStep4: useUiText("admin.help", "ui_texts_step4", "Haz clic en 'Editar' en el texto que quieres cambiar"),
    uiTextsStep5: useUiText("admin.help", "ui_texts_step5", "Modifica el valor y guarda"),
    uiTextsStep6: useUiText("admin.help", "ui_texts_step6", "Los cambios se reflejan inmediatamente en el sitio"),
    
    // ANALYTICS SECTION
    sectionAnalyticsTitle: useUiText("admin.help", "section_analytics_title", "Analíticas y Métricas"),
    analyticsIntroTitle: useUiText("admin.help", "analytics_intro_title", "Sistema de Analíticas Propietario"),
    analyticsIntroDesc: useUiText("admin.help", "analytics_intro_desc", "La plataforma incluye un sistema de analíticas integrado que rastrea automáticamente visitas, sesiones, descargas y más, sin necesidad de servicios externos."),
    analyticsMetricsTitle: useUiText("admin.help", "analytics_metrics_title", "Métricas Disponibles"),
    analyticsMetric1: useUiText("admin.help", "analytics_metric1", "Total de Pageviews: Número total de páginas vistas"),
    analyticsMetric2: useUiText("admin.help", "analytics_metric2", "Visitantes Únicos: Usuarios diferentes que visitaron el sitio"),
    analyticsMetric3: useUiText("admin.help", "analytics_metric3", "Sesiones: Número de visitas (sesión = conjunto de pageviews)"),
    analyticsMetric4: useUiText("admin.help", "analytics_metric4", "Duración Promedio: Tiempo medio que permanecen los usuarios"),
    analyticsMetric5: useUiText("admin.help", "analytics_metric5", "Suscripciones Newsletter: Nuevos suscriptores"),
    analyticsMetric6: useUiText("admin.help", "analytics_metric6", "Descargas: Libros y archivos descargados"),
    analyticsChartsTitle: useUiText("admin.help", "analytics_charts_title", "Gráficos y Rankings"),
    analyticsChartsDesc: useUiText("admin.help", "analytics_charts_desc", "Visualiza tendencias con gráficos de pageviews, y revisa los libros y autores más visitados con rankings en tiempo real."),
    analyticsFiltersTitle: useUiText("admin.help", "analytics_filters_title", "Filtros de Fecha"),
    analyticsFiltersDesc: useUiText("admin.help", "analytics_filters_desc", "Filtra las métricas por rango de fechas para analizar períodos específicos (últimos 7 días, 30 días, o personalizado)."),
    
    // ORDERS SECTION
    sectionOrdersTitle: useUiText("admin.help", "section_orders_title", "Pedidos y Clientes"),
    ordersIntroTitle: useUiText("admin.help", "orders_intro_title", "Gestión de Pedidos"),
    ordersIntroDesc: useUiText("admin.help", "orders_intro_desc", "Administra todos los pedidos realizados en la plataforma, tanto de libros físicos como digitales."),
    ordersViewTitle: useUiText("admin.help", "orders_view_title", "Cómo revisar pedidos"),
    ordersStep1: useUiText("admin.help", "orders_step1", "Ve a 'Pedidos' en el menú lateral (sección Editorial Global)"),
    ordersStep2: useUiText("admin.help", "orders_step2", "Filtra por estado: Pendiente, Completado, Cancelado"),
    ordersStep3: useUiText("admin.help", "orders_step3", "Busca pedidos por ID o nombre de cliente"),
    ordersStep4: useUiText("admin.help", "orders_step4", "Haz clic en un pedido para ver detalles completos"),
    ordersStep5: useUiText("admin.help", "orders_step5", "Actualiza el estado del pedido según su progreso"),
    ordersDetailsTitle: useUiText("admin.help", "orders_details_title", "Información del Pedido"),
    ordersDetailsDesc: useUiText("admin.help", "orders_details_desc", "Cada pedido muestra: Cliente, dirección de envío, productos, total, transacción PayPal, formato (físico/digital) y estado actual."),
    ordersCustomersTitle: useUiText("admin.help", "orders_customers_title", "Gestión de Clientes"),
    ordersCustomersDesc: useUiText("admin.help", "orders_customers_desc", "La pestaña 'Clientes' muestra todos los compradores con su historial de pedidos y datos de contacto."),
    ordersDigitalTitle: useUiText("admin.help", "orders_digital_title", "Entrega de Productos Digitales"),
    ordersDigitalDesc: useUiText("admin.help", "orders_digital_desc", "Los productos digitales se entregan automáticamente mediante enlaces de descarga seguros de un solo uso que expiran tras el uso."),
    
    // SEARCH SECTION
    sectionSearchTitle: useUiText("admin.help", "section_search_title", "Sistema de Búsqueda Universal"),
    searchIntroTitle: useUiText("admin.help", "search_intro_title", "Búsqueda en 7 Idiomas"),
    searchIntroDesc: useUiText("admin.help", "search_intro_desc", "La plataforma incluye un sistema de búsqueda universal que funciona en todos los idiomas soportados, buscando en autores, libros y series simultáneamente."),
    searchFeaturesTitle: useUiText("admin.help", "search_features_title", "Características de Búsqueda"),
    searchFeature1: useUiText("admin.help", "search_feature1", "Búsqueda en tiempo real con debounce (300ms)"),
    searchFeature2: useUiText("admin.help", "search_feature2", "Resultados agrupados por tipo: Autores, Series, Libros"),
    searchFeature3: useUiText("admin.help", "search_feature3", "Navegación por teclado (flechas arriba/abajo, Enter)"),
    searchFeature4: useUiText("admin.help", "search_feature4", "Filtrado por categoría en la página de resultados"),
    searchFeature5: useUiText("admin.help", "search_feature5", "URLs localizadas por idioma (/es-ES/buscar, /en-US/search, etc.)"),
    searchFeature6: useUiText("admin.help", "search_feature6", "Límite de 20 resultados con contenido activo/publicado"),
    searchLocationTitle: useUiText("admin.help", "search_location_title", "Ubicación de Búsqueda"),
    searchLocationDesc: useUiText("admin.help", "search_location_desc", "La barra de búsqueda está integrada en la navegación principal (desktop y mobile). No requiere configuración adicional, funciona automáticamente."),
    
    // IMAGES SECTION
    sectionImagesTitle: useUiText("admin.help", "section_images_title", "Gestión de Imágenes"),
    imagesSystemTitle: useUiText("admin.help", "images_system_title", "Sistema de Object Storage"),
    imagesSystemDesc: useUiText("admin.help", "images_system_desc", "Todas las imágenes se almacenan en Replit Object Storage, un sistema de almacenamiento en la nube seguro y escalable."),
    imagesSpecsTitle: useUiText("admin.help", "images_specs_title", "Especificaciones Recomendadas"),
    imagesBookCoversTitle: useUiText("admin.help", "images_book_covers_title", "Portadas de Libros"),
    imagesBookCoversSize: useUiText("admin.help", "images_book_covers_size", "Proporción 2:3 (ej: 800x1200px)"),
    imagesBookCoversMax: useUiText("admin.help", "images_book_covers_max", "Máximo: 5MB"),
    imagesHeroTitle: useUiText("admin.help", "images_hero_title", "Imágenes Hero"),
    imagesHeroSize: useUiText("admin.help", "images_hero_size", "Recomendado: 1920x1080px"),
    imagesHeroMax: useUiText("admin.help", "images_hero_max", "Máximo: 10MB"),
    imagesProfileTitle: useUiText("admin.help", "images_profile_title", "Fotos de Autor"),
    imagesProfileSize: useUiText("admin.help", "images_profile_size", "Cuadradas o 3:4 (ej: 800x800px o 600x800px)"),
    imagesProfileMax: useUiText("admin.help", "images_profile_max", "Máximo: 3MB"),
    imagesBlogTitle: useUiText("admin.help", "images_blog_title", "Imágenes de Blog"),
    imagesBlogSize: useUiText("admin.help", "images_blog_size", "16:9 landscape (ej: 1200x675px)"),
    imagesBlogMax: useUiText("admin.help", "images_blog_max", "Máximo: 5MB"),
    imagesTipsTitle: useUiText("admin.help", "images_tips_title", "Consejos para optimizar imágenes"),
    imagesTip1: useUiText("admin.help", "images_tip1", "Usa formatos WebP o JPEG para mejor compresión"),
    imagesTip2: useUiText("admin.help", "images_tip2", "Optimiza antes de subir con herramientas como TinyPNG"),
    imagesTip3: useUiText("admin.help", "images_tip3", "Evita imágenes excesivamente grandes que ralenticen el sitio"),
    imagesTip4: useUiText("admin.help", "images_tip4", "Mantén proporciones consistentes en series de imágenes"),
    imagesTip5: useUiText("admin.help", "images_tip5", "Usa nombres descriptivos para facilitar la organización"),
    
    // PROMOTIONAL SECTION
    sectionPromotionalTitle: useUiText("admin.help", "section_promotional_title", "Material Promocional"),
    promotionalWhatTitle: useUiText("admin.help", "promotional_what_title", "¿Qué es el material promocional?"),
    promotionalWhatDesc: useUiText("admin.help", "promotional_what_desc", "Contenido adicional que enriquece la experiencia del lector y ayuda a promocionar los libros de manera más efectiva."),
    promotionalTypesTitle: useUiText("admin.help", "promotional_types_title", "Tipos de material disponible"),
    promotionalMapTitle: useUiText("admin.help", "promotional_map_title", "Mapa Conceptual"),
    promotionalMapDesc: useUiText("admin.help", "promotional_map_desc", "Imagen que muestra el mundo, ubicaciones o conceptos clave de la historia"),
    promotionalTreeTitle: useUiText("admin.help", "promotional_tree_title", "Árbol Genealógico"),
    promotionalTreeDesc: useUiText("admin.help", "promotional_tree_desc", "Diagrama de relaciones entre personajes"),
    promotionalPressTitle: useUiText("admin.help", "promotional_press_title", "Notas de Prensa"),
    promotionalPressDesc: useUiText("admin.help", "promotional_press_desc", "Enlaces a reseñas, entrevistas y artículos sobre el libro"),
    promotionalGraphicsTitle: useUiText("admin.help", "promotional_graphics_title", "Material Gráfico"),
    promotionalGraphicsDesc: useUiText("admin.help", "promotional_graphics_desc", "Ilustraciones, mapas y recursos visuales adicionales"),
    promotionalPlaylistTitle: useUiText("admin.help", "promotional_playlist_title", "Playlist de Spotify"),
    promotionalPlaylistDesc: useUiText("admin.help", "promotional_playlist_desc", "Lista de reproducción musical inspirada en el libro"),
    promotionalTrailerTitle: useUiText("admin.help", "promotional_trailer_title", "Booktrailer (YouTube)"),
    promotionalTrailerDesc: useUiText("admin.help", "promotional_trailer_desc", "Video promocional del libro"),
    promotionalHowToTitle: useUiText("admin.help", "promotional_how_to_title", "Cómo agregar material promocional"),
    promotionalStep1: useUiText("admin.help", "promotional_step1", "Edita el libro o serie correspondiente"),
    promotionalStep2: useUiText("admin.help", "promotional_step2", "Baja hasta la sección 'Material Promocional'"),
    promotionalStep3: useUiText("admin.help", "promotional_step3", "Sube las imágenes o introduce las URLs de Spotify/YouTube"),
    promotionalStep4: useUiText("admin.help", "promotional_step4", "Para material con texto (mapas, árboles, notas de prensa):"),
    promotionalStep4Item1: useUiText("admin.help", "promotional_step4_item1", "Sube la imagen del recurso"),
    promotionalStep4Item2: useUiText("admin.help", "promotional_step4_item2", "Opcionalmente, añade texto descriptivo en Markdown"),
    promotionalStep5: useUiText("admin.help", "promotional_step5", "Activa los toggles para mostrar cada sección en la landing"),
    promotionalDisplayTitle: useUiText("admin.help", "promotional_display_title", "Visualización pública"),
    promotionalDisplayDesc: useUiText("admin.help", "promotional_display_desc", "El material promocional aparece en la landing page del libro/serie en secciones desplegables:"),
    promotionalDisplayItem1: useUiText("admin.help", "promotional_display_item1", "Mapa Conceptual: Sección con imagen expandible"),
    promotionalDisplayItem2: useUiText("admin.help", "promotional_display_item2", "Árbol Genealógico: Sección con diagrama expandible"),
    promotionalDisplayItem3: useUiText("admin.help", "promotional_display_item3", "Booktrailer: Reproductor de YouTube embebido"),
    promotionalDisplayItem4: useUiText("admin.help", "promotional_display_item4", "Playlist: Reproductor de Spotify embebido"),
    promotionalBestPracticesTitle: useUiText("admin.help", "promotional_best_practices_title", "Mejores prácticas"),
    promotionalTip1: useUiText("admin.help", "promotional_tip1", "Sube mapas y árboles en alta resolución para que sean legibles"),
    promotionalTip2: useUiText("admin.help", "promotional_tip2", "Crea playlists en Spotify con 10-20 canciones representativas"),
    promotionalTip3: useUiText("admin.help", "promotional_tip3", "Los booktrailers cortos (1-2 minutos) funcionan mejor"),
    promotionalTip4: useUiText("admin.help", "promotional_tip4", "Las notas de prensa deben ser de fuentes verificables"),
    promotionalTip5: useUiText("admin.help", "promotional_tip5", "No todos los libros necesitan todo el material, usa lo relevante"),
    promotionalTip6: useUiText("admin.help", "promotional_tip6", "Actualiza el material para lanzamientos y ediciones especiales"),
    
    // WORKFLOW SECTION
    sectionWorkflowTitle: useUiText("admin.help", "section_workflow_title", "Flujos de Trabajo Recomendados"),
    workflowInitialTitle: useUiText("admin.help", "workflow_initial_title", "Configuración Inicial de la Editorial"),
    workflowInitialStep1: useUiText("admin.help", "workflow_initial_step1", "Configurar datos de la editorial (Configuración Editorial > Marca)"),
    workflowInitialStep2: useUiText("admin.help", "workflow_initial_step2", "Personalizar la página de inicio (Hero, Secciones, Footer)"),
    workflowInitialStep3: useUiText("admin.help", "workflow_initial_step3", "Configurar PayPal para ventas (Configuración Editorial > PayPal)"),
    workflowInitialStep4: useUiText("admin.help", "workflow_initial_step4", "Configurar proveedor de email (Configuración Editorial > Email)"),
    workflowInitialStep5: useUiText("admin.help", "workflow_initial_step5", "Crear autores (Autores > Agregar)"),
    workflowInitialStep6: useUiText("admin.help", "workflow_initial_step6", "Configurar páginas de autores (Biografía, Settings)"),
    workflowInitialStep7: useUiText("admin.help", "workflow_initial_step7", "Revisar y ajustar traducciones según mercados objetivo"),
    workflowPromoteTitle: useUiText("admin.help", "workflow_promote_title", "Lanzamiento de un Nuevo Libro"),
    workflowPromoteStep1: useUiText("admin.help", "workflow_promote_step1", "Crear el libro con toda la información básica"),
    workflowPromoteStep2: useUiText("admin.help", "workflow_promote_step2", "Configurar ventas y subir archivos digitales (si aplica)"),
    workflowPromoteStep3: useUiText("admin.help", "workflow_promote_step3", "Personalizar la landing page del libro"),
    workflowPromoteStep4: useUiText("admin.help", "workflow_promote_step4", "Agregar material promocional completo"),
    workflowPromoteStep5: useUiText("admin.help", "workflow_promote_step5", "Crear artículos de blog sobre el lanzamiento"),
    workflowPromoteStep6: useUiText("admin.help", "workflow_promote_step6", "Generar código QR para promoción física"),
    workflowPromoteStep7: useUiText("admin.help", "workflow_promote_step7", "Publicar y compartir en redes sociales del autor"),
    
    // FINAL TIP
    finalTipTitle: useUiText("admin.help", "final_tip_title", "💡 Consejo Final"),
    finalTipDesc: useUiText("admin.help", "final_tip_desc", "Esta plataforma es muy completa y puede parecer abrumadora al principio. Tómate tu tiempo para explorar cada sección, y no dudes en experimentar. Todos los cambios son reversibles y puedes previsualizarlos antes de publicarlos. ¡Éxito con tu editorial!"),
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg" data-testid="header-help">
        <h2 className="text-3xl font-bold mb-2" data-testid="title-help">{t.pageTitle}</h2>
        <p className="text-primary-foreground/90" data-testid="description-help">
          {t.pageDescription}
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* AUTHORS SECTION */}
        <AccordionItem value="authors" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-authors">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionAuthorsTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.authorsHowToCreateTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.authorsStep1}</li>
                <li>{t.authorsStep2}</li>
                <li>{t.authorsStep3}</li>
                <li>{t.authorsStep4}</li>
                <li>{t.authorsStep5}</li>
                <li>{t.authorsStep6}</li>
                <li>{t.authorsStep7}</li>
                <li>{t.authorsStep8}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.authorsSeoTitle}</h4>
              <p className="text-muted-foreground">
                {t.authorsSeoDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.authorsBackgroundTitle}</h4>
              <p className="text-muted-foreground">
                {t.authorsBackgroundDesc}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* BOOKS SECTION */}
        <AccordionItem value="books" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-books">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionBooksTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.booksHowToAddTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.booksStep1}</li>
                <li>{t.booksStep2}
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.booksStep2Item1}</li>
                    <li>{t.booksStep2Item2}</li>
                    <li>{t.booksStep2Item3}</li>
                    <li>{t.booksStep2Item4}</li>
                    <li>{t.booksStep2Item5}</li>
                  </ul>
                </li>
                <li>{t.booksStep3}</li>
                <li>{t.booksStep4}</li>
                <li>{t.booksStep5}
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.booksStep5Item1}</li>
                    <li>{t.booksStep5Item2}</li>
                    <li>{t.booksStep5Item3}</li>
                    <li>{t.booksStep5Item4}</li>
                    <li>{t.booksStep5Item5}</li>
                    <li>{t.booksStep5Item6}</li>
                    <li>{t.booksStep5Item7}</li>
                    <li>{t.booksStep5Item8}</li>
                  </ul>
                </li>
                <li>{t.booksStep6}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t.booksSalesTitle}
              </h4>
              <p className="text-muted-foreground">
                {t.booksSalesDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.booksQrTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.booksQrStep1}</li>
                <li>{t.booksQrStep2}</li>
                <li>{t.booksQrStep3}</li>
                <li>{t.booksQrStep4}</li>
                <li>{t.booksQrStep5}</li>
                <li><strong>{t.booksQrStep6Strong}</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.booksQrStep6Item1}</li>
                    <li>{t.booksQrStep6Item2}</li>
                    <li>{t.booksQrStep6Item3}</li>
                    <li>{t.booksQrStep6Item4}</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.booksImageSpecsTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.booksImageSpec1}</li>
                <li>{t.booksImageSpec2}</li>
                <li>{t.booksImageSpec3}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SERIES SECTION */}
        <AccordionItem value="series" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-series">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionSeriesTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.seriesHowToCreateTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.seriesStep1}</li>
                <li>{t.seriesStep2}</li>
                <li>{t.seriesStep3}</li>
                <li>{t.seriesStep4}</li>
                <li>{t.seriesStep5}</li>
                <li>{t.seriesStep6}</li>
                <li>{t.seriesStep7}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.seriesMultiAuthorTitle}</h4>
              <p className="text-muted-foreground">
                {t.seriesMultiAuthorDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.seriesBackgroundTitle}</h4>
              <p className="text-muted-foreground">
                {t.seriesBackgroundDesc}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* BIO SECTION */}
        <AccordionItem value="bio" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-bio">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionBioTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.bioHowToEditTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.bioStep1}</li>
                <li>{t.bioStep2}</li>
                <li>{t.bioStep3}</li>
                <li>{t.bioStep4}</li>
                <li>{t.bioStep5}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.bioTipsTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.bioTip1}</li>
                <li>{t.bioTip2}</li>
                <li>{t.bioTip3}</li>
                <li>{t.bioTip4}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* TESTIMONIALS SECTION */}
        <AccordionItem value="testimonials" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-testimonials">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionTestimonialsTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.testimonialsHowToAddTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.testimonialsStep1}</li>
                <li>{t.testimonialsStep2}</li>
                <li>{t.testimonialsStep3}</li>
                <li>{t.testimonialsStep4}</li>
                <li>{t.testimonialsStep5}</li>
                <li>{t.testimonialsStep6}</li>
                <li>{t.testimonialsStep7}</li>
                <li>{t.testimonialsStep8}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.testimonialsBestPracticesTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.testimonialsTip1}</li>
                <li>{t.testimonialsTip2}</li>
                <li>{t.testimonialsTip3}</li>
                <li>{t.testimonialsTip4}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* BLOG SECTION */}
        <AccordionItem value="blog" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-blog">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionBlogTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.blogHowToCreateTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.blogStep1}</li>
                <li>{t.blogStep2}</li>
                <li>{t.blogStep3}</li>
                <li>{t.blogStep4}</li>
                <li>{t.blogStep5}</li>
                <li>{t.blogStep6}</li>
                <li>{t.blogStep7}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.blogIdeasTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.blogIdea1}</li>
                <li>{t.blogIdea2}</li>
                <li>{t.blogIdea3}</li>
                <li>{t.blogIdea4}</li>
                <li>{t.blogIdea5}</li>
                <li>{t.blogIdea6}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SETTINGS (AUTHOR) SECTION */}
        <AccordionItem value="settings" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-settings">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionSettingsTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.settingsGeneralTitle}</h4>
              <p className="text-muted-foreground mb-2">{t.settingsGeneralDesc}</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.settingsTab1}</li>
                <li>{t.settingsTab2}</li>
                <li>{t.settingsTab3}</li>
                <li>{t.settingsTab4}</li>
                <li>{t.settingsTab5}</li>
                <li>{t.settingsTab6}</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t.settingsNewsletterTitle}
              </h4>
              <p className="text-muted-foreground">
                {t.settingsNewsletterDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.settingsApiKeyTitle}</h4>
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  {t.settingsApiKeyDesc}
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* EDITORIAL SETTINGS SECTION */}
        <AccordionItem value="editorial" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-editorial">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionEditorialTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.editorialDescTitle}</h4>
              <p className="text-muted-foreground mb-3">
                {t.editorialDescText}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.editorialTabsTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.editorialTab1}</li>
                <li>{t.editorialTab2}</li>
                <li>{t.editorialTab3}</li>
                <li>{t.editorialTab4}</li>
                <li>{t.editorialTab5}</li>
                <li>{t.editorialTab6}</li>
                <li>{t.editorialTab7}</li>
                <li>{t.editorialTab8}</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t.editorialPaypalTitle}
              </h4>
              <p className="text-muted-foreground">
                {t.editorialPaypalDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t.editorialCurrencyTitle}
              </h4>
              <p className="text-muted-foreground">
                {t.editorialCurrencyDesc}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* TRANSLATIONS SECTION */}
        <AccordionItem value="translations" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-translations">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionTranslationsTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.translationsIntroTitle}</h4>
              <p className="text-muted-foreground mb-3">
                {t.translationsIntroDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.translationsContentTitle}</h4>
              <p className="text-muted-foreground mb-3">
                {t.translationsContentDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.translationsManagementTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.translationsStep1}</li>
                <li>{t.translationsStep2}</li>
                <li>{t.translationsStep3}</li>
                <li>{t.translationsStep4}</li>
                <li>{t.translationsStep5}</li>
                <li>{t.translationsStep6}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.translationsUrlsTitle}</h4>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  {t.translationsUrlsDesc}
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* UI TEXTS SECTION */}
        <AccordionItem value="ui-texts" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-ui-texts">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionUiTextsTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.uiTextsWhatTitle}</h4>
              <p className="text-muted-foreground mb-3">
                {t.uiTextsWhatDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.uiTextsNamespacesTitle}</h4>
              <p className="text-muted-foreground mb-3">
                {t.uiTextsNamespacesDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.uiTextsHowToTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.uiTextsStep1}</li>
                <li>{t.uiTextsStep2}</li>
                <li>{t.uiTextsStep3}</li>
                <li>{t.uiTextsStep4}</li>
                <li>{t.uiTextsStep5}</li>
                <li>{t.uiTextsStep6}</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ANALYTICS SECTION */}
        <AccordionItem value="analytics" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-analytics">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionAnalyticsTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.analyticsIntroTitle}</h4>
              <p className="text-muted-foreground mb-3">
                {t.analyticsIntroDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.analyticsMetricsTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.analyticsMetric1}</li>
                <li>{t.analyticsMetric2}</li>
                <li>{t.analyticsMetric3}</li>
                <li>{t.analyticsMetric4}</li>
                <li>{t.analyticsMetric5}</li>
                <li>{t.analyticsMetric6}</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.analyticsChartsTitle}</h4>
              <p className="text-muted-foreground">
                {t.analyticsChartsDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.analyticsFiltersTitle}</h4>
              <p className="text-muted-foreground">
                {t.analyticsFiltersDesc}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ORDERS SECTION */}
        <AccordionItem value="orders" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-orders">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionOrdersTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.ordersIntroTitle}</h4>
              <p className="text-muted-foreground mb-3">
                {t.ordersIntroDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.ordersViewTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.ordersStep1}</li>
                <li>{t.ordersStep2}</li>
                <li>{t.ordersStep3}</li>
                <li>{t.ordersStep4}</li>
                <li>{t.ordersStep5}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.ordersDetailsTitle}</h4>
              <p className="text-muted-foreground">
                {t.ordersDetailsDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.ordersCustomersTitle}</h4>
              <p className="text-muted-foreground">
                {t.ordersCustomersDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.ordersDigitalTitle}</h4>
              <p className="text-muted-foreground">
                {t.ordersDigitalDesc}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEARCH SECTION */}
        <AccordionItem value="search" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-search">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionSearchTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.searchIntroTitle}</h4>
              <p className="text-muted-foreground mb-3">
                {t.searchIntroDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.searchFeaturesTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.searchFeature1}</li>
                <li>{t.searchFeature2}</li>
                <li>{t.searchFeature3}</li>
                <li>{t.searchFeature4}</li>
                <li>{t.searchFeature5}</li>
                <li>{t.searchFeature6}</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.searchLocationTitle}</h4>
              <p className="text-muted-foreground">
                {t.searchLocationDesc}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* IMAGES SECTION */}
        <AccordionItem value="images" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-images">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionImagesTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t.imagesSystemTitle}
              </h4>
              <p className="text-muted-foreground mb-3">
                {t.imagesSystemDesc}
              </p>
              
              <h4 className="font-semibold mb-2">{t.imagesSpecsTitle}</h4>
              <div className="space-y-2 text-muted-foreground">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">{t.imagesBookCoversTitle}</p>
                    <p className="text-sm">{t.imagesBookCoversSize}</p>
                    <p className="text-sm">{t.imagesBookCoversMax}</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">{t.imagesHeroTitle}</p>
                    <p className="text-sm">{t.imagesHeroSize}</p>
                    <p className="text-sm">{t.imagesHeroMax}</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">{t.imagesProfileTitle}</p>
                    <p className="text-sm">{t.imagesProfileSize}</p>
                    <p className="text-sm">{t.imagesProfileMax}</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">{t.imagesBlogTitle}</p>
                    <p className="text-sm">{t.imagesBlogSize}</p>
                    <p className="text-sm">{t.imagesBlogMax}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.imagesTipsTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.imagesTip1}</li>
                <li>{t.imagesTip2}</li>
                <li>{t.imagesTip3}</li>
                <li>{t.imagesTip4}</li>
                <li>{t.imagesTip5}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PROMOTIONAL SECTION */}
        <AccordionItem value="promotional" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-promotional">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionPromotionalTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.promotionalWhatTitle}</h4>
              <p className="text-muted-foreground mb-3">
                {t.promotionalWhatDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.promotionalTypesTitle}</h4>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">{t.promotionalMapTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalMapDesc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.promotionalTreeTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalTreeDesc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.promotionalPressTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalPressDesc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.promotionalGraphicsTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalGraphicsDesc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.promotionalPlaylistTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalPlaylistDesc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.promotionalTrailerTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalTrailerDesc}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.promotionalHowToTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.promotionalStep1}</li>
                <li>{t.promotionalStep2}</li>
                <li>{t.promotionalStep3}</li>
                <li>{t.promotionalStep4}
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.promotionalStep4Item1}</li>
                    <li>{t.promotionalStep4Item2}</li>
                  </ul>
                </li>
                <li>{t.promotionalStep5}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.promotionalDisplayTitle}</h4>
              <p className="text-muted-foreground mb-2">
                {t.promotionalDisplayDesc}
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.promotionalDisplayItem1}</li>
                <li>{t.promotionalDisplayItem2}</li>
                <li>{t.promotionalDisplayItem3}</li>
                <li>{t.promotionalDisplayItem4}</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.promotionalBestPracticesTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.promotionalTip1}</li>
                <li>{t.promotionalTip2}</li>
                <li>{t.promotionalTip3}</li>
                <li>{t.promotionalTip4}</li>
                <li>{t.promotionalTip5}</li>
                <li>{t.promotionalTip6}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* WORKFLOW SECTION */}
        <AccordionItem value="workflow" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-workflow">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionWorkflowTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.workflowInitialTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.workflowInitialStep1}</li>
                <li>{t.workflowInitialStep2}</li>
                <li>{t.workflowInitialStep3}</li>
                <li>{t.workflowInitialStep4}</li>
                <li>{t.workflowInitialStep5}</li>
                <li>{t.workflowInitialStep6}</li>
                <li>{t.workflowInitialStep7}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.workflowPromoteTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.workflowPromoteStep1}</li>
                <li>{t.workflowPromoteStep2}</li>
                <li>{t.workflowPromoteStep3}</li>
                <li>{t.workflowPromoteStep4}</li>
                <li>{t.workflowPromoteStep5}</li>
                <li>{t.workflowPromoteStep6}</li>
                <li>{t.workflowPromoteStep7}</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" data-testid="card-final-tip">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">{t.finalTipTitle}</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200" data-testid="content-final-tip">
          <p>
            {t.finalTipDesc}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
