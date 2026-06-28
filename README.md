# Keel Panel — Premium Web Control Panel (cPanel Alternative)

Keel Panel is a modern, high-performance, dark-themed web control panel designed for developers and host providers. It serves as a lightweight, clean, and responsive alternative to cPanel, featuring dynamic server diagnostics, multi-tenant isolation, database and domain orchestration, SSL automation, FTP/SSH key management, and task schedulers.

---

## ✨ Features

- 👥 **Multi-Tenant Sandboxing**: Customer environments are jailed within `/sandbox/<username>/` and chrooted securely.
- 🌐 **Web Server Orchestration**: Virtual host creation, configuration verification, and reload triggers (Nginx & Apache).
- 🗄️ **Database Manager**: Live database creation, SQL developer user access management, and privilege grants.
- 🔒 **ACME Let's Encrypt SSL**: Automatic issuance, status tracking, and 90-day certificate lifecycle management.
- 🔑 **FTP & SSH Management**: Chrooted FTP accounts and authorized public key authentication rosters.
- ⏰ **Cron Task Scheduler**: Scheduled automated system operations and scripts.
- 📦 **Backup & Restore**: Instant workspace archive compilations (`.tar.gz`).
- 📊 **Server Performance Logs**: live parsing logs and metrics dashboards.

---

## 🚀 Installation on Ubuntu Server 26.04 LTS

Keel Panel comes with a unified setup wizard script that checks for pre-installed web stacks (Apache/Nginx, MariaDB, PHP, vsftpd, bind9), automatically installs any missing dependencies, establishes boundaries, and daemonizes the control panel dashboard.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/keel-panel.git
cd keel-panel
```

### 2. Execute the Setup Wizard
Run the auto-installer with root privileges:
```bash
sudo bash install.sh
```

The script will:
1. Update apt packages and verify Node.js developer tools.
2. Check for (and configure) Nginx, MariaDB/MySQL, PHP-FPM, vsftpd, and Bind9 services.
3. Build isolated sandbox directory trees.
4. Install Keel Panel dependencies.
5. Create and start a `keelpanel.service` systemd daemon.

### 3. Access the Dashboard
Once the installation finishes, you can access your control panel in your browser:
* URL: `http://your-server-ip:3001/`
* Default Admin Credentials:
  * **Username**: `admin`
  * **Password**: `password`

---

## 📁 Repository Structure

```
keel-panel/
├── client/          # Frontend React SPA (Single Page Application HTML/CSS)
├── server/          # Backend Node.js API Web Server
├── sandbox/         # Local sandbox development folder
├── install.sh       # Unified bash installation setup script
├── README.md        # This deployment guide
└── .gitignore       # Git exclusion rules
```

---

## 🛠️ Diagnostics & Management
* **Check Service Status**: `sudo systemctl status keelpanel`
* **Restart Control Panel**: `sudo systemctl restart keelpanel`
* **Inspect Runtime Logs**: `sudo journalctl -u keelpanel -f`
