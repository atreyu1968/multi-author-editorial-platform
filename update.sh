#!/bin/bash
set -e

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
source "$CONFIG_DIR/env"
print_success "Configuración cargada desde $CONFIG_DIR/env"

# Crear backup
BACKUP_DIR="/var/backups/$APP_NAME"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

print_status "Creando backup de seguridad..."
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/db_backup_$BACKUP_DATE.sql" 2>/dev/null || true
cp -r "$APP_DIR" "$BACKUP_DIR/code_backup_$BACKUP_DATE" 2>/dev/null || true
print_success "Backup creado en $BACKUP_DIR"

# Detener servicio
print_status "Deteniendo servicio..."
systemctl stop $APP_NAME

# Actualizar código
print_status "Descargando última versión..."
cd "$APP_DIR"
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
git fetch origin
git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null
chown -R $APP_USER:$APP_USER "$APP_DIR"
print_success "Código actualizado"

# Instalar dependencias
print_status "Actualizando dependencias..."
cd "$APP_DIR"

set -a
source "$CONFIG_DIR/env"
set +a

sudo -u $APP_USER npm install --legacy-peer-deps 2>&1 | tail -3
print_success "Dependencias actualizadas"

# Recompilar
print_status "Recompilando aplicación..."
sudo -u $APP_USER npm run build 2>&1 | tail -3
print_success "Aplicación compilada"

# Actualizar esquema de base de datos
print_status "Actualizando esquema de base de datos..."
sudo -u $APP_USER -E npm run db:push 2>&1 | tail -5
print_success "Base de datos actualizada"

# Reiniciar servicio
print_status "Reiniciando servicio..."
systemctl start $APP_NAME
sleep 3

if systemctl is-active --quiet $APP_NAME; then
    print_success "Servicio reiniciado correctamente"
else
    print_error "Error al reiniciar el servicio"
    echo "Revisa los logs: journalctl -u $APP_NAME -n 50"
    echo ""
    echo "Para restaurar el backup:"
    echo "  psql $DATABASE_URL < $BACKUP_DIR/db_backup_$BACKUP_DATE.sql"
    exit 1
fi

# Resumen
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              ACTUALIZACIÓN COMPLETADA                        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ La aplicación ha sido actualizada exitosamente${NC}"
echo ""
echo -e "${BLUE}Backup guardado en:${NC}"
echo "  Base de datos: $BACKUP_DIR/db_backup_$BACKUP_DATE.sql"
echo "  Código:        $BACKUP_DIR/code_backup_$BACKUP_DATE/"
echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo "  Estado:  systemctl status $APP_NAME"
echo "  Logs:    journalctl -u $APP_NAME -f"
echo ""
