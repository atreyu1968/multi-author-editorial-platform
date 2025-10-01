// Script to initialize database with sample data
import { db } from "./db";
import { 
  authors, 
  bookSeries, 
  books, 
  testimonials, 
  users,
  blogPosts
} from "@shared/schema";
import { randomBytes, scryptSync } from "crypto";

function hashPasswordSync(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const buf = scryptSync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  // Check if data already exists
  const existingAuthors = await db.select().from(authors);
  if (existingAuthors.length > 0) {
    console.log("✅ Database already seeded. Skipping...");
    return;
  }

  // Create admin user only if it doesn't exist
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || `admin_${Math.random().toString(36).slice(2, 10)}`;
    
    if (!process.env.ADMIN_PASSWORD) {
      console.log("⚠️  SECURITY: No ADMIN_PASSWORD set. Generated temporary password:", adminPassword);
      console.log("⚠️  CHANGE THIS IMMEDIATELY after first login!");
    }

    await db.insert(users).values({
      username: adminUsername,
      password: hashPasswordSync(adminPassword),
    });
    console.log("✅ Admin user created");
  } else {
    console.log("✅ Admin user already exists, skipping creation");
  }

  // Create author
  await db.insert(authors).values({
    name: "María González",
    heroTitle: "Creando Mundos con Palabras",
    heroSubtitle: "Autora Bestseller • Romance & Thriller • +15 Libros Publicados",
    bioParagraph1: "María González es una autora bestseller española especializada en novelas románticas, thriller psicológico y fantasía urbana. Con más de 12 años de experiencia, sus historias han cautivado a miles de lectores alrededor del mundo.",
    bioParagraph2: "Su habilidad para crear personajes profundos y tramas que mantienen a los lectores enganchados hasta la última página la ha convertido en una de las autoras más queridas en el mundo hispanohablante. Cada una de sus novelas es una invitación a explorar las complejidades del amor, el misterio y la condición humana.",
    bioParagraph3: "Cuando no está escribiendo, María disfruta de largos paseos por Barcelona, su ciudad natal, donde encuentra inspiración en cada rincón. También es una ávida lectora y mentora de escritores emergentes.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
    email: "contacto@mariagonzalez.com",
    instagramUrl: "https://instagram.com/mariagonzalezauthor",
    twitterUrl: "https://twitter.com/mgonzalezwriter",
    facebookUrl: "https://facebook.com/mariagonzalezauthor",
    amazonUrl: "https://amazon.com/author/mariagonzalez",
  });
  console.log("✅ Author created");

  // Create book series
  const [detectiveSeries] = await db.insert(bookSeries).values({
    title: "Serie Detective Luna",
    description: "Una serie de thriller psicológico que sigue a la detective Sofía Luna mientras resuelve casos complejos en Barcelona. Misterio, suspense y giros inesperados en cada entrega.",
    genre: "Thriller/Misterio",
    amazonUrl: "https://www.amazon.com/detective-luna-series",
  }).returning();

  const [corazonesSeries] = await db.insert(bookSeries).values({
    title: "Trilogía Corazones",
    description: "Una trilogía romántica contemporánea que explora las complejidades del amor moderno. Tres historias entrelazadas de pasión, pérdida y redención.",
    genre: "Romance Contemporáneo",
    amazonUrl: "https://www.amazon.com/corazones-trilogy",
  }).returning();
  console.log("✅ Book series created");

  // Create books for Detective Luna series
  await db.insert(books).values([
    {
      title: "Sombras en la Niebla",
      description: "El primer caso de la detective Sofía Luna la lleva a investigar una serie de desapariciones misteriosas en el barrio gótico de Barcelona. Lo que parece un caso rutinario se convierte en una pesadilla cuando descubre que el pasado que intentó enterrar está a punto de alcanzarla.",
      coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      genre: "Thriller",
      price: 12.99,
      amazonUrl: "https://www.amazon.com/sombras-niebla",
      seriesId: detectiveSeries.id,
      orderInSeries: 1,
      isStandalone: false,
      isPublished: true,
    },
    {
      title: "Ecos del Silencio",
      description: "Sofía Luna se enfrenta a su caso más personal cuando su mejor amiga desaparece sin dejar rastro. Cada pista la acerca más a una verdad que podría destruir todo lo que conoce.",
      coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      genre: "Thriller",
      price: 12.99,
      amazonUrl: "https://www.amazon.com/ecos-silencio",
      seriesId: detectiveSeries.id,
      orderInSeries: 2,
      isStandalone: false,
      isPublished: true,
    },
  ]);

  // Create books for Corazones trilogy
  await db.insert(books).values([
    {
      title: "Corazones en Fuga",
      description: "Emma nunca planeó enamorarse de su mejor amigo. Cuando una noche lo cambia todo, debe decidir entre proteger su corazón o arriesgarse a perderlo todo por amor.",
      coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      genre: "Romance",
      price: 10.99,
      amazonUrl: "https://www.amazon.com/corazones-fuga",
      seriesId: corazonesSeries.id,
      orderInSeries: 1,
      isStandalone: false,
      isPublished: true,
    },
    {
      title: "Corazones Rotos",
      description: "Después de una traición devastadora, Laura jura nunca volver a confiar. Pero cuando el pasado regresa en forma de un amor que creyó perdido, debe elegir entre el rencor y el perdón.",
      coverImage: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      genre: "Romance",
      price: 10.99,
      amazonUrl: "https://www.amazon.com/corazones-rotos",
      seriesId: corazonesSeries.id,
      orderInSeries: 2,
      isStandalone: false,
      isPublished: true,
    },
  ]);

  // Create standalone books
  await db.insert(books).values([
    {
      title: "La Última Carta",
      description: "Una novela epistolar que narra la historia de dos almas destinadas a encontrarse a través del tiempo y el espacio. Cartas escritas con lágrimas de esperanza y tinta de amor eterno.",
      coverImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      genre: "Romance Histórico",
      price: 11.99,
      amazonUrl: "https://www.amazon.com/ultima-carta",
      seriesId: null,
      orderInSeries: null,
      isStandalone: true,
      isPublished: true,
    },
    {
      title: "Susurros en la Oscuridad",
      description: "Un thriller psicológico que explora los límites de la mente humana. Cuando la psiquiatra Elena Vega comienza a experimentar los mismos síntomas que sus pacientes, la línea entre la realidad y la locura se difumina.",
      coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      genre: "Thriller Psicológico",
      price: 13.99,
      amazonUrl: "https://www.amazon.com/susurros-oscuridad",
      seriesId: null,
      orderInSeries: null,
      isStandalone: true,
      isPublished: true,
    },
  ]);
  console.log("✅ Books created");

  // Create testimonials
  await db.insert(testimonials).values([
    {
      content: "María tiene un don especial para crear personajes que se sienten reales. No pude soltar 'Corazones en Fuga' hasta terminarlo. ¡Estoy ansiosa por el siguiente!",
      authorName: "Ana Martínez",
      authorType: "Lectora verificada",
      authorPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      rating: 5,
      isFeatured: true,
      isPublished: true,
    },
    {
      content: "La serie Detective Luna es adictiva. Los giros de la trama son increíbles y siempre me mantiene adivinando hasta el final. ¡Recomendadísima!",
      authorName: "Carlos López",
      authorType: "Lector verificado",
      authorPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      rating: 5,
      isFeatured: true,
      isPublished: true,
    },
  ]);
  console.log("✅ Testimonials created");

  // Create blog posts
  const now = new Date().toISOString();
  await db.insert(blogPosts).values([
    {
      title: "Mi proceso creativo: Cómo nace una nueva historia",
      content: "Escribir es un viaje fascinante que comienza mucho antes de poner las primeras palabras en papel. Mi proceso creativo siempre empieza con una pregunta: ¿qué pasaría si...? Esta simple interrogante ha sido la semilla de todas mis novelas.\n\nCuando una idea me atrapa, comienzo por desarrollar los personajes. Para mí, son ellos quienes conducen la historia, no al revés. Paso días, a veces semanas, conociendo a mis protagonistas: sus miedos, sus sueños, sus contradicciones. Solo cuando puedo verlos claramente en mi mente, cuando sé cómo reaccionarían en cualquier situación, comienzo a escribir.\n\nEl primer borrador siempre es terrible. Es mi regla número uno: permítete escribir mal al principio. La magia está en la reescritura, en pulir cada frase hasta que brille con luz propia.",
      excerpt: "Descubre los secretos detrás de la creación de mis novelas y cómo los personajes cobran vida en mi mente antes de llegar al papel.",
      featuredImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      category: "Proceso Creativo",
      tags: ["escritura", "creatividad", "personajes"],
      isPublished: true,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Próximamente: Nueva serie \"Misterios de Medianoche\"",
      content: "Estoy emocionada de anunciar que estoy trabajando en una nueva serie que espero les fascine tanto como a mí me está fascinando escribirla. \"Misterios de Medianoche\" será una trilogía de suspenso psicológico que explora los límites entre la realidad y la pesadilla.\n\nLa protagonista, Elena Vega, es una psicóloga forense que comienza a experimentar sueños vívidos sobre crímenes que aún no han ocurrido. ¿Son premoniciones? ¿Coincidencias? ¿O hay algo más siniestro en juego?\n\nLa serie estará ambientada en una ciudad ficticia donde los límites entre el día y la noche, entre lo consciente y lo inconsciente, se difuminan peligrosamente. Cada libro podrá leerse de forma independiente, pero juntos contarán una historia más amplia sobre el poder de la mente humana.\n\nEspero tener el primer libro listo para finales de este año. ¡Manténganse atentos para más actualizaciones!",
      excerpt: "Una nueva trilogía de suspenso psicológico está en camino. Conoce a Elena Vega y adéntrate en un mundo donde los sueños pueden predecir el futuro.",
      featuredImage: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      category: "Noticias",
      tags: ["nueva serie", "suspenso", "psicológico"],
      isPublished: true,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
    },
  ]);
  console.log("✅ Blog posts created");

  console.log("🎉 Database seeding completed successfully!");
}

export { seedDatabase };

// Auto-run when executed directly
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
