#!/usr/bin/env bash
# ==============================================================================
# Keel Panel — Hot Updater Script (No-Wipe Code Deployer)
# ==============================================================================
# This script pulls changes from git, copies the source code to the active 
# installation folder (/opt/keel-panel), installs packages, and restarts the 
# service—without re-running installer setups (so config & data are preserved).
# ==============================================================================

if [ "$EUID" -ne 0 ]; then
  echo -e "\e[1;31mError: This script must be run as root (sudo).\e[0m"
  exit 1
fi

INSTALL_DIR="/opt/keel-panel"
SRC_DIR=$(pwd)

echo -e "\e[1;35m[1/4] Pulling latest updates from GitHub...\e[0m"
git pull

echo -e "\e[1;35m[2/4] Deploying source code to $INSTALL_DIR...\e[0m"
# Copy updated source code (preserving existing json configs)
# 1. Back up existing server configs if they exist
mkdir -p /tmp/keel-configs/
cp "$INSTALL_DIR/server/"*.json /tmp/keel-configs/ 2>/dev/null

# 2. Copy source directories
cp -r ./client "$INSTALL_DIR/"
cp -r ./server "$INSTALL_DIR/"
cp -r ./webmail "$INSTALL_DIR/"

# 3. Restore server configs
cp /tmp/keel-configs/*.json "$INSTALL_DIR/server/" 2>/dev/null
rm -rf /tmp/keel-configs/

chown -R keel:keel "$INSTALL_DIR"

echo -e "\e[1;35m[3/4] Installing dependencies & rebuilding packages...\e[0m"
# Rebuild server dependencies
echo "Rebuilding server..."
cd "$INSTALL_DIR/server" && npm install --production

# Rebuild main panel UI
echo "Rebuilding client..."
cd "$INSTALL_DIR/client" && npm install && npm run build
chown -R keel:keel "$INSTALL_DIR/client"

# Rebuild webmail client UI
echo "Rebuilding webmail..."
cd "$INSTALL_DIR/webmail" && npm install && npm run build
chown -R keel:keel "$INSTALL_DIR/webmail"

echo -e "\e[1;35m[4/4] Restarting Keel Panel backend service...\e[0m"
systemctl restart keelpanel

echo -e "\e[1;32mUpdate completed successfully!\e[0m"
