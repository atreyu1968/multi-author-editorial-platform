#!/bin/bash
set -e

# ============================================================
# DESINSTALADOR - Plataforma Editorial Multi-Autor
# Para Ubuntu 22.04/24.04
# ============================================================

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

APP_NAME="editorial"
APP_DIR="/var/www/$APP_NAME"
CONFIG_DIR="/etc/$APP_NAME"
DB_NAME="editorial_platform"
DB_USER="editorial"

if [ "$EUID" -ne 0 ]; then
    print_error "Este script debe ejecutarse como root"
    echo "Usa: sudo bash uninstall.sh"
    exit 1
fi

echo ""
echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║     DESINSTALADOR - PLATAFORMA EDITORIAL MULTI-AUTOR        ║${NC}"
echo -e "${RED}║     ADVERTENCIA: Esta acción es IRREVERSIBLE                ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_warning "Esta acción eliminará:"
echo "  - Servicio systemd: $APP_NAME"
echo "  - Directorio de la aplicación: $APP_DIR"
echo "  - Configuración: $CONFIG_DIR"
echo "  - Base de datos PostgreSQL: $DB_NAME"
echo "  - Usuario PostgreSQL: $DB_USER"
echo "  - Usuario del sistema: $APP_NAME"
echo "  - Configuración de Nginx: $APP_NAME"
echo "  - Cloudflare Tunnel (si está instalado)"
echo ""

read -p "¿Deseas hacer un BACKUP antes de desinstalar? (S/n): " DO_BACKUP
if [ "$DO_BACKUP" != "n" ] && [ "$DO_BACKUP" != "N" ]; then
    BACKUP_DIR="$HOME/editorial_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    print_status "Creando backup en $BACKUP_DIR..."
    
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_status "Respaldando base de datos..."
        sudo -u postgres pg_dump "$DB_NAME" > "$BACKUP_DIR/database.sql" 2>/dev/null || true
        print_success "Base de datos respaldada"
    fi
    
    if [ -d "$APP_DIR/uploads" ]; then
        print_status "Respaldando archivos subidos..."
        cp -r "$APP_DIR/uploads" "$BACKUP_DIR/" 2>/dev/null || true
        print_success "Archivos respaldados"
    fi
    
    if [ -f "$CONFIG_DIR/env" ]; then
        print_status "Respaldando configuración..."
        cp "$CONFIG_DIR/env" "$BACKUP_DIR/env.backup" 2>/dev/null || true
        print_success "Configuración respaldada"
    fi
    
    print_success "Backup completado en: $BACKUP_DIR"
    echo ""
fi

read -p "¿Estás SEGURO de que deseas DESINSTALAR TODO? (escribe 'SI' para confirmar): " CONFIRM
if [ "$CONFIRM" != "SI" ]; then
    print_warning "Desinstalación cancelada"
    exit 0
fi

echo ""
print_status "Iniciando desinstalación..."

print_status "Deteniendo servicio..."
systemctl stop $APP_NAME 2>/dev/null || true
systemctl disable $APP_NAME 2>/dev/null || true
rm -f /etc/systemd/system/$APP_NAME.service
systemctl daemon-reload
print_success "Servicio detenido y eliminado"

if systemctl is-active --quiet cloudflared 2>/dev/null; then
    print_status "Deteniendo Cloudflare Tunnel..."
    systemctl stop cloudflared 2>/dev/null || true
    systemctl disable cloudflared 2>/dev/null || true
    cloudflared service uninstall 2>/dev/null || true
    print_success "Cloudflare Tunnel eliminado"
fi

print_status "Eliminando archivos de la aplicación..."
rm -rf "$APP_DIR"
rm -rf "$CONFIG_DIR"
print_success "Archivos eliminados"

if [ -f /etc/nginx/sites-enabled/$APP_NAME ]; then
    print_status "Eliminando configuración de Nginx..."
    rm -f /etc/nginx/sites-enabled/$APP_NAME
    rm -f /etc/nginx/sites-available/$APP_NAME
    nginx -t > /dev/null 2>&1 && systemctl reload nginx
    print_success "Configuración de Nginx eliminada"
fi

print_status "Eliminando base de datos PostgreSQL..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
print_success "Base de datos y usuario eliminados"

print_status "Eliminando usuario del sistema..."
userdel -r $APP_NAME 2>/dev/null || true
print_success "Usuario del sistema eliminado"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              DESINSTALACIÓN COMPLETADA                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
    print_status "Tu backup está en: $BACKUP_DIR"
    echo ""
    echo "Para restaurar en el futuro:"
    echo "  1. Reinstala con: sudo bash install.sh"
    echo "  2. Restaura la base de datos:"
    echo "     sudo -u postgres psql $DB_NAME < $BACKUP_DIR/database.sql"
    echo "  3. Restaura archivos subidos:"
    echo "     cp -r $BACKUP_DIR/uploads/* /var/www/$APP_NAME/uploads/"
fi

echo ""
print_warning "Las dependencias del sistema (Node.js, PostgreSQL, Nginx) NO se han eliminado."
echo "Para eliminarlas manualmente:"
echo "  sudo apt remove nodejs postgresql nginx"
echo ""
