import { db } from "./db";
import { uiTexts } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const LOCALES = ['es-ES', 'en-US', 'ca-ES', 'fr-FR', 'it-IT', 'de-DE', 'pt-PT'];
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

async function main() {
  console.log("🔍 Verifying translation coverage for all 7 languages\n");
  console.log("=" .repeat(70));
  
  // Get all texts to determine total unique keys
  const allTexts = await db.select().from(uiTexts);
  const uniqueKeys = new Set(allTexts.map(t => `${t.namespace}:${t.key}`));
  const totalUniqueKeys = uniqueKeys.size;
  
  console.log(`\n📊 Total unique translation keys: ${totalUniqueKeys}\n`);
  
  // Check coverage for each locale
  const summary = [];
  for (const locale of LOCALES) {
    const localeTexts = await db
      .select()
      .from(uiTexts)
      .where(eq(uiTexts.locale, locale));
    
    const coverage = totalUniqueKeys > 0 ? (localeTexts.length / totalUniqueKeys) * 100 : 0;
    
    summary.push({
      locale,
      total: localeTexts.length,
      coverage: Math.round(coverage * 10) / 10
    });
    
    console.log(`${locale}: ${localeTexts.length} texts (${Math.round(coverage)}% coverage)`);
  }
  
  // Check public namespaces specifically
  console.log("\n\n📋 Public Namespace Coverage:");
  console.log("=" .repeat(70));
  
  for (const locale of LOCALES) {
    console.log(`\n${locale}:`);
    let publicTotal = 0;
    
    for (const namespace of PUBLIC_NAMESPACES) {
      const namespaceTexts = await db
        .select()
        .from(uiTexts)
        .where(and(
          eq(uiTexts.namespace, namespace),
          eq(uiTexts.locale, locale)
        ));
      
      publicTotal += namespaceTexts.length;
      console.log(`   ${namespace}: ${namespaceTexts.length} texts`);
    }
    
    console.log(`   TOTAL PUBLIC: ${publicTotal} texts`);
  }
  
  // Grand total
  console.log("\n\n");
  console.log("=" .repeat(70));
  console.log("✅ VERIFICATION COMPLETE");
  console.log("=" .repeat(70));
  
  const grandTotal = summary.reduce((sum, s) => sum + s.total, 0);
  console.log(`\nGrand total texts across all 7 languages: ${grandTotal}`);
  console.log(`Languages: ${LOCALES.join(', ')}`);
  
  process.exit(0);
}

main().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});
