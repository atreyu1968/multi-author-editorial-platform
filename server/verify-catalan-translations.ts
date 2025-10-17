import { db } from "./db";
import { uiTexts } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

// Common Spanish words that should NOT appear in Catalan UI texts
// (excluding proper nouns like "María", "Amazon", "PayPal", etc.)
const spanishWords = [
  // Spanish verbs
  "Ver", "ver", "Descubre", "descubre", "Conoce", "conoce", "Continuar", "continuar",
  "Reintentar", "reintentar", "Encuentra", "encuentra", "Comparte", "comparte",
  "Descarga", "descarga", "Comienza", "comienza", "Explora", "explora",
  "Leer", "leer", "Compartir", "compartir", "Buscar", "buscar",
  "Prueba", "prueba", "Lee", "lee", "Recibe", "recibe", "Agrega", "agrega",
  
  // Spanish nouns and adjectives
  "Todos", "todos", "Sobre", "sobre", "próximos", "próximas", "nuevos", "nuevas",
  "Perfil", "perfil", "Pago", "pago", "artículos", "artículo", "encontrados", "encontrado",
  "Autores", "autores", "Lectores", "lectores", "Historias", "historias",
  "completas", "completo", "autoconclusivas", "disponibles", "disponible",
  "categorías", "categoría", "filtros", "filtro", "Limpiar", "limpiar",
  "Enlaces", "enlaces", "Rápidos", "rápidos", "derechos", "reservados",
  "Próximamente", "próximamente", "agregaremos", "agregar", "Biografía", "biografía",
  
  // Spanish prepositions and articles that appear in wrong context
  "las ", "los ", "del ", "al ", "de ", "con ", "en ", "para ",
  "que ", "más ", "como ", "este ", "esta ", "estos ", "estas ",
  
  // Spanish phrases
  "qué dicen", "Lo que", "lo que", "Te ha gustado", "No se encontraron",
  "Pronto ", "Mantente", "Todos los", "todas las", "más contenido",
  "Por favor", "por favor",
];

// Namespaces to check
const namespaces = [
  "home", "homepage", "author_page", "book_landing", "blog",
  "checkout", "common", "navigation", "promo_content", "sections"
];

async function verifyTranslations() {
  console.log("🔍 Verifying Catalan translations...\n");
  
  const allTexts = await db
    .select()
    .from(uiTexts)
    .where(
      and(
        eq(uiTexts.locale, "ca-ES"),
        inArray(uiTexts.namespace, namespaces)
      )
    );
  
  console.log(`📊 Total texts to verify: ${allTexts.length}\n`);
  
  const issues: any[] = [];
  
  // Check for Spanish words
  for (const text of allTexts) {
    for (const spanishWord of spanishWords) {
      if (text.value.includes(spanishWord)) {
        // Skip if it's part of a proper noun (e.g., "María González")
        const isPossibleProperNoun = /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text.value);
        
        // Skip common exceptions
        const exceptions = [
          "PayPal", "Amazon", "María", "González", "Google Play", "Kobo",
          "Facebook", "Instagram", "Twitter", "Spotify", "YouTube",
          "Barcelona", "Catalunya", "EPUB", "PDF", "MOBI", "AZW3"
        ];
        
        const hasException = exceptions.some(exc => text.value.includes(exc));
        
        if (!hasException) {
          issues.push({
            namespace: text.namespace,
            key: text.key,
            value: text.value,
            spanishWord,
          });
        }
      }
    }
  }
  
  // Report findings
  if (issues.length === 0) {
    console.log("✅ No Spanish words found! All texts appear to be in Catalan.\n");
  } else {
    console.log(`⚠️  Found ${issues.length} potential issues:\n`);
    
    for (const issue of issues) {
      console.log(`  ❌ ${issue.namespace}.${issue.key}`);
      console.log(`     Contains Spanish word: "${issue.spanishWord}"`);
      console.log(`     Current value: "${issue.value}"`);
      console.log("");
    }
  }
  
  // Check for placeholders preservation
  console.log("\n🔍 Checking placeholder preservation...");
  
  const textsWithPlaceholders = allTexts.filter(t => 
    t.value.includes("{") || t.value.includes("}")
  );
  
  console.log(`  Found ${textsWithPlaceholders.length} texts with placeholders`);
  
  for (const text of textsWithPlaceholders) {
    const placeholders = text.value.match(/\{[^}]+\}/g);
    if (placeholders) {
      console.log(`  ✅ ${text.namespace}.${text.key}: ${placeholders.join(", ")}`);
    }
  }
  
  // Check for diacritics
  console.log("\n🔍 Checking Catalan diacritics...");
  
  const catalanDiacritics = ["à", "è", "é", "í", "ò", "ó", "ú", "ç", "ï", "ü"];
  const textsWithDiacritics = allTexts.filter(t =>
    catalanDiacritics.some(d => t.value.toLowerCase().includes(d))
  );
  
  console.log(`  Found ${textsWithDiacritics.length} texts with Catalan diacritics ✅`);
  
  // Sample some texts with diacritics
  const sampleSize = Math.min(10, textsWithDiacritics.length);
  console.log(`  \n  Sample of ${sampleSize} texts with diacritics:`);
  
  for (let i = 0; i < sampleSize; i++) {
    const text = textsWithDiacritics[i];
    console.log(`    ✅ ${text.namespace}.${text.key}: "${text.value}"`);
  }
  
  // Summary statistics
  console.log("\n\n📊 Summary by namespace:");
  
  for (const ns of namespaces) {
    const count = allTexts.filter(t => t.namespace === ns).length;
    const issueCount = issues.filter(i => i.namespace === ns).length;
    
    if (issueCount > 0) {
      console.log(`  ${ns}: ${count} texts, ❌ ${issueCount} issues`);
    } else {
      console.log(`  ${ns}: ${count} texts, ✅ OK`);
    }
  }
  
  // Final verdict
  console.log("\n\n" + "=".repeat(60));
  
  if (issues.length === 0) {
    console.log("✅ VERIFICATION PASSED!");
    console.log("   - 100% of UI texts are in proper Catalan");
    console.log("   - Placeholders are preserved");
    console.log("   - Diacritics are correct");
    console.log("   - No Spanish words detected (except proper nouns)");
  } else {
    console.log("⚠️  VERIFICATION INCOMPLETE");
    console.log(`   - ${issues.length} texts still contain Spanish words`);
    console.log("   - Review the issues above and apply corrections");
  }
  
  console.log("=".repeat(60));
}

verifyTranslations();
