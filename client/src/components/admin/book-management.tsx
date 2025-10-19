import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Upload, Copy, Download, QrCode, Package, FileText, AlertCircle } from "lucide-react";
import { useAdminAuthor } from "@/contexts/admin-author-context";
import { useUiText } from "@/contexts/ui-text-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

const bookFormSchema = insertBookSchema.extend({
  digitalFileEpub: z.string().nullable().optional(),
  digitalFilePdf: z.string().nullable().optional(),
  digitalFileMobi: z.string().nullable().optional(),
  digitalFileAzw3: z.string().nullable().optional(),
});

type BookFormData = z.infer<typeof bookFormSchema>;

export default function BookManagement() {
  const { selectedAuthorId } = useAdminAuthor();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreUrl, setNewStoreUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const t = {
    // Toast Messages - Create
    toastCreateTitle: useUiText("admin.books", "toast_create_title", "Libro creado"),
    toastCreateDescription: useUiText("admin.books", "toast_create_description", "El libro ha sido creado exitosamente."),
    toastCreateErrorTitle: useUiText("admin.books", "toast_create_error_title", "Error"),
    toastCreateErrorDescription: useUiText("admin.books", "toast_create_error_description", "No se pudo crear el libro."),
    // Toast Messages - Update
    toastUpdateTitle: useUiText("admin.books", "toast_update_title", "Libro actualizado"),
    toastUpdateDescription: useUiText("admin.books", "toast_update_description", "El libro ha sido actualizado exitosamente."),
    toastUpdateErrorTitle: useUiText("admin.books", "toast_update_error_title", "Error"),
    toastUpdateErrorDescription: useUiText("admin.books", "toast_update_error_description", "No se pudo actualizar el libro."),
    // Toast Messages - Delete
    toastDeleteTitle: useUiText("admin.books", "toast_delete_title", "Libro eliminado"),
    toastDeleteDescription: useUiText("admin.books", "toast_delete_description", "El libro ha sido eliminado exitosamente."),
    toastDeleteErrorTitle: useUiText("admin.books", "toast_delete_error_title", "Error"),
    toastDeleteErrorDescription: useUiText("admin.books", "toast_delete_error_description", "No se pudo eliminar el libro."),
    // Toast Messages - Image Upload
    toastImageUploadTitle: useUiText("admin.books", "toast_image_upload_title", "Imagen subida"),
    toastImageUploadDescription: useUiText("admin.books", "toast_image_upload_description", "La imagen ha sido subida exitosamente."),
    toastImageUploadErrorTitle: useUiText("admin.books", "toast_image_upload_error_title", "Error"),
    toastImageUploadErrorDescription: useUiText("admin.books", "toast_image_upload_error_description", "Error al procesar la imagen subida."),
    // Toast Messages - Digital Files
    toastEpubUploadTitle: useUiText("admin.books", "toast_epub_upload_title", "Archivo EPUB subido"),
    toastEpubUploadDescription: useUiText("admin.books", "toast_epub_upload_description", "El archivo EPUB ha sido subido exitosamente."),
    toastPdfUploadTitle: useUiText("admin.books", "toast_pdf_upload_title", "Archivo PDF subido"),
    toastPdfUploadDescription: useUiText("admin.books", "toast_pdf_upload_description", "El archivo PDF ha sido subido exitosamente."),
    toastMobiUploadTitle: useUiText("admin.books", "toast_mobi_upload_title", "Archivo MOBI subido"),
    toastMobiUploadDescription: useUiText("admin.books", "toast_mobi_upload_description", "El archivo MOBI ha sido subido exitosamente."),
    toastAzw3UploadTitle: useUiText("admin.books", "toast_azw3_upload_title", "Archivo AZW3 subido"),
    toastAzw3UploadDescription: useUiText("admin.books", "toast_azw3_upload_description", "El archivo AZW3 ha sido subido exitosamente."),
    // Toast Messages - QR Code
    toastQrErrorTitle: useUiText("admin.books", "toast_qr_error_title", "Error"),
    toastQrErrorDescription: useUiText("admin.books", "toast_qr_error_description", "No se pudo generar el código QR"),
    toastUrlCopiedTitle: useUiText("admin.books", "toast_url_copied_title", "Enlace copiado"),
    toastUrlCopiedDescription: useUiText("admin.books", "toast_url_copied_description", "La URL de la landing page se ha copiado al portapapeles."),
    toastQrDownloadedTitle: useUiText("admin.books", "toast_qr_downloaded_title", "QR descargado"),
    toastQrDownloadedDescription: useUiText("admin.books", "toast_qr_downloaded_description", "El código QR se ha descargado exitosamente."),
    // Toast Messages - Validation
    toastValidationErrorTitle: useUiText("admin.books", "toast_validation_error_title", "Error de validación"),
    toastValidationSaleFormat: useUiText("admin.books", "toast_validation_sale_format", "Debes habilitar al menos un formato de venta (físico o digital) cuando la venta directa está activa"),
    toastValidationDigitalFile: useUiText("admin.books", "toast_validation_digital_file", "Se requiere al menos un archivo digital cuando el formato digital está habilitado"),
    toastStoreLinkErrorTitle: useUiText("admin.books", "toast_store_link_error_title", "Error"),
    toastStoreLinkErrorDescription: useUiText("admin.books", "toast_store_link_error_description", "El nombre y la URL de la tienda son requeridos"),
    // Utility Functions
    seriesStandalone: useUiText("admin.books", "series_standalone", "Independiente"),
    seriesUnknown: useUiText("admin.books", "series_unknown", "Serie desconocida"),
    // Main UI
    pageTitle: useUiText("admin.books", "page_title", "Gestión de Libros"),
    buttonAddBook: useUiText("admin.books", "button_add_book", "Agregar Libro"),
    placeholderSearch: useUiText("admin.books", "placeholder_search", "Buscar libros..."),
    filterAllGenres: useUiText("admin.books", "filter_all_genres", "Todos los géneros"),
    // Table Headers
    tableHeaderCover: useUiText("admin.books", "table_header_cover", "Portada"),
    tableHeaderTitle: useUiText("admin.books", "table_header_title", "Título"),
    tableHeaderSeries: useUiText("admin.books", "table_header_series", "Serie"),
    tableHeaderGenre: useUiText("admin.books", "table_header_genre", "Género"),
    tableHeaderStatus: useUiText("admin.books", "table_header_status", "Estado"),
    tableHeaderActions: useUiText("admin.books", "table_header_actions", "Acciones"),
    // Badges/Status
    badgePublished: useUiText("admin.books", "badge_published", "Publicado"),
    badgeDraft: useUiText("admin.books", "badge_draft", "Borrador"),
    badgeStandalone: useUiText("admin.books", "badge_standalone", "Independiente"),
    badgeBookNumber: useUiText("admin.books", "badge_book_number", "Libro #"),
    // Action Buttons
    buttonEdit: useUiText("admin.books", "button_edit", "Editar"),
    buttonDelete: useUiText("admin.books", "button_delete", "Eliminar"),
    // Delete Confirmation
    confirmDelete: useUiText("admin.books", "confirm_delete", "¿Estás seguro de que quieres eliminar este libro?"),
    // Modal Titles
    modalTitleEdit: useUiText("admin.books", "modal_title_edit", "Editar Libro"),
    modalTitleAdd: useUiText("admin.books", "modal_title_add", "Agregar Libro"),
    // Tabs
    tabBasicInfo: useUiText("admin.books", "tab_basic_info", "Información Básica"),
    tabLandingPage: useUiText("admin.books", "tab_landing_page", "Landing Page"),
    tabPromoMaterial: useUiText("admin.books", "tab_promo_material", "Material Promocional"),
    tabSeo: useUiText("admin.books", "tab_seo", "SEO"),
    tabQrLinks: useUiText("admin.books", "tab_qr_links", "QR y Enlaces"),
    // Basic Info - Labels
    labelTitle: useUiText("admin.books", "label_title", "Título"),
    labelDescription: useUiText("admin.books", "label_description", "Descripción"),
    labelGenre: useUiText("admin.books", "label_genre", "Género"),
    labelPrice: useUiText("admin.books", "label_price", "Precio"),
    labelSeries: useUiText("admin.books", "label_series", "Serie"),
    labelOrderInSeries: useUiText("admin.books", "label_order_in_series", "Orden en la Serie"),
    labelStandalone: useUiText("admin.books", "label_standalone", "Libro independiente"),
    labelPublished: useUiText("admin.books", "label_published", "Publicado"),
    labelCoverImage: useUiText("admin.books", "label_cover_image", "Imagen de Portada"),
    labelAmazonUrl: useUiText("admin.books", "label_amazon_url", "URL de Amazon"),
    // Basic Info - Placeholders
    placeholderTitle: useUiText("admin.books", "placeholder_title", "Título del libro"),
    placeholderDescription: useUiText("admin.books", "placeholder_description", "Descripción detallada del libro..."),
    placeholderGenre: useUiText("admin.books", "placeholder_genre", "Ej: Fantasía, Thriller..."),
    placeholderPrice: useUiText("admin.books", "placeholder_price", "0.00"),
    placeholderSelectSeries: useUiText("admin.books", "placeholder_select_series", "Seleccionar serie"),
    placeholderOrder: useUiText("admin.books", "placeholder_order", "1"),
    placeholderCoverUrl: useUiText("admin.books", "placeholder_cover_url", "URL de la portada"),
    placeholderAmazonUrl: useUiText("admin.books", "placeholder_amazon_url", "https://amazon.com/..."),
    // Basic Info - Descriptions
    descriptionStandalone: useUiText("admin.books", "description_standalone", "Si el libro no pertenece a ninguna serie"),
    descriptionPublished: useUiText("admin.books", "description_published", "Controla si el libro es visible en el sitio público"),
    descriptionCoverUpload: useUiText("admin.books", "description_cover_upload", "Haz clic para subir una imagen de portada"),
    descriptionAmazonUrl: useUiText("admin.books", "description_amazon_url", "Enlace para comprar en Amazon"),
    // Series Options
    seriesOptionNone: useUiText("admin.books", "series_option_none", "Sin serie (independiente)"),
    // Direct Sale Section
    sectionDirectSaleTitle: useUiText("admin.books", "section_direct_sale_title", "Venta Directa"),
    sectionDirectSaleDescription: useUiText("admin.books", "section_direct_sale_description", "Configura la venta directa de este libro en la plataforma."),
    labelDirectSaleEnabled: useUiText("admin.books", "label_direct_sale_enabled", "Habilitar venta directa"),
    descriptionDirectSaleEnabled: useUiText("admin.books", "description_direct_sale_enabled", "Permite vender este libro directamente en la plataforma"),
    labelDirectSalePrice: useUiText("admin.books", "label_direct_sale_price", "Precio de Venta *"),
    labelDirectSaleStock: useUiText("admin.books", "label_direct_sale_stock", "Stock Disponible *"),
    sectionSaleFormats: useUiText("admin.books", "section_sale_formats", "Formatos de Venta"),
    descriptionSaleFormats: useUiText("admin.books", "description_sale_formats", "Selecciona qué formatos quieres ofrecer"),
    labelSaleFormatPhysical: useUiText("admin.books", "label_sale_format_physical", "Vender formato físico"),
    descriptionSaleFormatPhysical: useUiText("admin.books", "description_sale_format_physical", "Libro físico enviado por correo"),
    labelSaleFormatDigital: useUiText("admin.books", "label_sale_format_digital", "Vender formato digital"),
    descriptionSaleFormatDigital: useUiText("admin.books", "description_sale_format_digital", "Archivo digital descargable (requiere configurar archivo digital abajo)"),
    alertSelectFormatTitle: useUiText("admin.books", "alert_select_format_title", "Selecciona al menos un formato"),
    alertSelectFormatDescription: useUiText("admin.books", "alert_select_format_description", "Debes habilitar al menos un formato de venta (físico o digital)"),
    // Digital File Section
    sectionDigitalFileTitle: useUiText("admin.books", "section_digital_file_title", "Archivo Digital"),
    sectionDigitalFileDescription: useUiText("admin.books", "section_digital_file_description", "Configura el archivo digital para descarga después de la compra."),
    labelIsDigitalProduct: useUiText("admin.books", "label_is_digital_product", "Es producto digital"),
    descriptionIsDigitalProduct: useUiText("admin.books", "description_is_digital_product", "Marca si este libro es un producto digital descargable"),
    digitalFilesIntro: useUiText("admin.books", "digital_files_intro", "Sube archivos en los formatos que desees ofrecer. Puedes subir múltiples formatos."),
    // Digital Files - Individual formats
    labelDigitalFileEpub: useUiText("admin.books", "label_digital_file_epub", "Archivo EPUB"),
    placeholderDigitalFileEpub: useUiText("admin.books", "placeholder_digital_file_epub", "URL del archivo EPUB"),
    buttonUpload: useUiText("admin.books", "button_upload", "Subir"),
    descriptionEpub: useUiText("admin.books", "description_epub", "Formato compatible con la mayoría de lectores"),
    labelDigitalFilePdf: useUiText("admin.books", "label_digital_file_pdf", "Archivo PDF"),
    placeholderDigitalFilePdf: useUiText("admin.books", "placeholder_digital_file_pdf", "URL del archivo PDF"),
    descriptionPdf: useUiText("admin.books", "description_pdf", "Formato universal compatible con todos los dispositivos"),
    labelDigitalFileMobi: useUiText("admin.books", "label_digital_file_mobi", "Archivo MOBI"),
    placeholderDigitalFileMobi: useUiText("admin.books", "placeholder_digital_file_mobi", "URL del archivo MOBI"),
    descriptionMobi: useUiText("admin.books", "description_mobi", "Formato compatible con Kindle (versiones antiguas)"),
    labelDigitalFileAzw3: useUiText("admin.books", "label_digital_file_azw3", "Archivo AZW3"),
    placeholderDigitalFileAzw3: useUiText("admin.books", "placeholder_digital_file_azw3", "URL del archivo AZW3"),
    descriptionAzw3: useUiText("admin.books", "description_azw3", "Formato Kindle Format 8 (KF8) para dispositivos modernos"),
    digitalFilesStorageInfo: useUiText("admin.books", "digital_files_storage_info", "Todos los archivos se almacenan de forma segura en Object Storage privado (máx 50 MB por archivo)."),
    // SEO Section
    sectionSeoTitle: useUiText("admin.books", "section_seo_title", "SEO - Optimización para Buscadores"),
    sectionSeoDescription: useUiText("admin.books", "section_seo_description", "Configura cómo aparecerá la página del libro en Google y redes sociales."),
    labelSeoTitle: useUiText("admin.books", "label_seo_title", "Título SEO"),
    descriptionSeoTitleAuto: useUiText("admin.books", "description_seo_title_auto", "Deja vacío para usar automáticamente:"),
    labelSeoDescription: useUiText("admin.books", "label_seo_description", "Descripción SEO"),
    placeholderSeoDescription: useUiText("admin.books", "placeholder_seo_description", "Descripción breve para buscadores (150-160 caracteres)"),
    descriptionSeoDescriptionChars: useUiText("admin.books", "description_seo_description_chars", "caracteres. Deja vacío para usar la descripción del libro."),
    labelSeoKeywords: useUiText("admin.books", "label_seo_keywords", "Palabras Clave SEO"),
    placeholderSeoKeywords: useUiText("admin.books", "placeholder_seo_keywords", "novela, fantasía, aventura, etc."),
    descriptionSeoKeywords: useUiText("admin.books", "description_seo_keywords", "Separa las palabras clave con comas. Se incluirá automáticamente el título y género."),
    // Background Section
    sectionBackgroundTitle: useUiText("admin.books", "section_background_title", "Personalización de Fondo"),
    sectionBackgroundDescription: useUiText("admin.books", "section_background_description", "Configura el fondo personalizado para la página del libro."),
    labelBgImage: useUiText("admin.books", "label_bg_image", "URL de Imagen de Fondo"),
    placeholderBgImage: useUiText("admin.books", "placeholder_bg_image", "https://... o /objects/..."),
    descriptionBgImage: useUiText("admin.books", "description_bg_image", "Deja vacío para usar el fondo del tema del autor"),
    labelBgColor: useUiText("admin.books", "label_bg_color", "Color de Fondo (Opcional)"),
    placeholderBgColor: useUiText("admin.books", "placeholder_bg_color", "#RRGGBB"),
    descriptionBgColor: useUiText("admin.books", "description_bg_color", "Se usará si no hay imagen. Deja vacío para tema del autor."),
    // Landing Page - Hero
    sectionLandingHeroTitle: useUiText("admin.books", "section_landing_hero_title", "Hero de la Landing Page"),
    sectionLandingHeroDescription: useUiText("admin.books", "section_landing_hero_description", "Imagen y texto principal que verán los lectores al entrar"),
    labelLandingHeroImage: useUiText("admin.books", "label_landing_hero_image", "Imagen Hero"),
    descriptionLandingHeroUpload: useUiText("admin.books", "description_landing_hero_upload", "Imagen destacada (recomendado: 1920x1080px)"),
    labelLandingTagline: useUiText("admin.books", "label_landing_tagline", "Tagline"),
    placeholderLandingTagline: useUiText("admin.books", "placeholder_landing_tagline", "Una frase impactante que describa el libro"),
    descriptionLandingTagline: useUiText("admin.books", "description_landing_tagline", "Frase corta y memorable que capture la esencia"),
    // Landing Page - Synopsis
    sectionLandingSynopsisTitle: useUiText("admin.books", "section_landing_synopsis_title", "Sinopsis Extendida"),
    labelLandingSynopsis: useUiText("admin.books", "label_landing_synopsis", "Sinopsis para Landing"),
    placeholderLandingSynopsis: useUiText("admin.books", "placeholder_landing_synopsis", "Escribe una sinopsis atractiva y detallada..."),
    descriptionLandingSynopsis: useUiText("admin.books", "description_landing_synopsis", "Puedes usar Markdown para formato"),
    // Landing Page - Features
    sectionLandingFeaturesTitle: useUiText("admin.books", "section_landing_features_title", "Características Destacadas"),
    labelLandingFeatures: useUiText("admin.books", "label_landing_features", "Características"),
    placeholderLandingFeature: useUiText("admin.books", "placeholder_landing_feature", "Ej: Más de 500 páginas de aventuras épicas"),
    buttonAddFeature: useUiText("admin.books", "button_add_feature", "Agregar característica"),
    // Landing Page - Quotes
    sectionLandingQuotesTitle: useUiText("admin.books", "section_landing_quotes_title", "Citas del Libro"),
    labelLandingQuotes: useUiText("admin.books", "label_landing_quotes", "Citas Memorables"),
    placeholderLandingQuote: useUiText("admin.books", "placeholder_landing_quote", "Escribe una cita impactante del libro..."),
    buttonAddQuote: useUiText("admin.books", "button_add_quote", "Agregar cita"),
    // Landing Page - CTA
    sectionLandingCtaTitle: useUiText("admin.books", "section_landing_cta_title", "Call to Action"),
    labelLandingCta: useUiText("admin.books", "label_landing_cta", "Texto del Botón CTA"),
    placeholderLandingCta: useUiText("admin.books", "placeholder_landing_cta", "Ej: Consigue tu copia ahora"),
    descriptionLandingCta: useUiText("admin.books", "description_landing_cta", "Texto del botón principal de acción"),
    // Landing Page - Gallery
    sectionLandingGalleryTitle: useUiText("admin.books", "section_landing_gallery_title", "Galería de Imágenes"),
    labelLandingGallery: useUiText("admin.books", "label_landing_gallery", "URLs de Galería"),
    placeholderLandingGalleryUrl: useUiText("admin.books", "placeholder_landing_gallery_url", "URL de la imagen"),
    buttonAddGalleryImage: useUiText("admin.books", "button_add_gallery_image", "Agregar imagen a galería"),
    // Landing Page - Awards
    sectionLandingAwardsTitle: useUiText("admin.books", "section_landing_awards_title", "Premios y Reconocimientos"),
    labelLandingAwards: useUiText("admin.books", "label_landing_awards", "Premios"),
    placeholderLandingAward: useUiText("admin.books", "placeholder_landing_award", "Ej: Ganador del Premio XYZ 2023"),
    buttonAddAward: useUiText("admin.books", "button_add_award", "Agregar premio"),
    // Promo Material - Concept Map
    sectionPromoConceptMapTitle: useUiText("admin.books", "section_promo_concept_map_title", "Mapa Conceptual"),
    labelPromoConceptMap: useUiText("admin.books", "label_promo_concept_map", "URL del Mapa Conceptual"),
    descriptionPromoConceptMapUpload: useUiText("admin.books", "description_promo_concept_map_upload", "Imagen del mapa conceptual del universo/historia"),
    labelShowConceptMap: useUiText("admin.books", "label_show_concept_map", "Mostrar mapa conceptual"),
    descriptionShowConceptMap: useUiText("admin.books", "description_show_concept_map", "Si está activo, el mapa se mostrará en la landing"),
    // Promo Material - Family Tree
    sectionPromoFamilyTreeTitle: useUiText("admin.books", "section_promo_family_tree_title", "Árbol Genealógico"),
    labelPromoFamilyTree: useUiText("admin.books", "label_promo_family_tree", "URL del Árbol Genealógico"),
    descriptionPromoFamilyTreeUpload: useUiText("admin.books", "description_promo_family_tree_upload", "Imagen del árbol genealógico de personajes"),
    labelShowFamilyTree: useUiText("admin.books", "label_show_family_tree", "Mostrar árbol genealógico"),
    descriptionShowFamilyTree: useUiText("admin.books", "description_show_family_tree", "Si está activo, el árbol se mostrará en la landing"),
    // Promo Material - Press Notes
    sectionPromoPressNotesTitle: useUiText("admin.books", "section_promo_press_notes_title", "Notas de Prensa"),
    labelPromoPressNotes: useUiText("admin.books", "label_promo_press_notes", "Notas de Prensa / Reseñas"),
    placeholderPressNote: useUiText("admin.books", "placeholder_press_note", 'Ej: "Una obra maestra" - El Periódico'),
    buttonAddPressNote: useUiText("admin.books", "button_add_press_note", "Agregar nota de prensa"),
    labelShowPressNotes: useUiText("admin.books", "label_show_press_notes", "Mostrar notas de prensa"),
    descriptionShowPressNotes: useUiText("admin.books", "description_show_press_notes", "Si está activo, las notas se mostrarán en la landing"),
    // Promo Material - Additional Media
    sectionPromoAdditionalMediaTitle: useUiText("admin.books", "section_promo_additional_media_title", "Medios Adicionales"),
    labelPromoAdditionalMedia: useUiText("admin.books", "label_promo_additional_media", "URLs de Medios Adicionales"),
    placeholderAdditionalMedia: useUiText("admin.books", "placeholder_additional_media", "URL de imagen o video promocional"),
    buttonAddAdditionalMedia: useUiText("admin.books", "button_add_additional_media", "Agregar medio"),
    labelShowAdditionalMedia: useUiText("admin.books", "label_show_additional_media", "Mostrar medios adicionales"),
    descriptionShowAdditionalMedia: useUiText("admin.books", "description_show_additional_media", "Si está activo, los medios se mostrarán en la landing"),
    // Promo Material - Spotify
    sectionPromoSpotifyTitle: useUiText("admin.books", "section_promo_spotify_title", "Playlist de Spotify"),
    labelPromoSpotify: useUiText("admin.books", "label_promo_spotify", "URL de Playlist de Spotify"),
    placeholderSpotify: useUiText("admin.books", "placeholder_spotify", "URL de embed de Spotify"),
    descriptionSpotify: useUiText("admin.books", "description_spotify", "Playlist inspirada en el libro"),
    labelShowSpotify: useUiText("admin.books", "label_show_spotify", "Mostrar playlist de Spotify"),
    descriptionShowSpotify: useUiText("admin.books", "description_show_spotify", "Si está activo, la playlist se mostrará en la landing"),
    // Promo Material - YouTube
    sectionPromoYoutubeTitle: useUiText("admin.books", "section_promo_youtube_title", "Booktrailer de YouTube"),
    labelPromoYoutube: useUiText("admin.books", "label_promo_youtube", "URL de Booktrailer (YouTube)"),
    placeholderYoutube: useUiText("admin.books", "placeholder_youtube", "URL de embed de YouTube"),
    descriptionYoutube: useUiText("admin.books", "description_youtube", "Video promocional del libro"),
    labelShowYoutube: useUiText("admin.books", "label_show_youtube", "Mostrar booktrailer"),
    descriptionShowYoutube: useUiText("admin.books", "description_show_youtube", "Si está activo, el video se mostrará en la landing"),
    // Store Links Section
    sectionStoreLinksTitle: useUiText("admin.books", "section_store_links_title", "Enlaces a Librerías"),
    sectionStoreLinksDescription: useUiText("admin.books", "section_store_links_description", "Agrega enlaces donde los lectores pueden comprar el libro"),
    labelStoreName: useUiText("admin.books", "label_store_name", "Nombre de la Tienda"),
    placeholderStoreName: useUiText("admin.books", "placeholder_store_name", "Ej: Amazon, Casa del Libro..."),
    labelStoreUrl: useUiText("admin.books", "label_store_url", "URL de la Tienda"),
    placeholderStoreUrl: useUiText("admin.books", "placeholder_store_url", "https://..."),
    buttonAddStoreLink: useUiText("admin.books", "button_add_store_link", "Agregar tienda"),
    storeLinksListTitle: useUiText("admin.books", "store_links_list_title", "Tiendas configuradas:"),
    buttonRemove: useUiText("admin.books", "button_remove", "Eliminar"),
    // QR & Links Tab
    sectionQrTitle: useUiText("admin.books", "section_qr_title", "Código QR de la Landing Page"),
    sectionQrDescription: useUiText("admin.books", "section_qr_description", "Genera un código QR que lleva directamente a la landing page del libro"),
    buttonCopyUrl: useUiText("admin.books", "button_copy_url", "Copiar URL"),
    buttonDownloadQr: useUiText("admin.books", "button_download_qr", "Descargar QR"),
    qrGenerating: useUiText("admin.books", "qr_generating", "Generando QR..."),
    qrDescription: useUiText("admin.books", "qr_description", "Este código QR lleva directamente a la landing page del libro"),
    sectionLandingUrlTitle: useUiText("admin.books", "section_landing_url_title", "Enlace de la Landing Page"),
    buttonCopyLink: useUiText("admin.books", "button_copy_link", "Copiar Enlace"),
    qrSuggestionsTitle: useUiText("admin.books", "qr_suggestions_title", "💡 Sugerencias de uso"),
    qrSuggestion1: useUiText("admin.books", "qr_suggestion_1", "• Incluye el QR en la última página de tu libro"),
    qrSuggestion2: useUiText("admin.books", "qr_suggestion_2", "• Comparte el enlace en redes sociales"),
    qrSuggestion3: useUiText("admin.books", "qr_suggestion_3", "• Agrega el QR a materiales promocionales"),
    qrSuggestion4: useUiText("admin.books", "qr_suggestion_4", "• Usa el enlace en tu biografía de autor"),
    // Form Buttons
    buttonCancel: useUiText("admin.books", "button_cancel", "Cancelar"),
    buttonUpdate: useUiText("admin.books", "button_update", "Actualizar"),
    buttonCreate: useUiText("admin.books", "button_create", "Crear"),
    // Additional Descriptions - Format helpers
    descriptionLandingFeaturesFormat: useUiText("admin.books", "description_landing_features_format", "Una característica o aspecto destacado por línea"),
    descriptionLandingQuotesFormat: useUiText("admin.books", "description_landing_quotes_format", "Citas o extractos destacados del libro (una por línea)"),
    descriptionLandingGalleryFormat: useUiText("admin.books", "description_landing_gallery_format", "URLs de imágenes para la galería (una por línea)"),
    descriptionLandingAwardsFormat: useUiText("admin.books", "description_landing_awards_format", "Premios o reconocimientos recibidos (uno por línea)"),
    descriptionPromoIntro: useUiText("admin.books", "description_promo_intro", "Agrega contenido promocional adicional para enriquecer la experiencia de tus lectores. Todos estos campos son opcionales. Usa los switches para controlar qué contenidos se muestran en la landing page."),
    // Additional Placeholders
    placeholderLandingHeroUrl: useUiText("admin.books", "placeholder_landing_hero_url", "https://... o /objects/..."),
    placeholderDirectSalePrice: useUiText("admin.books", "placeholder_direct_sale_price", "0.00"),
    placeholderDirectSaleStock: useUiText("admin.books", "placeholder_direct_sale_stock", "0"),
    // SEO Dynamic Text
    seoNovelPrefix: useUiText("admin.books", "seo_novel_prefix", " - Novela "),
    seoAutoTitlePrefix: useUiText("admin.books", "seo_auto_title_prefix", "Deja vacío para usar automáticamente: \""),
    seoCharCountSuffix: useUiText("admin.books", "seo_char_count_suffix", "/160 caracteres. Deja vacío para usar la descripción del libro."),
    // Missing UI Texts
    placeholderImageUrl: useUiText("admin.books", "placeholder_image_url", "https://... o /objects/..."),
    labelAdditionalStores: useUiText("admin.books", "label_additional_stores", "Librerías Adicionales"),
    placeholderSeries: useUiText("admin.books", "placeholder_series", "Seleccionar serie"),
    labelSeriesOrder: useUiText("admin.books", "label_series_order", "Orden en la Serie"),
    placeholderSeriesOrder: useUiText("admin.books", "placeholder_series_order", "1"),
    labelEnableDirectSale: useUiText("admin.books", "label_enable_direct_sale", "Habilitar venta directa"),
    labelSalePrice: useUiText("admin.books", "label_sale_price", "Precio de Venta"),
    labelStock: useUiText("admin.books", "label_stock", "Stock Disponible"),
    labelSellPhysical: useUiText("admin.books", "label_sell_physical", "Vender formato físico"),
    labelSellDigital: useUiText("admin.books", "label_sell_digital", "Vender formato digital"),
    labelIsDigital: useUiText("admin.books", "label_is_digital", "Es producto digital"),
    labelFileEpub: useUiText("admin.books", "label_file_epub", "Archivo EPUB"),
    placeholderFileUrl: useUiText("admin.books", "placeholder_file_url", "URL del archivo"),
    labelFilePdf: useUiText("admin.books", "label_file_pdf", "Archivo PDF"),
    labelFileMobi: useUiText("admin.books", "label_file_mobi", "Archivo MOBI"),
    labelFileAzw3: useUiText("admin.books", "label_file_azw3", "Archivo AZW3"),
    labelBackgroundImageUrl: useUiText("admin.books", "label_background_image_url", "URL de Imagen de Fondo"),
    labelBackgroundColor: useUiText("admin.books", "label_background_color", "Color de Fondo"),
    placeholderBackgroundColor: useUiText("admin.books", "placeholder_background_color", "#RRGGBB"),
    labelHeroImage: useUiText("admin.books", "label_hero_image", "Imagen Hero"),
    labelSlogan: useUiText("admin.books", "label_slogan", "Tagline"),
    placeholderSlogan: useUiText("admin.books", "placeholder_slogan", "Una frase impactante que describa el libro"),
    labelExtendedSynopsis: useUiText("admin.books", "label_extended_synopsis", "Sinopsis Extendida"),
    placeholderExtendedSynopsis: useUiText("admin.books", "placeholder_extended_synopsis", "Escribe una sinopsis atractiva y detallada..."),
    labelCta: useUiText("admin.books", "label_cta", "Texto del Botón CTA"),
    placeholderCta: useUiText("admin.books", "placeholder_cta", "Ej: Consigue tu copia ahora"),
    labelFeatures: useUiText("admin.books", "label_features", "Características Destacadas"),
    placeholderFeatures: useUiText("admin.books", "placeholder_features", "Ej: Más de 500 páginas de aventuras épicas"),
    labelQuotes: useUiText("admin.books", "label_quotes", "Citas Memorables"),
    placeholderQuotes: useUiText("admin.books", "placeholder_quotes", "Escribe una cita impactante del libro..."),
    labelGallery: useUiText("admin.books", "label_gallery", "Galería de Imágenes"),
    placeholderGallery: useUiText("admin.books", "placeholder_gallery", "URL de la imagen"),
    labelAwards: useUiText("admin.books", "label_awards", "Premios y Reconocimientos"),
    placeholderAwards: useUiText("admin.books", "placeholder_awards", "Ej: Ganador del Premio XYZ 2023"),
    labelConceptMap: useUiText("admin.books", "label_concept_map", "Mapa Conceptual"),
    placeholderConceptMap: useUiText("admin.books", "placeholder_concept_map", "URL del mapa conceptual"),
    labelFamilyTree: useUiText("admin.books", "label_family_tree", "Árbol Genealógico"),
    placeholderFamilyTree: useUiText("admin.books", "placeholder_family_tree", "URL del árbol genealógico"),
    labelBooktrailer: useUiText("admin.books", "label_booktrailer", "Booktrailer (YouTube)"),
    placeholderBooktrailer: useUiText("admin.books", "placeholder_booktrailer", "URL de embed de YouTube"),
    labelShowBooktrailer: useUiText("admin.books", "label_show_booktrailer", "Mostrar booktrailer"),
    labelSpotifyPlaylist: useUiText("admin.books", "label_spotify_playlist", "Playlist de Spotify"),
    placeholderSpotifyPlaylist: useUiText("admin.books", "placeholder_spotify_playlist", "URL de embed de Spotify"),
    labelPressNotes: useUiText("admin.books", "label_press_notes", "Notas de Prensa"),
    placeholderPressNotes: useUiText("admin.books", "placeholder_press_notes", 'Ej: "Una obra maestra" - El Periódico'),
    labelShowPress: useUiText("admin.books", "label_show_press", "Mostrar notas de prensa"),
    labelGraphicMaterial: useUiText("admin.books", "label_graphic_material", "Material Gráfico Adicional"),
    placeholderGraphicMaterial: useUiText("admin.books", "placeholder_graphic_material", "URL de imagen o video promocional"),
    labelShowGraphic: useUiText("admin.books", "label_show_graphic", "Mostrar material gráfico"),
  };

  const form = useForm<BookFormData>({
    resolver: zodResolver(bookFormSchema),
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
      storeLinks: "",
      digitalFileEpub: null,
      digitalFilePdf: null,
      digitalFileMobi: null,
      digitalFileAzw3: null,
      isDigitalProduct: false,
      directSaleEnabled: false,
      directSalePrice: 0,
      directSaleStock: 0,
      saleFormatPhysical: false,
      saleFormatDigital: false,
    },
  });

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books", { authorId: selectedAuthorId }],
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
        title: t.toastCreateTitle,
        description: t.toastCreateDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books", { authorId: selectedAuthorId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] }); // Invalidate global books for series management
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] }); // Invalidate series as they may now include this book
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

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BookFormData }) => {
      const response = await apiRequest("PUT", `/api/books/${id}`, { ...data, authorId: selectedAuthorId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.toastUpdateTitle,
        description: t.toastUpdateDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books", { authorId: selectedAuthorId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] }); // Invalidate global books for series management
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] }); // Invalidate series as they may now include this book
      setIsModalOpen(false);
      setEditingBook(null);
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

  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      await apiRequest("DELETE", `/api/books/${bookId}`);
    },
    onSuccess: () => {
      toast({
        title: t.toastDeleteTitle,
        description: t.toastDeleteDescription,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books", { authorId: selectedAuthorId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] }); // Invalidate global books for series management
      queryClient.invalidateQueries({ queryKey: ["/api/book-series"] }); // Invalidate series as the deleted book may have been in a series
    },
    onError: () => {
      toast({
        title: t.toastDeleteErrorTitle,
        description: t.toastDeleteErrorDescription,
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
          title: t.toastImageUploadTitle,
          description: t.toastImageUploadDescription,
        });
      } catch (error) {
        toast({
          title: t.toastImageUploadErrorTitle,
          description: t.toastImageUploadErrorDescription,
          variant: "destructive",
        });
      }
    }
  };

  const handleEpubUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileURL = uploadedFile.uploadURL;
      form.setValue('digitalFileEpub', fileURL);
      toast({
        title: t.toastEpubUploadTitle,
        description: t.toastEpubUploadDescription,
      });
    }
  };

  const handlePdfUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileURL = uploadedFile.uploadURL;
      form.setValue('digitalFilePdf', fileURL);
      toast({
        title: t.toastPdfUploadTitle,
        description: t.toastPdfUploadDescription,
      });
    }
  };

  const handleMobiUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileURL = uploadedFile.uploadURL;
      form.setValue('digitalFileMobi', fileURL);
      toast({
        title: t.toastMobiUploadTitle,
        description: t.toastMobiUploadDescription,
      });
    }
  };

  const handleAzw3UploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileURL = uploadedFile.uploadURL;
      form.setValue('digitalFileAzw3', fileURL);
      toast({
        title: t.toastAzw3UploadTitle,
        description: t.toastAzw3UploadDescription,
      });
    }
  };

  const getSeriesTitle = (seriesId: string | null) => {
    if (!seriesId) return t.seriesStandalone;
    const serie = series.find(s => s.id === seriesId);
    return serie?.title || t.seriesUnknown;
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
        title: t.toastQrErrorTitle,
        description: t.toastQrErrorDescription,
        variant: "destructive",
      });
    }
  };

  const copyLandingPageUrl = () => {
    if (!editingBook) return;
    const url = getBookLandingPageUrl(editingBook.id);
    navigator.clipboard.writeText(url);
    toast({
      title: t.toastUrlCopiedTitle,
      description: t.toastUrlCopiedDescription,
    });
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl || !editingBook) return;
    const link = document.createElement('a');
    link.download = `qr-${editingBook.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    toast({
      title: t.toastQrDownloadedTitle,
      description: t.toastQrDownloadedDescription,
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
    if (window.confirm(t.confirmDelete)) {
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
      storeLinks: "",
      digitalFileEpub: null,
      digitalFilePdf: null,
      digitalFileMobi: null,
      digitalFileAzw3: null,
      isDigitalProduct: false,
      directSaleEnabled: false,
      directSalePrice: 0,
      directSaleStock: 0,
      saleFormatPhysical: false,
      saleFormatDigital: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBook(book);
    
    // Parse digitalFiles JSON if it exists
    let digitalFileEpub = null;
    let digitalFilePdf = null;
    let digitalFileMobi = null;
    let digitalFileAzw3 = null;
    
    if (book.digitalFiles) {
      try {
        const parsedFiles = JSON.parse(book.digitalFiles);
        digitalFileEpub = parsedFiles.epub || null;
        digitalFilePdf = parsedFiles.pdf || null;
        digitalFileMobi = parsedFiles.mobi || null;
        digitalFileAzw3 = parsedFiles.azw3 || null;
      } catch (error) {
        console.error('Error parsing digitalFiles:', error);
      }
    }
    
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
      storeLinks: book.storeLinks || "",
      digitalFileEpub,
      digitalFilePdf,
      digitalFileMobi,
      digitalFileAzw3,
      isDigitalProduct: book.isDigitalProduct || false,
      directSaleEnabled: book.directSaleEnabled || false,
      directSalePrice: book.directSalePrice || 0,
      directSaleStock: book.directSaleStock || 0,
      saleFormatPhysical: book.saleFormatPhysical || false,
      saleFormatDigital: book.saleFormatDigital || false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (data: BookFormData) => {
    // Validate sale format configuration
    if (data.directSaleEnabled) {
      if (!data.saleFormatPhysical && !data.saleFormatDigital) {
        toast({
          title: t.toastValidationErrorTitle,
          description: t.toastValidationSaleFormat,
          variant: "destructive",
        });
        return;
      }
      
      // If digital format is enabled, ensure at least one digital file is configured
      const hasAnyDigitalFile = !!(data.digitalFileEpub || data.digitalFilePdf || data.digitalFileMobi || data.digitalFileAzw3);
      if (data.saleFormatDigital && !hasAnyDigitalFile) {
        toast({
          title: t.toastValidationErrorTitle,
          description: t.toastValidationDigitalFile,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Build digitalFiles JSON from individual format fields
    const digitalFiles: Record<string, string> = {};
    if (data.digitalFileEpub) digitalFiles.epub = data.digitalFileEpub;
    if (data.digitalFilePdf) digitalFiles.pdf = data.digitalFilePdf;
    if (data.digitalFileMobi) digitalFiles.mobi = data.digitalFileMobi;
    if (data.digitalFileAzw3) digitalFiles.azw3 = data.digitalFileAzw3;
    
    const processedData = {
      ...data,
      seriesId: data.seriesId === "none" ? null : data.seriesId,
      digitalFiles: Object.keys(digitalFiles).length > 0 ? JSON.stringify(digitalFiles) : null,
    };
    
    // Remove temporary fields from the payload
    delete (processedData as any).digitalFileEpub;
    delete (processedData as any).digitalFilePdf;
    delete (processedData as any).digitalFileMobi;
    delete (processedData as any).digitalFileAzw3;
    
    if (editingBook) {
      updateBookMutation.mutate({ id: editingBook.id, data: processedData });
    } else {
      createBookMutation.mutate(processedData);
    }
  };

  // Helper function for background image upload
  const handleBgImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileURL = uploadedFile.uploadURL;
      
      try {
        const response = await apiRequest("POST", "/api/images/upload", { imageURL: fileURL });
        const data = await response.json();
        
        form.setValue("backgroundImageUrl", data.objectPath);
        
        toast({
          title: "Imagen de fondo subida",
          description: "La imagen de fondo se ha subido correctamente",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo subir la imagen de fondo",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddStoreLink = () => {
    if (!newStoreName.trim() || !newStoreUrl.trim()) {
      toast({
        title: t.toastStoreLinkErrorTitle,
        description: t.toastStoreLinkErrorDescription,
        variant: "destructive",
      });
      return;
    }

    const currentStoreLinks = form.getValues("storeLinks");
    let storeLinksArray: { name: string; url: string }[] = [];
    
    if (currentStoreLinks) {
      try {
        storeLinksArray = JSON.parse(currentStoreLinks);
      } catch (error) {
        console.error("Error parsing storeLinks:", error);
      }
    }

    storeLinksArray.push({ name: newStoreName, url: newStoreUrl });
    form.setValue("storeLinks", JSON.stringify(storeLinksArray));
    setNewStoreName("");
    setNewStoreUrl("");
  };

  const handleRemoveStoreLink = (index: number) => {
    const currentStoreLinks = form.getValues("storeLinks");
    let storeLinksArray: { name: string; url: string }[] = [];
    
    if (currentStoreLinks) {
      try {
        storeLinksArray = JSON.parse(currentStoreLinks);
      } catch (error) {
        console.error("Error parsing storeLinks:", error);
        return;
      }
    }

    storeLinksArray.splice(index, 1);
    form.setValue("storeLinks", storeLinksArray.length > 0 ? JSON.stringify(storeLinksArray) : "");
  };

  const getStoreLinksArray = (): { name: string; url: string }[] => {
    const storeLinksValue = form.watch("storeLinks");
    if (!storeLinksValue) return [];
    
    try {
      return JSON.parse(storeLinksValue);
    } catch (error) {
      return [];
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-primary">{t.pageTitle}</h3>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          data-testid="button-add-book"
          onClick={handleOpenAddModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.buttonAddBook}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t.placeholderSearch}
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
                <SelectItem value="all">{t.filterAllGenres}</SelectItem>
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
                  <th className="text-left p-4">{t.tableHeaderCover}</th>
                  <th className="text-left p-4">{t.tableHeaderTitle}</th>
                  <th className="text-left p-4">{t.tableHeaderSeries}</th>
                  <th className="text-left p-4">{t.tableHeaderGenre}</th>
                  <th className="text-left p-4">{t.tableHeaderStatus}</th>
                  <th className="text-left p-4">{t.tableHeaderActions}</th>
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
                        {book.isPublished ? t.badgePublished : t.badgeDraft}
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
              {editingBook ? t.modalTitleEdit : t.modalTitleAdd}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">{t.tabBasicInfo}</TabsTrigger>
                  <TabsTrigger value="landing">{t.tabLandingPage}</TabsTrigger>
                  <TabsTrigger value="promo" data-testid="tab-promo">{t.tabPromoMaterial}</TabsTrigger>
                  <TabsTrigger value="qr" disabled={!editingBook} data-testid="tab-qr">{t.tabQrLinks}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-6 mt-6">
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
                          <FormLabel>{t.labelGenre}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderGenre}
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
                        <FormLabel>{t.labelDescription}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderDescription}
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
                          <FormLabel>{t.labelCoverImage}</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder={t.placeholderImageUrl}
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
                              {t.buttonUpload}
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
                          <FormLabel>{t.labelPrice}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder={t.placeholderPrice}
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
                        <FormLabel>{t.labelAmazonUrl}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t.placeholderAmazonUrl}
                            data-testid="input-book-amazon"
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Multiple Store Links Section */}
                  <div className="space-y-4">
                    <FormLabel>{t.labelAdditionalStores}</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder={t.placeholderStoreName}
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        data-testid="input-store-name"
                      />
                      <Input
                        placeholder={t.placeholderStoreUrl}
                        value={newStoreUrl}
                        onChange={(e) => setNewStoreUrl(e.target.value)}
                        data-testid="input-store-url"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddStoreLink}
                      data-testid="button-add-store-link"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t.buttonAddStoreLink}
                    </Button>

                    {getStoreLinksArray().length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-muted-foreground">{t.storeLinksListTitle}</p>
                        {getStoreLinksArray().map((link, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            data-testid={`store-link-${index}`}
                          >
                            <div className="flex-1">
                              <p className="font-medium">{link.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStoreLink(index)}
                              data-testid={`button-remove-store-link-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="seriesId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelSeries}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-book-series">
                              <SelectValue placeholder={t.placeholderSeries} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{t.seriesOptionNone}</SelectItem>
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
                          <FormLabel>{t.labelSeriesOrder}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder={t.placeholderSeriesOrder}
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
                            <FormLabel>{t.labelStandalone}</FormLabel>
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
                            <FormLabel>{t.labelPublished}</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold">{t.sectionDirectSaleTitle}</h3>
                    <p className="text-sm text-muted-foreground">{t.sectionDirectSaleDescription}</p>
                    
                    <FormField
                      control={form.control}
                      name="directSaleEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-direct-sale"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{t.labelEnableDirectSale}</FormLabel>
                            <FormDescription>
                              {t.descriptionDirectSaleEnabled}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch('directSaleEnabled') && (
                      <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="directSalePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t.labelSalePrice}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder={t.placeholderDirectSalePrice}
                                    data-testid="input-direct-sale-price"
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="directSaleStock"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t.labelStock}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    placeholder={t.placeholderDirectSaleStock}
                                    data-testid="input-direct-sale-stock"
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold">{t.sectionSaleFormats}</h4>
                          <p className="text-sm text-muted-foreground">{t.descriptionSaleFormats}</p>
                          
                          <FormField
                            control={form.control}
                            name="saleFormatPhysical"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-sale-physical"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>{t.labelSellPhysical}</FormLabel>
                                  <FormDescription>
                                    {t.descriptionSaleFormatPhysical}
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="saleFormatDigital"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-sale-digital"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>{t.labelSellDigital}</FormLabel>
                                  <FormDescription>
                                    {t.descriptionSaleFormatDigital}
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          {!form.watch("saleFormatPhysical") && !form.watch("saleFormatDigital") && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>{t.alertSelectFormatTitle}</AlertTitle>
                              <AlertDescription>
                                {t.alertSelectFormatDescription}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold">{t.sectionDigitalFileTitle}</h3>
                    <p className="text-sm text-muted-foreground">{t.sectionDigitalFileDescription}</p>
                    
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
                            <FormLabel>{t.labelIsDigital}</FormLabel>
                            <FormDescription>
                              {t.descriptionIsDigitalProduct}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch('isDigitalProduct') && (
                      <div className="space-y-6 pl-4 border-l-2 border-primary/20">
                        <p className="text-sm text-muted-foreground">
                          {t.digitalFilesIntro}
                        </p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="digitalFileEpub"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t.labelFileEpub}</FormLabel>
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input 
                                        placeholder={t.placeholderFileUrl}
                                        data-testid="input-digital-file-epub"
                                        {...field}
                                        value={field.value || ""} 
                                        className="flex-1"
                                        readOnly
                                      />
                                    </FormControl>
                                    <ObjectUploader
                                      maxNumberOfFiles={1}
                                      maxFileSize={52428800}
                                      allowedFileTypes={['application/epub+zip']}
                                      onGetUploadParameters={handleGetUploadParameters}
                                      onComplete={handleEpubUploadComplete}
                                      buttonClassName="shrink-0"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      {t.buttonUpload}
                                    </ObjectUploader>
                                    {field.value && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => form.setValue('digitalFileEpub', null)}
                                        data-testid="button-clear-digital-file-epub"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <FormDescription className="text-xs">
                                    {t.descriptionEpub}
                                  </FormDescription>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="digitalFilePdf"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t.labelFilePdf}</FormLabel>
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input 
                                        placeholder={t.placeholderFileUrl}
                                        data-testid="input-digital-file-pdf"
                                        {...field}
                                        value={field.value || ""} 
                                        className="flex-1"
                                        readOnly
                                      />
                                    </FormControl>
                                    <ObjectUploader
                                      maxNumberOfFiles={1}
                                      maxFileSize={52428800}
                                      allowedFileTypes={['application/pdf']}
                                      onGetUploadParameters={handleGetUploadParameters}
                                      onComplete={handlePdfUploadComplete}
                                      buttonClassName="shrink-0"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      {t.buttonUpload}
                                    </ObjectUploader>
                                    {field.value && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => form.setValue('digitalFilePdf', null)}
                                        data-testid="button-clear-digital-file-pdf"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <FormDescription className="text-xs">
                                    {t.descriptionPdf}
                                  </FormDescription>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="digitalFileMobi"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t.labelFileMobi}</FormLabel>
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input 
                                        placeholder={t.placeholderFileUrl}
                                        data-testid="input-digital-file-mobi"
                                        {...field}
                                        value={field.value || ""} 
                                        className="flex-1"
                                        readOnly
                                      />
                                    </FormControl>
                                    <ObjectUploader
                                      maxNumberOfFiles={1}
                                      maxFileSize={52428800}
                                      allowedFileTypes={['application/x-mobipocket-ebook']}
                                      onGetUploadParameters={handleGetUploadParameters}
                                      onComplete={handleMobiUploadComplete}
                                      buttonClassName="shrink-0"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      {t.buttonUpload}
                                    </ObjectUploader>
                                    {field.value && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => form.setValue('digitalFileMobi', null)}
                                        data-testid="button-clear-digital-file-mobi"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <FormDescription className="text-xs">
                                    {t.descriptionMobi}
                                  </FormDescription>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="digitalFileAzw3"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t.labelFileAzw3}</FormLabel>
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input 
                                        placeholder={t.placeholderFileUrl}
                                        data-testid="input-digital-file-azw3"
                                        {...field}
                                        value={field.value || ""} 
                                        className="flex-1"
                                        readOnly
                                      />
                                    </FormControl>
                                    <ObjectUploader
                                      maxNumberOfFiles={1}
                                      maxFileSize={52428800}
                                      allowedFileTypes={['application/vnd.amazon.ebook']}
                                      onGetUploadParameters={handleGetUploadParameters}
                                      onComplete={handleAzw3UploadComplete}
                                      buttonClassName="shrink-0"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      {t.buttonUpload}
                                    </ObjectUploader>
                                    {field.value && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => form.setValue('digitalFileAzw3', null)}
                                        data-testid="button-clear-digital-file-azw3"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <FormDescription className="text-xs">
                                    {t.descriptionAzw3}
                                  </FormDescription>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="bg-muted/30 p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">
                            {t.digitalFilesStorageInfo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold">{t.sectionSeoTitle}</h3>
                    <p className="text-sm text-muted-foreground">{t.sectionSeoDescription}</p>
                    
                    <FormField
                      control={form.control}
                      name="seoTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelSeoTitle}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder={`${form.watch('title')}${form.watch('genre') ? `${t.seoNovelPrefix}${form.watch('genre')}` : ''}`} data-testid="input-book-seo-title" />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            {t.seoAutoTitlePrefix}{form.watch('title')}{form.watch('genre') ? `${t.seoNovelPrefix}${form.watch('genre')}` : ''}"
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
                          <FormLabel>{t.labelSeoDescription}</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} rows={3} placeholder={t.placeholderSeoDescription} data-testid="textarea-book-seo-description" />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            {field.value?.length || 0}{t.seoCharCountSuffix}
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
                          <FormLabel>{t.labelSeoKeywords}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder={t.placeholderSeoKeywords} data-testid="input-book-seo-keywords" />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            {t.descriptionSeoKeywords}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold">{t.sectionBackgroundTitle}</h3>
                      <p className="text-sm text-muted-foreground">{t.sectionBackgroundDescription}</p>
                      
                      {form.watch("backgroundImageUrl") && (
                        <div className="border rounded-lg p-4 bg-muted/50">
                          <img 
                            src={form.watch("backgroundImageUrl") || ""} 
                            alt="Vista previa de imagen de fondo" 
                            className="w-full max-h-48 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handleBgImageUploadComplete}
                          allowedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                          maxFileSize={5 * 1024 * 1024}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Subir Imagen de Fondo
                        </ObjectUploader>
                        <p className="text-xs text-muted-foreground">
                          Formatos: JPEG, PNG, WebP • Tamaño máximo: 5 MB
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="backgroundImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.labelBgImage}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder={t.placeholderBgImage} data-testid="input-book-bg-image" />
                            </FormControl>
                            <FormDescription>
                              {t.descriptionBgImage}
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
                            <FormLabel>{t.labelBackgroundColor}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder={t.placeholderBackgroundColor} data-testid="input-book-bg-color" />
                            </FormControl>
                            <FormDescription>
                              {t.descriptionBgColor}
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
                        <FormLabel>{t.labelHeroImage}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderLandingHeroUrl}
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
                            {t.buttonUpload}
                          </ObjectUploader>
                        </div>
                        <FormDescription>
                          {t.descriptionLandingHeroUpload}
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
                        <FormLabel>{t.labelSlogan}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t.placeholderSlogan}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionLandingTagline}
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
                        <FormLabel>{t.labelExtendedSynopsis}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderExtendedSynopsis}
                            rows={6}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionLandingSynopsis}
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
                        <FormLabel>{t.labelCta}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t.placeholderCta}
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionLandingCta}
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
                        <FormLabel>{t.labelFeatures}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderFeatures}
                            rows={4}
                            value={(field.value as string[] || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionLandingFeaturesFormat}
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
                        <FormLabel>{t.labelQuotes}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderQuotes}
                            rows={4}
                            value={(field.value as string[] || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionLandingQuotesFormat}
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
                        <FormLabel>{t.labelGallery}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderGallery}
                            rows={4}
                            value={(field.value as string[] || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionLandingGalleryFormat}
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
                        <FormLabel>{t.labelAwards}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderAwards}
                            rows={4}
                            value={(field.value as string[] || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(line => line.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          {t.descriptionLandingAwardsFormat}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="promo" className="space-y-6 mt-6">
                  <div className="bg-muted/30 p-4 rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground">
                      {t.descriptionPromoIntro}
                    </p>
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <FormField
                      control={form.control}
                      name="promoConceptMap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelConceptMap}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderConceptMap}
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
                            <FormLabel>{t.labelShowConceptMap}</FormLabel>
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
                          <FormLabel>{t.labelFamilyTree}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderFamilyTree}
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
                            <FormLabel>{t.labelShowFamilyTree}</FormLabel>
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
                          <FormLabel>{t.labelBooktrailer}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderBooktrailer}
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
                            <FormLabel>{t.labelShowBooktrailer}</FormLabel>
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
                          <FormLabel>{t.labelSpotifyPlaylist}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t.placeholderSpotifyPlaylist}
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
                            <FormLabel>{t.labelShowSpotify}</FormLabel>
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
                          <FormLabel>{t.labelPressNotes}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t.placeholderPressNotes}
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
                            <FormLabel>{t.labelShowPress}</FormLabel>
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
                          <FormLabel>{t.labelGraphicMaterial}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t.placeholderGraphicMaterial}
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
                            <FormLabel>{t.labelShowGraphic}</FormLabel>
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
                  {t.buttonCancel}
                </Button>
                <Button 
                  type="submit"
                  disabled={createBookMutation.isPending || updateBookMutation.isPending}
                  data-testid="button-save-book"
                >
                  {editingBook ? t.buttonUpdate : t.buttonCreate}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
