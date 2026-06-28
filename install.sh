#!/usr/bin/env bash
# ==============================================================================
# Keel Panel — Ubuntu Server 26.04 Auto-Installer & Configurator
# ==============================================================================
# A complete package script to verify, install, and configure web, database, 
# DNS, and FTP systems to support the Keel Panel Premium Control Panel.
# ==============================================================================

# Ensure script runs as root
if [ "$EUID" -ne 0 ]; then
  echo -e "\e[1;31mError: This script must be run as root (sudo).\e[0m"
  exit 1
fi

echo -e "\e[1;34m==================================================\e[0m"
echo -e "\e[1;32m      Welcome to the Keel Panel Auto-Installer     \e[0m"
echo -e "\e[1;34m==================================================\e[0m"
echo -e "Target OS: Ubuntu Server 26.04 LTS (or compatible Debian systems)"
echo

# 1. Detect Host OS details
if [ -f /etc/os-release ]; then
  . /etc/os-release
  echo -e "Detected OS: \e[1;36m$NAME $VERSION_ID\e[0m"
  if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
    echo -e "\e[1;33mWarning: This script is optimized for Ubuntu/Debian. Continuing anyway...\e[0m"
  fi
else
  echo -e "\e[1;33mWarning: /etc/os-release not found. Assuming Debian-like environment...\e[0m"
fi

# Function to check if a system service command is available
service_exists() {
  systemctl list-unit-files | grep -Fq "$1.service"
}

# 2. Package updates
echo -e "\n\e[1;35m[1/6] Syncing package list caches...\e[0m"
apt-get update -y

# 3. Check / Install core tools (Git, Node, Curl)
echo -e "\n\e[1;35m[2/6] Verifying Node.js and Core Developer Utilities...\e[0m"
DEPS=(curl git ufw sudo tar unzip)
for dep in "${DEPS[@]}"; do
  if ! command -v "$dep" &> /dev/null; then
    echo -e "Installing dependency: \e[1;33m$dep\e[0m"
    apt-get install -y "$dep"
  else
    echo -e "Dependency met: \e[1;32m$dep\e[0m"
  fi
done

# Install Node.js if missing
if ! command -v node &> /dev/null; then
  echo -e "\e[1;33mNode.js is missing. Installing Node.js LTS via NodeSource...\e[0m"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo -e "Node.js environment: \e[1;32m$(node -v)\e[0m"
fi

# 4. Check / Install Hosting Services Stack
echo -e "\n\e[1;35m[3/6] Auditing and configuring server daemon stack...\e[0m"

# WEB SERVER: Apache or Nginx
if command -v nginx &> /dev/null; then
  echo -e "Web Engine: \e[1;32mNginx is already installed.\e[0m"
elif command -v apache2 &> /dev/null; then
  echo -e "Web Engine: \e[1;32mApache2 is already installed.\e[0m"
else
  echo -e "\e[1;33mNo web server engine detected. Defaulting to Nginx installation...\e[0m"
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
fi

# DATABASE SERVER: MariaDB/MySQL
if command -v mysql &> /dev/null; then
  echo -e "Database Engine: \e[1;32mMariaDB/MySQL is already installed.\e[0m"
else
  echo -e "\e[1;33mNo database engine detected. Installing MariaDB Server...\e[0m"
  apt-get install -y mariadb-server
  systemctl enable mariadb
  systemctl start mariadb
fi

# Set up database administrative user for Keel Panel
echo -e "Configuring MariaDB user for Keel Panel..."
DB_PASS_FILE="/etc/keelpanel/db.conf"
mkdir -p /etc/keelpanel
if [ -f "$DB_PASS_FILE" ]; then
  DB_PASS=$(cat "$DB_PASS_FILE")
else
  DB_PASS=$(openssl rand -hex 16)
  echo "$DB_PASS" > "$DB_PASS_FILE"
  chmod 600 "$DB_PASS_FILE"
fi

mysql -u root -e "CREATE USER IF NOT EXISTS 'keel_admin'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -u root -e "ALTER USER 'keel_admin'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'keel_admin'@'localhost' WITH GRANT OPTION;"
mysql -u root -e "FLUSH PRIVILEGES;"

# PHP-FPM
if command -v php &> /dev/null; then
  echo -e "Script Runtime: \e[1;32mPHP is already installed ($(php -r 'echo PHP_VERSION;')).\e[0m"
else
  echo -e "\e[1;33mInstalling PHP, PHP-FPM, and database modules...\e[0m"
  apt-get install -y php-fpm php-mysql php-curl php-gd php-xml php-mbstring
fi

# FTP SERVER: vsftpd
if command -v vsftpd &> /dev/null; then
  echo -e "FTP Service: \e[1;32mvsftpd is already installed.\e[0m"
else
  echo -e "\e[1;33mInstalling vsftpd service for FTP support...\e[0m"
  apt-get install -y vsftpd
  systemctl enable vsftpd
  systemctl start vsftpd
fi

# MAIL SERVER: Postfix
if command -v postfix &> /dev/null; then
  echo -e "Mail Service: \e[1;32mPostfix is already installed.\e[0m"
else
  echo -e "\e[1;33mInstalling Postfix mail transfer agent...\e[0m"
  echo "postfix postfix/main_mailer_type string 'Internet Site'" | debconf-set-selections
  echo "postfix postfix/mailname string localhost" | debconf-set-selections
  apt-get install -y postfix
  systemctl enable postfix
  systemctl start postfix
fi

# Configure Postfix Outbound Staggering & Rate-Limiting
POSTFIX_MAIN_CF="/etc/postfix/main.cf"
if [ -f "$POSTFIX_MAIN_CF" ]; then
  echo "Configuring Postfix queue throttling parameters..."
  # Clean up existing parameters to prevent duplicates
  sed -i '/default_destination_rate_delay/d' "$POSTFIX_MAIN_CF"
  sed -i '/default_destination_concurrency_limit/d' "$POSTFIX_MAIN_CF"
  
  # Append new throttling configuration
  echo "default_destination_rate_delay = 2s" >> "$POSTFIX_MAIN_CF"
  echo "default_destination_concurrency_limit = 2" >> "$POSTFIX_MAIN_CF"
  
  systemctl restart postfix
  echo -e "Postfix queue throttling configured: \e[1;32m$POSTFIX_MAIN_CF\e[0m"
fi

# DNS SERVER: Bind9
if service_exists bind9 || service_exists named; then
  echo -e "DNS Service: \e[1;32mBind9 is already installed.\e[0m"
else
  echo -e "\e[1;33mInstalling Bind9 local zone server...\e[0m"
  apt-get install -y bind9
fi

# Enable and start BIND using named.service if available (since bind9.service is a linked/alias unit on modern systemd)
if service_exists named; then
  systemctl enable named
  systemctl start named
else
  systemctl enable bind9
  systemctl start bind9
fi

# 5. Bounding configurations & sandbox setup
echo -e "\n\e[1;35m[4/6] Creating sandboxed directory trees...\e[0m"

# Create keel group & user
if ! id "keel" &>/dev/null; then
  useradd -m -r -s /bin/bash keel
  echo "Created system user: keel"
fi

# Directory boundaries
mkdir -p /sandbox
chown root:root /sandbox
chmod 755 /sandbox
echo -e "System jail mounted: \e[1;32m/sandbox\e[0m"

# Configure vsftpd for chrooted users if file exists
VSFTPD_CONF="/etc/vsftpd.conf"
if [ -f "$VSFTPD_CONF" ]; then
  # Ensure chroot configurations are active
  if ! grep -q "chroot_local_user=YES" "$VSFTPD_CONF"; then
    echo "chroot_local_user=YES" >> "$VSFTPD_CONF"
  fi
  if ! grep -q "allow_writeable_chroot=YES" "$VSFTPD_CONF"; then
    echo "allow_writeable_chroot=YES" >> "$VSFTPD_CONF"
  fi
  systemctl restart vsftpd
  echo -e "FTP boundaries locked in: \e[1;32m$VSFTPD_CONF\e[0m"
fi

# 6. Install & Configure Keel Panel
echo -e "\n\e[1;35m[5/6] Building Keel Panel resources...\e[0m"

# Setup configuration folders
mkdir -p /etc/keelpanel
mkdir -p /var/log/keelpanel

# Copy application assets to /opt/keel-panel
INSTALL_DIR="/opt/keel-panel"
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp -r ./client "$INSTALL_DIR/client"
cp -r ./server "$INSTALL_DIR/server"
cp -r ./webmail "$INSTALL_DIR/webmail"
chown -R keel:keel "$INSTALL_DIR"
chown -R keel:keel /var/log/keelpanel

# Install Node server dependencies
echo "Installing Node.js packages..."
cd "$INSTALL_DIR/server" && npm install --production

# 7. Create Systemd Service for Daemon
echo -e "\n\e[1;35m[6/6] Registering Keel Panel Daemon background service...\e[0m"

SERVICE_FILE="/etc/systemd/system/keelpanel.service"
cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Keel Panel Premium Control Panel Service
After=network.target mysql.service nginx.service vsftpd.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/server
ExecStart=/usr/bin/node index.js
Restart=always
Environment=NODE_ENV=production PORT=3001 DB_HOST=localhost DB_USER=keel_admin DB_PASSWORD=$DB_PASS

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable keelpanel
systemctl restart keelpanel

echo
echo -e "\e[1;32m==================================================\e[0m"
echo -e "\e[1;32m    Keel Panel Installation Completed Successfully! \e[0m"
echo -e "=================================================="
echo -e "You can access your Control Panel at: \e[1;34mhttp://localhost:3001/\e[0m"
echo -e "Daemon logs are stored in systemd journal: \e[1;33mjournalctl -u keelpanel -f\e[0m"
echo -e "=================================================="
