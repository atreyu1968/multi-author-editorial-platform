import { DatabaseStorage } from "./database-storage";
import type { InsertUiText } from "@shared/schema";

const storage = new DatabaseStorage();

// Define all search page UI texts for all 7 locales
const searchTranslations: InsertUiText[] = [
  // 1. view_all_results
  {
    namespace: "search",
    key: "view_all_results",
    locale: "es-ES",
    value: "Ver todos los resultados"
  },
  {
    namespace: "search",
    key: "view_all_results",
    locale: "en-US",
    value: "View all results"
  },
  {
    namespace: "search",
    key: "view_all_results",
    locale: "ca-ES",
    value: "Veure tots els resultats"
  },
  {
    namespace: "search",
    key: "view_all_results",
    locale: "fr-FR",
    value: "Voir tous les résultats"
  },
  {
    namespace: "search",
    key: "view_all_results",
    locale: "it-IT",
    value: "Visualizza tutti i risultati"
  },
  {
    namespace: "search",
    key: "view_all_results",
    locale: "de-DE",
    value: "Alle Ergebnisse anzeigen"
  },
  {
    namespace: "search",
    key: "view_all_results",
    locale: "pt-PT",
    value: "Ver todos os resultados"
  },

  // 2. search_page_title
  {
    namespace: "search",
    key: "search_page_title",
    locale: "es-ES",
    value: "Resultados de búsqueda"
  },
  {
    namespace: "search",
    key: "search_page_title",
    locale: "en-US",
    value: "Search results"
  },
  {
    namespace: "search",
    key: "search_page_title",
    locale: "ca-ES",
    value: "Resultats de la cerca"
  },
  {
    namespace: "search",
    key: "search_page_title",
    locale: "fr-FR",
    value: "Résultats de recherche"
  },
  {
    namespace: "search",
    key: "search_page_title",
    locale: "it-IT",
    value: "Risultati della ricerca"
  },
  {
    namespace: "search",
    key: "search_page_title",
    locale: "de-DE",
    value: "Suchergebnisse"
  },
  {
    namespace: "search",
    key: "search_page_title",
    locale: "pt-PT",
    value: "Resultados da pesquisa"
  },

  // 3. search_filter_all
  {
    namespace: "search",
    key: "search_filter_all",
    locale: "es-ES",
    value: "Todos"
  },
  {
    namespace: "search",
    key: "search_filter_all",
    locale: "en-US",
    value: "All"
  },
  {
    namespace: "search",
    key: "search_filter_all",
    locale: "ca-ES",
    value: "Tots"
  },
  {
    namespace: "search",
    key: "search_filter_all",
    locale: "fr-FR",
    value: "Tous"
  },
  {
    namespace: "search",
    key: "search_filter_all",
    locale: "it-IT",
    value: "Tutti"
  },
  {
    namespace: "search",
    key: "search_filter_all",
    locale: "de-DE",
    value: "Alle"
  },
  {
    namespace: "search",
    key: "search_filter_all",
    locale: "pt-PT",
    value: "Todos"
  },

  // 4. search_filter_authors
  {
    namespace: "search",
    key: "search_filter_authors",
    locale: "es-ES",
    value: "Autores"
  },
  {
    namespace: "search",
    key: "search_filter_authors",
    locale: "en-US",
    value: "Authors"
  },
  {
    namespace: "search",
    key: "search_filter_authors",
    locale: "ca-ES",
    value: "Autors"
  },
  {
    namespace: "search",
    key: "search_filter_authors",
    locale: "fr-FR",
    value: "Auteurs"
  },
  {
    namespace: "search",
    key: "search_filter_authors",
    locale: "it-IT",
    value: "Autori"
  },
  {
    namespace: "search",
    key: "search_filter_authors",
    locale: "de-DE",
    value: "Autoren"
  },
  {
    namespace: "search",
    key: "search_filter_authors",
    locale: "pt-PT",
    value: "Autores"
  },

  // 5. search_filter_series
  {
    namespace: "search",
    key: "search_filter_series",
    locale: "es-ES",
    value: "Series"
  },
  {
    namespace: "search",
    key: "search_filter_series",
    locale: "en-US",
    value: "Series"
  },
  {
    namespace: "search",
    key: "search_filter_series",
    locale: "ca-ES",
    value: "Sèries"
  },
  {
    namespace: "search",
    key: "search_filter_series",
    locale: "fr-FR",
    value: "Séries"
  },
  {
    namespace: "search",
    key: "search_filter_series",
    locale: "it-IT",
    value: "Serie"
  },
  {
    namespace: "search",
    key: "search_filter_series",
    locale: "de-DE",
    value: "Serien"
  },
  {
    namespace: "search",
    key: "search_filter_series",
    locale: "pt-PT",
    value: "Séries"
  },

  // 6. search_filter_books
  {
    namespace: "search",
    key: "search_filter_books",
    locale: "es-ES",
    value: "Libros"
  },
  {
    namespace: "search",
    key: "search_filter_books",
    locale: "en-US",
    value: "Books"
  },
  {
    namespace: "search",
    key: "search_filter_books",
    locale: "ca-ES",
    value: "Llibres"
  },
  {
    namespace: "search",
    key: "search_filter_books",
    locale: "fr-FR",
    value: "Livres"
  },
  {
    namespace: "search",
    key: "search_filter_books",
    locale: "it-IT",
    value: "Libri"
  },
  {
    namespace: "search",
    key: "search_filter_books",
    locale: "de-DE",
    value: "Bücher"
  },
  {
    namespace: "search",
    key: "search_filter_books",
    locale: "pt-PT",
    value: "Livros"
  },

  // 7. search_results_count
  {
    namespace: "search",
    key: "search_results_count",
    locale: "es-ES",
    value: "{count} resultados"
  },
  {
    namespace: "search",
    key: "search_results_count",
    locale: "en-US",
    value: "{count} results"
  },
  {
    namespace: "search",
    key: "search_results_count",
    locale: "ca-ES",
    value: "{count} resultats"
  },
  {
    namespace: "search",
    key: "search_results_count",
    locale: "fr-FR",
    value: "{count} résultats"
  },
  {
    namespace: "search",
    key: "search_results_count",
    locale: "it-IT",
    value: "{count} risultati"
  },
  {
    namespace: "search",
    key: "search_results_count",
    locale: "de-DE",
    value: "{count} Ergebnisse"
  },
  {
    namespace: "search",
    key: "search_results_count",
    locale: "pt-PT",
    value: "{count} resultados"
  },

  // 8. search_no_results_message
  {
    namespace: "search",
    key: "search_no_results_message",
    locale: "es-ES",
    value: "No encontramos nada con '{query}'. Intenta con otros términos."
  },
  {
    namespace: "search",
    key: "search_no_results_message",
    locale: "en-US",
    value: "We couldn't find anything for '{query}'. Try different terms."
  },
  {
    namespace: "search",
    key: "search_no_results_message",
    locale: "ca-ES",
    value: "No hem trobat res amb '{query}'. Prova amb altres termes."
  },
  {
    namespace: "search",
    key: "search_no_results_message",
    locale: "fr-FR",
    value: "Nous n'avons rien trouvé pour '{query}'. Essayez d'autres termes."
  },
  {
    namespace: "search",
    key: "search_no_results_message",
    locale: "it-IT",
    value: "Non abbiamo trovato nulla per '{query}'. Prova con altri termini."
  },
  {
    namespace: "search",
    key: "search_no_results_message",
    locale: "de-DE",
    value: "Wir konnten nichts für '{query}' finden. Versuchen Sie andere Begriffe."
  },
  {
    namespace: "search",
    key: "search_no_results_message",
    locale: "pt-PT",
    value: "Não encontrámos nada para '{query}'. Tente outros termos."
  }
];

async function addSearchTranslations() {
  console.log(`\n🌍 Adding Search Page UI Text Translations`);
  console.log(`Total translations to add: ${searchTranslations.length}`);
  console.log(`Keys: 8 × Locales: 7 = ${searchTranslations.length} UI texts\n`);

  let addedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const translation of searchTranslations) {
    try {
      await storage.upsertUiText(translation);
      console.log(`✅ Added: ${translation.key} (${translation.locale})`);
      addedCount++;
    } catch (error) {
      const errorMsg = `❌ Failed to add ${translation.key} (${translation.locale}): ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully added: ${addedCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log(`\n❌ Error details:`);
    errors.forEach(err => console.log(err));
  }

  // Verify all translations were added
  console.log(`\n🔍 Verifying translations in database...`);
  const allTexts = await storage.getUiTexts();
  const searchTexts = allTexts.filter(t => t.namespace === "search");
  
  console.log(`\n📈 Verification Results:`);
  console.log(`Total UI texts in database: ${allTexts.length}`);
  console.log(`Search namespace UI texts: ${searchTexts.length}`);
  
  const keys = ["view_all_results", "search_page_title", "search_filter_all", 
                "search_filter_authors", "search_filter_series", "search_filter_books",
                "search_results_count", "search_no_results_message"];
  const locales = ["es-ES", "en-US", "ca-ES", "fr-FR", "it-IT", "de-DE", "pt-PT"];
  
  console.log(`\n📋 Coverage by key:`);
  for (const key of keys) {
    const keyTexts = searchTexts.filter(t => t.key === key);
    const missingLocales = locales.filter(locale => 
      !keyTexts.some(t => t.locale === locale)
    );
    console.log(`  ${key}: ${keyTexts.length}/7 locales`);
    if (missingLocales.length > 0) {
      console.log(`    ⚠️  Missing: ${missingLocales.join(", ")}`);
    }
  }

  console.log(`\n✅ Search page translations added successfully!`);
  
  if (searchTexts.length === 56) {
    console.log(`🎉 All 56 search translations are in the database!`);
  } else {
    console.log(`⚠️  Expected 56 translations but found ${searchTexts.length}`);
  }
}

addSearchTranslations()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
