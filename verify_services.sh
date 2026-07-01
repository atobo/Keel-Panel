#!/usr/bin/env bash
# ==============================================================================
# Keel Panel Service Audit & Network Accessibility Tool
# ==============================================================================
# This script inspects all services required by Keel Panel to ensure they are:
# 1. Active (Running) under systemd or PM2.
# 2. Bound to appropriate network interfaces (listening externally vs locally).
# ==============================================================================

# Ensure script runs with root/sudo privileges (to check netstat/ss bindings)
if [ "$EUID" -ne 0 ]; then
  echo -e "\e[1;31m[ERROR] This script must be run as root (sudo) to accurately inspect port bindings.\e[0m"
  exit 1
fi

echo -e "\e[1;34m============================================================\e[0m"
# Check if ss is available
SS_CMD=""
if command -v ss &> /dev/null; then
  SS_CMD="ss"
elif command -v netstat &> /dev/null; then
  SS_CMD="netstat"
fi

# Function to check port binding type (External vs Local Only vs Closed)
check_port_binding() {
  local port=$1
  local proto=$2
  
  if [ -z "$SS_CMD" ]; then
    echo -e "\e[1;33mUnable to check (ss/netstat not found)\e[0m"
    return
  fi

  local bindings
  if [ "$SS_CMD" = "ss" ]; then
    bindings=$(ss -tuln | grep -E ":${port}\s" | awk '{print $5}')
  else
    bindings=$(netstat -tuln | grep -E ":${port}\s" | awk '{print $4}')
  fi

  if [ -z "$bindings" ]; then
    echo -e "\e[1;31mCLOSED\e[0m (No service bound to port ${port})"
    return
  fi

  local is_external=false
  local is_local=false

  for binding in $bindings; do
    # Remove port suffix
    local ip=${binding%:*}
    # Handle IPv6 brackets
    ip=${ip//[\[\]]/}
    
    if [ "$ip" = "0.0.0.0" ] || [ "$ip" = "*" ] || [ "$ip" = "::" ] || [ -z "$ip" ]; then
      is_external=true
    elif [ "$ip" = "127.0.0.1" ] || [ "$ip" = "::1" ] || [ "$ip" = "localhost" ]; then
      is_local=true
    else
      # Bound to a specific IP address (could be public/private)
      is_external=true
    fi
  done

  if [ "$is_external" = true ]; then
    echo -e "\e[1;32mACCESSIBLE EXTERNALLY\e[0m (bound to wildcard or specific IP)"
  elif [ "$is_local" = true ]; then
    echo -e "\e[1;33mLOCAL ONLY\e[0m (bound to localhost/127.0.0.1 only)"
  fi
}

# Function to audit a systemd service
audit_service() {
  local service_name=$1
  local description=$2
  local port=$3
  
  echo -e "\n\e[1;35m--- Audit: $description ($service_name) ---\e[0m"
  
  # Check if active
  local status
  status=$(systemctl is-active "$service_name" 2>/dev/null)
  
  if [ "$status" = "active" ]; then
    echo -e "Status: \e[1;32mRUNNING\e[0m"
  else
    echo -e "Status: \e[1;31mNOT RUNNING\e[0m (systemctl reports: ${status:-not installed})"
  fi
  
  # Check port accessibility
  if [ -n "$port" ] && [ "$status" = "active" ]; then
    echo -n "Network Access: "
    check_port_binding "$port"
  fi
}

# 1. Web Servers (Nginx / Apache)
if systemctl list-units --all --type=service | grep -q "nginx.service"; then
  audit_service "nginx" "Web Server (Nginx)" "80"
  audit_service "nginx" "Web Server (Nginx SSL)" "443"
elif systemctl list-units --all --type=service | grep -q "apache2.service"; then
  audit_service "apache2" "Web Server (Apache)" "80"
  audit_service "apache2" "Web Server (Apache SSL)" "443"
else
  echo -e "\n\e[1;31m[WARNING] No active Web Server (Nginx or Apache) service detected!\e[0m"
fi

# 2. Database Server (MySQL/MariaDB)
if systemctl list-units --all --type=service | grep -q "mariadb.service"; then
  audit_service "mariadb" "Database Server (MariaDB)" "3306"
elif systemctl list-units --all --type=service | grep -q "mysql.service"; then
  audit_service "mysql" "Database Server (MySQL)" "3306"
else
  echo -e "\n\e[1;33m[INFO] No MySQL/MariaDB service found under systemd.\e[0m"
fi

# 3. FTP Server (vsftpd)
if systemctl list-units --all --type=service | grep -q "vsftpd.service"; then
  audit_service "vsftpd" "FTP Server (vsftpd)" "21"
else
  echo -e "\n\e[1;33m[INFO] No vsftpd service found.\e[0m"
fi

# 4. Mail Server (Postfix)
if systemctl list-units --all --type=service | grep -q "postfix.service"; then
  audit_service "postfix" "Mail SMTP Server (Postfix)" "25"
else
  echo -e "\n\e[1;33m[INFO] No Postfix service found.\e[0m"
fi

# 5. DNS Server (Bind9/named)
if systemctl list-units --all --type=service | grep -q "named.service"; then
  audit_service "named" "DNS Server (Bind9/named)" "53"
elif systemctl list-units --all --type=service | grep -q "bind9.service"; then
  audit_service "bind9" "DNS Server (Bind9)" "53"
else
  echo -e "\n\e[1;33m[INFO] No DNS Bind9 service found.\e[0m"
fi

# 6. Keel Panel Backend Daemon
echo -e "\n\e[1;35m--- Audit: Keel Panel Backend Daemon ---\e[0m"

# Try systemd service first
if systemctl list-units --all --type=service | grep -q "keelpanel.service"; then
  status=$(systemctl is-active keelpanel 2>/dev/null)
  if [ "$status" = "active" ]; then
    echo -e "Status (systemd): \e[1;32mRUNNING\e[0m"
  else
    echo -e "Status (systemd): \e[1;31mNOT RUNNING\e[0m"
  fi
else
  # Check if running via PM2 (looking across users, or current user)
  if command -v pm2 &> /dev/null; then
    pm2_status=$(pm2 status keel-backend 2>/dev/null | grep -E "online|errored|stopped")
    if [ -n "$pm2_status" ]; then
      if echo "$pm2_status" | grep -q "online"; then
        echo -e "Status (PM2): \e[1;32mRUNNING\e[0m"
      else
        echo -e "Status (PM2): \e[1;31mNOT RUNNING\e[0m"
      fi
    else
      echo -e "Status: \e[1;33mNot found as systemd service or PM2 app.\e[0m"
    fi
  else
    echo -e "Status: \e[1;33mNot found (systemd unit 'keelpanel' does not exist and pm2 is not installed)\e[0m"
  fi
fi

# Check backend Port 3001 binding
echo -n "Internal Daemon Access (Port 3001): "
check_port_binding "3001"
echo -e "\e[1;30m(Note: The backend daemon is typically local-only behind an Nginx reverse-proxy on Port 80/443)\e[0m"

echo -e "\n\e[1;34m============================================================\e[0m"
echo -e "Audit Completed."
