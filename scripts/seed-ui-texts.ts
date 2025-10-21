import { db } from "../server/db";
import { uiTexts } from "../shared/schema";
import { readFileSync } from "fs";
import { sql } from "drizzle-orm";

export async function seedUiTexts() {
  // Timeout wrapper to prevent hanging (5 minutes for large seed operations)
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('UI texts seed timeout after 5 minutes')), 300000)
  );
  
  const seedPromise = (async () => {
    console.log("🔍 Verificando si necesita seed de UI texts...");
    
    // Verificar si ya existen textos
    const existingCount = await db.select({ count: sql<number>`count(*)` })
      .from(uiTexts)
      .then(result => Number(result[0].count));
  
  console.log(`   Textos existentes: ${existingCount}`);
  
  console.log("📦 Cargando textos desde archivo...");
  
  const seedDataPath = "data/ui-texts-seed.json";
  let seedData: Record<string, any[]>;
  
  try {
    seedData = JSON.parse(readFileSync(seedDataPath, "utf-8"));
  } catch (error) {
    console.error("❌ No se pudo cargar el archivo de seed:", error);
    return;
  }
  
  // Calcular cuántos textos hay en el archivo
  let totalInFile = 0;
  for (const texts of Object.values(seedData)) {
    totalInFile += texts.length;
  }
  
  console.log(`   Total en archivo: ${totalInFile}`);
  
  // Si ya están todos los textos, saltar
  if (existingCount >= totalInFile) {
    console.log("✅ Base de datos ya tiene todos los textos. Saltando seed.");
    return;
  }
  
  console.log(`💾 Insertando ${totalInFile - existingCount} textos faltantes...`);
  
  let totalInserted = 0;
  let totalSkipped = 0;
  
  for (const [namespace, texts] of Object.entries(seedData)) {
    console.log(`   Procesando ${texts.length} textos de ${namespace}...`);
    
    for (const text of texts) {
      try {
        const result = await db.insert(uiTexts).values({
          namespace,
          key: text.key,
          locale: text.locale,
          value: text.value
        }).onConflictDoNothing().returning();
        
        if (result.length > 0) {
          totalInserted++;
        } else {
          totalSkipped++;
        }
      } catch (error) {
        totalSkipped++;
      }
    }
  }
  
  console.log(`✅ Seed completado. ${totalInserted} textos insertados, ${totalSkipped} duplicados saltados.`);
  })();
  
  try {
    await Promise.race([seedPromise, timeoutPromise]);
  } catch (error) {
    console.error("❌ Error during UI texts seed:", error);
    throw error; // Re-throw to be caught by caller
  }
}
