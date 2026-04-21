# Plataforma de Gestión Editorial Multi-Autor

Una aplicación web completa diseñada para gestionar hasta 30 autores dentro de una única plataforma editorial. Cada autor obtiene páginas de destino personalizables con temas personalizados, blogs, catálogos de libros y capacidades de comercio electrónico integradas.

![Version](https://img.shields.io/badge/versión-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-20.x-green.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-14%2B-blue.svg)
![Licencia](https://img.shields.io/badge/licencia-MIT-green.svg)

## 🌟 Características

### Gestión Multi-Autor
- **Panel de Administración Centralizado** - Gestiona todos los autores, libros, series y contenido desde un solo lugar
- **Páginas de Autor Personalizadas** - Cada autor obtiene `/autor/[slug]` con branding personalizado
- **Temas Individuales** - Colores, logotipos y favicons personalizables por autor
- **Series Multi-Autor** - Soporte para series de libros con múltiples autores contribuyentes
- **Dominios Personalizados por Autor** - Cada autor puede tener su propio dominio único (ej: `miautor.com`) y la landing del autor se renderiza directamente en la raíz (`/`), sin redirecciones; los enlaces canónicos y `hreflang` se ajustan automáticamente para evitar duplicados de SEO
- **Lista de Correo por Autor** - Activa/desactiva la lista por autor con remitente (nombre + email), proveedor (Resend, SendGrid, Brevo, Postmark, Mailgun, Mailchimp Transactional o Gmail) y API key independientes; los campos de remitente y los de transporte (proveedor + API key) hacen fallback de forma **independiente** a la configuración editorial, así un autor puede mantener su identidad de envío usando el proveedor global. La API key del autor nunca se expone en respuestas públicas
- **Libro de Regalo por Autor** - Cada autor puede ofrecer su propio libro gratuito (título, descripción, portada y archivo dedicados). El formulario de suscripción detecta automáticamente si hay regalo configurado: si lo hay, envía un enlace **único de un solo uso con caducidad** (no se expone nunca la URL del archivo); si no, hace una suscripción simple. Si el autor no configura regalo, se usa el libro global como fallback

### Comercio Electrónico
- **Carrito de Compras Completo** - Sistema de carrito basado en sesiones
- **Integración PayPal** - Procesamiento de pagos seguro
- **Productos Digitales** - Entrega automatizada de archivos EPUB, PDF, MOBI, AZW3
- **Productos Físicos** - Gestión de inventario y envíos
- **Libros de Regalo** - Sistema automatizado de entrega de libros de regalo
- **Códigos QR** - Generación automática de códigos QR para promociones
- **Audiolibros** - Enlace a plataformas externas de audiolibros (Audivia, etc.)

### Gestión de Contenido
- **Libros** - Gestión completa de libros con metadatos, portadas y material promocional
- **Series** - Organiza libros en series/colecciones multi-autor
- **Sistema de Blog** - Blog individual para cada autor
- **Testimonios** - Reseñas y respaldos de clientes
- **Newsletter** - Sistema de suscripción de boletín integrado
- **Próximamente** - Marca libros como "próximamente" con páginas promocionales sin opciones de compra

### Internacionalización (i18n)
- **7 Idiomas** - Soporte completo para:
  - Español (es-ES)
  - Inglés (en-US)
  - Catalán (ca-ES)
  - Francés (fr-FR)
  - Italiano (it-IT)
  - Alemán (de-DE)
  - Portugués (pt-PT)
- **11,238 Textos de UI** - Traducción completa de la interfaz en 25 namespaces
- **URLs Localizadas** - Rutas específicas por idioma (ej: `/libro`, `/book`, `/livre`)
- **Traducción de Contenido** - Soporte para traducir libros, autores, series y posts de blog
- **Multi-Moneda** - 8 monedas configurables con conversión automática de tasas de cambio

### Búsqueda y Descubrimiento
- **Búsqueda Universal** - Busca entre autores, libros y series
- **Resultados Localizados** - Páginas de búsqueda en los 7 idiomas
- **Navegación por Teclado** - Interfaz de búsqueda accesible

### Analíticas
- **Analíticas Propietarias** - Panel de analíticas integrado
- **Seguimiento de Visitas** - Monitorea el comportamiento de los visitantes
- **Métricas de Conversión** - Rastrea suscripciones, descargas y compras
- **Contenido Principal** - Ve los libros y autores más populares

### Seguridad
- **Autenticación Segura** - Autenticación basada en sesiones con cookies httpOnly
- **Hash de Contraseñas** - Scrypt con salt
- **Limitación de Tasa** - Previene ataques de fuerza bruta
- **Cabeceras CSP** - Política de Seguridad de Contenido vía Helmet.js
- **Descargas Seguras** - Entrega de archivos digitales basada en tokens con expiración

## 🚀 Inicio Rápido

### Requisitos Previos

- Ubuntu 20.04 LTS o superior
- Acceso root o sudo
- Conexión a Internet

### Instalación Rápida

```bash
# Descargar el instalador
curl -O https://raw.githubusercontent.com/atreyu1968/multi-author-editorial-platform/main/install.sh

# Ejecutar como root
sudo bash install.sh
```

El instalador te guiará para configurar:
- Idioma de la plataforma (7 idiomas disponibles)
- Dominio (ej: `ediciones.tudominio.com`)
- Certificado SSL con Let's Encrypt (automático)
- Credenciales de PayPal (opcional)
- Proveedor de email (opcional)
- Cloudflare Tunnel (opcional, para acceso sin abrir puertos)

### Actualización

```bash
# Desde el directorio de la aplicación
cd /var/www/editorial
sudo bash update.sh
```

O si el script se actualizó en el repositorio:

```bash
# Descargar la última versión del actualizador
curl -O https://raw.githubusercontent.com/atreyu1968/multi-author-editorial-platform/main/update.sh
sudo bash update.sh
```

El script `update.sh` se encarga de todo automáticamente:
1. Crea backup de la base de datos y del código anterior
2. Descarga la última versión del código desde GitHub
3. Instala las dependencias necesarias
4. Compila la aplicación
5. Aplica migraciones SQL pendientes (directorio `migrations/`)
6. Verifica el usuario administrador
7. Reinicia el servicio
8. Limpia la caché de Nginx
9. Verifica que la aplicación responde correctamente
10. Si algo falla, restaura automáticamente la versión anterior

### Desinstalación Completa

Para eliminar completamente la plataforma del servidor, usa el script automático:

```bash
# Descargar el desinstalador
curl -O https://raw.githubusercontent.com/atreyu1968/multi-author-editorial-platform/main/uninstall.sh

# Ejecutar como root
sudo bash uninstall.sh
```

El desinstalador:
- Ofrece hacer backup automático antes de eliminar
- Detiene y elimina todos los servicios
- Elimina base de datos, archivos y configuración
- Limpia Nginx y Cloudflare Tunnel si están configurados

**Desinstalación manual** (si prefieres hacerlo paso a paso):

```bash
# 1. Detener y deshabilitar servicios
sudo systemctl stop editorial
sudo systemctl disable editorial
sudo rm /etc/systemd/system/editorial.service
sudo systemctl daemon-reload

# 2. (Opcional) Detener Cloudflare Tunnel si lo usaste
sudo systemctl stop cloudflared 2>/dev/null
sudo systemctl disable cloudflared 2>/dev/null
sudo cloudflared service uninstall 2>/dev/null

# 3. Eliminar archivos de la aplicación
sudo rm -rf /var/www/editorial
sudo rm -rf /etc/editorial

# 4. Eliminar configuración de Nginx
sudo rm /etc/nginx/sites-enabled/editorial
sudo rm /etc/nginx/sites-available/editorial
sudo nginx -t && sudo systemctl reload nginx

# 5. Eliminar base de datos y usuario PostgreSQL
sudo -u postgres psql -c "DROP DATABASE IF EXISTS editorial_platform;"
sudo -u postgres psql -c "DROP USER IF EXISTS editorial;"

# 6. Eliminar usuario del sistema
sudo userdel -r editorial 2>/dev/null

# 7. (Opcional) Eliminar dependencias si no las necesitas
# ADVERTENCIA: Solo si no tienes otras apps que las usen
# sudo apt remove nodejs postgresql nginx
```

**Nota**: Antes de desinstalar, considera hacer un backup:
```bash
# Backup de la base de datos
sudo -u postgres pg_dump editorial_platform > ~/editorial_backup_$(date +%Y%m%d).sql

# Backup de archivos subidos
sudo tar -czvf ~/editorial_uploads_$(date +%Y%m%d).tar.gz /var/www/editorial/uploads
```

### Después de instalar

- **URL**: `https://tu-dominio.com` (o `http://IP-servidor` sin dominio)
- **Admin**: usuario `admin` / contraseña `admin123`
- **Panel de administración**: `/admin`
- ⚠️ **Cambia la contraseña inmediatamente** después del primer acceso

### Comandos Útiles

```bash
# Estado del servicio
sudo systemctl status editorial

# Ver logs en tiempo real
sudo journalctl -u editorial -f

# Reiniciar la aplicación
sudo systemctl restart editorial

# Ver configuración
cat /etc/editorial/env
```

Para instrucciones detalladas, consulta [INSTALLATION.md](INSTALLATION.md).

## 📖 Documentación

- [Guía de Instalación](INSTALLATION.md) - Instrucciones completas de instalación
- [Guía de Deployment](DEPLOYMENT.md) - Workflow completo de GitHub a producción

## 🛠️ Stack Tecnológico

### Backend
- **Node.js 20** - Entorno de ejecución
- **Express.js** - Framework web
- **TypeScript** - Desarrollo con tipos seguros
- **PostgreSQL** - Base de datos relacional
- **Drizzle ORM** - Consultas de base de datos con tipos seguros

### Frontend
- **React 18** - Librería de UI
- **Vite** - Herramienta de construcción
- **Tailwind CSS** - CSS de utilidades
- **shadcn/ui** - Librería de componentes
- **TanStack Query** - Gestión de estado del servidor
- **Wouter** - Enrutamiento ligero

### Servicios Externos
- **PayPal** - Procesamiento de pagos
- **Neon Database** - PostgreSQL serverless (opcional)
- **Object Storage** - Almacenamiento de archivos (opcional)

## 📋 Configuración

### Variables de Entorno

Copia `.env.example` a `.env` y configura:

```env
# Base de Datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/editorial_platform

# Sesión
SESSION_SECRET=tu-secreto-aleatorio

# PayPal
PAYPAL_CLIENT_ID=tu-client-id
PAYPAL_CLIENT_SECRET=tu-client-secret
PAYPAL_MODE=sandbox

# Idioma
DEFAULT_LOCALE=es-ES
```

Consulta [.env.example](.env.example) para todas las opciones disponibles.

## 🔧 Gestión

### Comandos de Servicio

```bash
# Iniciar el servicio
sudo systemctl start editorial

# Detener el servicio
sudo systemctl stop editorial

# Reiniciar el servicio
sudo systemctl restart editorial

# Ver logs
sudo journalctl -u editorial -f

# Verificar estado
sudo systemctl status editorial
```

### Gestión de Base de Datos

```bash
# Backup de base de datos
pg_dump -U editorial editorial_platform > backup.sql

# Restaurar base de datos
psql -U editorial editorial_platform < backup.sql

# Acceder a la consola de base de datos
psql -U editorial -d editorial_platform
```

### Actualizaciones

**Usar siempre el script de actualización:**

```bash
cd /var/www/editorial
sudo bash update.sh
```

El script se encarga de todo: backup, descarga, dependencias, compilación, migraciones de base de datos y reinicio del servicio.

### Sistema de Migraciones SQL

Las migraciones de base de datos se gestionan mediante archivos SQL en el directorio `migrations/`:

```
migrations/
├── 001_initial_schema_sync.sql    # Sincronización inicial del esquema
├── 002_nueva_funcionalidad.sql    # Futuras migraciones...
└── ...
```

El script `update.sh` aplica automáticamente las migraciones pendientes en orden. Cada migración se ejecuta una sola vez (se registra en la tabla `_migrations`). Los archivos SQL usan `IF NOT EXISTS` para ser idempotentes y seguros.

## 🏗️ Estructura del Proyecto

```
editorial-platform/
├── client/                 # Aplicación React frontend
│   ├── src/
│   │   ├── components/    # Componentes UI reutilizables
│   │   │   ├── admin/     # Componentes del panel de administración
│   │   │   ├── seo/       # Componentes SEO (meta tags, sitemap)
│   │   │   └── ui/        # Componentes shadcn/ui
│   │   ├── pages/         # Componentes de página
│   │   ├── contexts/      # Contextos de React (locale, cart, ui-text)
│   │   ├── hooks/         # Hooks personalizados de React
│   │   └── lib/           # Funciones de utilidad
├── server/                # Aplicación Express backend
│   ├── index.ts           # Punto de entrada del servidor
│   ├── routes.ts          # Rutas de API
│   ├── storage.ts         # Interfaz de almacenamiento
│   ├── auth.ts            # Lógica de autenticación
│   └── paypal.ts          # Integración de PayPal
├── shared/                # Código compartido frontend/backend
│   ├── schema.ts          # Schema de base de datos (Drizzle)
│   ├── currency-service.ts # Servicio de conversión de monedas
│   └── utils.ts           # Utilidades compartidas
├── migrations/            # Migraciones SQL incrementales
│   └── 001_initial_schema_sync.sql
├── install.sh             # Instalador automático para Ubuntu
├── update.sh              # Actualizador automático
├── uninstall.sh           # Desinstalador automático
├── publish-to-github.sh   # Script para publicar en GitHub
├── .env.example           # Template de variables de entorno
├── INSTALLATION.md        # Guía de instalación detallada
└── DEPLOYMENT.md          # Guía de deployment
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor, siéntete libre de enviar un Pull Request.

1. Haz fork del repositorio
2. Crea tu rama de característica (`git checkout -b feature/CaracteristicaIncreible`)
3. Haz commit de tus cambios (`git commit -m 'Añadir alguna CaracteristicaIncreible'`)
4. Haz push a la rama (`git push origin feature/CaracteristicaIncreible`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo LICENSE para más detalles.

## 🐛 Solución de Problemas

### La aplicación no inicia
- Revisa los logs: `sudo journalctl -u editorial -n 50`
- Verifica la configuración: `cat /etc/editorial/env`
- Asegúrate de que PostgreSQL esté corriendo: `sudo systemctl status postgresql`

### Errores de conexión a la base de datos
- Verifica `DATABASE_URL` en `/etc/editorial/env`
- Prueba la conexión: `psql -U editorial -d editorial_platform`
- Revisa los logs de PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-*-main.log`

### Fallos en pagos de PayPal
- Verifica las credenciales en el panel de administración
- Comprueba que `PAYPAL_MODE` coincida con tus credenciales (sandbox/production)
- Revisa el panel de PayPal para errores

### La actualización falla
- Si `update.sh` falla durante la compilación, restaura automáticamente la versión anterior
- Los backups se guardan en `/var/backups/editorial/`
- Para restaurar manualmente la base de datos:
  ```bash
  psql "$DATABASE_URL" < /var/backups/editorial/db_backup_FECHA.sql
  ```

### No se ven los cambios tras actualizar
1. Pulsa Ctrl+Shift+R en el navegador para forzar recarga
2. O abre una ventana de incógnito/privada
3. Si usas Cloudflare, limpia la caché desde el panel de Cloudflare

Para más consejos de solución de problemas, consulta [INSTALLATION.md](INSTALLATION.md#troubleshooting).

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/atreyu1968/multi-author-editorial-platform/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/atreyu1968/multi-author-editorial-platform/discussions)

## 🎯 Hoja de Ruta

- [ ] Notificaciones por email para pedidos
- [ ] Panel de analíticas avanzado
- [ ] UI de gestión de productos de merchandising
- [ ] Panel de autor para autoservicio
- [ ] Integraciones con redes sociales
- [ ] Herramientas avanzadas de SEO
- [ ] Aplicación móvil

## ⭐ Reconocimientos

- Construido con [Replit](https://replit.com)
- Componentes UI de [shadcn/ui](https://ui.shadcn.com)
- Iconos de [Lucide](https://lucide.dev)

---

Hecho con ❤️ para editoriales y agencias literarias

**Dale una estrella** a este repositorio si te resulta útil!
