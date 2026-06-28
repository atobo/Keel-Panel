export function getNginxTemplate(domain, docroot, phpVersion = '8.2', sslConfig = null, redirectUrl = null, hotlinkProtect = false) {
  const hotlinkRule = hotlinkProtect ? `
    location ~* \\.(jpg|jpeg|png|gif|svg|webp|mp4|webm)$ {
        valid_referers none blocked server_names *.${domain} ${domain};
        if ($invalid_referer) {
            return 403;
        }
    }
` : '';

  if (redirectUrl) {
    if (sslConfig) {
      return `server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name ${domain} www.${domain};

    ssl_certificate ${sslConfig.certPath};
    ssl_certificate_key ${sslConfig.keyPath};

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    charset utf-8;

    return 301 ${redirectUrl};
}
`;
    }
    return `server {
    listen 80;
    listen [::]:80;

    server_name ${domain} www.${domain};

    charset utf-8;

    return 301 ${redirectUrl};
}
`;
  }

  if (sslConfig) {
    return `server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name ${domain} www.${domain};
    root ${docroot};
    index index.html index.htm index.php;

    ssl_certificate ${sslConfig.certPath};
    ssl_certificate_key ${sslConfig.keyPath};

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    charset utf-8;
${hotlinkRule}
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log /var/log/nginx/${domain}-access.log;
    error_log /var/log/nginx/${domain}-error.log error;

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php${phpVersion}-fpm.sock;
    }

    location ~ /\\.ht {
        deny all;
    }
}
`;
  }

  return `server {
    listen 80;
    listen [::]:80;

    server_name ${domain} www.${domain};
    root ${docroot};
    index index.html index.htm index.php;

    charset utf-8;
${hotlinkRule}
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log /var/log/nginx/${domain}-access.log;
    error_log /var/log/nginx/${domain}-error.log error;

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php${phpVersion}-fpm.sock;
    }

    location ~ /\\.ht {
        deny all;
    }
}
`;
}

export function getApacheTemplate(domain, docroot, phpVersion = '8.2', sslConfig = null, redirectUrl = null, hotlinkProtect = false) {
  const hotlinkRule = hotlinkProtect ? `
        RewriteEngine on
        RewriteCond %{HTTP_REFERER} !^$
        RewriteCond %{HTTP_REFERER} !^https?://(www\\.)?${domain} [NC]
        RewriteRule \\.(jpg|jpeg|png|gif|svg|webp|mp4|webm)$ - [F]
` : '';

  if (redirectUrl) {
    if (sslConfig) {
      return `<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}
    Redirect permanent / https://${domain}/
</VirtualHost>

<VirtualHost *:443>
    ServerName ${domain}
    ServerAlias www.${domain}

    SSLEngine on
    SSLCertificateFile "${sslConfig.certPath}"
    SSLCertificateKeyFile "${sslConfig.keyPath}"

    Redirect permanent / ${redirectUrl}
</VirtualHost>
`;
    }
    return `<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}

    Redirect permanent / ${redirectUrl}
</VirtualHost>
`;
  }

  if (sslConfig) {
    return `<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}
    Redirect permanent / https://${domain}/
</VirtualHost>

<VirtualHost *:443>
    ServerName ${domain}
    ServerAlias www.${domain}
    DocumentRoot "${docroot}"

    SSLEngine on
    SSLCertificateFile "${sslConfig.certPath}"
    SSLCertificateKeyFile "${sslConfig.keyPath}"

    <Directory "${docroot}">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        ${hotlinkRule}
    </Directory>

    <FilesMatch \\.php$>
        SetHandler "proxy:unix:/run/php/php${phpVersion}-fpm.sock|fcgi://localhost"
    </FilesMatch>

    ErrorLog \${APACHE_LOG_DIR}/${domain}-error.log
    CustomLog \${APACHE_LOG_DIR}/${domain}-access.log combined
</VirtualHost>
`;
  }

  return `<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}
    DocumentRoot "${docroot}"

    <Directory "${docroot}">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        ${hotlinkRule}
    </Directory>

    # Proxy declaration to PHP-FPM socket
    <FilesMatch \\.php$>
        SetHandler "proxy:unix:/run/php/php${phpVersion}-fpm.sock|fcgi://localhost"
    </FilesMatch>

    ErrorLog \${APACHE_LOG_DIR}/${domain}-error.log
    CustomLog \${APACHE_LOG_DIR}/${domain}-access.log combined
</VirtualHost>
`;
}

export function getNginxWebmailTemplate(domain, sslConfig = null) {
  if (sslConfig) {
    return `server {
    listen 80;
    listen [::]:80;
    server_name webmail.${domain};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name webmail.${domain};

    ssl_certificate ${sslConfig.certPath};
    ssl_certificate_key ${sslConfig.keyPath};

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    charset utf-8;

    location / {
        proxy_pass http://localhost:3002/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
`;
  }
  return `server {
    listen 80;
    listen [::]:80;

    server_name webmail.${domain};

    charset utf-8;

    location / {
        proxy_pass http://localhost:3002/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
`;
}

export function getApacheWebmailTemplate(domain, sslConfig = null) {
  if (sslConfig) {
    return `<VirtualHost *:80>
    ServerName webmail.${domain}
    Redirect permanent / https://webmail.${domain}/
</VirtualHost>

<VirtualHost *:443>
    ServerName webmail.${domain}

    SSLEngine on
    SSLCertificateFile "${sslConfig.certPath}"
    SSLCertificateKeyFile "${sslConfig.keyPath}"

    ProxyPreserveHost On
    ProxyPass / http://localhost:3002/
    ProxyPassReverse / http://localhost:3002/
</VirtualHost>
`;
  }
  return `<VirtualHost *:80>
    ServerName webmail.${domain}

    ProxyPreserveHost On
    ProxyPass / http://localhost:3002/
    ProxyPassReverse / http://localhost:3002/
</VirtualHost>
`;
}
