import { db } from "../server/db";
import { uiTexts } from "../shared/schema";
import { readFileSync } from "fs";
import { sql } from "drizzle-orm";

export async function seedUiTexts() {
  console.log("🔍 Verificando si necesita seed de UI texts...");
  
  // Verificar si ya existen textos
  const existingCount = await db.select({ count: sql<number>`count(*)` })
    .from(uiTexts)
    .then(result => Number(result[0].count));
  
  console.log(`   Textos existentes: ${existingCount}`);
  
  // Si ya hay más de 1000 textos, asumir que ya está poblada
  if (existingCount > 1000) {
    console.log("✅ Base de datos ya tiene textos. Saltando seed.");
    return;
  }
  
  console.log("📦 Cargando textos desde archivo...");
  
  const seedDataPath = "data/ui-texts-seed.json";
  let seedData: Record<string, any[]>;
  
  try {
    seedData = JSON.parse(readFileSync(seedDataPath, "utf-8"));
  } catch (error) {
    console.error("❌ No se pudo cargar el archivo de seed:", error);
    return;
  }
  
  console.log("💾 Insertando textos en la base de datos...");
  
  let totalInserted = 0;
  
  for (const [namespace, texts] of Object.entries(seedData)) {
    console.log(`   Insertando ${texts.length} textos de ${namespace}...`);
    
    for (const text of texts) {
      try {
        await db.insert(uiTexts).values({
          namespace,
          key: text.key,
          locale: text.locale,
          value: text.value
        }).onConflictDoNothing();
        
        totalInserted++;
      } catch (error) {
        // Ignorar errores de duplicados
      }
    }
  }
  
  console.log(`✅ Seed completado. ${totalInserted} textos insertados.`);
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUiTexts()
    .then(() => {
      console.log("✅ Seed ejecutado exitosamente");
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ Error ejecutando seed:", error);
      process.exit(1);
    });
}
