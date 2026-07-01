# Keel Panel Installation Guide

This guide details the step-by-step process of installing and running **Keel Panel** on your Linux VPS or bare-metal server (optimized for Ubuntu Server 24.04 / 26.04 LTS).

---

## 📋 System Requirements & Diagnostics

Before starting, verify your system specs using the commands below:

1.  **Operating System**: Ubuntu 22.04 / 24.04 / 26.04 LTS (x86_64 or ARM64)
    *   *Check command*: `lsb_release -a` or `cat /etc/os-release`
2.  **Node.js**: v18.0.0 or higher
    *   *Check command*: `node -v`
3.  **Package Manager**: `npm` v9.0.0 or higher
    *   *Check command*: `npm -v`
4.  **Reverse Proxies (Optional)**: Nginx, Apache, or Caddy
    *   *Check command*: `nginx -v` (NGINX), `apache2 -v` (Apache), or `caddy version` (Caddy)
5.  **Database (Optional)**: PostgreSQL or MariaDB (runs in SQLite/Mock mode if none are detected)
    *   *Check command*: `psql --version` or `mysql --version`
6.  **System Permissions**: Sudo/root access (required for virtual host generation, folder bounding, and port bindings)
    *   *Check command*: `sudo -v` (will prompt for password to verify access)

> [!NOTE]
> **Residential & Home Network Deployments**: If you are installing on a home/consumer connection, ISPs often block ports `80`, `443` (inbound), and `25` (outbound). See [Part 4: ISP Port Blocking & Residential Workarounds](documentation.md#part-4-isp-port-blocking--residential-workarounds) for instructions on using Cloudflare Tunnels and SMTP relays to bypass these blocks.

### 🔧 Installing/Updating Missing Requirements

If your system is missing any of the dependencies, use the commands below to install them:

#### 1. Update APT Package Lists
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

#### 2. Install Node.js & npm (NodeSource v20 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Install Utilities (Git, Curl, Unzip)
```bash
sudo apt-get install -y git curl unzip
```

#### 4. Install Web Servers (Choose One)
*   **NGINX**:
    ```bash
    sudo apt-get install -y nginx
    ```
*   **Apache**:
    ```bash
    sudo apt-get install -y apache2
    ```
*   **Caddy**:
    ```bash
    sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt-get update
    sudo apt-get install -y caddy
    ```

#### 5. Install Database Servers (Optional)
*   **PostgreSQL**:
    ```bash
    sudo apt-get install -y postgresql postgresql-contrib
    ```
*   **MariaDB**:
    ```bash
    sudo apt-get install -y mariadb-server
    ```

---

## 🚀 Step 1: Uploading Keel Panel to Server

You can upload the source code to your server using **Git** or **SFTP**.

### Option A: Using Git (Recommended)
Clone the repository directly into your server's application directory:
```bash
sudo git clone https://github.com/your-username/keel-panel.git /opt/keel-panel
sudo chown -R $USER:$USER /opt/keel-panel
```

### Option B: Using SFTP / Zip Upload
1. Compress your local project folder into a `.zip` archive.
2. Upload the archive to your server via SFTP to `/tmp/keel-panel.zip`.
3. Extract and move the files to `/opt/keel-panel`:
```bash
sudo apt-get install unzip
sudo unzip /tmp/keel-panel.zip -d /opt/keel-panel
sudo chown -R $USER:$USER /opt/keel-panel
```

---

## 🛠️ Step 2: Installing Dependencies

Keel Panel consists of a Node.js API daemon (backend) and a Vite/React SPA dashboard (frontend).

### 1. Build the Backend
Navigate to the server directory and install npm modules (including the standard `ws` WebSocket library):
```bash
cd /opt/keel-panel/server
npm install
```

### 2. Build the Frontend Assets
Navigate to the client directory, install React packages, and compile the production bundle:
```bash
cd /opt/keel-panel/client
npm install
npm run build
```
Vite will compile the static assets into `/opt/keel-panel/client/dist`.

---

## ⚙️ Step 3: Server Sandbox Environment Setup

Keel Panel isolates tenants inside chroot-like sandboxes. We must create the sandbox parent directory on the host system:
```bash
sudo mkdir -p /sandbox
sudo chmod 755 /sandbox
```
*(By default, Keel Panel will seed isolated tenant subfolders inside `/sandbox` upon user creation, ensuring chrooted file structures).*

---

## 🖥️ Step 4: Configuration & Running the Application

For a production environment, we use **PM2** to run the backend daemon in the background and **Nginx** to serve the static frontend assets.

### 1. Start the Backend Daemon via PM2
Install PM2 globally and start the server:
```bash
sudo npm install -g pm2
cd /opt/keel-panel/server
pm2 start index.js --name "keel-backend"
pm2 save
pm2 startup
```
This runs the backend on port **3001** and configures it to start automatically on system boot.

### 2. Configure Nginx to Serve the Frontend
Create an Nginx configuration file for Keel Panel:
```bash
sudo nano /etc/nginx/sites-available/keelpanel
```

Paste the following configuration, adjusting the `server_name` to your domain or server IP:
```nginx
server {
    listen 80;
    server_name panel.yourdomain.com; # Replace with server IP or domain

    # Serve static frontend assets compiled by Vite
    location / {
        root /opt/keel-panel/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node daemon
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/keelpanel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔐 Step 5: Initial Access & Authentication

1. Open your web browser and navigate to `http://panel.yourdomain.com` (or your server's IP address).
2. You will be greeted by the **Keel Panel Authentication Card**.
3. Sign in using the default administrative credentials:
    *   **Username**: `admin`
    *   **Password**: `password`
4. Once logged in, navigate to the **Advanced Security Suite** -> **SSH Keys / Users** to update the default password and configure secure authentication keys.

---

## 🔍 Step 6: Verifying the Services
To verify that everything is running correctly, check the following:
*   **WebSockets**: The dashboard stats (CPU usage, memory footprint) should update in real-time. If they aren't, verify that port `3001` allows WebSocket upgrades in your Nginx config.
*   **Logs**: Check backend daemon logs at any time using PM2:
    ```bash
    pm2 logs keel-backend
    ```
