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

  // Create book series with landing page data
  const [detectiveSeries] = await db.insert(bookSeries).values({
    title: "Serie Detective Luna",
    description: "Una serie de thriller psicológico que sigue a la detective Sofía Luna mientras resuelve casos complejos en Barcelona. Misterio, suspense y giros inesperados en cada entrega.",
    genre: "Thriller/Misterio",
    amazonUrl: "https://www.amazon.com/detective-luna-series",
    landingHeroImage: "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    landingTagline: "En las sombras de Barcelona, una detective busca la verdad... y descubre que algunos secretos nunca deberían revelarse",
    landingWorldDescription: "Barcelona se convierte en un personaje más de esta serie ambientada en los rincones más oscuros de la ciudad condal. Desde el laberinto del Barrio Gótico hasta los modernos rascacielos, cada ubicación esconde secretos que Sofía Luna debe desentrañar. La ciudad late con misterio, donde la belleza arquitectónica contrasta con los crímenes más perturbadores.",
    landingCharacters: "Sofía Luna: Detective brillante con un pasado traumático que la persigue. Impulsiva pero meticulosa, su intuición pocas veces falla. // Inspector Martín Cruz: Mentor y figura paterna de Sofía, guarda secretos que podrían cambiar todo. // Dr. Adrián Vega: Forense con quien Sofía tiene una relación complicada, mezcla de atracción y desconfianza.",
    landingReadingOrder: "Aunque cada libro puede leerse de forma independiente con su propio misterio resuelto, se recomienda leer en orden para apreciar la evolución de Sofía y los misterios personales que se entrelazan a lo largo de la serie.",
    landingThemes: ["Justicia y venganza", "Secretos del pasado", "Redención personal", "Corrupción institucional", "Psicología criminal"],
  }).returning();

  const [corazonesSeries] = await db.insert(bookSeries).values({
    title: "Trilogía Corazones",
    description: "Una trilogía romántica contemporánea que explora las complejidades del amor moderno. Tres historias entrelazadas de pasión, pérdida y redención.",
    genre: "Romance Contemporáneo",
    amazonUrl: "https://www.amazon.com/corazones-trilogy",
    landingHeroImage: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    landingTagline: "Tres historias, tres corazones rotos, una segunda oportunidad para el amor verdadero",
    landingWorldDescription: "Ambientada en el vibrante Madrid contemporáneo, esta trilogía sigue las vidas entrelazadas de tres amigos que navegan por el amor, la pérdida y la redención. Desde las terrazas soleadas de Malasaña hasta las elegantes galerías de Salamanca, cada locación refleja las emociones y transformaciones de los protagonistas.",
    landingCharacters: "Emma Torres: Arquitecta soñadora que teme arriesgar su amistad por amor. // Laura Mendoza: Abogada fuerte e independiente, cicatrices emocionales ocultan su verdadero yo. // Daniel Ruiz: Chef apasionado que debe elegir entre su carrera internacional y el amor de su vida.",
    landingReadingOrder: "Aunque cada libro se centra en una pareja diferente, los personajes se entrelazan a lo largo de toda la trilogía. Para disfrutar completamente de las conexiones y referencias cruzadas, se recomienda leer en orden secuencial.",
    landingThemes: ["Amor y amistad", "Segunda oportunidades", "Perdón y sanación", "Miedo al compromiso", "Autoconocimiento"],
  }).returning();
  console.log("✅ Book series created");

  // Create books for Detective Luna series with landing page data
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
      landingHeroImage: "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      landingTagline: "En el laberinto del Barrio Gótico, las sombras guardan secretos mortales",
      landingSynopsis: "La detective Sofía Luna pensaba que había dejado atrás su oscuro pasado. Pero cuando una serie de jóvenes desaparecen misteriosamente en el corazón del Barrio Gótico de Barcelona, se ve obligada a enfrentarse a los demonios que ha intentado enterrar durante años. Cada pista la acerca más a una verdad aterradora: el asesino conoce su secreto más oscuro.\n\nMientras la niebla envuelve las antiguas calles de piedra y las víctimas siguen acumulándose, Sofía debe decidir hasta dónde está dispuesta a llegar para detener al culpable. ¿Qué sacrificará para encontrar la verdad? Y cuando finalmente la encuentre, ¿podrá vivir con las consecuencias?",
      landingFeatures: [
        "Una trama llena de giros inesperados que te mantendrá adivinando hasta el final",
        "Ambientación detallada en el misterioso Barrio Gótico de Barcelona",
        "Personajes profundos con secretos oscuros y motivaciones complejas",
        "Perfecto equilibrio entre suspense psicológico y thriller de acción"
      ],
      landingQuotes: [
        "Algunas sombras nunca desaparecen, solo esperan el momento perfecto para regresar",
        "En Barcelona, hasta las piedras antiguas guardan secretos. Y algunos deberían permanecer enterrados",
        "La verdad no siempre nos libera. A veces, nos condena"
      ],
      landingCTA: "Descubre el misterio en Amazon",
      landingGallery: [
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
        "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"
      ],
      landingAwards: [
        "Finalista - Premio Mejor Thriller 2022",
        "Selección del Mes - Club de Lectura El Corte Inglés"
      ],
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
      landingHeroImage: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      landingTagline: "El silencio más peligroso es el que esconde la verdad",
      landingSynopsis: "Cuando su mejor amiga y colega, la periodista Ana Vidal, desaparece mientras investigaba una serie de suicidios sospechosos, Sofía Luna sabe que el tiempo es oro. Pero lo que descubre la lleva por un camino que nunca imaginó: una red de corrupción que alcanza los niveles más altos del poder.\n\nCada eco del pasado la acerca más al presente. Cada silencio esconde una mentira. Y mientras Sofía corre contra reloj para encontrar a su amiga, descubre que algunos secretos tienen un precio demasiado alto... incluso para la verdad.",
      landingFeatures: [
        "Continuación directa con más profundidad en el pasado de Sofía",
        "Thriller político que expone las sombras del poder",
        "Ritmo trepidante que no da respiro",
        "Giro final devastador que cambia todo"
      ],
      landingQuotes: [
        "El silencio puede ser ensordecedor cuando esconde gritos que nunca se pronunciaron",
        "Hay verdades que, una vez descubiertas, no pueden olvidarse",
        "En el juego del poder, la lealtad es la moneda más peligrosa"
      ],
      landingCTA: "Continúa la saga en Amazon",
      landingGallery: [],
      landingAwards: ["Premio Letras Negras 2023 - Mejor Thriller"],
    },
  ]);

  // Create books for Corazones trilogy with landing page data
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
      landingHeroImage: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      landingTagline: "A veces el amor está más cerca de lo que piensas... y eso lo hace más aterrador",
      landingSynopsis: "Emma Torres y Marcos han sido mejores amigos desde la universidad. Él conoce todos sus secretos, ella conoce todos los suyos. O eso creían. Una noche de verano, una copa de vino de más y una confesión inesperada lo cambian todo.\n\nAhora Emma debe decidir: ¿arriesgar la amistad más importante de su vida por la posibilidad del amor verdadero? ¿O huir antes de que sea demasiado tarde? Pero los corazones en fuga rara vez encuentran paz, y pronto descubrirá que no puedes escapar de tus sentimientos... ni de tu destino.",
      landingFeatures: [
        "Romance de amigos a amantes con química irresistible",
        "Personajes realistas con miedos y esperanzas auténticas",
        "Ambientación en el Madrid contemporáneo vibrante y romántico",
        "Humor, ternura y pasión en perfectas dosis"
      ],
      landingQuotes: [
        "Lo más aterrador del amor verdadero es que siempre estuvo allí, esperando ser reconocido",
        "A veces huimos no porque no amemos, sino porque amamos demasiado",
        "El riesgo más grande no es perder un amor... es nunca haberlo intentado"
      ],
      landingCTA: "Comienza la trilogía en Amazon",
      landingGallery: [],
      landingAwards: [],
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
      landingHeroImage: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      landingTagline: "Los corazones rotos pueden sanar... pero las cicatrices cuentan historias",
      landingSynopsis: "Laura Mendoza construyó murallas alrededor de su corazón después de que Diego la traicionara hace cinco años. Ahora es una abogada exitosa que no necesita a nadie. Pero cuando Diego regresa a Madrid pidiendo una segunda oportunidad, todas sus defensas comienzan a tambalearse.\n\nÉl ha cambiado. Ella también. Pero, ¿es suficiente? Entre secretos no revelados, dolor no sanado y una atracción que nunca murió, Laura debe decidir si algunos corazones rotos merecen ser reparados... o si es más sabio dejarlos en el pasado donde pertenecen.",
      landingFeatures: [
        "Segunda oportunidad llena de tensión emocional",
        "Exploración profunda del perdón y la sanación",
        "Química explosiva entre protagonistas complejos",
        "Entrelazado con la historia de Emma y Marcos"
      ],
      landingQuotes: [
        "El perdón no es olvidar. Es recordar sin dolor",
        "Las cicatrices nos recuerdan que sobrevivimos",
        "El amor verdadero merece una segunda oportunidad... o quizás una primera vez hecha bien"
      ],
      landingCTA: "Continúa con el libro 2 en Amazon",
      landingGallery: [],
      landingAwards: [],
    },
  ]);

  // Create standalone books with landing page data
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
      landingHeroImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      landingTagline: "A través del tiempo y las palabras, dos almas encuentran su destino",
      landingSynopsis: "1942. Elena escribe cartas a un soldado en el frente que nunca conoció pero que siente en su alma. 2024. María descubre un baúl antiguo con cartas de amor que nunca fueron enviadas.\n\nDos mujeres separadas por casi un siglo, unidas por el poder de las palabras y el amor eterno. Mientras María lee las cartas de Elena, comienza a experimentar visiones, sueños y sentimientos que no son suyos. ¿Es posible que el amor trascienda el tiempo? ¿Puede una carta no enviada encontrar finalmente a su destinatario?\n\nUna novela epistolar que te hará creer en el destino, en las segundas oportunidades y en el poder imperecedero del amor verdadero.",
      landingFeatures: [
        "Formato epistolar único que alterna entre dos épocas",
        "Romance histórico con elementos de realismo mágico",
        "Investigación meticulosa de la España de los años 40",
        "Historia de amor que trasciende el tiempo"
      ],
      landingQuotes: [
        "Hay palabras que esperan décadas para ser leídas por los ojos correctos",
        "El tiempo puede separar cuerpos, pero nunca almas destinadas a encontrarse",
        "Cada carta es una botella al mar del tiempo, esperando llegar a puerto"
      ],
      landingCTA: "Descubre esta historia atemporal",
      landingGallery: [],
      landingAwards: ["Mejor Romance Histórico 2023 - Premios Letras de España"],
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
      landingHeroImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      landingTagline: "Cuando la mente es el laberinto, ¿cómo encuentras la salida?",
      landingSynopsis: "La Dra. Elena Vega es una psiquiatra forense reconocida, especializada en tratar a pacientes con trastornos disociativos. Pero cuando comienza a escuchar susurros que nadie más oye y a experimentar lapsos de memoria, su mundo perfectamente ordenado comienza a desmoronarse.\n\n¿Está desarrollando los mismos síntomas que sus pacientes? ¿O hay algo más siniestro en juego? Mientras investiga su propia cordura, Elena descubre que uno de sus pacientes no es quien dice ser... y que su propia mente podría guardar secretos que su consciencia se niega a recordar.\n\nUn thriller psicológico que te hará cuestionar la naturaleza de la realidad, la memoria y la identidad misma.",
      landingFeatures: [
        "Thriller psicológico con giros mentales impredecibles",
        "Exploración fascinante de la psique humana",
        "Protagonista compleja que lucha contra su propia mente",
        "Final que recontextualiza toda la historia"
      ],
      landingQuotes: [
        "La mente humana es el mayor misterio... y el peor enemigo",
        "A veces los susurros en la oscuridad son ecos de verdades que preferimos olvidar",
        "Cuando ya no puedes confiar en tu propia mente, ¿en quién puedes confiar?"
      ],
      landingCTA: "Adéntrate en la oscuridad",
      landingGallery: [],
      landingAwards: ["Top 10 Thrillers del Año - La Vanguardia", "Selección Especial - Festival Getafe Negro"],
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
