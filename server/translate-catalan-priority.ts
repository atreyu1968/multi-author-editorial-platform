import { db } from "./db";
import { uiTexts } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

// Priority namespaces to translate
const PRIORITY_NAMESPACES = [
  "home",
  "homepage", 
  "author_page",
  "book_landing",
  "blog",
  "checkout",
  "common",
  "navigation",
  "promo_content",
  "sections"
];

// Comprehensive Spanish to Catalan translation dictionary
// Based on professional ecommerce UI translations
const TRANSLATIONS: Record<string, string> = {
  // Shopping & Cart
  "Carrito": "Cistell",
  "Carrito de compras": "Cistell de la compra",
  "Añadir al carrito": "Afegir al cistell",
  "¡Añadido al carrito!": "Afegit al cistell!",
  "Ver carrito": "Veure el cistell",
  "Vaciar carrito": "Buidar el cistell",
  "Añadiendo...": "Afegint...",
  "ha sido añadido a tu carrito.": "s'ha afegit a la teva cistella.",
  
  // Product & Catalog
  "Producto": "Producte",
  "Productos": "Productes",
  "Libro": "Llibre",
  "Libros": "Llibres",
  "Precio": "Preu",
  "Descripción": "Descripció",
  "Disponible": "Disponible",
  "Agotado": "Esgotat",
  "En stock": "En estoc",
  "Cantidad": "Quantitat",
  "Digital": "Digital",
  "Físico": "Físic",
  "Artículo": "Article",
  
  // Checkout & Payment
  "Pagar": "Pagar",
  "Finalizar compra": "Finalitzar la compra",
  "Comprar ahora": "Comprar ara",
  "Comprar": "Comprar",
  "Continuar comprando": "Continuar comprant",
  "Proceder al pago": "Procedir al pagament",
  "Pago seguro": "Pagament segur",
  "Confirmar pedido": "Confirmar comanda",
  "Método de pago": "Mètode de pagament",
  "Tarjeta de crédito": "Targeta de crèdit",
  
  // Order & Shipping
  "Pedido": "Comanda",
  "Mi pedido": "La meva comanda",
  "Mis pedidos": "Les meves comandes",
  "Envío": "Enviament",
  "Gastos de envío": "Despeses d'enviament",
  "Envío gratis": "Enviament gratuït",
  "Envío gratuito": "Enviament gratuït",
  "Dirección de envío": "Adreça d'enviament",
  "Entrega": "Lliurament",
  "Plazo de entrega": "Termini de lliurament",
  
  // Account & User
  "Mi cuenta": "El meu compte",
  "Iniciar sesión": "Iniciar sessió",
  "Registrarse": "Registrar-se",
  "Cerrar sesión": "Tancar sessió",
  "Usuario": "Usuari",
  "Contraseña": "Contrasenya",
  "Datos personales": "Dades personals",
  "Perfil": "Perfil",
  "Nombre": "Nom",
  "Apellidos": "Cognoms",
  "Correo electrónico": "Correu electrònic",
  "Email": "Correu electrònic",
  "Teléfono": "Telèfon",
  "Dirección": "Adreça",
  "Ciudad": "Ciutat",
  "País": "País",
  "Código postal": "Codi postal",
  
  // General Actions
  "Buscar": "Cercar",
  "Búsqueda": "Cerca",
  "Filtrar": "Filtrar",
  "Ordenar por": "Ordenar per",
  "Editar": "Editar",
  "Eliminar": "Eliminar",
  "Modificar": "Modificar",
  "Cancelar": "Cancel·lar",
  "Aceptar": "Acceptar",
  "Continuar": "Continuar",
  "Volver": "Tornar",
  "Guardar": "Desar",
  "Descargar": "Descarregar",
  "Descarga": "Descàrrega",
  "Descarga Gratuita": "Descàrrega Gratuïta",
  
  // Content & Info
  "Leer más": "Llegir més",
  "Ver más": "Veure més",
  "Ver detalles": "Veure detalls",
  "Más información": "Més informació",
  "Información": "Informació",
  "Detalles": "Detalls",
  "Inicio": "Inici",
  "Volver al inicio": "Tornar a l'inici",
  "Blog": "Blog",
  "Contacto": "Contacte",
  "Ayuda": "Ajuda",
  "Preguntas frecuentes": "Preguntes freqüents",
  "Sobre": "Sobre",
  "Acerca de": "Sobre",
  
  // Reviews & Feedback
  "Opiniones": "Opinions",
  "Valoraciones": "Valoracions",
  "Reseñas": "Ressenyes",
  "Comentarios": "Comentaris",
  "Calificación": "Qualificació",
  "Testimonios": "Testimonis",
  
  // Quantities & Measures
  "Total": "Total",
  "Subtotal": "Subtotal",
  "Impuestos": "Impostos",
  "Gratis": "Gratuït",
  "Gratuito": "Gratuït",
  "Nuevo": "Nou",
  "Nueva": "Nova",
  "Destacado": "Destacat",
  "Destacada": "Destacada",
  "Páginas": "Pàgines",
  
  // Author & Book specific
  "Autor": "Autor",
  "Autora": "Autora",
  "Autores": "Autors",
  "Serie": "Sèrie",
  "Series": "Sèries",
  "Ver serie completa": "Veure la sèrie completa",
  "Explorar toda la serie": "Explorar tota la sèrie",
  "Ver Libros": "Veure Llibres",
  "Ver en Amazon": "Veure a Amazon",
  "Comprar en Amazon": "Comprar a Amazon",
  "Sinopsis": "Sinopsi",
  "Género": "Gènere",
  "Fecha de publicación": "Data de publicació",
  "ISBN": "ISBN",
  "Editorial": "Editorial",
  "Idioma": "Idioma",
  "Español": "Espanyol",
  "Inglés": "Anglès",
  "Catalán": "Català",
  
  // Specific book landing texts
  "Portada del libro": "Portada del llibre",
  "Foto de": "Foto de",
  "Retrato profesional de": "Retrat professional de",
  "Foto de perfil de": "Foto de perfil de",
  "Una historia emocionante que no querrás dejar de leer.": "Una història emocionant que no voldràs deixar de llegir.",
  "Autor no encontrado": "Autor no trobat",
  "El autor que buscas no existe o ha sido eliminado.": "L'autor que cerques no existeix o ha estat eliminat.",
  "Libro no encontrado": "Llibre no trobat",
  "El libro que buscas no existe o ha sido eliminado.": "El llibre que cerques no existeix o ha estat eliminat.",
  
  // Newsletter & Email
  "Suscríbete": "Subscriu-te",
  "Suscribirse": "Subscriure's",
  "Newsletter": "Butlletí",
  "Boletín": "Butlletí",
  "Recibir novedades": "Rebre novetats",
  "Notificaciones": "Notificacions",
  "Confirmación": "Confirmació",
  
  // Legal & Footer
  "Todos los derechos reservados": "Tots els drets reservats",
  "Política de privacidad": "Política de privadesa",
  "Términos y condiciones": "Termes i condicions",
  "Condiciones de uso": "Condicions d'ús",
  "Redes sociales": "Xarxes socials",
  "Devoluciones": "Devolucions",
  "Política de devolución": "Política de devolució",
  "Garantía": "Garantia",
  
  // Error messages
  "Error": "Error",
  "No se pudo añadir el libro al carrito. Intenta de nuevo.": "No s'ha pogut afegir el llibre a la cistella. Torna-ho a intentar.",
  "Intenta de nuevo": "Torna-ho a intentar",
  "Ocurrió un error": "S'ha produït un error",
  
  // Status & States
  "Disponible ahora": "Disponible ara",
  "Próximamente": "Pròximament",
  "Publicado": "Publicat",
  "Publicada": "Publicada",
  "Borrador": "Esborrany",
  "Activo": "Actiu",
  "Activa": "Activa",
  "Inactivo": "Inactiu",
  "Inactiva": "Inactiva",
  
  // Gallery & Media
  "Galería": "Galeria",
  "Imagen": "Imatge",
  "de": "de",
  "Booktrailer": "Booktrailer",
  "Contenido Adicional": "Contingut Addicional",
  "Formatos Digitales:": "Formats Digitals:",
  "Formato Digital": "Format Digital",
  "Árbol Genealógico": "Arbre Genealògic",
  "Descubre las relaciones entre los personajes": "Descobreix les relacions entre els personatges",
  "Mapa Conceptual": "Mapa Conceptual",
  "Explora el mundo y los conceptos de la historia": "Explora el món i els conceptes de la història",
  "Lo que encontrarás en este libro": "El que trobaràs en aquest llibre",
  "¿Listo para sumergirte en esta historia?": "Preparat per submergir-te en aquesta història?",
  "Comienza tu aventura ahora y descubre por qué miles de lectores han quedado cautivados con esta historia.": "Comença la teva aventura ara i descobreix per què milers de lectors han quedat captivats amb aquesta història.",
};

// Function to translate text preserving placeholders
function translateText(text: string): string {
  // Direct match first
  if (TRANSLATIONS[text]) {
    return TRANSLATIONS[text];
  }
  
  // Extract placeholders like {count}, {name}, etc.
  const placeholderRegex = /\{[^}]+\}/g;
  const placeholders = text.match(placeholderRegex) || [];
  
  // Try translating with placeholders replaced temporarily
  let tempText = text;
  const placeholderMap: Record<string, string> = {};
  
  placeholders.forEach((placeholder, index) => {
    const tempKey = `__PLACEHOLDER_${index}__`;
    placeholderMap[tempKey] = placeholder;
    tempText = tempText.replace(placeholder, tempKey);
  });
  
  // Translate the temp text
  let translated = TRANSLATIONS[tempText] || tempText;
  
  // Restore placeholders
  Object.entries(placeholderMap).forEach(([tempKey, originalPlaceholder]) => {
    translated = translated.replace(tempKey, originalPlaceholder);
  });
  
  // If no direct translation found, apply word-by-word and pattern-based translation
  if (translated === tempText) {
    translated = applyPatternTranslation(text);
  }
  
  return translated;
}

function applyPatternTranslation(text: string): string {
  let result = text;
  
  // Replace words that appear in the dictionary (case-insensitive)
  Object.entries(TRANSLATIONS).forEach(([spanish, catalan]) => {
    // Word boundary replacement
    const regex = new RegExp(`\\b${spanish}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      // Preserve case
      if (match === match.toUpperCase()) return catalan.toUpperCase();
      if (match[0] === match[0].toUpperCase()) {
        return catalan[0].toUpperCase() + catalan.slice(1);
      }
      return catalan;
    });
  });
  
  return result;
}

async function main() {
  console.log("🌐 Starting Catalan translation for priority namespaces...\n");
  
  let totalTranslated = 0;
  
  for (const namespace of PRIORITY_NAMESPACES) {
    console.log(`Translating namespace: ${namespace}`);
    
    // Get all texts in this namespace for ca-ES
    const textsToTranslate = await db
      .select()
      .from(uiTexts)
      .where(and(
        eq(uiTexts.namespace, namespace),
        eq(uiTexts.locale, "ca-ES")
      ));
    
    if (textsToTranslate.length === 0) {
      console.log(`  ⏭️  No texts found`);
      continue;
    }
    
    let namespaceCount = 0;
    
    // Translate each text
    for (const text of textsToTranslate) {
      const translated = translateText(text.value);
      
      // Only update if translation changed
      if (translated !== text.value) {
        await db
          .update(uiTexts)
          .set({ value: translated })
          .where(and(
            eq(uiTexts.namespace, text.namespace),
            eq(uiTexts.key, text.key),
            eq(uiTexts.locale, "ca-ES")
          ));
        
        namespaceCount++;
      }
    }
    
    totalTranslated += namespaceCount;
    console.log(`  ✅ Translated ${namespaceCount} / ${textsToTranslate.length} texts`);
  }
  
  console.log(`\n✅ Total translated: ${totalTranslated} texts across ${PRIORITY_NAMESPACES.length} namespaces\n`);
  
  // Show coverage
  const allTexts = await db.select().from(uiTexts).where(eq(uiTexts.locale, "ca-ES"));
  console.log(`📊 Final Catalan coverage: ${allTexts.length} texts\n`);
  
  process.exit(0);
}

main().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});
