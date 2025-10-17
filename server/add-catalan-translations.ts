import { DatabaseStorage } from "./database-storage";
import type { InsertUiText } from "@shared/schema";

// Priority namespaces to translate (same as English)
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

// Spanish to Catalan translation map for common UI texts
const ES_TO_CA_TRANSLATIONS: Record<string, string> = {
  // Common words
  "Inicio": "Inici",
  "Libros": "Llibres",
  "Blog": "Blog",
  "Contacto": "Contacte",
  "Leer más": "Llegir més",
  "Ver más": "Veure més",
  "Comprar ahora": "Comprar ara",
  "Añadir al carrito": "Afegir a la cistella",
  "Carrito": "Cistella",
  "Checkout": "Finalitzar compra",
  "Pagar": "Pagar",
  "Total": "Total",
  "Subtotal": "Subtotal",
  "Envío": "Enviament",
  "Gratis": "Gratis",
  "Nombre": "Nom",
  "Email": "Correu electrònic",
  "Dirección": "Adreça",
  "Ciudad": "Ciutat",
  "País": "País",
  "Código postal": "Codi postal",
  "Teléfono": "Telèfon",
  "Continuar": "Continuar",
  "Volver": "Tornar",
  "Cancelar": "Cancel·lar",
  "Guardar": "Desar",
  "Buscar": "Cercar",
  "Filtrar": "Filtrar",
  "Ordenar": "Ordenar",
  "Precio": "Preu",
  "Disponible": "Disponible",
  "Agotado": "Esgotat",
  "Nuevo": "Nou",
  "Destacado": "Destacat",
  "Autor": "Autor",
  "Autora": "Autora",
  "Autores": "Autors",
  "Libro": "Llibre",
  "Serie": "Sèrie",
  "Descripción": "Descripció",
  "Sinopsis": "Sinopsi",
  "Género": "Gènere",
  "Fecha de publicación": "Data de publicació",
  "Páginas": "Pàgines",
  "ISBN": "ISBN",
  "Editorial": "Editorial",
  "Idioma": "Idioma",
  "Español": "Espanyol",
  "Inglés": "Anglès",
  "Catalán": "Català",
  "Comentarios": "Comentaris",
  "Reseñas": "Ressenyes",
  "Valoraciones": "Valoracions",
  "Suscríbete": "Subscriu-te",
  "Newsletter": "Butlletí",
  "Recibir novedades": "Rebre novetats",
  "Todos los derechos reservados": "Tots els drets reservats",
  "Política de privacidad": "Política de privadesa",
  "Términos y condiciones": "Termes i condicions",
  "Redes sociales": "Xarxes socials"
};

function translateToaCatalan(spanishText: string): string {
  // First try direct translation from map
  if (ES_TO_CA_TRANSLATIONS[spanishText]) {
    return ES_TO_CA_TRANSLATIONS[spanishText];
  }
  
  // For complex translations, apply pattern-based rules
  let catalanText = spanishText;
  
  // Common patterns (simple rules for automatic translation)
  const patterns = [
    // Verb conjugations
    { es: /\bción\b/g, ca: "ció" },
    { es: /\bciones\b/g, ca: "cions" },
    { es: /\bdad\b/g, ca: "dat" },
    { es: /\bdades\b/g, ca: "dats" },
    
    // Articles and pronouns
    { es: /\bel\s/g, ca: "el " },
    { es: /\bla\s/g, ca: "la " },
    { es: /\blos\s/g, ca: "els " },
    { es: /\blas\s/g, ca: "les " },
    { es: /\bun\s/g, ca: "un " },
    { es: /\buna\s/g, ca: "una " },
    { es: /\bunos\s/g, ca: "uns " },
    { es: /\bunas\s/g, ca: "unes " },
    
    // Common word endings
    { es: /mente\b/g, ca: "ment" },
    { es: /ción\b/g, ca: "ció" },
    { es: /sión\b/g, ca: "ssió" },
    { es: /dad\b/g, ca: "tat" },
    { es: /tad\b/g, ca: "tat" },
    
    // Specific common words
    { es: /\bpara\b/g, ca: "per a" },
    { es: /\bcon\b/g, ca: "amb" },
    { es: /\bsin\b/g, ca: "sense" },
    { es: /\bsobre\b/g, ca: "sobre" },
    { es: /\bentre\b/g, ca: "entre" },
    { es: /\bhasta\b/g, ca: "fins" },
    { es: /\bdesde\b/g, ca: "des de" },
    { es: /\bhacia\b/g, ca: "cap a" },
    { es: /\bpor\b/g, ca: "per" },
    { es: /\btambién\b/g, ca: "també" },
    { es: /\bmás\b/g, ca: "més" },
    { es: /\bmenos\b/g, ca: "menys" },
    { es: /\bmuy\b/g, ca: "molt" },
    { es: /\bmucho\b/g, ca: "molt" },
    { es: /\bpoco\b/g, ca: "poc" },
    { es: /\btodo\b/g, ca: "tot" },
    { es: /\btoda\b/g, ca: "tota" },
    { es: /\btodos\b/g, ca: "tots" },
    { es: /\btodas\b/g, ca: "totes" },
    { es: /\balgún\b/g, ca: "algun" },
    { es: /\balguna\b/g, ca: "alguna" },
    { es: /\balgunos\b/g, ca: "alguns" },
    { es: /\balgunas\b/g, ca: "algunes" },
    { es: /\bningún\b/g, ca: "cap" },
    { es: /\bninguna\b/g, ca: "cap" },
    { es: /\bningunas\b/g, ca: "cap" },
    { es: /\bningunos\b/g, ca: "cap" },
    { es: /\ботro\b/g, ca: "altre" },
    { es: /\боtra\b/g, ca: "altra" },
    { es: /\бotros\b/g, ca: "altres" },
    { es: /\бotras\b/g, ca: "altres" },
    { es: /\bmismo\b/g, ca: "mateix" },
    { es: /\bmisma\b/g, ca: "mateixa" },
    { es: /\bmismos\b/g, ca: "mateixos" },
    { es: /\bmismas\b/g, ca: "mateixes" },
  ];
  
  for (const pattern of patterns) {
    catalanText = catalanText.replace(pattern.es, pattern.ca);
  }
  
  return catalanText;
}

async function main() {
  const storage = new DatabaseStorage();
  
  console.log("🚀 Starting Catalan (ca-ES) translation process...\n");
  
  // STEP 1: Bulk copy es-ES → ca-ES
  console.log("📋 STEP 1: Bulk copying es-ES → ca-ES...");
  
  const matrix = await storage.getLocaleMatrix();
  const toCopy = matrix.filter(item => item.locales["es-ES"] && !item.locales["ca-ES"]);
  
  console.log(`Found ${toCopy.length} texts to copy from es-ES to ca-ES`);
  
  if (toCopy.length > 0) {
    const entries: InsertUiText[] = toCopy.map(item => ({
      namespace: item.namespace,
      key: item.key,
      locale: "ca-ES",
      value: item.locales["es-ES"]!
    }));
    
    const results = await storage.bulkUpsertUiTexts(entries);
    console.log(`✅ Copied ${results.length} translations from es-ES to ca-ES\n`);
  } else {
    console.log("✅ No texts to copy (ca-ES already has all es-ES texts)\n");
  }
  
  // STEP 2: Translate priority namespaces
  console.log("🌐 STEP 2: Translating priority public namespaces...");
  console.log(`Priority namespaces: ${PRIORITY_NAMESPACES.join(", ")}\n`);
  
  for (const namespace of PRIORITY_NAMESPACES) {
    console.log(`Translating namespace: ${namespace}`);
    
    const namespaceMatrix = await storage.getLocaleMatrix([namespace]);
    const toTranslate = namespaceMatrix.filter(item => 
      item.locales["es-ES"] && 
      item.locales["ca-ES"] === item.locales["es-ES"] // Only translate if it's still in Spanish
    );
    
    if (toTranslate.length === 0) {
      console.log(`  ⏭️  Already translated (${toTranslate.length} texts)`);
      continue;
    }
    
    const translatedEntries: InsertUiText[] = toTranslate.map(item => {
      const spanishValue = item.locales["es-ES"]!;
      const catalanValue = translateToaCatalan(spanishValue);
      
      return {
        namespace: item.namespace,
        key: item.key,
        locale: "ca-ES",
        value: catalanValue
      };
    });
    
    const results = await storage.bulkUpsertUiTexts(translatedEntries);
    console.log(`  ✅ Translated ${results.length} texts in ${namespace}`);
  }
  
  console.log("\n");
  
  // STEP 3: Verify coverage
  console.log("📊 STEP 3: Verifying coverage...\n");
  
  const finalMatrix = await storage.getLocaleMatrix();
  const locales = ['es-ES', 'en-US', 'ca-ES'];
  
  console.log("Coverage Summary:");
  console.log("─".repeat(60));
  
  for (const locale of locales) {
    const total = finalMatrix.length;
    const translated = finalMatrix.filter(item => item.locales[locale]).length;
    const coverage = total > 0 ? (translated / total) * 100 : 0;
    const localeName = locale === 'es-ES' ? 'Español' : locale === 'en-US' ? 'Inglés' : 'Catalán';
    
    console.log(`${localeName.padEnd(10)} | ${translated.toString().padStart(5)} / ${total.toString().padStart(5)} | ${coverage.toFixed(1).padStart(5)}%`);
  }
  
  console.log("─".repeat(60));
  
  // Spot-check priority namespaces
  console.log("\n🔍 Spot-checking priority namespace translations:\n");
  
  for (const namespace of PRIORITY_NAMESPACES.slice(0, 3)) { // Check first 3
    const namespaceMatrix = await storage.getLocaleMatrix([namespace]);
    const sample = namespaceMatrix.slice(0, 2); // Show 2 examples
    
    console.log(`Namespace: ${namespace}`);
    for (const item of sample) {
      console.log(`  Key: ${item.key}`);
      console.log(`    ES: ${item.locales["es-ES"]}`);
      console.log(`    CA: ${item.locales["ca-ES"]}`);
    }
    console.log();
  }
  
  console.log("✅ Catalan translation process completed!\n");
  
  process.exit(0);
}

main().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});
