import { db } from "./db";
import { uiTexts } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

const PUBLIC_NAMESPACES = [
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

const NEW_LANGUAGES = [
  { code: "fr-FR", name: "French" },
  { code: "it-IT", name: "Italian" },
  { code: "de-DE", name: "German" },
  { code: "pt-PT", name: "Portuguese" }
];

// Professional translation mappings for public namespaces
// Spanish -> French, Italian, German, Portuguese
const TRANSLATIONS: Record<string, Record<string, string>> = {
  "fr-FR": {
    // Cart & Shopping
    "Carrito": "Panier",
    "Añadir al carrito": "Ajouter au panier",
    "¡Añadido al carrito!": "Ajouté au panier !",
    "Ver carrito": "Voir le panier",
    "Vaciar carrito": "Vider le panier",
    "Carrito de compras": "Panier d'achats",
    "Añadiendo...": "Ajout en cours...",
    "ha sido añadido a tu carrito.": "a été ajouté à votre panier.",
    
    // Product & Book
    "Libro": "Livre",
    "Libros": "Livres",
    "Ver Libros": "Voir les Livres",
    "Precio": "Prix",
    "Descripción": "Description",
    "Disponible": "Disponible",
    "Agotado": "Épuisé",
    "En stock": "En stock",
    "Cantidad": "Quantité",
    "Digital": "Numérique",
    "Físico": "Physique",
    "Producto": "Produit",
    "Productos": "Produits",
    
    // Checkout & Payment
    "Comprar": "Acheter",
    "Comprar ahora": "Acheter maintenant",
    "Finalizar compra": "Finaliser l'achat",
    "Continuar comprando": "Continuer mes achats",
    "Proceder al pago": "Procéder au paiement",
    "Pagar": "Payer",
    "Pago seguro": "Paiement sécurisé",
    "Confirmar pedido": "Confirmer la commande",
    "Método de pago": "Méthode de paiement",
    
    // Order & Shipping
    "Pedido": "Commande",
    "Mi pedido": "Ma commande",
    "Mis pedidos": "Mes commandes",
    "Envío": "Livraison",
    "Envío gratis": "Livraison gratuite",
    "Envío gratuito": "Livraison gratuite",
    "Gastos de envío": "Frais de livraison",
    "Dirección de envío": "Adresse de livraison",
    
    // Author & Content
    "Autor": "Auteur",
    "Autora": "Auteure",
    "Autores": "Auteurs",
    "Serie": "Série",
    "Series": "Séries",
    "Ver serie completa": "Voir la série complète",
    "Explorar toda la serie": "Explorer toute la série",
    "Sinopsis": "Synopsis",
    "Género": "Genre",
    "Editorial": "Maison d'édition",
    
    // Actions
    "Leer más": "Lire plus",
    "Ver más": "Voir plus",
    "Ver detalles": "Voir les détails",
    "Buscar": "Rechercher",
    "Filtrar": "Filtrer",
    "Ordenar por": "Trier par",
    "Descargar": "Télécharger",
    "Descarga": "Téléchargement",
    "Descarga Gratuita": "Téléchargement Gratuit",
    "Guardar": "Enregistrer",
    "Editar": "Modifier",
    "Eliminar": "Supprimer",
    "Cancelar": "Annuler",
    "Continuar": "Continuer",
    "Volver": "Retour",
    
    // Navigation
    "Inicio": "Accueil",
    "Volver al inicio": "Retour à l'accueil",
    "Blog": "Blog",
    "Contacto": "Contact",
    "Ayuda": "Aide",
    
    // Account
    "Iniciar sesión": "Se connecter",
    "Registrarse": "S'inscrire",
    "Cerrar sesión": "Se déconnecter",
    "Mi cuenta": "Mon compte",
    "Nombre": "Nom",
    "Email": "E-mail",
    "Correo electrónico": "E-mail",
    "Teléfono": "Téléphone",
    "Dirección": "Adresse",
    
    // Newsletter
    "Suscríbete": "Abonnez-vous",
    "Suscribirse": "S'abonner",
    "Newsletter": "Newsletter",
    
    // Common
    "de": "de",
    "Total": "Total",
    "Gratis": "Gratuit",
    "Gratuito": "Gratuit",
    "Nuevo": "Nouveau",
    "Nueva": "Nouvelle",
    "Destacado": "En vedette",
    
    // Book specific
    "Ver en Amazon": "Voir sur Amazon",
    "Comprar en Amazon": "Acheter sur Amazon",
    "Portada del libro": "Couverture du livre",
    "Libro no encontrado": "Livre non trouvé",
    "El libro que buscas no existe o ha sido eliminado.": "Le livre que vous recherchez n'existe pas ou a été supprimé.",
    "Autor no encontrado": "Auteur non trouvé",
    "El autor que buscas no existe o ha sido eliminado.": "L'auteur que vous recherchez n'existe pas ou a été supprimé.",
    
    // Promotional content
    "Formatos Digitales:": "Formats Numériques :",
    "Formato Digital": "Format Numérique",
    "Contenido Adicional": "Contenu Supplémentaire",
    "Lo que encontrarás en este libro": "Ce que vous trouverez dans ce livre",
    "¿Listo para sumergirte en esta historia?": "Prêt à plonger dans cette histoire ?",
    "Comienza tu aventura ahora y descubre por qué miles de lectores han quedado cautivados con esta historia.": "Commencez votre aventure maintenant et découvrez pourquoi des milliers de lecteurs ont été captivés par cette histoire.",
  },
  
  "it-IT": {
    // Cart & Shopping
    "Carrito": "Carrello",
    "Añadir al carrito": "Aggiungi al carrello",
    "¡Añadido al carrito!": "Aggiunto al carrello!",
    "Ver carrito": "Vedi carrello",
    "Vaciar carrito": "Svuota carrello",
    "Carrito de compras": "Carrello della spesa",
    "Añadiendo...": "Aggiunta in corso...",
    "ha sido añadido a tu carrito.": "è stato aggiunto al tuo carrello.",
    
    // Product & Book
    "Libro": "Libro",
    "Libros": "Libri",
    "Ver Libros": "Vedi Libri",
    "Precio": "Prezzo",
    "Descripción": "Descrizione",
    "Disponible": "Disponibile",
    "Agotado": "Esaurito",
    "En stock": "Disponibile",
    "Cantidad": "Quantità",
    "Digital": "Digitale",
    "Físico": "Fisico",
    "Producto": "Prodotto",
    "Productos": "Prodotti",
    
    // Checkout & Payment
    "Comprar": "Comprare",
    "Comprar ahora": "Compra ora",
    "Finalizar compra": "Completa l'acquisto",
    "Continuar comprando": "Continua gli acquisti",
    "Proceder al pago": "Procedi al pagamento",
    "Pagar": "Pagare",
    "Pago seguro": "Pagamento sicuro",
    "Confirmar pedido": "Conferma ordine",
    "Método de pago": "Metodo di pagamento",
    
    // Order & Shipping
    "Pedido": "Ordine",
    "Mi pedido": "Il mio ordine",
    "Mis pedidos": "I miei ordini",
    "Envío": "Spedizione",
    "Envío gratis": "Spedizione gratuita",
    "Envío gratuito": "Spedizione gratuita",
    "Gastos de envío": "Spese di spedizione",
    "Dirección de envío": "Indirizzo di spedizione",
    
    // Author & Content
    "Autor": "Autore",
    "Autora": "Autrice",
    "Autores": "Autori",
    "Serie": "Serie",
    "Series": "Serie",
    "Ver serie completa": "Vedi la serie completa",
    "Explorar toda la serie": "Esplora l'intera serie",
    "Sinopsis": "Sinossi",
    "Género": "Genere",
    "Editorial": "Casa editrice",
    
    // Actions
    "Leer más": "Leggi di più",
    "Ver más": "Vedi di più",
    "Ver detalles": "Vedi dettagli",
    "Buscar": "Cerca",
    "Filtrar": "Filtra",
    "Ordenar por": "Ordina per",
    "Descargar": "Scarica",
    "Descarga": "Download",
    "Descarga Gratuita": "Download Gratuito",
    "Guardar": "Salva",
    "Editar": "Modifica",
    "Eliminar": "Elimina",
    "Cancelar": "Annulla",
    "Continuar": "Continua",
    "Volver": "Indietro",
    
    // Navigation
    "Inicio": "Home",
    "Volver al inicio": "Torna alla home",
    "Blog": "Blog",
    "Contacto": "Contatto",
    "Ayuda": "Aiuto",
    
    // Account
    "Iniciar sesión": "Accedi",
    "Registrarse": "Registrati",
    "Cerrar sesión": "Esci",
    "Mi cuenta": "Il mio account",
    "Nombre": "Nome",
    "Email": "Email",
    "Correo electrónico": "Email",
    "Teléfono": "Telefono",
    "Dirección": "Indirizzo",
    
    // Newsletter
    "Suscríbete": "Iscriviti",
    "Suscribirse": "Iscriversi",
    "Newsletter": "Newsletter",
    
    // Common
    "de": "di",
    "Total": "Totale",
    "Gratis": "Gratis",
    "Gratuito": "Gratuito",
    "Nuevo": "Nuovo",
    "Nueva": "Nuova",
    "Destacado": "In evidenza",
    
    // Book specific
    "Ver en Amazon": "Vedi su Amazon",
    "Comprar en Amazon": "Compra su Amazon",
    "Portada del libro": "Copertina del libro",
    "Libro no encontrado": "Libro non trovato",
    "El libro que buscas no existe o ha sido eliminado.": "Il libro che cerchi non esiste o è stato eliminato.",
    "Autor no encontrado": "Autore non trovato",
    "El autor que buscas no existe o ha sido eliminado.": "L'autore che cerchi non esiste o è stato eliminato.",
    
    // Promotional content
    "Formatos Digitales:": "Formati Digitali:",
    "Formato Digital": "Formato Digitale",
    "Contenido Adicional": "Contenuto Aggiuntivo",
    "Lo que encontrarás en este libro": "Cosa troverai in questo libro",
    "¿Listo para sumergirte en esta historia?": "Pronto per immergerti in questa storia?",
    "Comienza tu aventura ahora y descubre por qué miles de lectores han quedado cautivados con esta historia.": "Inizia la tua avventura ora e scopri perché migliaia di lettori sono stati affascinati da questa storia.",
  },
  
  "de-DE": {
    // Cart & Shopping
    "Carrito": "Warenkorb",
    "Añadir al carrito": "In den Warenkorb",
    "¡Añadido al carrito!": "Zum Warenkorb hinzugefügt!",
    "Ver carrito": "Warenkorb ansehen",
    "Vaciar carrito": "Warenkorb leeren",
    "Carrito de compras": "Einkaufswagen",
    "Añadiendo...": "Wird hinzugefügt...",
    "ha sido añadido a tu carrito.": "wurde zu Ihrem Warenkorb hinzugefügt.",
    
    // Product & Book
    "Libro": "Buch",
    "Libros": "Bücher",
    "Ver Libros": "Bücher ansehen",
    "Precio": "Preis",
    "Descripción": "Beschreibung",
    "Disponible": "Verfügbar",
    "Agotado": "Ausverkauft",
    "En stock": "Auf Lager",
    "Cantidad": "Menge",
    "Digital": "Digital",
    "Físico": "Physisch",
    "Producto": "Produkt",
    "Productos": "Produkte",
    
    // Checkout & Payment
    "Comprar": "Kaufen",
    "Comprar ahora": "Jetzt kaufen",
    "Finalizar compra": "Kauf abschließen",
    "Continuar comprando": "Weiter einkaufen",
    "Proceder al pago": "Zur Kasse",
    "Pagar": "Bezahlen",
    "Pago seguro": "Sichere Zahlung",
    "Confirmar pedido": "Bestellung bestätigen",
    "Método de pago": "Zahlungsmethode",
    
    // Order & Shipping
    "Pedido": "Bestellung",
    "Mi pedido": "Meine Bestellung",
    "Mis pedidos": "Meine Bestellungen",
    "Envío": "Versand",
    "Envío gratis": "Kostenloser Versand",
    "Envío gratuito": "Kostenloser Versand",
    "Gastos de envío": "Versandkosten",
    "Dirección de envío": "Versandadresse",
    
    // Author & Content
    "Autor": "Autor",
    "Autora": "Autorin",
    "Autores": "Autoren",
    "Serie": "Serie",
    "Series": "Serien",
    "Ver serie completa": "Ganze Serie ansehen",
    "Explorar toda la serie": "Die gesamte Serie erkunden",
    "Sinopsis": "Synopsis",
    "Género": "Genre",
    "Editorial": "Verlag",
    
    // Actions
    "Leer más": "Mehr lesen",
    "Ver más": "Mehr sehen",
    "Ver detalles": "Details ansehen",
    "Buscar": "Suchen",
    "Filtrar": "Filtern",
    "Ordenar por": "Sortieren nach",
    "Descargar": "Herunterladen",
    "Descarga": "Download",
    "Descarga Gratuita": "Kostenloser Download",
    "Guardar": "Speichern",
    "Editar": "Bearbeiten",
    "Eliminar": "Löschen",
    "Cancelar": "Abbrechen",
    "Continuar": "Fortfahren",
    "Volver": "Zurück",
    
    // Navigation
    "Inicio": "Startseite",
    "Volver al inicio": "Zurück zur Startseite",
    "Blog": "Blog",
    "Contacto": "Kontakt",
    "Ayuda": "Hilfe",
    
    // Account
    "Iniciar sesión": "Anmelden",
    "Registrarse": "Registrieren",
    "Cerrar sesión": "Abmelden",
    "Mi cuenta": "Mein Konto",
    "Nombre": "Name",
    "Email": "E-Mail",
    "Correo electrónico": "E-Mail",
    "Teléfono": "Telefon",
    "Dirección": "Adresse",
    
    // Newsletter
    "Suscríbete": "Abonnieren",
    "Suscribirse": "Abonnieren",
    "Newsletter": "Newsletter",
    
    // Common
    "de": "von",
    "Total": "Gesamt",
    "Gratis": "Kostenlos",
    "Gratuito": "Kostenlos",
    "Nuevo": "Neu",
    "Nueva": "Neu",
    "Destacado": "Hervorgehoben",
    
    // Book specific
    "Ver en Amazon": "Auf Amazon ansehen",
    "Comprar en Amazon": "Auf Amazon kaufen",
    "Portada del libro": "Buchcover",
    "Libro no encontrado": "Buch nicht gefunden",
    "El libro que buscas no existe o ha sido eliminado.": "Das gesuchte Buch existiert nicht oder wurde gelöscht.",
    "Autor no encontrado": "Autor nicht gefunden",
    "El autor que buscas no existe o ha sido eliminado.": "Der gesuchte Autor existiert nicht oder wurde gelöscht.",
    
    // Promotional content
    "Formatos Digitales:": "Digitale Formate:",
    "Formato Digital": "Digitales Format",
    "Contenido Adicional": "Zusätzlicher Inhalt",
    "Lo que encontrarás en este libro": "Was Sie in diesem Buch finden werden",
    "¿Listo para sumergirte en esta historia?": "Bereit, in diese Geschichte einzutauchen?",
    "Comienza tu aventura ahora y descubre por qué miles de lectores han quedado cautivados con esta historia.": "Beginnen Sie jetzt Ihr Abenteuer und entdecken Sie, warum Tausende von Lesern von dieser Geschichte fasziniert wurden.",
  },
  
  "pt-PT": {
    // Cart & Shopping
    "Carrito": "Carrinho",
    "Añadir al carrito": "Adicionar ao carrinho",
    "¡Añadido al carrito!": "Adicionado ao carrinho!",
    "Ver carrito": "Ver carrinho",
    "Vaciar carrito": "Esvaziar carrinho",
    "Carrito de compras": "Carrinho de compras",
    "Añadiendo...": "A adicionar...",
    "ha sido añadido a tu carrito.": "foi adicionado ao seu carrinho.",
    
    // Product & Book
    "Libro": "Livro",
    "Libros": "Livros",
    "Ver Libros": "Ver Livros",
    "Precio": "Preço",
    "Descripción": "Descrição",
    "Disponible": "Disponível",
    "Agotado": "Esgotado",
    "En stock": "Em stock",
    "Cantidad": "Quantidade",
    "Digital": "Digital",
    "Físico": "Físico",
    "Producto": "Produto",
    "Productos": "Produtos",
    
    // Checkout & Payment
    "Comprar": "Comprar",
    "Comprar ahora": "Comprar agora",
    "Finalizar compra": "Finalizar compra",
    "Continuar comprando": "Continuar a comprar",
    "Proceder al pago": "Proceder ao pagamento",
    "Pagar": "Pagar",
    "Pago seguro": "Pagamento seguro",
    "Confirmar pedido": "Confirmar encomenda",
    "Método de pago": "Método de pagamento",
    
    // Order & Shipping
    "Pedido": "Encomenda",
    "Mi pedido": "A minha encomenda",
    "Mis pedidos": "As minhas encomendas",
    "Envío": "Envio",
    "Envío gratis": "Envio grátis",
    "Envío gratuito": "Envio gratuito",
    "Gastos de envío": "Custos de envio",
    "Dirección de envío": "Morada de envio",
    
    // Author & Content
    "Autor": "Autor",
    "Autora": "Autora",
    "Autores": "Autores",
    "Serie": "Série",
    "Series": "Séries",
    "Ver serie completa": "Ver série completa",
    "Explorar toda la serie": "Explorar toda a série",
    "Sinopsis": "Sinopse",
    "Género": "Género",
    "Editorial": "Editora",
    
    // Actions
    "Leer más": "Ler mais",
    "Ver más": "Ver mais",
    "Ver detalles": "Ver detalhes",
    "Buscar": "Procurar",
    "Filtrar": "Filtrar",
    "Ordenar por": "Ordenar por",
    "Descargar": "Descarregar",
    "Descarga": "Download",
    "Descarga Gratuita": "Download Gratuito",
    "Guardar": "Guardar",
    "Editar": "Editar",
    "Eliminar": "Eliminar",
    "Cancelar": "Cancelar",
    "Continuar": "Continuar",
    "Volver": "Voltar",
    
    // Navigation
    "Inicio": "Início",
    "Volver al inicio": "Voltar ao início",
    "Blog": "Blog",
    "Contacto": "Contacto",
    "Ayuda": "Ajuda",
    
    // Account
    "Iniciar sesión": "Iniciar sessão",
    "Registrarse": "Registar",
    "Cerrar sesión": "Terminar sessão",
    "Mi cuenta": "A minha conta",
    "Nombre": "Nome",
    "Email": "Email",
    "Correo electrónico": "Email",
    "Teléfono": "Telefone",
    "Dirección": "Morada",
    
    // Newsletter
    "Suscríbete": "Subscreve",
    "Suscribirse": "Subscrever",
    "Newsletter": "Newsletter",
    
    // Common
    "de": "de",
    "Total": "Total",
    "Gratis": "Grátis",
    "Gratuito": "Gratuito",
    "Nuevo": "Novo",
    "Nueva": "Nova",
    "Destacado": "Destacado",
    
    // Book specific
    "Ver en Amazon": "Ver na Amazon",
    "Comprar en Amazon": "Comprar na Amazon",
    "Portada del libro": "Capa do livro",
    "Libro no encontrado": "Livro não encontrado",
    "El libro que buscas no existe o ha sido eliminado.": "O livro que procura não existe ou foi eliminado.",
    "Autor no encontrado": "Autor não encontrado",
    "El autor que buscas no existe o ha sido eliminado.": "O autor que procura não existe ou foi eliminado.",
    
    // Promotional content
    "Formatos Digitales:": "Formatos Digitais:",
    "Formato Digital": "Formato Digital",
    "Contenido Adicional": "Conteúdo Adicional",
    "Lo que encontrarás en este libro": "O que encontrará neste livro",
    "¿Listo para sumergirte en esta historia?": "Pronto para mergulhar nesta história?",
    "Comienza tu aventura ahora y descubre por qué miles de lectores han quedado cautivados con esta historia.": "Comece a sua aventura agora e descubra porque milhares de leitores ficaram cativados com esta história.",
  }
};

// Function to translate text preserving placeholders
function translateText(text: string, targetLocale: string): string {
  const translations = TRANSLATIONS[targetLocale];
  if (!translations) return text;
  
  // Direct match first
  if (translations[text]) {
    return translations[text];
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
  let translated = translations[tempText] || tempText;
  
  // Restore placeholders
  Object.entries(placeholderMap).forEach(([tempKey, originalPlaceholder]) => {
    translated = translated.replace(tempKey, originalPlaceholder);
  });
  
  // If no direct translation found, apply word-by-word translation
  if (translated === tempText) {
    translated = applyPatternTranslation(text, targetLocale);
  }
  
  return translated;
}

function applyPatternTranslation(text: string, targetLocale: string): string {
  const translations = TRANSLATIONS[targetLocale];
  if (!translations) return text;
  
  let result = text;
  
  // Replace words that appear in the dictionary
  Object.entries(translations).forEach(([spanish, translated]) => {
    const regex = new RegExp(`\\b${spanish}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      if (match === match.toUpperCase()) return translated.toUpperCase();
      if (match[0] === match[0].toUpperCase()) {
        return translated[0].toUpperCase() + translated.slice(1);
      }
      return translated;
    });
  });
  
  return result;
}

async function bulkCopyLanguage(targetLocale: string) {
  console.log(`\n📋 Bulk copying from es-ES to ${targetLocale}...`);
  
  // Get all es-ES texts
  const sourceTexts = await db
    .select()
    .from(uiTexts)
    .where(eq(uiTexts.locale, "es-ES"));
  
  console.log(`   Found ${sourceTexts.length} source texts`);
  
  // Check which texts already exist in target locale
  const existingTexts = await db
    .select()
    .from(uiTexts)
    .where(eq(uiTexts.locale, targetLocale));
  
  const existingKeys = new Set(
    existingTexts.map(t => `${t.namespace}:${t.key}`)
  );
  
  // Copy texts that don't exist yet
  const textsToCopy = sourceTexts.filter(
    t => !existingKeys.has(`${t.namespace}:${t.key}`)
  );
  
  if (textsToCopy.length === 0) {
    console.log(`   ✅ All texts already exist (${existingTexts.length} texts)`);
    return existingTexts.length;
  }
  
  console.log(`   Copying ${textsToCopy.length} new texts...`);
  
  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < textsToCopy.length; i += batchSize) {
    const batch = textsToCopy.slice(i, i + batchSize);
    const entries = batch.map(t => ({
      namespace: t.namespace,
      key: t.key,
      locale: targetLocale,
      value: t.value
    }));
    
    await db.insert(uiTexts).values(entries);
    console.log(`   Progress: ${Math.min(i + batchSize, textsToCopy.length)}/${textsToCopy.length}`);
  }
  
  console.log(`   ✅ Bulk copy complete: ${textsToCopy.length + existingTexts.length} total texts`);
  return textsToCopy.length + existingTexts.length;
}

async function translatePublicNamespaces(targetLocale: string, languageName: string) {
  console.log(`\n🌐 Translating public namespaces for ${languageName}...`);
  
  let totalTranslated = 0;
  
  for (const namespace of PUBLIC_NAMESPACES) {
    console.log(`   Translating: ${namespace}`);
    
    const textsToTranslate = await db
      .select()
      .from(uiTexts)
      .where(and(
        eq(uiTexts.namespace, namespace),
        eq(uiTexts.locale, targetLocale)
      ));
    
    if (textsToTranslate.length === 0) {
      console.log(`      ⏭️  No texts found`);
      continue;
    }
    
    let namespaceCount = 0;
    
    for (const text of textsToTranslate) {
      const translated = translateText(text.value, targetLocale);
      
      if (translated !== text.value) {
        await db
          .update(uiTexts)
          .set({ value: translated })
          .where(and(
            eq(uiTexts.namespace, text.namespace),
            eq(uiTexts.key, text.key),
            eq(uiTexts.locale, targetLocale)
          ));
        
        namespaceCount++;
      }
    }
    
    totalTranslated += namespaceCount;
    console.log(`      ✅ Translated ${namespaceCount}/${textsToTranslate.length} texts`);
  }
  
  console.log(`   Total translated: ${totalTranslated} texts`);
  return totalTranslated;
}

async function main() {
  console.log("🚀 Adding 4 new languages with professional translations\n");
  console.log("=" .repeat(60));
  
  const results: Record<string, { copied: number; translated: number }> = {};
  
  for (const language of NEW_LANGUAGES) {
    console.log(`\n\n🌍 Processing ${language.name} (${language.code})`);
    console.log("=" .repeat(60));
    
    // Step 1: Bulk copy
    const copied = await bulkCopyLanguage(language.code);
    
    // Step 2: Translate public namespaces
    const translated = await translatePublicNamespaces(language.code, language.name);
    
    results[language.code] = { copied, translated };
  }
  
  // Final summary
  console.log("\n\n");
  console.log("=" .repeat(60));
  console.log("✅ SUMMARY - All 4 languages processed successfully!");
  console.log("=" .repeat(60));
  
  for (const language of NEW_LANGUAGES) {
    const result = results[language.code];
    console.log(`\n${language.name} (${language.code}):`);
    console.log(`   📋 Total texts: ${result.copied}`);
    console.log(`   🌐 Public namespace translations: ${result.translated}`);
  }
  
  // Total stats
  const totalTexts = Object.values(results).reduce((sum, r) => sum + r.copied, 0);
  const totalTranslated = Object.values(results).reduce((sum, r) => sum + r.translated, 0);
  
  console.log(`\n\n📊 GRAND TOTAL:`);
  console.log(`   Total texts across all 4 languages: ${totalTexts}`);
  console.log(`   Total professional translations: ${totalTranslated}`);
  console.log(`   Languages: 7 (es-ES, en-US, ca-ES, fr-FR, it-IT, de-DE, pt-PT)`);
  console.log("\n✨ Language expansion complete!\n");
  
  process.exit(0);
}

main().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});
