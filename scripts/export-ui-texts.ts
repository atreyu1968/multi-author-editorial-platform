import { db } from "../server/db";
import { uiTexts } from "../shared/schema";
import { writeFileSync } from "fs";

async function exportUiTexts() {
  console.log("Exportando textos de UI...");
  
  const allTexts = await db.select().from(uiTexts);
  
  console.log(`Encontrados ${allTexts.length} textos`);
  
  // Agrupar por namespace para mejor organización
  const byNamespace = allTexts.reduce((acc, text) => {
    if (!acc[text.namespace]) {
      acc[text.namespace] = [];
    }
    acc[text.namespace].push({
      key: text.key,
      locale: text.locale,
      value: text.value
    });
    return acc;
  }, {} as Record<string, any[]>);
  
  const outputPath = "data/ui-texts-seed.json";
  writeFileSync(outputPath, JSON.stringify(byNamespace, null, 2));
  
  console.log(`✅ Textos exportados a: ${outputPath}`);
  console.log(`   Namespaces: ${Object.keys(byNamespace).length}`);
  console.log(`   Total textos: ${allTexts.length}`);
  
  process.exit(0);
}

exportUiTexts().catch(error => {
  console.error("Error exportando textos:", error);
  process.exit(1);
});
