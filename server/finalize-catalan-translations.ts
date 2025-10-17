import { db } from "./db";
import { uiTexts } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

// Additional comprehensive translations for remaining texts
const ADDITIONAL_TRANSLATIONS: Record<string, string> = {
  // Fix partial translations
  "Todos los derechos reservados.": "Tots els drets reservats.",
  "Todos los derechos reservados": "Tots els drets reservats",
  
  // Additional common phrases
  "Foto de": "Foto de",  // Stays same
  "Sobre": "Sobre",  // Stays same for "About"
  "Explora las emocionantes series de": "Explora les emocionants sèries de",
  "libros": "llibres",
  "autor": "autor",  // Stays same
  
  // Homepage & Home
  "Últimas Novedades": "Últimes Novetats",
  "Descubre": "Descobreix",
  "Descubre nuestros": "Descobreix els nostres",
  "Descubre nuestras": "Descobreix les nostres",
  "Bienvenido": "Benvingut",
  "Bienvenida": "Benvinguda",
  "Bienvenidos": "Benvinguts",
  "Explorar": "Explorar",
  "Explora": "Explora",
  "Visita": "Visita",
  "Conoce": "Coneix",
  "Descubrir": "Descobrir",
  
  // Blog specific
  "Publicado el": "Publicat el",
  "Escrito por": "Escrit per",
  "Categoría": "Categoria",
  "Categorías": "Categories",
  "Etiquetas": "Etiquetes",
  "Artículos": "Articles",
  "Artículo": "Article",
  "Lectura": "Lectura",
  "min de lectura": "min de lectura",
  "minutos": "minuts",
  "Compartir": "Compartir",
  "Compartir en": "Compartir a",
  
  // Book landing specific
  "Comienza tu aventura ahora y descubre por qué miles de lectores han quedado cautivados con esta historia.": "Comença la teva aventura ara i descobreix per què milers de lectors han quedat captivats amb aquesta història.",
  "¿Listo para sumergirte en esta historia?": "Preparat per submergir-te en aquesta història?",
  "Descubre las relaciones entre los personajes": "Descobreix les relacions entre els personatges",
  "Explora el mundo y los conceptos de la historia": "Explora el món i els conceptes de la història",
  "Lo que encontrarás en este libro": "El que trobaràs en aquest llibre",
  
  // Checkout specific
  "Resumen del pedido": "Resum de la comanda",
  "Información de envío": "Informació d'enviament",
  "Información de pago": "Informació de pagament",
  "Método de envío": "Mètode d'enviament",
  "Detalles del pedido": "Detalls de la comanda",
  "Tu pedido": "La teva comanda",
  "Realizar pedido": "Fer comanda",
  "Tramitar pedido": "Tramitar comanda",
  "Código promocional": "Codi promocional",
  "Aplicar": "Aplicar",
  "Cupón": "Cupó",
  "Descuento": "Descompte",
  "IVA": "IVA",
  "IVA incluido": "IVA inclòs",
  "Sin IVA": "Sense IVA",
  
  // Promo content
  "Oferta especial": "Oferta especial",
  "Oferta": "Oferta",
  "Ofertas": "Ofertes",
  "Promoción": "Promoció",
  "Promociones": "Promocions",
  "No te lo pierdas": "No t'ho perdis",
  "Únete": "Uneix-te",
  "Suscríbete ahora": "Subscriu-te ara",
  "Consigue": "Aconsegueix",
  "Obtén": "Obtén",
  "Regalo": "Regal",
  "Exclusivo": "Exclusiu",
  "Exclusiva": "Exclusiva",
  "Solo": "Només",
  "Limitado": "Limitat",
  "Limitada": "Limitada",
  
  // Navigation
  "Menú": "Menú",
  "Principal": "Principal",
  "Página principal": "Pàgina principal",
  "Siguiente": "Següent",
  "Anterior": "Anterior",
  "Primera": "Primera",
  "Última": "Última",
  "Ir a": "Anar a",
  
  // Sections
  "Sección": "Secció",
  "Secciones": "Seccions",
  "Destacados": "Destacats",
  "Destacadas": "Destacades",
  "Populares": "Populars",
  "Recientes": "Recents",
  "Tendencias": "Tendències",
  
  // Additional actions
  "Añadir": "Afegir",
  "Agregar": "Afegir",
  "Quitar": "Treure",
  "Borrar": "Esborrar",
  "Actualizar": "Actualitzar",
  "Refrescar": "Refrescar",
  "Cargar": "Carregar",
  "Subir": "Pujar",
  "Bajar": "Baixar",
  "Abrir": "Obrir",
  "Cerrar": "Tancar",
  "Mostrar": "Mostrar",
  "Ocultar": "Amagar",
  "Expandir": "Expandir",
  "Contraer": "Contraure",
  
  // Status messages
  "Cargando...": "Carregant...",
  "Procesando...": "Processant...",
  "Enviando...": "Enviant...",
  "Guardando...": "Desant...",
  "Completado": "Completat",
  "Completada": "Completada",
  "En proceso": "En procés",
  "Pendiente": "Pendent",
  "Confirmado": "Confirmat",
  "Confirmada": "Confirmada",
  "Enviado": "Enviat",
  "Enviada": "Enviada",
  "Entregado": "Lliurat",
  "Entregada": "Lliurada",
  
  // Time and dates
  "Hoy": "Avui",
  "Ayer": "Ahir",
  "Mañana": "Demà",
  "Día": "Dia",
  "Días": "Dies",
  "Semana": "Setmana",
  "Mes": "Mes",
  "Año": "Any",
  "Hora": "Hora",
  "Fecha": "Data",
  
  // Boolean & Options
  "Sí": "Sí",
  "No": "No",
  "Tal vez": "Potser",
  "Todos": "Tots",
  "Todas": "Totes",
  "Ninguno": "Cap",
  "Ninguna": "Cap",
  "Algunos": "Alguns",
  "Algunas": "Algunes",
  "Varios": "Diversos",
  "Varias": "Diverses",
};

async function translateRemainingTexts() {
  console.log("🔧 Finalizing Catalan translations for priority namespaces...\n");
  
  const priorityNamespaces = [
    "home", "homepage", "author_page", "book_landing", 
    "blog", "checkout", "common", "navigation", 
    "promo_content", "sections"
  ];
  
  let totalFixed = 0;
  
  for (const namespace of priorityNamespaces) {
    // Get texts that are still identical to Spanish
    const textsNeedingTranslation = await db.select({
      caText: uiTexts,
    })
    .from(uiTexts)
    .where(and(
      eq(uiTexts.namespace, namespace),
      eq(uiTexts.locale, "ca-ES")
    ));
    
    let fixed = 0;
    
    for (const { caText } of textsNeedingTranslation) {
      // Check if Spanish version exists and is same
      const [esText] = await db.select()
        .from(uiTexts)
        .where(and(
          eq(uiTexts.namespace, caText.namespace),
          eq(uiTexts.key, caText.key),
          eq(uiTexts.locale, "es-ES")
        ));
      
      if (esText && caText.value === esText.value) {
        // Try to translate
        const translated = translateWithDictionary(caText.value);
        
        if (translated !== caText.value) {
          await db.update(uiTexts)
            .set({ value: translated })
            .where(and(
              eq(uiTexts.namespace, caText.namespace),
              eq(uiTexts.key, caText.key),
              eq(uiTexts.locale, "ca-ES")
            ));
          
          fixed++;
        }
      }
    }
    
    totalFixed += fixed;
    if (fixed > 0) {
      console.log(`✅ ${namespace}: Fixed ${fixed} additional translations`);
    }
  }
  
  console.log(`\n✅ Total additional translations: ${totalFixed}\n`);
  
  // Show final statistics
  const stats = await db.execute(sql`
    SELECT 
      ca.namespace,
      COUNT(*) as total,
      SUM(CASE WHEN ca.value != es.value THEN 1 ELSE 0 END) as translated,
      ROUND(100.0 * SUM(CASE WHEN ca.value != es.value THEN 1 ELSE 0 END) / COUNT(*), 1) as pct
    FROM ui_texts ca
    JOIN ui_texts es ON ca.namespace = es.namespace AND ca.key = es.key AND es.locale = 'es-ES'
    WHERE ca.locale = 'ca-ES' 
      AND ca.namespace IN ('home', 'homepage', 'author_page', 'book_landing', 'blog', 'checkout', 'common', 'navigation', 'promo_content', 'sections')
    GROUP BY ca.namespace
    ORDER BY pct DESC
  `);
  
  console.log("📊 Final Translation Coverage by Namespace:");
  console.log("─".repeat(60));
  console.log("Namespace".padEnd(20) + "Total".padEnd(10) + "Translated".padEnd(15) + "Coverage");
  console.log("─".repeat(60));
  
  stats.rows.forEach((row: any) => {
    console.log(
      row.namespace.padEnd(20) + 
      row.total.toString().padEnd(10) + 
      row.translated.toString().padEnd(15) + 
      row.pct + "%"
    );
  });
  
  console.log("─".repeat(60));
  
  process.exit(0);
}

function translateWithDictionary(text: string): string {
  // Direct match
  if (ADDITIONAL_TRANSLATIONS[text]) {
    return ADDITIONAL_TRANSLATIONS[text];
  }
  
  // Word-by-word replacement (case-sensitive for first attempt)
  let result = text;
  
  Object.entries(ADDITIONAL_TRANSLATIONS).forEach(([spanish, catalan]) => {
    const regex = new RegExp(`\\b${spanish}\\b`, 'g');
    result = result.replace(regex, catalan);
  });
  
  // If nothing changed, try case-insensitive
  if (result === text) {
    Object.entries(ADDITIONAL_TRANSLATIONS).forEach(([spanish, catalan]) => {
      const regex = new RegExp(`\\b${spanish}\\b`, 'gi');
      result = result.replace(regex, (match) => {
        if (match === match.toUpperCase()) return catalan.toUpperCase();
        if (match[0] === match[0].toUpperCase()) {
          return catalan[0].toUpperCase() + catalan.slice(1);
        }
        return catalan;
      });
    });
  }
  
  return result;
}

translateRemainingTexts().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});
