#!/bin/bash
set -e

# ============================================================
# AUTOINSTALADOR - Plataforma Editorial Multi-Autor
# Para Ubuntu 22.04/24.04
# Basado en las lecciones aprendidas (systemd, config externa, etc.)
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

# ============================================================
# CONFIGURACIÓN - MODIFICAR SEGÚN TU REPOSITORIO
# ============================================================
APP_NAME="editorial"
APP_DIR="/var/www/$APP_NAME"
CONFIG_DIR="/etc/$APP_NAME"
APP_PORT="5000"
APP_USER="editorial"
DB_NAME="editorial"
DB_USER="editorial"

# Repositorio de GitHub
GITHUB_REPO="https://github.com/atreyu1968/multi-author-editorial-platform.git"

# ============================================================
# VERIFICACIONES INICIALES
# ============================================================
if [ "$EUID" -ne 0 ]; then
    print_error "Este script debe ejecutarse como root"
    echo "Usa: sudo bash install.sh"
    exit 1
fi

# Detectar sistema operativo
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    print_error "No se pudo detectar el sistema operativo"
    exit 1
fi

if [ "$OS" != "ubuntu" ]; then
    print_warning "Este script está diseñado para Ubuntu. Detectado: $OS $VERSION"
    read -p "¿Continuar de todos modos? (s/N): " CONTINUE
    if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ]; then
        exit 1
    fi
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     INSTALADOR - PLATAFORMA EDITORIAL MULTI-AUTOR           ║${NC}"
echo -e "${CYAN}║     Soporte para ~30 autores con e-commerce completo        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# DETECTAR INSTALACIÓN EXISTENTE
# ============================================================
IS_UPDATE=false
if [ -f "$CONFIG_DIR/env" ]; then
    IS_UPDATE=true
    print_warning "Instalación existente detectada"
    print_status "Se preservarán las credenciales actuales"
    echo ""
    
    # Cargar credenciales existentes
    source "$CONFIG_DIR/env"
    
    # Extraer DB_PASS del DATABASE_URL existente
    if [ -n "$DATABASE_URL" ]; then
        DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    fi
else
    print_status "Nueva instalación"
    echo ""
    
    # Generar nuevas credenciales
    DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    SESSION_SECRET=$(openssl rand -base64 32)
fi

# ============================================================
# SELECCIONAR IDIOMA
# ============================================================
print_status "Selecciona el idioma predeterminado de la plataforma:"
echo "  1) Español (es-ES)"
echo "  2) English (en-US)"
echo "  3) Català (ca-ES)"
echo "  4) Français (fr-FR)"
echo "  5) Italiano (it-IT)"
echo "  6) Deutsch (de-DE)"
echo "  7) Português (pt-PT)"
echo ""
read -p "Elige idioma [1-7] (por defecto: 1): " LANG_CHOICE
LANG_CHOICE=${LANG_CHOICE:-1}

case $LANG_CHOICE in
    1) DEFAULT_LOCALE="es-ES" ;;
    2) DEFAULT_LOCALE="en-US" ;;
    3) DEFAULT_LOCALE="ca-ES" ;;
    4) DEFAULT_LOCALE="fr-FR" ;;
    5) DEFAULT_LOCALE="it-IT" ;;
    6) DEFAULT_LOCALE="de-DE" ;;
    7) DEFAULT_LOCALE="pt-PT" ;;
    *) DEFAULT_LOCALE="es-ES" ;;
esac
print_success "Idioma seleccionado: $DEFAULT_LOCALE"

# ============================================================
# SOLICITAR CONFIGURACIÓN
# ============================================================
echo ""
print_status "Configuración del repositorio"

# Repositorio GitHub
echo ""
echo "URL del repositorio GitHub"
echo "(Ejemplo: https://github.com/tu-usuario/editorial-platform.git)"
read -p "URL [$GITHUB_REPO]: " INPUT_REPO
GITHUB_REPO=${INPUT_REPO:-$GITHUB_REPO}

# Validar que no sea la URL por defecto
if [[ "$GITHUB_REPO" == *"TU_USUARIO"* ]]; then
    print_error "Debes especificar la URL de tu repositorio GitHub"
    exit 1
fi

# PayPal (solo en nueva instalación o si no existe)
if [ "$IS_UPDATE" = false ] || [ -z "$PAYPAL_CLIENT_ID" ]; then
    echo ""
    print_status "Configuración de PayPal"
    echo "(Puedes dejarlo vacío y configurarlo después en el panel de admin)"
    read -p "PayPal Client ID: " PAYPAL_CLIENT_ID
    read -p "PayPal Client Secret: " PAYPAL_CLIENT_SECRET
fi

# Proveedor de email (solo en nueva instalación o si no existe)
if [ "$IS_UPDATE" = false ] || [ -z "$EMAIL_PROVIDER" ]; then
    echo ""
    print_status "Configuración de Email (opcional)"
    echo "Proveedores disponibles: resend, sendgrid, mailchimp, brevo, postmark, mailgun, gmail"
    read -p "Proveedor de email [ninguno]: " EMAIL_PROVIDER
    if [ -n "$EMAIL_PROVIDER" ]; then
        read -p "API Key del proveedor: " EMAIL_API_KEY
        read -p "Email remitente (ej: noreply@tudominio.com): " EMAIL_FROM
    fi
fi

# ============================================================
# INSTALAR DEPENDENCIAS DEL SISTEMA
# ============================================================
echo ""
print_status "Instalando dependencias del sistema..."

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx postgresql postgresql-contrib build-essential ufw

# Marcar nginx como manual para evitar autoremove
apt-mark manual nginx > /dev/null 2>&1

print_success "Dependencias del sistema instaladas"

# ============================================================
# INSTALAR NODE.JS 20.x
# ============================================================
print_status "Verificando Node.js..."

if ! command -v node &> /dev/null || [[ $(node -v) != v20* ]]; then
    print_status "Instalando Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs
fi

# Asegurar permisos correctos (lección aprendida)
chmod 755 /usr/bin/node 2>/dev/null || true
chmod 755 /usr/bin/npm 2>/dev/null || true

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
print_success "Node.js $NODE_VERSION / npm $NPM_VERSION"

# ============================================================
# CONFIGURAR POSTGRESQL
# ============================================================
print_status "Configurando PostgreSQL..."

# Iniciar PostgreSQL si no está corriendo
systemctl start postgresql
systemctl enable postgresql > /dev/null 2>&1

if [ "$IS_UPDATE" = false ]; then
    # Crear usuario y base de datos (solo instalación nueva)
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
    
    # Configurar autenticación md5 (lección aprendida: peer no funciona con password)
    PG_HBA=$(sudo -u postgres psql -t -c "SHOW hba_file;" | xargs)
    if [ -f "$PG_HBA" ]; then
        if ! grep -q "host.*all.*all.*127.0.0.1.*md5" "$PG_HBA" 2>/dev/null; then
            echo "host    all             all             127.0.0.1/32            md5" >> "$PG_HBA"
            echo "host    all             all             ::1/128                 md5" >> "$PG_HBA"
            systemctl restart postgresql
        fi
    fi
    
    print_success "Base de datos creada: $DB_NAME"
else
    print_success "Base de datos existente preservada"
fi

# ============================================================
# CREAR USUARIO DEL SISTEMA
# ============================================================
print_status "Configurando usuario del sistema..."

if ! id "$APP_USER" &>/dev/null; then
    useradd --system --create-home --shell /bin/bash $APP_USER
    print_success "Usuario '$APP_USER' creado"
else
    print_success "Usuario '$APP_USER' ya existe"
fi

# ============================================================
# GUARDAR CONFIGURACIÓN PERSISTENTE (fuera del repositorio)
# ============================================================
print_status "Guardando configuración en $CONFIG_DIR/env..."

mkdir -p "$CONFIG_DIR"
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# Formato systemd: SIN comillas (lección aprendida)
cat > "$CONFIG_DIR/env" << EOF
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=$DATABASE_URL
SESSION_SECRET=$SESSION_SECRET
DEFAULT_LOCALE=$DEFAULT_LOCALE
SECURE_COOKIES=false
UPLOADS_DIR=$APP_DIR/uploads
PAYPAL_CLIENT_ID=$PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=$PAYPAL_CLIENT_SECRET
EMAIL_PROVIDER=$EMAIL_PROVIDER
EMAIL_API_KEY=$EMAIL_API_KEY
EMAIL_FROM=$EMAIL_FROM
EOF

chmod 600 "$CONFIG_DIR/env"
chown root:root "$CONFIG_DIR/env"

print_success "Configuración guardada"

# ============================================================
# CLONAR/ACTUALIZAR CÓDIGO
# ============================================================
print_status "Descargando código desde GitHub..."

git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true

if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null
    print_success "Código actualizado"
else
    rm -rf "$APP_DIR"
    git clone --depth 1 "$GITHUB_REPO" "$APP_DIR"
    print_success "Código descargado"
fi

chown -R $APP_USER:$APP_USER "$APP_DIR"

# ============================================================
# INSTALAR DEPENDENCIAS Y COMPILAR
# ============================================================
print_status "Instalando dependencias de Node.js..."

cd "$APP_DIR"

# Cargar variables de entorno para el build
set -a
source "$CONFIG_DIR/env"
set +a

# Instalar dependencias
sudo -u $APP_USER npm install --legacy-peer-deps 2>&1 | tail -3

print_status "Compilando aplicación..."
sudo -u $APP_USER npm run build 2>&1 | tail -3

print_success "Aplicación compilada"

# ============================================================
# EJECUTAR MIGRACIONES DE BASE DE DATOS
# ============================================================
print_status "Sincronizando esquema de base de datos..."

cd "$APP_DIR"

# Exportar variables para drizzle
export DATABASE_URL

# Ejecutar db:push
sudo -u $APP_USER -E npm run db:push 2>&1 | tail -5

print_success "Base de datos sincronizada"

# ============================================================
# CREAR DIRECTORIO DE UPLOADS
# ============================================================
print_status "Creando directorio de uploads..."

UPLOADS_DIR="$APP_DIR/uploads"
mkdir -p "$UPLOADS_DIR/public"
mkdir -p "$UPLOADS_DIR/private"
chown -R $APP_USER:$APP_USER "$UPLOADS_DIR"
chmod -R 755 "$UPLOADS_DIR"

print_success "Directorio de uploads creado"

# ============================================================
# CONFIGURAR SERVICIO SYSTEMD (NO PM2 - lección aprendida)
# ============================================================
print_status "Configurando servicio systemd..."

cat > "/etc/systemd/system/$APP_NAME.service" << EOF
[Unit]
Description=Plataforma Editorial Multi-Autor
Documentation=https://github.com/TU_USUARIO/TU_REPOSITORIO
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$CONFIG_DIR/env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$APP_NAME

# Seguridad adicional
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$APP_DIR $APP_DIR/uploads

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable $APP_NAME > /dev/null 2>&1

print_success "Servicio systemd configurado"

# ============================================================
# CONFIGURAR NGINX
# ============================================================
print_status "Configurando Nginx..."

# Preguntar por el dominio
echo ""
read -p "Dominio (ej: ediciones.atreyu.net) [dejar vacío para IP]: " DOMAIN_NAME
DOMAIN_NAME=${DOMAIN_NAME:-_}

if [ "$DOMAIN_NAME" != "_" ]; then
    SERVER_NAME="$DOMAIN_NAME"
else
    SERVER_NAME="_"
fi

cat > "/etc/nginx/sites-available/$APP_NAME" << NGINX_EOF
server {
    listen 80;
    server_name $SERVER_NAME;
    
    # Archivos grandes (subida de libros digitales)
    client_max_body_size 500M;
    
    # Logs
    access_log /var/log/nginx/editorial_access.log;
    error_log /var/log/nginx/editorial_error.log;
    
    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy a la aplicación Node.js
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # Servir archivos subidos directamente desde Nginx
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
    
    # Cache para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:5000;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Bloquear acceso a archivos sensibles
    location ~ /\. {
        deny all;
    }
}
NGINX_EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
nginx -t > /dev/null 2>&1

systemctl restart nginx

print_success "Nginx configurado"

# Ofrecer SSL con Let's Encrypt si hay dominio
if [ "$DOMAIN_NAME" != "_" ]; then
    echo ""
    read -p "¿Configurar SSL con Let's Encrypt para $DOMAIN_NAME? (S/n): " SETUP_SSL
    SETUP_SSL=${SETUP_SSL:-S}
    
    if [ "$SETUP_SSL" = "S" ] || [ "$SETUP_SSL" = "s" ]; then
        print_status "Instalando Certbot..."
        apt-get install -y -qq certbot python3-certbot-nginx
        
        print_status "Obteniendo certificado SSL..."
        certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --register-unsafely-without-email 2>&1 | tail -5
        
        # Habilitar cookies seguras (SSL = HTTPS)
        sed -i 's/SECURE_COOKIES=false/SECURE_COOKIES=true/' "$CONFIG_DIR/env"
        
        print_success "SSL configurado para $DOMAIN_NAME"
    fi
fi

# ============================================================
# CONFIGURAR FIREWALL
# ============================================================
print_status "Configurando firewall..."

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp > /dev/null 2>&1   # SSH
    ufw allow 80/tcp > /dev/null 2>&1   # HTTP
    ufw allow 443/tcp > /dev/null 2>&1  # HTTPS
    ufw --force enable > /dev/null 2>&1
    print_success "Firewall configurado (puertos 22, 80, 443)"
else
    print_warning "UFW no disponible, configura el firewall manualmente"
fi

# ============================================================
# INICIAR SERVICIO
# ============================================================
print_status "Iniciando aplicación..."

systemctl restart $APP_NAME
sleep 5

if systemctl is-active --quiet $APP_NAME; then
    print_success "Aplicación iniciada correctamente"
else
    print_error "Error al iniciar la aplicación"
    echo ""
    echo "Revisa los logs con:"
    echo "  journalctl -u $APP_NAME -n 50"
    echo ""
    echo "Verifica la configuración:"
    echo "  cat $CONFIG_DIR/env"
fi

# ============================================================
# CLOUDFLARE TUNNEL (OPCIONAL)
# ============================================================
echo ""
echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
print_status "Cloudflare Tunnel (opcional)"
echo ""
echo "Si tienes un token de Cloudflare Tunnel, puedes configurarlo ahora."
echo "Esto permite acceso HTTPS sin abrir puertos en el router."
echo "Obtén tu token en: https://one.dash.cloudflare.com → Zero Trust → Tunnels"
echo ""
read -p "Token de Cloudflare Tunnel (Enter para omitir): " CF_TOKEN

if [ -n "$CF_TOKEN" ]; then
    print_status "Instalando Cloudflare Tunnel..."
    
    # Descargar e instalar cloudflared
    curl -L -o /tmp/cloudflared.deb \
        https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb 2>/dev/null
    dpkg -i /tmp/cloudflared.deb > /dev/null 2>&1
    rm -f /tmp/cloudflared.deb
    
    # Instalar servicio con token
    cloudflared service install "$CF_TOKEN" 2>/dev/null
    systemctl enable cloudflared > /dev/null 2>&1
    systemctl start cloudflared
    
    # Habilitar cookies seguras (Cloudflare = HTTPS)
    sed -i 's/SECURE_COOKIES=false/SECURE_COOKIES=true/' "$CONFIG_DIR/env"
    systemctl restart $APP_NAME
    
    print_success "Cloudflare Tunnel configurado"
    print_status "Recuerda configurar el hostname en Cloudflare para apuntar a http://localhost:5000"
else
    print_warning "Cloudflare Tunnel omitido"
    echo ""
    echo "Puedes configurarlo después con:"
    echo "  curl -L -o /tmp/cf.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
    echo "  dpkg -i /tmp/cf.deb"
    echo "  cloudflared service install TU_TOKEN"
    echo "  sed -i 's/SECURE_COOKIES=false/SECURE_COOKIES=true/' $CONFIG_DIR/env"
    echo "  systemctl restart $APP_NAME"
fi

# ============================================================
# RESUMEN FINAL
# ============================================================
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              INSTALACIÓN COMPLETADA                          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}URL de acceso:${NC} http://$SERVER_IP"
echo ""
echo -e "${YELLOW}Credenciales de administrador:${NC}"
echo "  Usuario:    admin"
echo "  Contraseña: admin123"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Cambia la contraseña después del primer acceso${NC}"
echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo "  Estado:        systemctl status $APP_NAME"
echo "  Logs:          journalctl -u $APP_NAME -f"
echo "  Reiniciar:     systemctl restart $APP_NAME"
echo "  Detener:       systemctl stop $APP_NAME"
echo "  Configuración: cat $CONFIG_DIR/env"
echo ""
echo -e "${BLUE}Archivos importantes:${NC}"
echo "  Aplicación:    $APP_DIR"
echo "  Configuración: $CONFIG_DIR/env"
echo "  Nginx:         /etc/nginx/sites-available/$APP_NAME"
echo "  Servicio:      /etc/systemd/system/$APP_NAME.service"
echo "  Logs Nginx:    /var/log/nginx/editorial_*.log"
echo ""
echo -e "${BLUE}Para actualizar la aplicación:${NC}"
echo "  curl -O https://raw.githubusercontent.com/atreyu1968/multi-author-editorial-platform/main/update.sh"
echo "  sudo bash update.sh"
echo ""
echo -e "${BLUE}O reinstalar desde cero (preserva datos):${NC}"
echo "  curl -O https://raw.githubusercontent.com/atreyu1968/multi-author-editorial-platform/main/install.sh"
echo "  sudo bash install.sh"
echo ""

if [ "$IS_UPDATE" = true ]; then
    echo -e "${GREEN}✓ Actualización completada exitosamente${NC}"
else
    echo -e "${GREEN}✓ Instalación completada exitosamente${NC}"
fi
echo ""
