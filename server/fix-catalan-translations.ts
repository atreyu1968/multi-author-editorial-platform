import { db } from "./db";
import { uiTexts } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Comprehensive mapping of Spanish texts to proper Catalan translations
// Using Barcelona central Catalan with informal "tu" form
const translations: Record<string, Record<string, string>> = {
  author_page: {
    "footer_bio": "Biografia",
    "footer_quick_links": "Enllaços ràpids",
    "standalone_desc_prefix": "Històries completes i autoconclusives de",
    "standalone_title": "Llibres independents",
    "testimonials_desc_prefix": "Descobreix què diuen sobre els llibres de",
    "testimonials_title": "Què diuen els lectors",
  },
  blog: {
    "article_count_plural": "Articles trobats",
    "article_count_singular": "Article trobat",
    "article_liked_question": "T'ha agradat aquest article?",
    "article_not_found_message": "L'article que cerques no existeix o no està publicat.",
    "article_not_found_title": "Article no trobat",
    "back_to_blog": "Tornar al blog",
    "category_all": "Totes les categories",
    "category_filter_placeholder": "Totes les categories",
    "clear_filters": "Netejar filtres",
    "coming_soon": "Aviat compartiré més contingut aquí. Mantingues-te atent!",
    "footer_bio": "Autora bestseller especialitzada en romàntic, thriller i fantasia. Creant històries que toquen el cor des de 2012.",
    "hero_subtitle": "Comparteixo el meu procés creatiu, notícies sobre els meus propers llibres, consells per a escriptors i reflexions sobre el meravellós món de la literatura.",
    "more_articles_button": "Veure més articles",
    "no_articles_available": "No hi ha articles disponibles",
    "no_articles_found": "No s'han trobat articles",
    "seo_description": "Llegeix els últims articles de María González sobre escriptura, procés creatiu, propers llançaments i consells per a escriptors emergents.",
    "seo_keyword_autora": "autora",
    "seo_keyword_blog": "blog",
    "seo_keyword_consejos": "consells",
    "seo_keyword_escritura": "escriptura",
    "seo_keyword_noticias": "notícies",
    "seo_keyword_proceso_creativo": "procés creatiu",
    "seo_title": "Blog - María González Autora",
    "search_placeholder": "Cercar articles...",
    "subscribe_message": "Subscriu-te al meu butlletí per rebre més contingut com aquest i actualitzacions sobre els meus propers llibres.",
    "tags_label": "Etiquetes:",
    "tags_more": "més",
    "try_other_search": "Prova amb altres termes de cerca o canvia els filtres.",
  },
  book_landing: {
    "agotado": "Esgotat",
    "anadido_carrito": "Afegit al cistell!",
    "anadido_carrito_desc": "s'ha afegit al teu cistell.",
    "anadiendo": "Afegint...",
    "arbol_genealogico": "Arbre genealògic",
    "arbol_genealogico_desc": "Descobreix les relacions entre els personatges",
    "articulo": "Article",
    "booktrailer": "Booktrailer",
    "comienza_aventura": "Comença la teva aventura ara i descobreix per què milers de lectors han quedat captivats amb aquesta història.",
    "comprar_ahora": "Comprar ara",
    "comprar_amazon": "Comprar a Amazon",
    "contenido_adicional": "Contingut addicional",
    "digital": "Digital",
    "embed_booktrailer": "Booktrailer",
    "error": "Error",
    "error_carrito": "No s'ha pogut afegir el llibre al cistell. Torna-ho a intentar.",
    "explorar_serie": "Explorar tota la sèrie",
    "fisico": "Físic",
    "formato_digital": "Format digital",
    "formatos_digitales": "Formats digitals:",
    "galeria": "Galeria",
    "gallery_image_alt_de": "de",
    "gallery_image_alt_imagen": "Imatge",
    "libro": "Llibre",
    "libro_no_encontrado": "Llibre no trobat",
    "libro_no_existe": "El llibre que cerques no existeix o ha estat eliminat.",
    "listo_sumergirte": "Estàs llest per submergir-te en aquesta història?",
    "lo_que_encontraras": "El que trobaràs en aquest llibre",
    "mapa_conceptual": "Mapa conceptual",
    "mapa_conceptual_desc": "Explora el món i els conceptes de la història",
    "material_grafico": "Material gràfic",
    "material_grafico_desc": "Il·lustracions, mapes i material visual",
    "momentos_memorables": "Moments memorables",
    "notas_prensa": "Notes de premsa",
    "notas_prensa_desc": "Llegeix ressenyes i articles sobre aquest llibre",
    "parte_serie": "Part de la sèrie:",
    "playlist_lectura": "Llista de reproducció de lectura",
    "premio": "Premi",
    "premios_reconocimientos": "Premis i reconeixements",
    "producto_digital": "Producte digital",
    "recurso": "Recurs",
    "seo_desc_de": "de",
    "seo_desc_de_genero": "de",
    "seo_desc_descubre": "Descobreix",
    "seo_desc_fascinante": "una fascinant novel·la",
    "seo_desc_fascinante_novela": "una fascinant novel·la",
    "seo_desc_mantendra": "que et mantindrà enganxat des de la primera pàgina.",
    "seo_desc_prefix": "Descobreix",
    "seo_desc_suffix": "que et mantindrà enganxat des de la primera pàgina.",
    "seo_image_alt_portada": "Portada de",
    "seo_novela": "Novel·la",
    "seo_title_novela": "Novel·la",
    "sinopsis": "Sinopsi",
    "sinopsis_no_disponible": "Sinopsi no disponible",
    "ver_arbol": "Veure arbre",
    "ver_mapa": "Veure mapa",
    "ver_mas_detalles": "Veure més detalls",
    "volver_inicio": "Tornar a l'inici",
  },
  checkout: {
    "badge_digital": "Digital",
    "billing_form_desc": "Completa les teves dades per continuar",
    "billing_form_title": "Informació de facturació",
    "button_back_home": "Tornar a l'inici",
    "button_back_to_store": "Tornar a la botiga",
    "button_confirm_order": "Confirmar comanda",
    "button_continue_payment": "Continuar al pagament",
    "button_download_invoice": "Descarregar factura",
    "button_download_prefix": "Descarregar",
    "button_my_orders": "Veure les meves comandes",
    "button_retry": "Tornar a intentar",
    "button_validating": "Validant...",
    "cart_summary_desc": "Revisa els teus productes abans de finalitzar",
    "cart_summary_title": "Resum del cistell",
    "customer_info_title": "Informació del client",
    "download_pending_message": "L'enllaç de descàrrega estarà disponible quan es completi la comanda",
    "download_valid_until": "Enllaç vàlid fins",
    "empty_cart_desc": "No tens productes al teu cistell",
    "empty_cart_title": "Cistell buit",
    "error_verify_customer": "Error al verificar el client",
    "fallback_file": "Arxiu",
    "fallback_product_name": "Producte",
    "label_billing_address": "Adreça de facturació *",
    "label_customer_email": "Correu electrònic:",
    "label_customer_name": "Nom:",
    "label_email": "Correu electrònic *",
    "label_fullname": "Nom complet *",
    "label_item_subtotal": "Subtotal:",
    "label_newsletter": "Subscriure'm al butlletí de notícies",
    "label_newsletter_desc": "Rep novetats i ofertes exclusives",
    "label_order_date": "Data:",
    "label_order_number": "Número de comanda:",
    "label_order_status": "Estat:",
    "label_order_total": "Total:",
    "label_phone": "Telèfon",
    "label_quantity_value": "Quantitat:",
    "label_same_as_billing": "Adreça d'enviament igual a facturació",
    "label_shipping_address": "Adreça d'enviament",
    "label_shipping_address_info": "Adreça d'enviament:",
    "label_subtotal": "Subtotal:",
    "label_tax": "Impostos:",
    "label_total": "Total:",
    "label_transaction_id": "ID de transacció PayPal:",
    "label_unit_price": "Preu unitari:",
    "next_steps_message": "Rebràs un correu electrònic de confirmació amb els detalls de la teva comanda. Si la teva comanda inclou productes digitals, trobaràs els enllaços de descàrrega al correu.",
    "next_steps_title": "Propers passos",
    "not_available": "N/D",
    "order_confirmed_subtitle": "Gràcies per la teva compra. La teva comanda ha estat processada amb èxit.",
    "order_confirmed_title": "Comanda confirmada!",
    "order_items_title": "Articles de la comanda",
    "order_not_found_desc": "No hem pogut trobar la comanda sol·licitada",
    "order_not_found_message": "La comanda que cerques no existeix o ha estat eliminada.",
    "order_not_found_title": "Comanda no trobada",
    "page_title": "Finalitzar la compra",
    "paypal_secure_message": "Completa el teu pagament de forma segura amb PayPal",
    "placeholder_billing_address": "Carrer, número, ciutat, codi postal, país",
    "placeholder_email": "joan@exemple.cat",
    "placeholder_fullname": "Joan Pérez",
    "placeholder_phone": "+34123456789",
    "placeholder_shipping_address": "Carrer, número, ciutat, codi postal, país",
    "seo_description": "Completa la teva compra de forma segura. Revisa el teu cistell, introdueix la teva informació de facturació i enviament, i procedeix al pagament.",
    "seo_keyword_buy": "comprar",
    "seo_keyword_cart": "cistell",
    "seo_keyword_checkout": "checkout",
    "seo_keyword_complete": "finalitzar la compra",
    "seo_keyword_payment": "pagament",
    "seo_title": "Checkout - Finalitzar la compra",
    "status_cancelled": "Cancel·lat",
    "status_completed": "Completat",
    "status_failed": "Fallat",
    "status_pending": "Pendent",
    "toast_data_saved_desc": "La teva informació ha estat registrada correctament.",
    "toast_data_saved_title": "Dades guardades",
    "toast_error_title": "Error",
    "toast_existing_customer_desc": "Les teves dades han estat carregades automàticament.",
    "toast_existing_customer_title": "Client existent",
    "toast_order_completed_desc": "La teva comanda ha estat processada amb èxit.",
    "toast_order_completed_title": "Comanda completada!",
    "toast_order_create_error": "No s'ha pogut crear la comanda. Si us plau, contacta amb suport.",
    "toast_process_error": "No s'ha pogut processar la informació. Si us plau, torna-ho a intentar.",
    "toast_product_remove_error": "No s'ha pogut eliminar el producte.",
    "toast_product_removed_desc": "El producte ha estat eliminat del cistell.",
    "toast_product_removed_title": "Producte eliminat",
    "toast_quantity_update_error": "No s'ha pogut actualitzar la quantitat.",
    "toast_quantity_updated_desc": "El cistell ha estat actualitzat.",
    "toast_quantity_updated_title": "Quantitat actualitzada",
    "validation_billing_required": "L'adreça de facturació és requerida",
    "validation_email_invalid": "Correu electrònic invàlid",
    "validation_fullname_required": "El nom complet és requerit",
  },
  home: {
    "bio_subtitle": "Descobreix la història darrere de les paraules",
    "bio_title": "Coneix l'autor",
    "footer_bio": "Autor bestseller especialitzat en romàntic, thriller i fantasia. Creant històries que toquen el cor des de 2012.",
    "footer_rights": "Tots els drets reservats.",
    "meta_author_description": "Autor de novel·les històriques i thrillers",
    "meta_description_intro": "Descobreix les captivadores novel·les de",
    "meta_description_outro": ". Des de romàntics apassionats fins misteris que et mantindran despert tota la nit. Explora les meves sèries i llibres independents.",
    "newsletter_subtitle": "Subscriu-te al nostre butlletí i rep un llibre gratuït, a més de ser el primer a saber sobre nous llançaments, ofertes exclusives i contingut especial.",
    "newsletter_title": "Uneix-te a la nostra comunitat",
    "series_subtitle": "Explora les emocionants sèries que han captivat milers de lectors arreu del món.",
    "series_title": "Sèries de llibres",
    "standalone_subtitle": "Històries completes i autoconclusives que pots gaudir com a experiències úniques.",
    "standalone_title": "Llibres independents",
    "testimonials_subtitle": "Milers de lectors han gaudit de les històries de María. Descobreix què diuen sobre els seus llibres.",
    "testimonials_title": "Què diuen els lectors",
  },
  homepage: {
    "button_view_all_authors": "Mostra tots els autors",
    "button_view_profile": "Veure perfil",
    "empty_authors_soon": "Pròximament afegirem nous autors",
    "feature1_desc_default": "Seleccionem acuradament cada obra.",
    "feature1_title_default": "Qualitat literària",
    "feature2_desc_default": "Promovem veus úniques amb perspectives fresques.",
    "feature2_title_default": "Autors diversos",
    "feature3_desc_default": "Creem connexions significatives entre autors i lectors.",
    "feature3_title_default": "Experiència única",
    "featured_desc_default": "Coneix alguns dels talentosos escriptors que formen part de la nostra editorial",
    "featured_title_default": "Autors destacats",
    "footer_contact": "Contacte",
    "footer_copyright_default": "© 2024 Editorial. Tots els drets reservats.",
    "footer_location_default": "Barcelona, Catalunya",
    "footer_quick_links": "Enllaços ràpids",
    "hero_primary_button_default": "Descobreix autors",
    "hero_secondary_button_default": "Sobre nosaltres",
    "hero_subtitle_default": "Descobreix històries úniques dels millors autors contemporanis",
    "hero_title_default": "Editorial de literatura contemporània",
    "loading": "Carregant...",
    "offer_desc_default": "Som una editorial compromesa amb la qualitat literària i la promoció de nous talents. La nostra missió és connectar autors amb lectors de tot el món.",
    "offer_title_default": "Què oferim",
    "seo_description_default": "Editorial de literatura contemporània amb autors de qualitat. Descobreix novel·les, thrillers, romàntics i més.",
    "seo_keyword_autors": "autors",
    "seo_keyword_editorial": "editorial",
    "seo_keyword_libros": "llibres",
    "seo_keyword_literatura": "literatura",
    "seo_keyword_novelas": "novel·les",
    "seo_title_default": "Editorial - Literatura contemporània",
  },
  navigation: {
    "about": "Sobre nosaltres",
    "authors": "Autors",
    "blog": "Blog",
    "books": "Llibres",
    "contact": "Contacte",
    "home": "Inici",
    "series": "Sèries",
    "shop": "Botiga",
  },
  promo_content: {
    "concept_map_title": "Mapa conceptual",
    "family_tree_title": "Arbre genealògic",
    "media_title": "Material gràfic",
    "no_content": "No hi ha contingut promocional disponible",
    "playlist_title": "Llista de reproducció",
    "press_notes_title": "Notes de premsa",
    "spotify_playlist_desc": "Escolta la banda sonora d'aquesta història",
    "tab_concept_map": "Mapa",
    "tab_family_tree": "Genealogia",
    "tab_media": "Galeria",
    "tab_press": "Premsa",
    "tab_spotify": "Música",
    "tab_trailer": "Tràiler",
    "trailer_title": "Tràiler del llibre",
  },
  sections: {
    "latest_books": "Últims llibres",
    "series": "Sèries",
    "standalone": "Llibres independents",
    "testimonials": "Testimonis",
  },
};

async function fixCatalanTranslations() {
  console.log("🔍 Starting Catalan translation fixes...\n");
  
  let totalUpdated = 0;
  
  for (const [namespace, texts] of Object.entries(translations)) {
    console.log(`📝 Processing namespace: ${namespace}`);
    
    for (const [key, value] of Object.entries(texts)) {
      try {
        const result = await db
          .update(uiTexts)
          .set({ value })
          .where(
            and(
              eq(uiTexts.namespace, namespace),
              eq(uiTexts.key, key),
              eq(uiTexts.locale, "ca-ES")
            )
          );
        
        console.log(`  ✅ Updated ${namespace}.${key} → "${value}"`);
        totalUpdated++;
      } catch (error) {
        console.error(`  ❌ Error updating ${namespace}.${key}:`, error);
      }
    }
    
    console.log("");
  }
  
  console.log(`\n✨ Translation fix complete! Updated ${totalUpdated} texts.`);
  
  // Verify the updates
  console.log("\n🔍 Verifying updates...");
  
  for (const namespace of Object.keys(translations)) {
    const records = await db
      .select()
      .from(uiTexts)
      .where(
        and(
          eq(uiTexts.namespace, namespace),
          eq(uiTexts.locale, "ca-ES")
        )
      );
    
    console.log(`  ${namespace}: ${records.length} records in database`);
  }
  
  console.log("\n✅ All done!");
}

fixCatalanTranslations();
