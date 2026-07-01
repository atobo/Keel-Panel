# Keel Panel - Comprehensive Documentation & Security Guide

This document is the ultimate reference manual for **Keel Panel**, providing detailed instructions for system administrators (installation, hardening, and operation) and hosting tenants (end-user workspace management).

---

## 📖 Table of Contents
1. [Part 1: Administrator Installation & Hardening Guide](#part-1-administrator-installation--hardening-guide)
2. [Part 2: Administrator Operations Manual](#part-2-administrator-operations-manual)
3. [Part 3: Tenant / End-User User Manual](#part-3-tenant--end-user-user-manual)
4. [Part 4: ISP Port Blocking & Residential Workarounds](#part-4-isp-port-blocking--residential-workarounds)

---

## 🛠️ Part 1: Administrator Installation & Hardening Guide

This section covers the deployment, sandboxing, and security hardening of the panel daemon.

### 📋 Prerequisites & Diagnostics
Verify that your system meets the requirements:
*   **Operating System**: Ubuntu 22.04 / 24.04 / 26.04 LTS (`lsb_release -a`)
*   **Node.js**: v18.0.0+ (`node -v`)
*   **npm**: v9.0.0+ (`npm -v`)
*   **Git**: Required (`sudo apt install -y git`)

To install missing Node.js runtime environments:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git unzip curl
```

### 📦 1. Uploading & Building Keel Panel
Clone the source code to `/opt/keel-panel`:
```bash
sudo git clone https://github.com/your-username/keel-panel.git /opt/keel-panel
```

Install backend dependencies:
```bash
cd /opt/keel-panel/server
npm install
```

Install frontend packages and compile the production bundle:
```bash
cd /opt/keel-panel/client
npm install
npm run build
```

### 🔒 2. Security Hardening & Isolation

#### Run under a Low-Privilege System User
Do NOT run the Node.js daemon as root. Create a dedicated system user `keel`:
```bash
sudo useradd -r -s /bin/false keel
sudo chown -R keel:keel /opt/keel-panel
```

#### Set up the Sandboxed Bounding Root
Create the parent directory where all tenant files will reside:
```bash
sudo mkdir -p /sandbox
sudo chown keel:keel /sandbox
sudo chmod 755 /sandbox
```

#### Restrict Sudo Executions (Visudo)
To reload NGINX, Apache, or Caddy virtual hosts without running the entire daemon as root, configure strict sudo exceptions:
```bash
sudo nano /etc/sudoers.d/keel
```
Add the following lines (replace paths if necessary):
```text
keel ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/nginx -s reload
keel ALL=(ALL) NOPASSWD: /usr/sbin/apachectl -t, /usr/sbin/apachectl -k graceful
keel ALL=(ALL) NOPASSWD: /usr/bin/caddy reload --config /etc/caddy/Caddyfile
```

#### Firewall Lockdown (UFW)
Only expose public web ports (`80`, `443`) and SSH (`22`). Keep the daemon port (`3001`) restricted to local loopback access:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Enforce Production HTTPS (Nginx Proxy)
Create `/etc/nginx/sites-available/keelpanel`:
```nginx
server {
    listen 80;
    server_name panel.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name panel.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/panel.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/panel.yourdomain.com/privkey.pem;

    location / {
        root /opt/keel-panel/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

Start the daemon with PM2 under the `keel` user:
```bash
sudo -u keel pm2 start /opt/keel-panel/server/index.js --name "keel-backend"
sudo -u keel pm2 save
```

---

## ⚙️ Part 2: Administrator Operations Manual

Administrative tools to manage the global server state.

### 👤 1. Creating and Managing Tenants
*   Navigate to the **Tenant Accounts Manager** in the sidebar navigation.
*   Click **Create Tenant Profile**.
*   Specify a unique username, account role (`tenant`), password, and storage quota (e.g., `500 MB`).
*   **Result**: The system automatically spins up `/sandbox/<username>` as an isolated filesystem scope.

### 🔄 2. Global Reverse-Proxy Engine Management
*   Navigate to the **System Dashboard**.
*   Under the **Modern Web Stack Selector** card, view the memory footprint of active engines (NGINX, Apache, Caddy).
*   Toggle your active engine on the fly. Sudo reload commands are fired to the visudo exceptions silently.

### 🧪 3. Developer App Engine Deployments
*   Navigate to **Modern DX & GitOps**.
*   **Register Daemon Application**: Assign custom Node, Bun, Python, or Go startup entry scripts, configure port bindings, and append system environment variables.
*   **Container Launcher**: Spawn isolated lightweight Docker containers by defining registry images and host port mappings.

### 🔄 4. Updating the Control Panel (Zero Data Loss)
To update the panel to the latest code changes without affecting custom settings, database tables, or tenant sandbox directories:
1. Navigate to the panel installation folder:
   ```bash
   cd /opt/keel-panel
   ```
2. Pull the updated codebase:
   ```bash
   sudo git pull origin main
   ```
3. Sync Node dependencies for the server:
   ```bash
   cd server && npm install --production
   ```
4. Recompile client assets (if frontend changes are present):
   ```bash
   cd ../client && npm install && npm run build
   ```
5. Restart the background panel daemon:
   *   If using **PM2**: `sudo -u keel pm2 restart keel-backend`
   *   If using **Systemd**: `sudo systemctl restart keelpanel`

---

## 💻 Part 3: Tenant / End-User User Manual

End-user controls to run websites, files, and databases.

### 📂 1. Web File Browser & Archiver
*   Access the **File Manager** to view directories inside your isolated sandbox.
*   **Drag & Drop** files directly from your desktop into the web grid to stream uploads.
*   Right-click or select items to perform actions:
    *   **Chmod Exception Rules**: Toggle file execution flags visually (e.g., `755`, `644`).
    *   **Folder Privacy Locks**: Protect folders with password popups (visual `.htaccess` configuration).
    *   **Archive / Decompress**: Compile zip/tar.gz files or extract directory bundles.
*   **Git Clone**: Enter repository URLs and branch targets to clone source code directly into your directories.

### 🗄️ 2. Databases & visual SQL Explorer
*   Access the **Database Manager** tab.
*   Use the **3-Step Database Wizard** to:
    1.  Create a target SQL database.
    2.  Create database user credentials.
    3.  Map user access permissions automatically.
*   Click **Explore Table** next to any database to open the visual table browser, edit rows on-demand, or run manual SQL queries.
*   Deploy one-click **Adminer** setups securely to manage database contents with a single SSO login.

### 🌐 3. Subdomains & DNS Zone Records
*   Go to **Domains & DNS**.
*   Click **Create Subdomain** to register addon domains, edit paths, select execution engines (Nginx/Apache), or set permanently cached redirections.
*   Click **DNS Records Console** to edit local zone mappings (A, CNAME, MX, TXT) and configure SPF/DKIM keys to verify mail authenticity.

### ⏱️ 4. Cron Task Scheduler
*   Navigate to the **Task Scheduler (Crons)**.
*   View active schedules or click **Create Task**.
*   Enter custom Cron commands and set schedules using standard cron syntax.
*   Use the **AI Cron Composer** to type natural statements (e.g., "run my cleanup every Sunday at 3 AM") and instantly map the generated cron schedule.

### ☁️ 5. Cloud Backups & DNS Registrar Synchronization
*   Navigate to **Cloud-Native Integrations**.
*   **Cloud Backups**: Configure Amazon S3, Google Cloud Storage, or Backblaze B2 bucket credentials. Click **Trigger Backup** to stream compressed directory archives directly to your cloud buckets.
*   **DNS Provider API**: Enter Cloudflare, Route53, or DigitalOcean API keys. Click **Sync to Cloud** next to your domains to push zone records to external registrars instantly.

---

## 🌐 Part 4: ISP Port Blocking & Residential Workarounds

When deploying Keel Panel on a home server or residential/consumer internet connection, internet service providers (ISPs) often block:
- **Inbound Ports**: `80` (HTTP) and `443` (HTTPS) to prevent hosting web servers on consumer tiers.
- **Outbound Port**: `25` (SMTP) globally to curb outbound spam and email abuse.

To deploy Keel Panel successfully in these environments, use the following bypass strategies:

### 1. Inbound Bypass: Cloudflare Tunnels

A Cloudflare Tunnel connects your local server ports directly to the Cloudflare network without requiring any open inbound ports or dynamic DNS.

#### Step 1: Install `cloudflared`
Download and install the Cloudflare Tunnel daemon on your server:
```bash
# Add Cloudflare gpg key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

# Add cloudflared repository
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Install cloudflared
sudo apt-get update && sudo apt-get install cloudflared -y
```

#### Step 2: Authenticate and Create Tunnel
1. Run the login command and click the URL provided to authorize with your Cloudflare account:
   ```bash
   cloudflared tunnel login
   ```
2. Create your tunnel (replace `my-vps-tunnel` with a custom name):
   ```bash
   cloudflared tunnel create my-vps-tunnel
   ```
   *This generates a JSON credentials file in `~/.cloudflare/`.*

#### Step 3: Configure Routing
Create or edit your local configuration file (usually `~/.cloudflare/config.yml`):
```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /home/keel/.cloudflare/<TUNNEL_UUID>.json

ingress:
  - hostname: panel.yourdomain.com
    service: http://localhost:3001
  - hostname: mail.yourdomain.com
    service: http://localhost:3002
  - service: http_status:404
```
Ensure you create the DNS records in Cloudflare pointing to your tunnel:
```bash
cloudflared tunnel route dns my-vps-tunnel panel.yourdomain.com
cloudflared tunnel route dns my-vps-tunnel mail.yourdomain.com
```

#### Step 4: Run as a Service
Install the tunnel as a system service so it launches on boot:
```bash
sudo cloudflared --config /home/keel/.cloudflare/config.yml service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

### 2. Outbound Bypass: Amazon SES SMTP Relay

To bypass outbound Port 25 blocking and ensure high deliverability, configure Keel Panel to route outbound mail through Amazon SES (or another SMTP relay service like MailerSend, SendGrid, etc.).

#### Step 1: Obtain SMTP Credentials from Amazon SES
1. Log in to your **Amazon AWS Console** and navigate to **Amazon Simple Email Service (SES)**.
2. Verify your domain or email address in **Verified Identities**.
3. Go to **SMTP Settings** in the AWS SES sidebar.
4. Click **Create SMTP Credentials**. Download or copy the generated Username and Password.
5. Note your SES SMTP endpoint and port (e.g., `email-smtp.us-east-1.amazonaws.com` on Port `587` or `465`).

#### Step 2: Enable SMTP Relay in Keel Panel
1. Access the Keel Panel dashboard UI.
2. Navigate to **Mail Services** -> **SMTP Relay Settings**.
3. Toggle **Enable Outbound SMTP Relay** to **ON**.
4. Enter the details:
   - **SMTP Host**: e.g., `email-smtp.us-east-1.amazonaws.com`
   - **Port**: `587`
   - **Username**: *Your generated AWS SES SMTP username*
   - **Password / API Key**: *Your generated AWS SES SMTP password*
5. Click **Save Settings**. 

Keel Panel will automatically update the Postfix `main.cf` configurations, rebuild the SASL maps database, and reload Postfix. All outbound mail will now route through Amazon SES over secure port 587/465.

