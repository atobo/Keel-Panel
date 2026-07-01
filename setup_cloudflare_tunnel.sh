#!/usr/bin/env bash
# ==============================================================================
# Keel Panel - Cloudflare Tunnel Installation & Setup Helper
# ==============================================================================
# This script automates installing the Cloudflare Tunnel client (cloudflared)
# and helps configure ingress rules to route panel (3001) and webmail (3002).
# ==============================================================================

# Ensure script is run with root/sudo privileges to install packages
if [ "$EUID" -ne 0 ]; then
  echo -e "\e[1;31m[ERROR] Please run this script with sudo:\e[0m"
  echo "  sudo ./setup_cloudflare_tunnel.sh"
  exit 1
fi

echo -e "\e[1;34m============================================================\e[0m"
echo -e "\e[1;32m      Keel Panel: Cloudflare Tunnel Installer & Setup\e[0m"
echo -e "\e[1;34m============================================================\e[0m"

# 1. Install cloudflared
if ! command -v cloudflared &> /dev/null; then
  echo -e "\n\e[1;35m[1/3] Installing cloudflared daemon...\e[0m"
  
  # Ensure keyring directory exists
  mkdir -p --mode=0755 /usr/share/keyrings
  
  # Fetch Cloudflare key
  echo "Downloading Cloudflare repository key..."
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  
  # Add repository
  echo "Adding cloudflared repository..."
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/cloudflared.list
  
  # Update and install
  echo "Running apt-get update and installing cloudflared..."
  apt-get update && apt-get install cloudflared -y
  
  if command -v cloudflared &> /dev/null; then
    echo -e "\e[1;32m[SUCCESS] cloudflared successfully installed.\e[0m"
  else
    echo -e "\e[1;31m[ERROR] Installation failed. Please check your internet connection or install manually.\e[0m"
    exit 1
  fi
else
  echo -e "\n\e[1;32m[INFO] cloudflared is already installed. Skipping installation.\e[0m"
fi

# 2. Login & Authenticate
echo -e "\n\e[1;35m[2/3] Cloudflare Authentication Setup\e[0m"
echo "To link this server to your Cloudflare account, run the command below as your non-root user:"
echo -e "  \e[1;33mcloudflared tunnel login\e[0m"
echo "This will give you a login link to authenticate your domains."
echo ""
echo "After authenticating, you can create a new tunnel with:"
echo -e "  \e[1;33mcloudflared tunnel create <tunnel-name>\e[0m"

# 3. Generating Sample configuration file
echo -e "\n\e[1;35m[3/3] Generating Local Configuration Draft\e[0m"

CONFIG_DIR="/etc/cloudflared"
mkdir -p "$CONFIG_DIR"

cat <<EOF > "$CONFIG_DIR/config.yml.example"
# Keel Panel Cloudflare Tunnel configuration template
# Copy this file to /etc/cloudflared/config.yml and replace placeholders.

tunnel: <YOUR_TUNNEL_UUID_OR_ID>
credentials-file: /etc/cloudflared/<YOUR_TUNNEL_UUID>.json

ingress:
  # Route panel dashboard (default port 3001)
  - hostname: panel.yourdomain.com
    service: http://localhost:3001
    
  # Route webmail client (default port 3002)
  - hostname: mail.yourdomain.com
    service: http://localhost:3002
    
  # Fallback rule
  - service: http_status:404
EOF

echo -e "\e[1;32m[INFO] Generated config template at: $CONFIG_DIR/config.yml.example\e[0m"
echo ""
echo -e "\e[1;34m------------------------------------------------------------\e[0m"
echo -e "\e[1;32mQuick Steps to Finish Setup:\e[0m"
echo "1. Run: cloudflared tunnel login"
echo "2. Run: cloudflared tunnel create keel-tunnel"
echo "3. Copy the credentials JSON to $CONFIG_DIR/<UUID>.json"
echo "4. Copy /etc/cloudflared/config.yml.example to /etc/cloudflared/config.yml and fill in details."
echo "5. Add DNS records for your domain:"
echo "   cloudflared tunnel route dns keel-tunnel panel.yourdomain.com"
echo "   cloudflared tunnel route dns keel-tunnel mail.yourdomain.com"
echo "6. Enable & Start the systemd service:"
echo "   sudo systemctl enable cloudflared"
echo "   sudo systemctl start cloudflared"
echo -e "\e[1;34m------------------------------------------------------------\e[0m"
