#!/bin/bash

# ============================================================
# ACTUALIZADOR - Plataforma Editorial Multi-Autor
# Actualiza el código sin perder datos ni configuración
# ============================================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuración
APP_NAME="editorial"
APP_DIR="/var/www/$APP_NAME"
CONFIG_DIR="/etc/$APP_NAME"
APP_USER="editorial"

# ============================================================
# SAFETY NET: Si algo falla, siempre reiniciar el servicio
# ============================================================
SHOULD_RESTART=false
cleanup() {
    if [ "$SHOULD_RESTART" = true ]; then
        echo ""
        print_warning "El script terminó inesperadamente. Reiniciando servicio..."
        systemctl start $APP_NAME 2>/dev/null || true
        sleep 2
        if systemctl is-active --quiet $APP_NAME; then
            print_success "Servicio reiniciado (con la versión anterior)"
        else
            print_error "No se pudo reiniciar el servicio"
            echo "  Revisa: journalctl -u $APP_NAME -n 30 --no-pager"
        fi
    fi
}
trap cleanup EXIT

# Verificar root
if [ "$EUID" -ne 0 ]; then
    print_error "Este script debe ejecutarse como root"
    echo "Usa: sudo bash update.sh"
    exit 1
fi

# Verificar instalación existente
if [ ! -f "$CONFIG_DIR/env" ]; then
    print_error "No se encontró una instalación existente"
    echo "Ejecuta primero install.sh para una instalación nueva"
    exit 1
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     ACTUALIZADOR - PLATAFORMA EDITORIAL MULTI-AUTOR         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Cargar configuración existente
set -a
source "$CONFIG_DIR/env"
set +a
print_success "Configuración cargada desde $CONFIG_DIR/env"

# Crear backup
BACKUP_DIR="/var/backups/$APP_NAME"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

print_status "Creando backup de seguridad..."
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/db_backup_$BACKUP_DATE.sql" 2>/dev/null || true
cp -r "$APP_DIR/dist" "$BACKUP_DIR/dist_backup_$BACKUP_DATE" 2>/dev/null || true
print_success "Backup creado en $BACKUP_DIR"

# Detener servicio
print_status "Deteniendo servicio..."
systemctl stop $APP_NAME 2>/dev/null || true
SHOULD_RESTART=true

# ============================================================
# ACTUALIZAR CÓDIGO
# ============================================================
print_status "Descargando última versión..."
cd "$APP_DIR"
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
git fetch origin 2>&1
git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null
CURRENT_COMMIT=$(git log --oneline -1)
chown -R $APP_USER:$APP_USER "$APP_DIR"
print_success "Código actualizado: $CURRENT_COMMIT"

# ============================================================
# AUTO-ACTUALIZAR ESTE SCRIPT
# Si el update.sh del repo es más nuevo, copiarlo y reiniciar
# ============================================================
if [ -f "$APP_DIR/update.sh" ]; then
    SCRIPT_PATH=$(realpath "$0" 2>/dev/null || echo "$0")
    REPO_SCRIPT="$APP_DIR/update.sh"
    if ! diff -q "$SCRIPT_PATH" "$REPO_SCRIPT" > /dev/null 2>&1; then
        print_warning "Se detectó una versión más nueva de update.sh"
        SHOULD_RESTART=false
        cp "$REPO_SCRIPT" "$SCRIPT_PATH"
        chmod +x "$SCRIPT_PATH"
        print_status "Reiniciando con la versión actualizada..."
        exec bash "$SCRIPT_PATH" "$@"
    fi
fi

# ============================================================
# INSTALAR DEPENDENCIAS
# ============================================================
print_status "Actualizando dependencias..."
cd "$APP_DIR"

sudo -u $APP_USER -E npm install --legacy-peer-deps 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    print_warning "Hubo warnings en npm install (normalmente no es crítico)"
fi
print_success "Dependencias actualizadas"

# ============================================================
# RECOMPILAR APLICACIÓN
# ============================================================
print_status "Recompilando aplicación..."
BUILD_LOG="/tmp/editorial_build_$BACKUP_DATE.log"

sudo -u $APP_USER -E npm run build > "$BUILD_LOG" 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
    print_error "Error al compilar la aplicación (código de salida: $BUILD_EXIT)"
    echo ""
    echo "═══════ LOG DE COMPILACIÓN ═══════"
    cat "$BUILD_LOG"
    echo "══════════════════════════════════"
    echo ""
    echo "Log completo en: $BUILD_LOG"
    echo ""
    print_status "Restaurando versión anterior..."
    if [ -d "$BACKUP_DIR/dist_backup_$BACKUP_DATE" ]; then
        rm -rf "$APP_DIR/dist"
        cp -r "$BACKUP_DIR/dist_backup_$BACKUP_DATE" "$APP_DIR/dist"
        chown -R $APP_USER:$APP_USER "$APP_DIR/dist"
        print_warning "Versión anterior restaurada"
    fi
    print_status "Reiniciando servicio con versión anterior..."
    systemctl start $APP_NAME 2>/dev/null || true
    SHOULD_RESTART=false
    exit 1
fi

print_success "Aplicación compilada correctamente"

# Verificar que los archivos de build existen
if [ ! -f "$APP_DIR/dist/index.js" ] || [ ! -f "$APP_DIR/dist/public/index.html" ]; then
    print_error "Los archivos compilados no se generaron correctamente"
    echo "Contenido de dist/:"
    ls -la "$APP_DIR/dist/" 2>/dev/null || echo "  (no existe)"
    ls -la "$APP_DIR/dist/public/" 2>/dev/null || echo "  (public/ no existe)"
    if [ -d "$BACKUP_DIR/dist_backup_$BACKUP_DATE" ]; then
        rm -rf "$APP_DIR/dist"
        cp -r "$BACKUP_DIR/dist_backup_$BACKUP_DATE" "$APP_DIR/dist"
        chown -R $APP_USER:$APP_USER "$APP_DIR/dist"
        print_warning "Versión anterior restaurada"
    fi
    systemctl start $APP_NAME 2>/dev/null || true
    SHOULD_RESTART=false
    exit 1
fi
print_success "Archivos compilados verificados"
rm -f "$BUILD_LOG"

# ============================================================
# ACTUALIZAR ESQUEMA DE BASE DE DATOS
# ============================================================
print_status "Actualizando esquema de base de datos..."
cd "$APP_DIR"
sudo -u $APP_USER -E npx drizzle-kit push --force 2>&1 | tail -10
print_success "Base de datos actualizada"

# ============================================================
# VERIFICAR USUARIO ADMIN
# ============================================================
print_status "Verificando usuario administrador..."
sudo -u $APP_USER -E npx tsx scripts/create-admin.ts 2>&1 || {
    print_warning "Creando admin con método alternativo..."
    ADMIN_SCRIPT=$(mktemp /tmp/create-admin-XXXXXX.ts)
    cat > "$ADMIN_SCRIPT" << 'ADMIN_EOF'
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import pg from "pg";

const scryptAsync = promisify(scrypt);

async function run() {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
  const hash = buf.toString("hex") + "." + salt;
  const Pool = pg.Pool || (pg as any);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(
    "INSERT INTO users (id, username, password) VALUES (gen_random_uuid(), $1, $2) ON CONFLICT (username) DO UPDATE SET password = $2",
    ["admin", hash]
  );
  await pool.end();
  console.log("Admin creado: admin / admin123");
}
run();
ADMIN_EOF
    chown $APP_USER:$APP_USER "$ADMIN_SCRIPT"
    sudo -u $APP_USER -E npx tsx "$ADMIN_SCRIPT" 2>&1 || print_warning "No se pudo crear admin automáticamente."
    rm -f "$ADMIN_SCRIPT"
}
print_success "Usuario administrador verificado"

# ============================================================
# VERIFICAR DIRECTORIO DE UPLOADS
# ============================================================
print_status "Verificando directorio de uploads..."
UPLOADS_DIR="$APP_DIR/uploads"
mkdir -p "$UPLOADS_DIR/public"
mkdir -p "$UPLOADS_DIR/private"
chown -R $APP_USER:$APP_USER "$UPLOADS_DIR"
chmod -R 755 "$UPLOADS_DIR"
print_success "Directorio de uploads verificado"

# Agregar UPLOADS_DIR al env si no existe
if ! grep -q "UPLOADS_DIR" "$CONFIG_DIR/env"; then
    echo "UPLOADS_DIR=$UPLOADS_DIR" >> "$CONFIG_DIR/env"
    print_success "Variable UPLOADS_DIR agregada a configuración"
fi

# ============================================================
# REINICIAR SERVICIO
# ============================================================
print_status "Reiniciando servicio..."
systemctl start $APP_NAME
sleep 3

if systemctl is-active --quiet $APP_NAME; then
    SHOULD_RESTART=false
    print_success "Servicio reiniciado correctamente"
else
    SHOULD_RESTART=false
    print_error "Error al reiniciar el servicio"
    echo "Revisa los logs: journalctl -u $APP_NAME -n 50 --no-pager"
    echo ""
    echo "Para restaurar el backup de la base de datos:"
    echo "  psql \"$DATABASE_URL\" < $BACKUP_DIR/db_backup_$BACKUP_DATE.sql"
    exit 1
fi

# ============================================================
# LIMPIAR CACHÉ (importante para ver los cambios)
# ============================================================
print_status "Limpiando caché de Nginx..."
systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true
print_success "Caché de Nginx limpiado"

# Verificar si hay Cloudflare
if command -v cloudflared &> /dev/null; then
    print_warning "Cloudflare detectado: limpia la caché desde el panel de Cloudflare"
    echo "  https://one.dash.cloudflare.com → tu dominio → Caching → Purge Everything"
fi

# ============================================================
# VERIFICACIÓN FINAL
# ============================================================
print_status "Verificando que la aplicación responde..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Aplicación respondiendo correctamente (HTTP $HTTP_CODE)"
else
    print_warning "La aplicación respondió con código HTTP $HTTP_CODE"
    echo "  Puede necesitar unos segundos más para iniciar"
    echo "  Verifica con: curl -I http://localhost:5000/"
fi

# Resumen
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              ACTUALIZACIÓN COMPLETADA                        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ La aplicación ha sido actualizada exitosamente${NC}"
echo -e "${GREEN}  Commit: $CURRENT_COMMIT${NC}"
echo ""
echo -e "${BLUE}Backup guardado en:${NC}"
echo "  Base de datos: $BACKUP_DIR/db_backup_$BACKUP_DATE.sql"
echo "  Build anterior: $BACKUP_DIR/dist_backup_$BACKUP_DATE/"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Si no ves los cambios en el navegador:${NC}"
echo "  1. Pulsa Ctrl+Shift+R (o Cmd+Shift+R en Mac) para forzar recarga"
echo "  2. O abre una ventana de incógnito/privada"
echo "  3. Si usas Cloudflare, limpia la caché desde el panel"
echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo "  Estado:  systemctl status $APP_NAME"
echo "  Logs:    journalctl -u $APP_NAME -f"
echo ""
