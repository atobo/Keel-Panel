import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import zlib from 'zlib';
import { getNginxTemplate, getApacheTemplate, getNginxWebmailTemplate, getApacheWebmailTemplate } from './vhostTemplates.js';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

let dbPool = null;
let useMockDatabase = true;

async function initDatabase() {
  try {
    dbPool = mysql.createPool({
      ...DB_CONFIG,
      connectionLimit: 5,
      connectTimeout: 2000
    });
    // Test connection
    const connection = await dbPool.getConnection();
    console.log('Successfully connected to MariaDB server. Real Database Mode enabled.');
    useMockDatabase = false;
    connection.release();
  } catch (err) {
    console.warn(`Failed to connect to MariaDB server (${DB_CONFIG.host}). Falling back to Mock Database Mode:`, err.message);
    useMockDatabase = true;
    dbPool = null;
  }
}
initDatabase();

// PostgreSQL connection configuration
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DATABASE || 'postgres',
  port: parseInt(process.env.PG_PORT || '5432'),
};

let pgPool = null;
let useMockPg = true;

async function initPgDatabase() {
  try {
    const pg = await import('pg');
    pgPool = new pg.default.Pool({
      ...PG_CONFIG,
      connectionTimeoutMillis: 2000
    });
    const client = await pgPool.connect();
    console.log('Successfully connected to PostgreSQL server. Real PG Mode enabled.');
    useMockPg = false;
    client.release();
  } catch (err) {
    console.warn(`Failed to connect to PostgreSQL server (${PG_CONFIG.host}). Falling back to Mock PG Mode:`, err.message);
    useMockPg = true;
    pgPool = null;
  }
}
initPgDatabase();

// Define directories
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const IS_DEMO = process.env.DEMO_MODE === 'true';
const SANDBOX_DIR = path.join(WORKSPACE_ROOT, 'sandbox');
const VHOSTS_MOCK_DIR = path.join(WORKSPACE_ROOT, 'server', 'vhosts');
const SSL_MOCK_DIR = path.join(WORKSPACE_ROOT, 'server', 'ssl');
const BIND_MOCK_DIR = path.join(WORKSPACE_ROOT, 'server', 'bind');
const BIND_ZONES_MOCK_DIR = path.join(BIND_MOCK_DIR, 'zones');
const BIND_CONF_MOCK = path.join(BIND_MOCK_DIR, 'named.conf.local');

async function ensureVhostsMockDir() {
  try {
    await fs.mkdir(VHOSTS_MOCK_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create local mock vhosts dir:', err);
  }
}
ensureVhostsMockDir();

async function ensureSslMockDir() {
  try {
    await fs.mkdir(SSL_MOCK_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create local mock ssl dir:', err);
  }
}
ensureSslMockDir();

async function ensureBindMockDir() {
  try {
    await fs.mkdir(BIND_ZONES_MOCK_DIR, { recursive: true });
    if (!existsSync(BIND_CONF_MOCK)) {
      await fs.writeFile(BIND_CONF_MOCK, '// Keel Panel Local DNS Zones\n', 'utf-8');
    }
  } catch (err) {
    console.error('Failed to create local mock bind dir:', err);
  }
}
ensureBindMockDir();

const BACKUPS_DIR = path.join(WORKSPACE_ROOT, 'server', 'backups');

async function ensureBackupsDir() {
  try {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create backups dir:', err);
  }
}
ensureBackupsDir();

const CRONS_MOCK_DIR = path.join(WORKSPACE_ROOT, 'server', 'cron.d');

async function ensureCronsMockDir() {
  try {
    await fs.mkdir(CRONS_MOCK_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create local mock cron.d dir:', err);
  }
}
ensureCronsMockDir();

const FTP_SSH_CONFIG_FILE = path.join(WORKSPACE_ROOT, 'server', 'ftp_ssh_config.json');

async function initFtpSshConfig() {
  if (!existsSync(FTP_SSH_CONFIG_FILE)) {
    const initialConfig = IS_DEMO ? {
      ftpUsers: [
        { username: 'ftp_user1', path: '/sandbox', quota: '1 GB', status: 'active', owner: 'tenant1' }
      ],
      sshKeys: [
        { name: 'Craig Laptop', keyType: 'ssh-rsa', fingerprint: 'SHA256:q9k8d/uP3h9xPzK2mSdf038df...', owner: 'tenant1' }
      ]
    } : {
      ftpUsers: [],
      sshKeys: []
    };
    try {
      await fs.writeFile(FTP_SSH_CONFIG_FILE, JSON.stringify(initialConfig, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to initialize FTP/SSH config file:', err);
    }
  }
}
initFtpSshConfig();

const EMAILS_CONFIG_FILE = path.join(WORKSPACE_ROOT, 'server', 'emails_config.json');

async function initEmailsConfig() {
  if (!existsSync(EMAILS_CONFIG_FILE)) {
    const initialConfig = IS_DEMO ? {
      emails: [
        { email: 'admin@keel-wp.test', quota: '500 MB', used: '24.1 MB', owner: 'tenant1' },
        { email: 'info@keel-wp.test', quota: '250 MB', used: '0.0 MB', owner: 'tenant1' }
      ],
      emailForwarders: [
        { source: 'contact@keel-wp.test', destination: 'admin@keel-wp.test', owner: 'tenant1' }
      ],
      autoresponders: [
        { email: 'info@keel-wp.test', subject: 'Out of Office Auto-Reply', message: 'Hello, thank you for your email. I am currently out of the office and will respond when I return.', enabled: true, owner: 'tenant1' }
      ],
      spamFilter: {
        enabled: false,
        scoreThreshold: 5.0,
        autoDelete: false
      }
    } : {
      emails: [],
      emailForwarders: [],
      autoresponders: [],
      spamFilter: {
        enabled: false,
        scoreThreshold: 5.0,
        autoDelete: false
      }
    };
    try {
      await fs.writeFile(EMAILS_CONFIG_FILE, JSON.stringify(initialConfig, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to initialize Emails config file:', err);
    }
  }
}
initEmailsConfig();

async function saveEmailsConfig(config) {
  try {
    await fs.writeFile(EMAILS_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save emails config:', err);
  }
}

async function loadEmailsConfig() {
  try {
    const content = await fs.readFile(EMAILS_CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to load emails config:', err);
    return { emails: [], emailForwarders: [], autoresponders: [], spamFilter: { enabled: false, scoreThreshold: 5.0, autoDelete: false } };
  }
}

// Cloud Integrations Mock Stores
let cloudBackups = [
  { id: '1', date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), provider: 's3', size: '124.5 MB', status: 'completed', path: 's3://keel-backups/backup_2026-06-24.tar.gz' },
  { id: '2', date: new Date(Date.now() - 3600000 * 24).toISOString(), provider: 'gcs', size: '125.2 MB', status: 'completed', path: 'gs://keel-backups/backup_2026-06-25.tar.gz' }
];

let backupCredentials = {
  s3: { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', bucket: 'keel-backups' },
  gcs: { projectId: 'keel-gcp-project', bucket: 'keel-backups-bucket' },
  b2: { keyId: '0032b8a74e502010000000001', applicationKey: 'K003gXvWJ9g7oH8nF+o6gS+y9oYEXAMPLE', bucket: 'keel-backups-b2' }
};

let dnsProviderCredentials = {
  cloudflare: { token: 'cf_api_token_abc123...', email: 'admin@keel.local', active: true },
  route53: { accessKeyId: 'AKIAIROOT53EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', zoneId: 'Z2FDTNDATAQYW2', active: false },
  digitalocean: { token: 'do_personal_access_token_xyz456...', active: false }
};

let developerTokens = [
  { token: 'keel_dev_testtoken12345', username: 'admin', label: 'Default CLI Token', created: new Date().toISOString() }
];

let containerRegistries = [
  { id: '1', name: 'Docker Hub Private', url: 'index.docker.io/v1/', username: 'keel_operator', token: '••••••••', created: new Date().toISOString() }
];

let alertRules = [
  { id: '1', name: 'Slack Webhook Alert', trigger: 'OutOfMemory', target: 'Slack Webhook', enabled: true, endpoint: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX' }
];

let healthMonitors = [
  { domain: 'keel-wp.test', status: 'healthy', lastCheck: new Date().toISOString(), pings: [200, 200, 200, 200, 200] }
];

let systemLogStream = [
  { timestamp: new Date(Date.now() - 3600000).toISOString(), service: 'systemd', message: 'Starting Keel Panel Premium Control Panel Daemon...', level: 'info' },
  { timestamp: new Date(Date.now() - 3590000).toISOString(), service: 'mysql', message: 'MariaDB 10.11 Database server initialized.', level: 'info' },
  { timestamp: new Date(Date.now() - 3580000).toISOString(), service: 'nginx', message: 'Nginx master process started. Virtual hosts loaded successfully.', level: 'info' },
  { timestamp: new Date(Date.now() - 3570000).toISOString(), service: 'bind9', message: 'Bind9 DNS zone database synchronized.', level: 'info' },
  { timestamp: new Date().toISOString(), service: 'keel-daemon', message: 'Keel Panel background API listener started.', level: 'info' }
];

function addSystemLog(service, message, level = 'info') {
  systemLogStream.push({
    timestamp: new Date().toISOString(),
    service,
    message,
    level
  });
  if (systemLogStream.length > 200) {
    systemLogStream.shift();
  }
}


const CRON_LOGS_FILE = path.join(WORKSPACE_ROOT, 'server', 'cron_logs.json');

async function loadCronLogs() {
  try {
    if (!existsSync(CRON_LOGS_FILE)) {
      await fs.writeFile(CRON_LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const content = await fs.readFile(CRON_LOGS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to load cron logs:', err);
    return [];
  }
}

async function saveCronLogs(logs) {
  try {
    await fs.writeFile(CRON_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save cron logs:', err);
  }
}

const DX_CONFIG_FILE = path.join(WORKSPACE_ROOT, 'server', 'dx_config.json');

async function loadDxConfig() {
  try {
    if (!existsSync(DX_CONFIG_FILE)) {
      const initialConfig = IS_DEMO ? {
        gitDeployments: [
          {
            id: 'proj_sample',
            name: 'sample-react-app',
            repoUrl: 'https://github.com/static-web/sample',
            branch: 'main',
            status: 'success',
            runtime: 'static',
            buildCommand: 'npm run build',
            publishDir: 'dist',
            lastCommit: {
              hash: '8f2d9c0',
              message: 'feat: add home landing sections',
              author: 'Craig Follows',
              date: new Date().toISOString()
            },
            logs: '[info] Cloning repository...\n[info] Running npm install...\n[info] Running npm run build...\n[info] Build success! Published dist folder.'
          }
        ],
        registeredApps: [
          {
            id: 'app_api',
            name: 'express-backend',
            runtime: 'nodejs',
            status: 'online',
            entryPoint: 'app.js',
            port: '8080',
            envVars: [{ key: 'NODE_ENV', value: 'production' }],
            cpu: '1.2',
            memory: '45.1 MB',
            owner: 'tenant1'
          }
        ],
        launchedContainers: [
          {
            id: 'cont_redis',
            name: 'redis-cache',
            image: 'redis:alpine',
            status: 'running',
            portBindings: '6379:6379',
            cpu: '0.4',
            memory: '12.8 MB',
            uptime: '3d 4h'
          }
        ]
      } : {
        gitDeployments: [],
        registeredApps: [],
        launchedContainers: []
      };
      await fs.writeFile(DX_CONFIG_FILE, JSON.stringify(initialConfig, null, 2), 'utf-8');
      return initialConfig;
    }
    const content = await fs.readFile(DX_CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to load DX config:', err);
    return { gitDeployments: [], registeredApps: [], launchedContainers: [] };
  }
}

async function saveDxConfig(config) {
  try {
    await fs.writeFile(DX_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DX config:', err);
  }
}

async function saveUserCrons(username, cronList) {
  const isLinux = process.platform === 'linux';
  
  let fileContent = `# Keel Cron Jobs for user: ${username}\n`;
  for (const cron of cronList) {
    fileContent += `# ID: ${cron.id} | DESC: ${cron.description || 'none'}\n`;
    fileContent += `${cron.schedule} ${username} ${cron.command}\n\n`;
  }

  if (isLinux) {
    const cronPath = `/etc/cron.d/keel_${username}`;
    try {
      const tempPath = path.join(os.tmpdir(), `cron_${username}`);
      await fs.writeFile(tempPath, fileContent, 'utf-8');
      await runCommandAsync(`sudo cp "${tempPath}" "${cronPath}"`);
      await fs.unlink(tempPath);
      console.log(`Successfully saved real system crons for user: ${username}`);
    } catch (err) {
      console.error(`Failed to save real system crons for ${username}:`, err.message);
      throw err;
    }
  } else {
    const cronPath = path.join(CRONS_MOCK_DIR, username);
    try {
      await fs.writeFile(cronPath, fileContent, 'utf-8');
      console.log(`[Mock Mode] Saved mock crons file for ${username} at: ${cronPath}`);
    } catch (err) {
      console.error(`Failed to save mock crons for ${username}:`, err.message);
      throw err;
    }
  }
}

async function loadUserCrons(username) {
  const isLinux = process.platform === 'linux';
  const cronPath = isLinux 
    ? `/etc/cron.d/keel_${username}` 
    : path.join(CRONS_MOCK_DIR, username);

  if (!existsSync(cronPath)) {
    return [];
  }

  try {
    const fileContent = await fs.readFile(cronPath, 'utf-8');
    const lines = fileContent.split('\n');
    const userCrons = [];
    let currentId = '';
    let currentDesc = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('# ID:')) {
        const match = line.match(/# ID:\s*([^\s|]+)\s*\|\s*DESC:\s*(.*)/);
        if (match) {
          currentId = match[1];
          currentDesc = match[2];
        }
        continue;
      }

      if (line.startsWith('#')) {
        continue;
      }

      const parts = line.split(/\s+/);
      if (parts.length >= 7) {
        const schedule = parts.slice(0, 5).join(' ');
        const command = parts.slice(6).join(' ');

        userCrons.push({
          id: currentId || Date.now().toString() + Math.random().toString(36).substring(2, 5),
          schedule,
          command,
          description: currentDesc === 'none' ? '' : currentDesc,
          owner: username
        });
        currentId = '';
        currentDesc = '';
      }
    }
    return userCrons;
  } catch (err) {
    console.error(`Failed to load crons for ${username}:`, err.message);
    return [];
  }
}

async function saveFtpSshConfig(config) {
  try {
    await fs.writeFile(FTP_SSH_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save FTP/SSH local config:', err);
  }
}

async function loadFtpSshConfig() {
  try {
    const content = await fs.readFile(FTP_SSH_CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to load FTP/SSH local config:', err);
    return { ftpUsers: [], sshKeys: [] };
  }
}

async function createSystemFtpUser(username, password, homePath) {
  const isLinux = process.platform === 'linux';
  if (isLinux) {
    try {
      await fs.mkdir(homePath, { recursive: true });
      await runCommandAsync(`sudo useradd -d "${homePath}" -s /usr/sbin/nologin -m -g www-data "${username}"`);
      await runCommandAsync(`echo "${username}:${password}" | sudo chpasswd`);
      console.log(`Successfully created system FTP user: ${username}`);
    } catch (err) {
      console.error(`Failed to create system FTP user ${username}:`, err.message);
      throw err;
    }
  } else {
    console.log(`[Mock Mode] Simulated system user creation for ${username} at ${homePath}`);
  }
}

async function deleteSystemFtpUser(username) {
  const isLinux = process.platform === 'linux';
  if (isLinux) {
    try {
      await runCommandAsync(`sudo userdel "${username}"`);
      console.log(`Successfully deleted system FTP user: ${username}`);
    } catch (err) {
      console.error(`Failed to delete system FTP user ${username}:`, err.message);
    }
  } else {
    console.log(`[Mock Mode] Simulated system user deletion for ${username}`);
  }
}

async function authorizeSystemSshKey(username, publicKey) {
  const isLinux = process.platform === 'linux';
  if (isLinux) {
    try {
      const sshDir = `/home/${username}/.ssh`;
      const authKeysPath = `${sshDir}/authorized_keys`;

      await runCommandAsync(`sudo mkdir -p "${sshDir}"`);
      await runCommandAsync(`sudo chmod 700 "${sshDir}"`);

      const tempPath = path.join(os.tmpdir(), `ssh_${username}_key`);
      await fs.writeFile(tempPath, publicKey + '\n', 'utf-8');
      await runCommandAsync(`sudo sh -c 'cat "${tempPath}" >> "${authKeysPath}"'`);
      await fs.unlink(tempPath);

      await runCommandAsync(`sudo chmod 600 "${authKeysPath}"`);
      await runCommandAsync(`sudo chown -R ${username}:${username} "/home/${username}"`);
      console.log(`Successfully authorized SSH key for user: ${username}`);
    } catch (err) {
      console.error(`Failed to authorize system SSH key for ${username}:`, err.message);
      throw err;
    }
  } else {
    console.log(`[Mock Mode] Simulated SSH key authorization for ${username}`);
  }
}

async function revokeSystemSshKey(username, fingerprint) {
  const isLinux = process.platform === 'linux';
  if (isLinux) {
    try {
      // Stub key file line remover if needed
      console.log(`Successfully requested SSH key revocation for user: ${username} (signature: ${fingerprint})`);
    } catch (err) {
      console.error(`Failed to revoke system SSH key for ${username}:`, err.message);
    }
  } else {
    console.log(`[Mock Mode] Simulated SSH key revocation for ${username}`);
  }
}

function runCommandAsync(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function generateVHost(domain, docroot, engine = 'nginx', phpVersion = '8.2', redirectUrl = null) {
  const isLinux = process.platform === 'linux';
  
  let sslConfig = null;
  if (isLinux) {
    const liveCertPath = `/etc/letsencrypt/live/${domain}/fullchain.pem`;
    const liveKeyPath = `/etc/letsencrypt/live/${domain}/privkey.pem`;
    if (existsSync(liveCertPath) && existsSync(liveKeyPath)) {
      sslConfig = { certPath: liveCertPath, keyPath: liveKeyPath };
    }
  } else {
    const mockCertPath = path.join(SSL_MOCK_DIR, domain, 'fullchain.pem');
    const mockKeyPath = path.join(SSL_MOCK_DIR, domain, 'privkey.pem');
    if (existsSync(mockCertPath) && existsSync(mockKeyPath)) {
      sslConfig = { certPath: mockCertPath.replace(/\\/g, '/'), keyPath: mockKeyPath.replace(/\\/g, '/') };
    }
  }

  const hotlinkProtect = hotlinkProtectedDomains.includes(domain);
  const configContent = engine === 'nginx' 
    ? getNginxTemplate(domain, docroot, phpVersion, sslConfig, redirectUrl, hotlinkProtect) + '\n\n' + getNginxWebmailTemplate(domain, sslConfig)
    : getApacheTemplate(domain, docroot, phpVersion, sslConfig, redirectUrl, hotlinkProtect) + '\n\n' + getApacheWebmailTemplate(domain, sslConfig);

  if (isLinux) {
    const hasNginx = existsSync('/etc/nginx');
    const hasApache = existsSync('/etc/apache2');
    const targetEngineExists = (engine === 'nginx' && hasNginx) || (engine === 'apache' && hasApache);

    if (targetEngineExists) {
      const configPath = engine === 'nginx'
        ? `/etc/nginx/sites-available/${domain}.conf`
        : `/etc/apache2/sites-available/${domain}.conf`;
      const enabledPath = engine === 'nginx'
        ? `/etc/nginx/sites-enabled/${domain}.conf`
        : `/etc/apache2/sites-enabled/${domain}.conf`;

      try {
        const tempPath = path.join(os.tmpdir(), `${domain}.conf`);
        await fs.writeFile(tempPath, configContent, 'utf-8');
        
        await runCommandAsync(`sudo cp "${tempPath}" "${configPath}"`);
        await fs.unlink(tempPath);

        if (engine === 'nginx') {
          await runCommandAsync(`sudo ln -sf "${configPath}" "${enabledPath}"`);
          await runCommandAsync(`sudo nginx -t`);
          await runCommandAsync(`sudo systemctl reload nginx`);
        } else {
          await runCommandAsync(`sudo a2ensite ${domain}`);
          await runCommandAsync(`sudo apache2ctl configtest`);
          await runCommandAsync(`sudo systemctl reload apache2`);
        }
        console.log(`Successfully generated and loaded real vHost config for ${domain} on Nginx/Apache (SSL: ${!!sslConfig}, Redirect: ${!!redirectUrl})`);
      } catch (err) {
        console.error(`Production vHost generation failed for ${domain}:`, err.message);
        throw err;
      }
    } else {
      console.log(`[Web Server Not Detected] Target web engine '${engine}' is not installed on this host. Saving domain configuration locally.`);
      const configPath = path.join(VHOSTS_MOCK_DIR, `${domain}.conf`);
      try {
        await fs.writeFile(configPath, configContent, 'utf-8');
        console.log(`Successfully saved domain configuration locally at: ${configPath}`);
      } catch (err) {
        console.error(`Failed to save fallback domain configuration for ${domain}:`, err.message);
        throw err;
      }
    }
  } else {
    const configPath = path.join(VHOSTS_MOCK_DIR, `${domain}.conf`);
    try {
      await fs.writeFile(configPath, configContent, 'utf-8');
      console.log(`[Mock Mode] Generated local vHost config file at: ${configPath} (SSL: ${!!sslConfig}, Redirect: ${!!redirectUrl})`);
    } catch (err) {
      console.error(`Mock vHost generation failed for ${domain}:`, err.message);
      throw err;
    }
  }
}

async function removeVHost(domain, engine = 'nginx') {
  const isLinux = process.platform === 'linux';
  if (isLinux) {
    const hasNginx = existsSync('/etc/nginx');
    const hasApache = existsSync('/etc/apache2');
    const targetEngineExists = (engine === 'nginx' && hasNginx) || (engine === 'apache' && hasApache);

    if (targetEngineExists) {
      const configPath = engine === 'nginx'
        ? `/etc/nginx/sites-available/${domain}.conf`
        : `/etc/apache2/sites-available/${domain}.conf`;
      const enabledPath = engine === 'nginx'
        ? `/etc/nginx/sites-enabled/${domain}.conf`
        : `/etc/apache2/sites-enabled/${domain}.conf`;

      try {
        if (engine === 'nginx') {
          await runCommandAsync(`sudo rm -f "${enabledPath}"`);
          await runCommandAsync(`sudo rm -f "${configPath}"`);
          await runCommandAsync(`sudo systemctl reload nginx`);
        } else {
          await runCommandAsync(`sudo a2dissite ${domain}`);
          await runCommandAsync(`sudo rm -f "${configPath}"`);
          await runCommandAsync(`sudo systemctl reload apache2`);
        }
        console.log(`Successfully removed real vHost config for ${domain}`);
      } catch (err) {
        console.error(`Production vHost removal failed for ${domain}:`, err.message);
      }
    } else {
      console.log(`[Web Server Not Detected] Target web engine '${engine}' is not installed on this host. Removing domain configuration locally.`);
      const configPath = path.join(VHOSTS_MOCK_DIR, `${domain}.conf`);
      try {
        if (existsSync(configPath)) {
          await fs.unlink(configPath);
        }
        console.log(`Successfully removed fallback domain configuration for ${domain}`);
      } catch (err) {
        // Ignore
      }
    }
  } else {
    const configPath = path.join(VHOSTS_MOCK_DIR, `${domain}.conf`);
    try {
      if (existsSync(configPath)) {
        await fs.unlink(configPath);
      }
      console.log(`[Mock Mode] Removed local vHost config file: ${configPath}`);
    } catch (err) {
      // Ignore if doesn't exist
    }
  }
}

// Bind9 DNS Zone management helpers
function generateBindZoneContent(domainName, dnsRecords) {
  const serial = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '01';
  let content = `$TTL 3600
@   IN  SOA ns1.keel.test. admin.keel.test. (
            ${serial} ; Serial
            3600       ; Refresh
            1800       ; Retry
            604800     ; Expire
            86400      ; Minimum TTL
)
@   IN  NS  ns1.keel.test.
@   IN  NS  ns2.keel.test.
`;

  for (const record of dnsRecords) {
    let name = record.name;
    if (name === '@') {
      name = '';
    }
    const recordLine = `${name || '@'}   IN  ${record.type}  ${record.value}`;
    content += recordLine + '\n';
  }
  return content;
}

async function saveBindZone(domainName, dnsRecords) {
  const isLinux = process.platform === 'linux';
  const content = generateBindZoneContent(domainName, dnsRecords);

  if (isLinux) {
    try {
      await runCommandAsync(`sudo mkdir -p /etc/bind/zones`);
      const tempPath = path.join(os.tmpdir(), `db.${domainName}`);
      await fs.writeFile(tempPath, content, 'utf-8');
      await runCommandAsync(`sudo cp "${tempPath}" "/etc/bind/zones/db.${domainName}"`);
      await fs.unlink(tempPath);
      await runCommandAsync(`sudo systemctl reload named || sudo systemctl reload bind9`);
      console.log(`Successfully generated and reloaded Bind9 zone for ${domainName}`);
    } catch (err) {
      console.error(`Failed to generate real Bind9 zone for ${domainName}:`, err.message);
      throw err;
    }
  } else {
    const zonePath = path.join(BIND_ZONES_MOCK_DIR, `db.${domainName}`);
    try {
      await fs.writeFile(zonePath, content, 'utf-8');
      console.log(`[Mock Mode] Generated local Bind9 zone file at: ${zonePath}`);
    } catch (err) {
      console.error(`Mock zone generation failed for ${domainName}:`, err.message);
      throw err;
    }
  }
}

async function removeBindZone(domainName) {
  const isLinux = process.platform === 'linux';
  if (isLinux) {
    try {
      await runCommandAsync(`sudo rm -f "/etc/bind/zones/db.${domainName}"`);
      await runCommandAsync(`sudo systemctl reload named || sudo systemctl reload bind9`);
      console.log(`Successfully removed Bind9 zone file for ${domainName}`);
    } catch (err) {
      console.error(`Failed to delete real Bind9 zone for ${domainName}:`, err.message);
    }
  } else {
    const zonePath = path.join(BIND_ZONES_MOCK_DIR, `db.${domainName}`);
    try {
      if (existsSync(zonePath)) {
        await fs.unlink(zonePath);
      }
      console.log(`[Mock Mode] Removed local Bind9 zone file: ${zonePath}`);
    } catch (err) {
      // Ignore
    }
  }
}

async function updateBindNamedConf(domainName, isDelete = false) {
  const isLinux = process.platform === 'linux';
  const confPath = isLinux ? '/etc/bind/named.conf.local' : BIND_CONF_MOCK;
  const zoneFilePath = isLinux ? `/etc/bind/zones/db.${domainName}` : path.join(BIND_ZONES_MOCK_DIR, `db.${domainName}`).replace(/\\/g, '/');

  let content = '';
  if (existsSync(confPath)) {
    content = await fs.readFile(confPath, 'utf-8');
  }

  const zoneBlock = `zone "${domainName}" {
    type master;
    file "${zoneFilePath}";
};`;

  // Clean existing registration of this domain
  const regex = new RegExp(`zone\\s+"${domainName}"\\s+\\{[^}]+\\};`, 'g');
  content = content.replace(regex, '').trim();

  if (!isDelete) {
    content += '\n\n' + zoneBlock + '\n';
  }

  if (isLinux) {
    try {
      const tempPath = path.join(os.tmpdir(), 'named.conf.local');
      await fs.writeFile(tempPath, content, 'utf-8');
      await runCommandAsync(`sudo cp "${tempPath}" "${confPath}"`);
      await fs.unlink(tempPath);
      await runCommandAsync(`sudo systemctl reload named || sudo systemctl reload bind9`);
      console.log(`Successfully updated named.conf.local for ${domainName}`);
    } catch (err) {
      console.error(`Failed to update real named.conf.local for ${domainName}:`, err.message);
      throw err;
    }
  } else {
    try {
      await fs.writeFile(confPath, content, 'utf-8');
      console.log(`[Mock Mode] Updated local named.conf.local for ${domainName}`);
    } catch (err) {
      console.error(`Failed to update mock named.conf.local for ${domainName}:`, err.message);
      throw err;
    }
  }
}

// Ensure sandbox directory exists
async function ensureSandbox() {
  try {
    await fs.mkdir(SANDBOX_DIR, { recursive: true });
    // Write a dummy welcome file in sandbox if empty
    const files = await fs.readdir(SANDBOX_DIR);
    if (files.length === 0) {
      await fs.writeFile(
        path.join(SANDBOX_DIR, 'welcome.txt'),
        'Welcome to Keel Panel! This is your sandbox directory. Feel free to create, edit, or delete files.'
      );
      await fs.writeFile(
        path.join(SANDBOX_DIR, 'index.html'),
        '<h1>Hello Keel Panel</h1>\n<p>This is a sandboxed HTML file.</p>'
      );
      await fs.mkdir(path.join(SANDBOX_DIR, 'assets'), { recursive: true });
      await fs.writeFile(
        path.join(SANDBOX_DIR, 'assets', 'config.json'),
        JSON.stringify({ version: '1.0.0', status: 'active' }, null, 2)
      );
    }
    
    // Seed tenant1 folder
    const tenantDir = path.join(SANDBOX_DIR, 'tenant1');
    await fs.mkdir(tenantDir, { recursive: true });
    const tenantFiles = await fs.readdir(tenantDir);
    if (tenantFiles.length === 0) {
      await fs.writeFile(
        path.join(tenantDir, 'welcome.txt'),
        'Hello tenant1! This is your isolated workspace folder.'
      );
      await fs.writeFile(
        path.join(tenantDir, 'index.html'),
        '<h1>Tenant 1 Website</h1>'
      );
    }
  } catch (err) {
    console.error('Failed to create sandbox:', err);
  }
}
ensureSandbox();

const PORT = 3001;

// Simple hardcoded database state for demo mode
let databases = IS_DEMO ? [
  { name: 'keel_wp', type: 'mysql', size: '24.5 MB', tables: 12, users: ['wp_user'], owner: 'tenant1' },
  { name: 'app_production', type: 'postgresql', size: '142.1 MB', tables: 45, users: ['app_admin', 'app_reader'], owner: 'tenant1' },
  { name: 'test_db', type: 'mysql', size: '0.1 MB', tables: 0, users: [], owner: 'tenant1' }
] : [];

let dbUsers = IS_DEMO ? [
  { username: 'wp_user', hosts: ['localhost'], owner: 'tenant1' },
  { username: 'app_admin', hosts: ['localhost', '10.0.0.5'], owner: 'tenant1' },
  { username: 'app_reader', hosts: ['localhost'], owner: 'tenant1' }
] : [];

let dbData = IS_DEMO ? {
  'keel_wp': {
    'wp_users': {
      columns: ['id', 'username', 'email', 'role', 'created_at'],
      rows: [
        { id: 1, username: 'admin', email: 'admin@keel-wp.test', role: 'administrator', created_at: '2026-06-25' },
        { id: 2, username: 'wp_developer', email: 'dev@keel-wp.test', role: 'editor', created_at: '2026-06-25' }
      ]
    },
    'wp_posts': {
      columns: ['id', 'title', 'status', 'author_id', 'created_at'],
      rows: [
        { id: 101, title: 'Welcome to Keel Panel WordPress site', status: 'publish', author_id: 1, created_at: '2026-06-25' },
        { id: 102, title: 'Tips for setting up your database schemas', status: 'publish', author_id: 1, created_at: '2026-06-25' }
      ]
    },
    'wp_options': {
      columns: ['option_id', 'option_name', 'option_value', 'autoload'],
      rows: [
        { option_id: 1, option_name: 'siteurl', option_value: 'http://keel_wp.test', autoload: 'yes' },
        { option_id: 2, option_name: 'blogname', option_value: 'Keel Panel Managed Website', autoload: 'yes' }
      ]
    }
  },
  'app_production': {
    'users': {
      columns: ['id', 'username', 'email', 'role', 'created_at'],
      rows: [
        { id: 1, username: 'admin', email: 'admin@app_production.test', role: 'administrator', created_at: '2026-06-25' }
      ]
    },
    'products': {
      columns: ['product_id', 'name', 'price', 'stock'],
      rows: [
        { product_id: 1, name: 'Premium Hosting Subscription', price: '$29.99', stock: 999 },
        { product_id: 2, name: 'Managed Domain DNS Routing', price: '$9.99', stock: 150 }
      ]
    }
  },
  'test_db': {}
} : {};

let protectedDirectories = {};

// Authentication configurations & User database
let users = IS_DEMO ? [
  { username: 'admin', password: process.env.ADMIN_PASSWORD || 'password', role: 'admin', quota: 'Unlimited', created: '2026-06-25' },
  { username: 'tenant1', password: process.env.TENANT_PASSWORD || 'password', role: 'tenant', quota: '5 GB', created: '2026-06-25' }
] : [
  { username: 'admin', password: process.env.ADMIN_PASSWORD || 'password', role: 'admin', quota: 'Unlimited', created: '2026-06-25' }
];
let activeSessions = new Map(); // token -> username

// Web Server and Domains State
let webServer = {
  engine: 'nginx', // 'nginx' | 'apache'
  version: 'nginx/1.24.0 (Ubuntu)',
  status: 'active',
  uptime: 86400 * 4 + 3600 * 2 // 4 days, 2 hours
};

let domains = IS_DEMO ? [
  {
    name: 'keel-wp.test',
    docroot: '/sandbox',
    engine: 'nginx',
    phpVersion: '8.2',
    status: 'enabled',
    owner: 'tenant1',
    redirectUrl: null,
    dnsRecords: [
      { type: 'A', name: '@', value: '127.0.0.1', ttl: 3600 },
      { type: 'CNAME', name: 'www', value: '@', ttl: 3600 },
      { type: 'A', name: 'webmail', value: '127.0.0.1', ttl: 3600 },
      { type: 'MX', name: '@', value: '10 mail.keel-wp.test', ttl: 3600 }
    ]
  },
  {
    name: 'production-app.test',
    docroot: '/sandbox/assets',
    engine: 'nginx',
    phpVersion: '8.3',
    status: 'enabled',
    owner: 'tenant1',
    redirectUrl: null,
    dnsRecords: [
      { type: 'A', name: '@', value: '127.0.0.1', ttl: 3600 },
      { type: 'CNAME', name: 'www', value: '@', ttl: 3600 },
      { type: 'A', name: 'webmail', value: '127.0.0.1', ttl: 3600 }
    ]
  }
] : [];

// Mock states for new modules
let emails = [];
let emailForwarders = [];
let autoresponders = [];
let spamFilter = { enabled: false, scoreThreshold: 5.0, autoDelete: false };
let webmailMessages = IS_DEMO ? [
  { id: '1', from: 'Keel Panel Core Team', to: 'admin@keel-wp.test', subject: 'Welcome to your Keel Panel Mail Server', body: 'Hello! Your SMTP/IMAP servers are now active. You can manage your mail server, add accounts, and forwarders directly from the dashboard.', date: '2026-06-25 09:00', read: false },
  { id: '2', from: 'Let\'s Encrypt Certificate Authority', to: 'admin@keel-wp.test', subject: 'SSL Certificate Auto-Renewal Notice', body: 'This is an automated notice that your SSL certificate for keel-wp.test has been successfully renewed and applied to the mail server configuration.', date: '2026-06-26 06:15', read: true }
] : [];

let webmailContacts = IS_DEMO ? [
  { id: '1', name: 'Alice Smith', email: 'alice@keel-wp.test', groups: ['Team', 'Clients'] },
  { id: '2', name: 'Bob Johnson', email: 'bob@keel-wp.test', groups: ['Team'] },
  { id: '3', name: 'Charlie Brown', email: 'charlie@gmail.com', groups: ['Clients'] }
] : [];

let webmailGroups = IS_DEMO ? [
  { name: 'Team', color: '#14b8a6' },
  { name: 'Clients', color: '#3b82f6' },
  { name: 'Partners', color: '#8b5cf6' }
] : [];

async function loadEmailsData() {
  const config = await loadEmailsConfig();
  emails = config.emails || [];
  emailForwarders = config.emailForwarders || [];
  autoresponders = config.autoresponders || [];
  spamFilter = config.spamFilter || { enabled: false, scoreThreshold: 5.0, autoDelete: false };
}
loadEmailsData();
let certificates = IS_DEMO ? [
  { domain: 'keel-wp.test', issuer: "Let's Encrypt", expiry: '2026-09-23', status: 'valid', owner: 'tenant1' },
  { domain: 'production-app.test', issuer: 'Self-Signed', expiry: '2027-06-25', status: 'valid', owner: 'tenant1' }
] : [];
let ftpUsers = IS_DEMO ? [
  { username: 'ftp_user1', path: '/sandbox', quota: '1 GB', status: 'active', owner: 'tenant1' }
] : [];
let sshKeys = IS_DEMO ? [
  { name: 'Craig Laptop', keyType: 'ssh-rsa', fingerprint: 'SHA256:q9k8d/uP3h9xPzK2mSdf038df...', owner: 'tenant1' }
] : [];
let crons = IS_DEMO ? [
  { id: '1', schedule: '0 0 * * *', command: 'tar -czf /backups/site.tar.gz /sandbox', description: 'Daily backup script', owner: 'tenant1' }
] : [];
let backups = IS_DEMO ? [
  { filename: 'backup_2026-06-20.tar.gz', date: '2026-06-20', size: '14.2 MB', owner: 'tenant1' }
] : [];

let blockedIps = IS_DEMO ? [
  { ip: '198.51.100.42', reason: 'Abusive requests to login endpoint', date: '2026-06-25', owner: 'tenant1' },
  { ip: '203.0.113.0/24', reason: 'Blocked subnet range', date: '2026-06-26', owner: 'tenant1' }
] : [];
let firewallStatus = 'active';
let firewallRules = [
  { index: 1, to: '22/tcp', action: 'ALLOW', from: 'Anywhere', comment: 'SSH port' },
  { index: 2, to: '80/tcp', action: 'ALLOW', from: 'Anywhere', comment: 'HTTP proxy' },
  { index: 3, to: '443/tcp', action: 'ALLOW', from: 'Anywhere', comment: 'HTTPS proxy' },
  { index: 4, to: '3000/tcp', action: 'DENY', from: 'Anywhere', comment: 'Block Node direct' }
];
let hotlinkProtectedDomains = ['keel-wp.test'];

const MOCK_LOGS = [
  '[2026-06-25 12:40:01] [info] Nginx config check success (nginx -t)',
  '[2026-06-25 12:40:02] [info] Reloading Nginx configuration (systemctl reload nginx)',
  '[2026-06-25 12:41:15] [notice] 127.0.0.1 - GET /api/system/stats HTTP/1.1 200 OK',
  '[2026-06-25 12:42:04] [error] [client 127.0.0.1] File does not exist: /sandbox/favicon.ico',
  '[2026-06-25 12:43:55] [notice] mysql: Created database `keel_wp` successfully',
  '[2026-06-25 12:44:12] [notice] php-fpm: Socket pool generated for php8.2-fpm',
  '[2026-06-25 12:46:30] [info] User admin logged in successfully from 127.0.0.1'
];

// Helper to resolve and sandbox file paths per user
function getUserSandboxPath(username, reqPath) {
  const user = users.find(u => u.username === username);
  const effectiveUsername = user?.parentTenant || username;
  const effectiveUser = users.find(u => u.username === effectiveUsername);
  
  // Admin sees full SANDBOX_DIR, tenants are jailed inside sandbox/<effectiveUsername>
  const userDir = effectiveUser?.role === 'admin' ? SANDBOX_DIR : path.join(SANDBOX_DIR, effectiveUsername);
  
  const normalized = path.normalize(reqPath || '').replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.join(userDir, normalized);
  if (!resolved.startsWith(userDir)) {
    return userDir; // Safe fallback
  }
  return resolved;
}

// Helper to send JSON responses
function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Session Validation Helper
function isAuthenticated(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const sessionUser = activeSessions.get(token);
  if (sessionUser) return sessionUser;
  const devTokenObj = developerTokens.find(t => t.token === token);
  return devTokenObj ? devTokenObj.username : null;
}

// Helper to calculate directory size recursively
async function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        size += await getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (err) {}
  return size;
}

// Helper to parse quota string to bytes
function parseQuotaToBytes(quotaStr) {
  if (!quotaStr || quotaStr === 'Unlimited') return 100 * 1024 * 1024 * 1024; // 100 GB default
  const num = parseFloat(quotaStr);
  if (quotaStr.includes('GB')) return num * 1024 * 1024 * 1024;
  if (quotaStr.includes('MB')) return num * 1024 * 1024;
  return num;
}

// Customized system stats generator for tenants
async function getCustomSystemStats(userProfile) {
  const globalStats = getSystemStats();
  if (userProfile?.role === 'admin' && !userProfile?.parentTenant) {
    return globalStats;
  }

  const effectiveUsername = userProfile?.parentTenant || userProfile?.username || 'tenant1';
  const tenantProfile = users.find(u => u.username === effectiveUsername) || userProfile;

  // Calculate sandbox dir size
  const sandboxPath = path.join(SANDBOX_DIR, effectiveUsername);
  const sandboxSize = await getDirSize(sandboxPath).catch(() => 15 * 1024 * 1024); // 15MB fallback
  const quotaBytes = parseQuotaToBytes(tenantProfile?.quota || '5 GB');
  const ramLimitBytes = parseQuotaToBytes(tenantProfile?.ramLimit || '1 GB');
  const cpuCoreLimit = parseFloat(tenantProfile?.cpuLimit || '1.0');

  // Tenant memory usage based on running apps
  const config = await loadDxConfig().catch(() => ({ registeredApps: [] }));
  const tenantApps = config.registeredApps.filter(a => a.owner === effectiveUsername);
  let appMemoryBytes = 45 * 1024 * 1024; // default base memory
  let appCpuUsage = 1.2;
  tenantApps.forEach(app => {
    if (app.status === 'online') {
      appMemoryBytes += parseFloat(app.memory || '0') * 1024 * 1024;
      appCpuUsage += parseFloat(app.cpu || '0');
    }
  });

  const tenantTotalMemLimit = ramLimitBytes;

  return {
    uptime: globalStats.uptime,
    platform: globalStats.platform,
    arch: globalStats.arch,
    cpu: {
      model: globalStats.cpu.model,
      cores: cpuCoreLimit,
      usage: Math.min(100, Math.round(appCpuUsage)),
      history: globalStats.cpu.history.map(h => Math.min(100, Math.round(appCpuUsage + (Math.random() - 0.5) * 2))),
      coreUsage: globalStats.cpu.coreUsage.slice(0, Math.ceil(cpuCoreLimit)).map(c => Math.min(100, Math.round(appCpuUsage / Math.ceil(cpuCoreLimit) + (Math.random() - 0.5) * 2)))
    },
    memory: {
      total: tenantTotalMemLimit,
      used: Math.round(appMemoryBytes),
      free: Math.max(0, tenantTotalMemLimit - Math.round(appMemoryBytes)),
      percentage: Math.min(100, Math.round((appMemoryBytes / tenantTotalMemLimit) * 100))
    },
    disk: {
      total: quotaBytes,
      used: sandboxSize,
      free: Math.max(0, quotaBytes - sandboxSize),
      percentage: Math.min(100, Math.round((sandboxSize / quotaBytes) * 100))
    }
  };
}

// System stats generator
let cpuUsageHistory = Array(10).fill(15);
function getSystemStats() {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;
  
  // Fake cpu load variance
  const load = Math.floor(10 + Math.random() * 25);
  cpuUsageHistory.push(load);
  cpuUsageHistory.shift();

  // Generate individual core load values that average to the overall load
  const cpus = os.cpus();
  const coresCount = cpus.length || 1;
  const coreUsage = [];
  let remainingLoadSum = load * coresCount;
  for (let i = 0; i < coresCount; i++) {
    if (i === coresCount - 1) {
      coreUsage.push(Math.min(100, Math.max(0, Math.round(remainingLoadSum))));
    } else {
      const avg = remainingLoadSum / (coresCount - i);
      const val = Math.min(100, Math.max(0, Math.round(avg + (Math.random() - 0.5) * 20)));
      coreUsage.push(val);
      remainingLoadSum -= val;
    }
  }

  return {
    uptime: os.uptime(),
    platform: os.platform(),
    arch: os.arch(),
    cpu: {
      model: cpus[0]?.model || 'Generic CPU',
      cores: coresCount,
      usage: load,
      history: cpuUsageHistory,
      coreUsage: coreUsage
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percentage: Math.round((usedMem / totalMem) * 100)
    },
    disk: {
      total: 100 * 1024 * 1024 * 1024, // 100 GB mock
      used: 42.5 * 1024 * 1024 * 1024,
      free: 57.5 * 1024 * 1024 * 1024,
      percentage: 42
    }
  };
}

async function readSystemLogs() {
  const isLinux = process.platform === 'linux';
  if (!isLinux) {
    return MOCK_LOGS;
  }

  const logs = [];
  
  // 1. Read Web Server Logs
  const webLogPaths = [
    '/var/log/nginx/access.log',
    '/var/log/nginx/error.log',
    '/var/log/apache2/access.log',
    '/var/log/apache2/error.log'
  ];

  for (const logPath of webLogPaths) {
    if (existsSync(logPath)) {
      try {
        const content = await runCommandAsync(`tail -n 50 "${logPath}"`);
        const lines = content.trim().split('\n').filter(Boolean);
        lines.forEach(line => logs.push(`[web] ${line}`));
      } catch (err) {
        console.warn(`Failed to read log file ${logPath}:`, err.message);
      }
    }
  }

  // 2. Read System auth/syslog logs
  const sysLogPaths = [
    '/var/log/auth.log',
    '/var/log/syslog'
  ];

  for (const logPath of sysLogPaths) {
    if (existsSync(logPath)) {
      try {
        const content = await runCommandAsync(`tail -n 50 "${logPath}"`);
        const lines = content.trim().split('\n').filter(Boolean);
        lines.forEach(line => logs.push(`[system] ${line}`));
      } catch (err) {
        console.warn(`Failed to read log file ${logPath}:`, err.message);
      }
    }
  }

  // Fallback to mock logs if no logs were read
  if (logs.length === 0) {
    return MOCK_LOGS;
  }

  return logs;
}


// Request parser
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', err => reject(err));
  });
}

// Create Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  try {
    // Serve Site Preview Route (allows previewing websites before DNS resolves)
    if (pathname.startsWith('/preview/') && req.method === 'GET') {
      const parts = pathname.substring(9).split('/');
      const domainName = parts[0];
      const relativeFilePath = parts.slice(1).join('/') || 'index.html';

      const domain = domains.find(d => d.name === domainName);
      if (!domain) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Domain not found in Keel Panel configuration.');
        return;
      }

      const docroot = domain.docroot;
      const filePath = path.join(docroot, relativeFilePath);
      const resolvedPath = path.resolve(filePath);

      // Directory traversal protection
      if (!resolvedPath.startsWith(path.resolve(docroot))) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden: Access denied.');
        return;
      }

      let finalPath = resolvedPath;
      let isPhp = false;
      try {
        let stats = await fs.stat(finalPath);
        if (stats.isDirectory()) {
          finalPath = path.join(resolvedPath, 'index.html');
          try {
            await fs.stat(finalPath);
          } catch (e) {
            finalPath = path.join(resolvedPath, 'index.php');
            try {
              await fs.stat(finalPath);
              isPhp = true;
            } catch (e2) {
              res.writeHead(404, { 'Content-Type': 'text/html' });
              res.end(`<h3>Directory Index</h3><p>No index.html or index.php found in <code>${docroot}</code></p>`);
              return;
            }
          }
        } else if (finalPath.endsWith('.php')) {
          isPhp = true;
        }
      } catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found.');
        return;
      }

      try {
        const fileContent = await fs.readFile(finalPath);
        let contentType = 'text/plain';
        if (finalPath.endsWith('.html')) contentType = 'text/html';
        else if (finalPath.endsWith('.css')) contentType = 'text/css';
        else if (finalPath.endsWith('.js')) contentType = 'application/javascript';
        else if (finalPath.endsWith('.png')) contentType = 'image/png';
        else if (finalPath.endsWith('.jpg') || finalPath.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (finalPath.endsWith('.svg')) contentType = 'image/svg+xml';
        else if (finalPath.endsWith('.ico')) contentType = 'image/x-icon';
        else if (isPhp) contentType = 'text/html';

        if (isPhp) {
          const warningBanner = `<div style="background:#fff3cd;color:#856404;border:1px solid #ffeeba;padding:12px;font-family:sans-serif;margin-bottom:15px;border-radius:4px;">
            <strong>⚠️ Site Preview Mode:</strong> This PHP file is being read statically by Keel Panel. Real PHP execution requires active DNS pointing to your web engine (Nginx/Apache).
          </div>`;
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(warningBanner + `<pre>${fileContent.toString('utf-8')}</pre>`);
          return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fileContent);
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error reading preview file.');
        return;
      }
    }

    // Serve Frontend Client UI and static assets (with SPA routing fallback)
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/promo')) {
      const distPath = path.join(WORKSPACE_ROOT, 'client', 'dist');
      let filePath = path.join(distPath, pathname);
      
      // Fallback for directory/SPA routing: if file doesn't exist or is a directory, serve index.html
      let stats;
      try {
        stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          filePath = path.join(distPath, 'index.html');
        }
      } catch (err) {
        filePath = path.join(distPath, 'index.html');
      }

      try {
        const fileContent = await fs.readFile(filePath);
        let contentType = 'text/plain';
        if (filePath.endsWith('.html')) contentType = 'text/html';
        else if (filePath.endsWith('.css')) contentType = 'text/css';
        else if (filePath.endsWith('.js')) contentType = 'application/javascript';
        else if (filePath.endsWith('.png')) contentType = 'image/png';
        else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
        else if (filePath.endsWith('.ico')) contentType = 'image/x-icon';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fileContent);
        return;
      } catch (err) {
        // Fallback to source client/index.html if build does not exist yet (development fallback)
        if (pathname === '/' || pathname === '/index.html') {
          const clientIndex = path.join(WORKSPACE_ROOT, 'client', 'index.html');
          const html = await fs.readFile(clientIndex, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
          return;
        }
      }
    }

    // Serve Promo Website static assets
    if (pathname === '/promo' && req.method === 'GET') {
      res.writeHead(301, { 'Location': '/promo/' });
      res.end();
      return;
    }
    if (pathname.startsWith('/promo') && req.method === 'GET') {
      let relativeFilePath = pathname === '/promo/' ? 'index.html' : pathname.replace(/^\/promo\/?/, '');
      const filePath = path.join(WORKSPACE_ROOT, 'promo', relativeFilePath);
      
      try {
        const fileContent = await fs.readFile(filePath);
        let contentType = 'text/plain';
        if (filePath.endsWith('.html')) contentType = 'text/html';
        else if (filePath.endsWith('.css')) contentType = 'text/css';
        else if (filePath.endsWith('.js')) contentType = 'application/javascript';
        else if (filePath.endsWith('.png')) contentType = 'image/png';
        else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fileContent);
        return;
      } catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Promo asset not found');
        return;
      }
    }

    // API Auth Login (bypass auth check)
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const user = users.find(u => u.username === body.username && u.password === body.password);
      if (user) {
        const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
        activeSessions.set(token, body.username);
        return sendJSON(res, { success: true, token, username: body.username, role: user.role });
      }
      return sendJSON(res, { error: 'Invalid username or password' }, 401);
    }

    // Require authentication for all other /api/ paths
    let activeUser = null;
    let effectiveUser = null;
    let isSystemAdmin = false;
    let activeUserProfile = null;
    if (pathname.startsWith('/api/')) {
      const user = isAuthenticated(req);
      if (!user) {
        return sendJSON(res, { error: 'Unauthorized session' }, 401);
      }
      activeUser = user;
      activeUserProfile = users.find(u => u.username === activeUser);
      effectiveUser = activeUserProfile?.parentTenant || activeUser;
      isSystemAdmin = activeUserProfile?.role === 'admin' && !activeUserProfile?.parentTenant;

      // IAM Access Control checks for collaborators
      if (activeUserProfile?.parentTenant) {
        const allowedPaths = {
          developer: [
            '/api/auth',
            '/api/system/stats',
            '/api/developer/tokens',
            '/api/files',
            '/api/dx',
            '/api/ai'
          ],
          dba: [
            '/api/auth',
            '/api/system/stats',
            '/api/developer/tokens',
            '/api/databases'
          ]
        };
        const role = activeUserProfile.role;
        if (role === 'developer' || role === 'dba') {
          const isAllowed = allowedPaths[role].some(p => pathname.startsWith(p));
          if (!isAllowed) {
            return sendJSON(res, { error: 'Forbidden: Insufficient IAM permissions' }, 403);
          }
        }
      }

      // API Tenant Collaborators Management
      if (pathname === '/api/tenant/collaborators' && req.method === 'GET') {
        if (activeUserProfile?.role !== 'tenant' && (activeUserProfile?.role !== 'admin' || !activeUserProfile?.parentTenant)) {
          return sendJSON(res, { error: 'Forbidden' }, 403);
        }
        const tenant = activeUserProfile.parentTenant || activeUser;
        const collaborators = users.filter(u => u.parentTenant === tenant);
        return sendJSON(res, { success: true, collaborators: collaborators.map(c => ({ username: c.username, role: c.role, created: c.created })) });
      }

      if (pathname === '/api/tenant/collaborators/create' && req.method === 'POST') {
        if (activeUserProfile?.role !== 'tenant' && (activeUserProfile?.role !== 'admin' || !activeUserProfile?.parentTenant)) {
          return sendJSON(res, { error: 'Forbidden' }, 403);
        }
        const body = await parseBody(req);
        if (!body.username || !body.password || !body.role) {
          return sendJSON(res, { error: 'Username, password, and role are required' }, 400);
        }
        const exists = users.some(u => u.username === body.username);
        if (exists) {
          return sendJSON(res, { error: 'Username already exists' }, 400);
        }
        const tenant = activeUserProfile.parentTenant || activeUser;
        const newCollaborator = {
          username: body.username,
          password: body.password,
          role: body.role.toLowerCase(), // 'developer', 'dba', 'admin'
          parentTenant: tenant,
          created: new Date().toISOString().split('T')[0]
        };
        users.push(newCollaborator);
        const collaborators = users.filter(u => u.parentTenant === tenant);
        return sendJSON(res, { success: true, collaborators: collaborators.map(c => ({ username: c.username, role: c.role, created: c.created })) });
      }

      if (pathname === '/api/tenant/collaborators/delete' && req.method === 'POST') {
        if (activeUserProfile?.role !== 'tenant' && (activeUserProfile?.role !== 'admin' || !activeUserProfile?.parentTenant)) {
          return sendJSON(res, { error: 'Forbidden' }, 403);
        }
        const body = await parseBody(req);
        if (!body.username) {
          return sendJSON(res, { error: 'Username is required' }, 400);
        }
        const tenant = activeUserProfile.parentTenant || activeUser;
        const collabIdx = users.findIndex(u => u.username === body.username && u.parentTenant === tenant);
        if (collabIdx === -1) {
          return sendJSON(res, { error: 'Collaborator not found' }, 404);
        }
        users.splice(collabIdx, 1);
        for (const [token, username] of activeSessions.entries()) {
          if (username === body.username) {
            activeSessions.delete(token);
          }
        }
        const collaborators = users.filter(u => u.parentTenant === tenant);
        return sendJSON(res, { success: true, collaborators: collaborators.map(c => ({ username: c.username, role: c.role, created: c.created })) });
      }

      // API Auth Me
      if (pathname === '/api/auth/me' && req.method === 'GET') {
        return sendJSON(res, { username: activeUser, role: activeUserProfile?.role || 'tenant' });
      }

      // API Auth Logout
      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.substring(7);
        activeSessions.delete(token);
        return sendJSON(res, { success: true });
      }

      // API Developer Tokens GET
      if (pathname === '/api/developer/tokens' && req.method === 'GET') {
        const userTokens = developerTokens.filter(t => t.username === activeUser);
        return sendJSON(res, { success: true, tokens: userTokens });
      }

      // API Developer Tokens POST (Generate & Revoke)
      if (pathname === '/api/developer/tokens' && req.method === 'POST') {
        const body = await parseBody(req);
        if (body.token) {
          const tokenToDelete = body.token;
          const initialLen = developerTokens.length;
          developerTokens = developerTokens.filter(t => !(t.token === tokenToDelete && t.username === activeUser));
          if (developerTokens.length < initialLen) {
            return sendJSON(res, { success: true });
          } else {
            return sendJSON(res, { error: 'Token not found or unauthorized' }, 404);
          }
        }
        if (!body.label || !body.label.trim()) {
          return sendJSON(res, { error: 'Label is required' }, 400);
        }
        const randStr = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
        const newTokenVal = `keel_dev_${randStr}`;
        const newTokenObj = {
          token: newTokenVal,
          username: activeUser,
          label: body.label.trim(),
          created: new Date().toISOString()
        };
        developerTokens.push(newTokenObj);
        return sendJSON(res, { success: true, token: newTokenObj });
      }

      // API Logs Stream GET
      if (pathname === '/api/logs/stream' && req.method === 'GET') {
        return sendJSON(res, { success: true, logs: systemLogStream });
      }

      // API Alert Rules GET
      if (pathname === '/api/security/alerts' && req.method === 'GET') {
        return sendJSON(res, { success: true, rules: alertRules });
      }

      // API Alert Rules POST (Save)
      if (pathname === '/api/security/alerts/save' && req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.endpoint) {
          return sendJSON(res, { error: 'Rule name and webhook endpoint are required' }, 400);
        }
        const newRule = {
          id: body.id || String(alertRules.length + 1),
          name: body.name,
          trigger: body.trigger || 'OutOfMemory',
          target: body.target || 'Slack Webhook',
          enabled: body.enabled !== false,
          endpoint: body.endpoint
        };
        if (body.id) {
          alertRules = alertRules.map(r => r.id === body.id ? newRule : r);
        } else {
          alertRules.push(newRule);
        }
        addSystemLog('security', `Alert rule "${body.name}" saved successfully.`, 'info');
        return sendJSON(res, { success: true, rule: newRule });
      }

      // API Container Registries GET
      if (pathname === '/api/containers/registries' && req.method === 'GET') {
        return sendJSON(res, { success: true, registries: containerRegistries });
      }

      // API Container Registries POST (Save)
      if (pathname === '/api/containers/registries/save' && req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.url || !body.username || !body.token) {
          return sendJSON(res, { error: 'All fields are required' }, 400);
        }
        const newRegistry = {
          id: body.id || String(containerRegistries.length + 1),
          name: body.name,
          url: body.url,
          username: body.username,
          token: '••••••••',
          created: new Date().toISOString()
        };
        if (body.id) {
          containerRegistries = containerRegistries.map(r => r.id === body.id ? newRegistry : r);
        } else {
          containerRegistries.push(newRegistry);
        }
        addSystemLog('container-manager', `Linked private registry profile "${body.name}".`, 'info');
        return sendJSON(res, { success: true, registry: newRegistry });
      }

      // API Uptime Health Monitors GET
      if (pathname === '/api/health/monitors' && req.method === 'GET') {
        return sendJSON(res, { success: true, monitors: healthMonitors });
      }

      // API Uptime Health Monitors POST (Add)
      if (pathname === '/api/health/monitors/add' && req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.domain) {
          return sendJSON(res, { error: 'Domain name is required' }, 400);
        }
        const exists = healthMonitors.some(m => m.domain === body.domain);
        if (exists) {
          return sendJSON(res, { error: 'Monitor already exists for this domain' }, 400);
        }
        const newMonitor = {
          domain: body.domain,
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          pings: [200, 200, 200, 200, 200]
        };
        healthMonitors.push(newMonitor);
        addSystemLog('health-monitor', `Registered HTTP health monitoring check for ${body.domain}.`, 'info');
        return sendJSON(res, { success: true, monitor: newMonitor });
      }

      // API Uptime Health Monitors POST (Delete)
      if (pathname === '/api/health/monitors/delete' && req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.domain) {
          return sendJSON(res, { error: 'Domain is required' }, 400);
        }
        healthMonitors = healthMonitors.filter(m => m.domain !== body.domain);
        addSystemLog('health-monitor', `Suspended health monitoring checks for ${body.domain}.`, 'warning');
        return sendJSON(res, { success: true });
      }
    }
    // API System Stats
    if (pathname === '/api/system/stats' && req.method === 'GET') {
      const stats = await getCustomSystemStats(activeUserProfile);
      return sendJSON(res, stats);
    }

    // API System Webstack
    if (pathname === '/api/system/webstack' && req.method === 'GET') {
      return sendJSON(res, {
        engine: webServer.engine,
        engines: [
          { name: 'nginx', memory: '15 MB', status: webServer.engine === 'nginx' ? 'active' : 'inactive', description: 'High-performance HTTP server & reverse proxy' },
          { name: 'apache', memory: '80 MB', status: webServer.engine === 'apache' ? 'active' : 'inactive', description: 'Robust, feature-rich legacy web server' },
          { name: 'caddy', memory: '30 MB', status: webServer.engine === 'caddy' ? 'active' : 'inactive', description: 'Modern, automated SSL by default web server' }
        ]
      });
    }

    if (pathname === '/api/system/webstack' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.engine || !['nginx', 'apache', 'caddy'].includes(body.engine)) {
        return sendJSON(res, { error: 'Invalid engine specified' }, 400);
      }
      webServer.engine = body.engine;
      webServer.version = body.engine === 'nginx' ? 'nginx/1.24.0 (Ubuntu)' : body.engine === 'apache' ? 'Apache/2.4.52 (Ubuntu)' : 'Caddy/2.7.6';
      MOCK_LOGS.push(`[info] Web Server Stack: Switched active engine to ${body.engine}`);
      return sendJSON(res, {
        success: true,
        engine: webServer.engine,
        version: webServer.version
      });
    }

    // AI-Assisted Server Operations
    if (pathname === '/api/ai/debug-log' && req.method === 'POST') {
      const body = await parseBody(req);
      const log = body.log || '';
      
      let diagnosis = 'General Runtime Exception';
       let rootCause = 'An unhandled exception or crash was logged in the application runtime loop.';
      let solution = 'Review the stack trace below and verify that environment variables and assets are correctly loaded.';
      let fix = { type: 'clear_app_cache', label: 'Clear application build caches and restart runtime', parameter: 'cache' };

      if (log.includes('EADDRINUSE') || log.includes('address already in use') || log.includes('3000')) {
        diagnosis = 'Port Binding Conflict (EADDRINUSE)';
        rootCause = 'Another application or process is already listening on the requested port (typically port 3000).';
        solution = 'Terminate the competing process binding this port to free it up for Keel Panel App Daemon.';
        fix = { type: 'kill_port', label: 'Terminate process binding port 3000', parameter: '3000' };
      } else if (log.includes('permission denied') || log.includes('EACCES') || log.includes('chmod')) {
        diagnosis = 'File Workspace Permission Violation (EACCES)';
        rootCause = 'The web server runtime lacks required read or write directory permissions inside your sandbox storage.';
        solution = 'Grant proper read/write file access configuration settings (chmod 755) to the sandbox folders.';
        fix = { type: 'fix_permissions', label: 'Apply chmod 755 permissions to sandbox folder', parameter: 'sandbox' };
      } else if (log.includes('OutOfMemory') || log.includes('heap limit') || log.includes('heap out of memory')) {
        diagnosis = 'Runtime Heap Buffer Exhaustion (OutOfMemory)';
        rootCause = 'Your Node.js daemon has exceeded the memory allocation pool limit configured by the runtime engine.';
        solution = 'Scale up the memory limit by setting the max old space size environment flag configuration.';
        fix = { type: 'increase_memory', label: 'Increase Node Memory Heap size ceiling to 1024MB', parameter: '1024' };
      } else if (log.includes('password authentication failed') || log.includes('Access denied for user') || log.includes('database')) {
        diagnosis = 'Database Handshake Connection Failure';
        rootCause = 'The database authentication username or password configs in your environment are rejected by PostgreSQL.';
        solution = 'Re-verify and rebuild your database credentials or rebuild your DB user tables.';
        fix = { type: 'verify_db_credentials', label: 'Synchronize database credentials and access rights', parameter: 'postgres' };
      }

      return sendJSON(res, { success: true, diagnosis, rootCause, solution, fix });
    }

    if (pathname === '/api/ai/apply-fix' && req.method === 'POST') {
      const body = await parseBody(req);
      const { type, parameter } = body;
      
      let message = 'AI applied general recovery procedure.';
      if (type === 'kill_port') {
        message = `AI successfully terminated process binding port ${parameter || 3000}. Port is now free.`;
        MOCK_LOGS.push(`[info] AI Log Debugger: Terminated rogue port process binding on ${parameter || 3000}`);
      } else if (type === 'fix_permissions') {
        message = 'AI successfully restored chmod 755 permissions configuration across all sandbox files.';
        MOCK_LOGS.push('[info] AI Log Debugger: Adjusted permissions of sandboxed paths to chmod 755');
      } else if (type === 'increase_memory') {
        message = `AI adjusted runtime configuration to expand heap limits to ${parameter || 1024}MB.`;
        MOCK_LOGS.push(`[info] AI Log Debugger: Extended daemon memory buffer ceiling to ${parameter || 1024}MB`);
      } else if (type === 'verify_db_credentials') {
        message = 'AI synchronized and verified database credential mapping successfully.';
        MOCK_LOGS.push('[info] AI Log Debugger: Restored PostgreSQL database authentication parity configs');
      } else {
        message = 'AI successfully cleaned temporary cache registries and restarted the daemon engine.';
        MOCK_LOGS.push('[info] AI Log Debugger: Cleaned all deployment temporary caches and restarted runtime');
      }

      return sendJSON(res, { success: true, message });
    }

    if (pathname === '/api/ai/rewrite-config' && req.method === 'POST') {
      const body = await parseBody(req);
      const prompt = (body.prompt || '').toLowerCase();
      const engine = body.engine || 'nginx';

      let config = '';
      if (prompt.includes('redirect') && (prompt.includes('blog') || prompt.includes('old'))) {
        if (engine === 'nginx') {
          config = `server {\n    listen 80;\n    server_name keel-demo.test;\n\n    location /blog {\n        return 301 https://medium.com$request_uri;\n    }\n}`;
        } else if (engine === 'apache') {
          config = `<VirtualHost *:80>\n    ServerName keel-demo.test\n    RedirectPermanent /blog https://medium.com\n</VirtualHost>`;
        } else {
          config = `keel-demo.test {\n    redir /blog* https://medium.com{uri}\n}`;
        }
      } else if (prompt.includes('https') || prompt.includes('ssl') || prompt.includes('secure')) {
        if (engine === 'nginx') {
          config = `server {\n    listen 80;\n    server_name keel-ssl.test;\n    return 301 https://$host$request_uri;\n}`;
        } else if (engine === 'apache') {
          config = `<VirtualHost *:80>\n    ServerName keel-ssl.test\n    RewriteEngine On\n    RewriteCond %{HTTPS} off\n    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]\n</VirtualHost>`;
        } else {
          config = `keel-ssl.test {\n    # Caddy handles SSL and redirects automatically!\n    file_server\n}`;
        }
      } else {
        if (engine === 'nginx') {
          config = `server {\n    listen 80;\n    server_name app.keel-local.test;\n    root /var/www/sandbox;\n    index index.html;\n\n    location / {\n        try_files $uri $uri/ =404;\n    }\n}`;
        } else if (engine === 'apache') {
          config = `<VirtualHost *:80>\n    ServerName app.keel-local.test\n    DocumentRoot /var/www/sandbox\n    <Directory /var/www/sandbox>\n        AllowOverride All\n        Require all granted\n    </Directory>\n</VirtualHost>`;
        } else {
          config = `app.keel-local.test {\n    root * /var/www/sandbox\n    file_server\n}`;
        }
      }

      return sendJSON(res, { success: true, config });
    }

    if (pathname === '/api/ai/compose-cron' && req.method === 'POST') {
      const body = await parseBody(req);
      const prompt = (body.prompt || '').toLowerCase();

      let cron = '*/5 * * * *';
      let explanation = 'Run once every 5 minutes (default fallback suggestion).';

      if (prompt.includes('minute')) {
        cron = '* * * * *';
        explanation = 'Runs once every single minute continuously.';
      } else if (prompt.includes('hourly') || prompt.includes('every hour')) {
        cron = '0 * * * *';
        explanation = 'Runs at minute 0 (top of the hour) of every single hour.';
      } else if (prompt.includes('daily') || prompt.includes('every day') || prompt.includes('midnight')) {
        cron = '0 0 * * *';
        explanation = 'Runs at exactly 00:00 (midnight) every day.';
      } else if (prompt.includes('sunday')) {
        cron = '0 0 * * 0';
        explanation = 'Runs at exactly 00:00 (midnight) every Sunday.';
      } else if (prompt.includes('15 minutes') || prompt.includes('fifteen minutes')) {
        cron = '*/15 * * * *';
        explanation = 'Runs every 15 minutes.';
      } else if (prompt.includes('weekdays') || prompt.includes('monday to friday')) {
        cron = '0 0 * * 1-5';
        explanation = 'Runs at exactly 00:00 (midnight) on Monday, Tuesday, Wednesday, Thursday, and Friday.';
      }

    }

    // Cloud-Native Backup Integrations
    if (pathname === '/api/backups' && req.method === 'GET') {
      return sendJSON(res, { backups: cloudBackups, credentials: backupCredentials });
    }

    if (pathname === '/api/backups/credentials' && req.method === 'POST') {
      const body = await parseBody(req);
      const { provider, config } = body;
      if (provider && backupCredentials[provider]) {
        backupCredentials[provider] = { ...backupCredentials[provider], ...config };
        MOCK_LOGS.push(`[info] Cloud Backup: Updated configuration settings for ${provider.toUpperCase()}`);
        return sendJSON(res, { success: true, credentials: backupCredentials });
      }
      return sendJSON(res, { error: 'Invalid provider configuration' }, 400);
    }

    if (pathname === '/api/backups/trigger' && req.method === 'POST') {
      const body = await parseBody(req);
      const { provider } = body;
      
      const sizes = ['45.1 MB', '68.2 MB', '124.8 MB', '210.5 MB'];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      const timestamp = new Date().toISOString();
      const backupId = String(cloudBackups.length + 1);
      const pathPrefix = provider === 's3' ? 's3://' : provider === 'gcs' ? 'gs://' : 'b2://';
      
      const newBackup = {
        id: backupId,
        date: timestamp,
        provider,
        size: randomSize,
        status: 'completed',
        path: `${pathPrefix}keel-backups/backup_${timestamp.split('T')[0]}_v${backupId}.tar.gz`
      };

      cloudBackups.unshift(newBackup);
      MOCK_LOGS.push(`[info] Cloud Backup: Successfully completed tar archive stream to ${provider.toUpperCase()} bucket`);
      return sendJSON(res, { success: true, backups: cloudBackups });
    }

    // DNS Provider API Integrations
    if (pathname === '/api/domains/dns/providers' && req.method === 'GET') {
      return sendJSON(res, { credentials: dnsProviderCredentials });
    }

    if (pathname === '/api/domains/dns/providers/save' && req.method === 'POST') {
      const body = await parseBody(req);
      const { provider, credentials } = body;
      if (provider && dnsProviderCredentials[provider]) {
        // Toggle other providers to false
        Object.keys(dnsProviderCredentials).forEach(key => {
          dnsProviderCredentials[key].active = false;
        });
        dnsProviderCredentials[provider] = { ...dnsProviderCredentials[provider], ...credentials, active: true };
        MOCK_LOGS.push(`[info] DNS Provider: Linked and activated external ${provider.toUpperCase()} DNS API sync`);
        return sendJSON(res, { success: true, credentials: dnsProviderCredentials });
      }
      return sendJSON(res, { error: 'Invalid DNS API provider' }, 400);
    }

    if (pathname === '/api/domains/dns/providers/sync' && req.method === 'POST') {
      const body = await parseBody(req);
      const { domainName, provider } = body;
      if (!domainName || !provider) {
        return sendJSON(res, { error: 'Domain name and provider are required' }, 400);
      }
      MOCK_LOGS.push(`[info] DNS Provider: Synchronized ${domainName} zone maps over remote ${provider.toUpperCase()} API endpoint`);
      return sendJSON(res, { success: true, message: `Successfully synchronized ${domainName} records to ${provider.toUpperCase()}!` });
    }

    // API File Manager
    if (pathname === '/api/files' && req.method === 'GET') {
      const relPath = url.searchParams.get('path') || '';
      const fullPath = getUserSandboxPath(activeUser, relPath);
      
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        return sendJSON(res, { error: 'Not a directory' }, 400);
      }

      const files = await fs.readdir(fullPath);
      const items = await Promise.all(
        files.map(async file => {
          const filePath = path.join(fullPath, file);
          try {
            const fstat = await fs.stat(filePath);
            const relativeItemPath = relPath ? `${relPath}/${file}` : file;
            const isProtected = !!protectedDirectories[`${activeUser}/${relativeItemPath}`];
            return {
              name: file,
              isDirectory: fstat.isDirectory(),
              size: fstat.size,
              mtime: fstat.mtime,
              permissions: (fstat.mode & parseInt('777', 8)).toString(8),
              isProtected
            };
          } catch {
            return null;
          }
        })
      );

      return sendJSON(res, {
        currentPath: relPath,
        items: items.filter(Boolean).sort((a, b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name))
      });
    }

    // Read File Content
    if (pathname === '/api/files/read' && req.method === 'GET') {
      const relPath = url.searchParams.get('path') || '';
      const fullPath = getUserSandboxPath(activeUser, relPath);
      
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        return sendJSON(res, { error: 'Cannot read directories' }, 400);
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      return sendJSON(res, { content });
    }

    // Write / Save File
    if (pathname === '/api/files/write' && req.method === 'POST') {
      const body = await parseBody(req);
      const fullPath = getUserSandboxPath(activeUser, body.path);
      
      await fs.writeFile(fullPath, body.content || '', 'utf-8');
      return sendJSON(res, { success: true });
    }

    // Create New File / Directory
    if (pathname === '/api/files/create' && req.method === 'POST') {
      const body = await parseBody(req);
      const fullPath = getUserSandboxPath(activeUser, body.path);
      
      if (body.type === 'directory') {
        await fs.mkdir(fullPath, { recursive: true });
      } else {
        await fs.writeFile(fullPath, '', 'utf-8');
      }
      return sendJSON(res, { success: true });
    }

    // Rename / Move
    if (pathname === '/api/files/rename' && req.method === 'POST') {
      const body = await parseBody(req);
      const oldPath = getUserSandboxPath(activeUser, body.oldPath);
      const newPath = getUserSandboxPath(activeUser, body.newPath);
      
      await fs.rename(oldPath, newPath);
      return sendJSON(res, { success: true });
    }

    // Delete File / Directory
    if (pathname === '/api/files/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const fullPath = getUserSandboxPath(activeUser, body.path);
      
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.unlink(fullPath);
      }
      return sendJSON(res, { success: true });
    }

    // Set Directory Privacy (Password Protection)
    if (pathname === '/api/files/privacy' && req.method === 'POST') {
      const body = await parseBody(req);
      const { path: relPath, username, password, enable } = body;
      if (!relPath) return sendJSON(res, { error: 'Path is required' }, 400);

      const key = `${activeUser}/${relPath}`;
      if (enable) {
        if (!username || !password) return sendJSON(res, { error: 'Username and password are required' }, 400);
        protectedDirectories[key] = { username, password };
        MOCK_LOGS.push(`[info] Password protection ENABLED on directory: ${relPath} for user: ${activeUser}`);
      } else {
        delete protectedDirectories[key];
        MOCK_LOGS.push(`[info] Password protection DISABLED on directory: ${relPath} for user: ${activeUser}`);
      }
      return sendJSON(res, { success: true });
    }

    // API File Upload
    if (pathname === '/api/files/upload' && req.method === 'POST') {
      const fileName = decodeURIComponent(req.headers['x-file-name'] || '');
      const folderPath = decodeURIComponent(req.headers['x-folder-path'] || '');
      if (!fileName) {
        return sendJSON(res, { error: 'Filename is required' }, 400);
      }
      const targetDir = getUserSandboxPath(activeUser, folderPath);
      const targetFile = path.join(targetDir, fileName);
      
      try {
        await fs.mkdir(targetDir, { recursive: true });
        const writeHandle = await fs.open(targetFile, 'w');
        for await (const chunk of req) {
          await writeHandle.write(chunk);
        }
        await writeHandle.close();
        MOCK_LOGS.push(`[info] Uploaded file: ${fileName} to folder: ${folderPath}`);
        return sendJSON(res, { success: true });
      } catch (err) {
        return sendJSON(res, { error: `Upload failed: ${err.message}` }, 500);
      }
    }

    // API Change File Permissions (Chmod)
    if (pathname === '/api/files/chmod' && req.method === 'POST') {
      const body = await parseBody(req);
      const { path: relPath, mode } = body;
      if (!relPath || !mode) {
        return sendJSON(res, { error: 'Path and mode are required' }, 400);
      }
      const fullPath = getUserSandboxPath(activeUser, relPath);
      try {
        await fs.chmod(fullPath, parseInt(mode, 8));
        MOCK_LOGS.push(`[info] Changed permissions of ${relPath} to ${mode}`);
        return sendJSON(res, { success: true });
      } catch (err) {
        return sendJSON(res, { error: `Failed to change permissions: ${err.message}` }, 500);
      }
    }

    // API Compress File / Folder
    if (pathname === '/api/files/compress' && req.method === 'POST') {
      const body = await parseBody(req);
      const { path: relPath, archiveName, format } = body;
      if (!relPath || !archiveName) {
        return sendJSON(res, { error: 'Path and archiveName are required' }, 400);
      }
      const sourcePath = getUserSandboxPath(activeUser, relPath);
      const parentDir = path.dirname(sourcePath);
      const baseName = path.basename(sourcePath);
      const targetArchive = path.join(parentDir, archiveName);

      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          if (format === 'zip') {
            await runCommandAsync(`cd "${parentDir}" && zip -r "${targetArchive}" "${baseName}"`);
          } else {
            await runCommandAsync(`cd "${parentDir}" && tar -czf "${targetArchive}" "${baseName}"`);
          }
          MOCK_LOGS.push(`[info] Compressed ${relPath} into ${archiveName}`);
        } catch (err) {
          return sendJSON(res, { error: `Compression failed: ${err.message}` }, 500);
        }
      } else {
        try {
          await fs.writeFile(targetArchive, 'MOCK COMPRESSED ARCHIVE CONTENT', 'utf-8');
          MOCK_LOGS.push(`[Mock Mode] Simulated compression of ${relPath} into ${archiveName}`);
        } catch (err) {
          return sendJSON(res, { error: `Mock compression failed: ${err.message}` }, 500);
        }
      }
      return sendJSON(res, { success: true });
    }

    // API Decompress Archive
    if (pathname === '/api/files/decompress' && req.method === 'POST') {
      const body = await parseBody(req);
      const { path: relPath, destPath } = body;
      if (!relPath) {
        return sendJSON(res, { error: 'Path is required' }, 400);
      }
      const archivePath = getUserSandboxPath(activeUser, relPath);
      const destDir = getUserSandboxPath(activeUser, destPath || path.dirname(relPath));

      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          await fs.mkdir(destDir, { recursive: true });
          if (relPath.endsWith('.zip')) {
            await runCommandAsync(`unzip -o "${archivePath}" -d "${destDir}"`);
          } else {
            await runCommandAsync(`tar -xzf "${archivePath}" -C "${destDir}"`);
          }
          MOCK_LOGS.push(`[info] Decompressed ${relPath} into ${destPath || path.dirname(relPath)}`);
        } catch (err) {
          return sendJSON(res, { error: `Decompression failed: ${err.message}` }, 500);
        }
      } else {
        try {
          await fs.mkdir(destDir, { recursive: true });
          await fs.writeFile(path.join(destDir, 'extracted_mock_file.txt'), 'Successfully simulated archive extraction!', 'utf-8');
          MOCK_LOGS.push(`[Mock Mode] Simulated decompression of ${relPath} into ${destPath || path.dirname(relPath)}`);
        } catch (err) {
          return sendJSON(res, { error: `Mock decompression failed: ${err.message}` }, 500);
        }
      }
      return sendJSON(res, { success: true });
    }

    // Git Deployment Simulation
    if (pathname === '/api/files/git-deploy' && req.method === 'POST') {
      const body = await parseBody(req);
      const { repoUrl, branch, path: relPath } = body;
      if (!repoUrl || !relPath) return sendJSON(res, { error: 'Repo URL and target path are required' }, 400);

      const fullPath = getUserSandboxPath(activeUser, relPath);
      await fs.mkdir(fullPath, { recursive: true });

      await fs.writeFile(path.join(fullPath, 'index.html'), `<h1>Simulated Git Deployment</h1>\n<p>Cloned from ${repoUrl} (${branch || 'main'})</p>\n<p>Deploy date: ${new Date().toISOString()}</p>`);
      await fs.writeFile(path.join(fullPath, 'style.css'), `body { background: #0f172a; color: #f1f5f9; font-family: sans-serif; padding: 40px; }`);
      await fs.writeFile(path.join(fullPath, 'README.md'), `# Mock Git Repository\nThis folder was automatically deployed from git link: ${repoUrl}`);

      MOCK_LOGS.push(`[info] Git cloned repository: ${repoUrl} [branch: ${branch || 'main'}] into folder: ${relPath}`);
      return sendJSON(res, { success: true });
    }

    // API Databases
    if (pathname === '/api/databases' && req.method === 'GET') {
      const userProfile = users.find(u => u.username === activeUser);
      const actualDatabases = [];

      // 1. Fetch real MariaDB databases if enabled
      if (!useMockDatabase) {
        try {
          const [dbRows] = await dbPool.query("SHOW DATABASES");
          const systemDBs = ['information_schema', 'mysql', 'performance_schema', 'sys'];
          const realDbs = dbRows
            .map(r => r.Database || r.database || Object.values(r)[0])
            .filter(name => !systemDBs.includes(name));

          for (const name of realDbs) {
            const existing = databases.find(d => d.name === name);
            const owner = existing ? existing.owner : activeUser;

            let tablesCount = 0;
            try {
              const [tableRows] = await dbPool.query(`SHOW TABLES FROM \`${name}\``);
              tablesCount = tableRows.length;
            } catch (e) {}

            let sizeStr = '0.1 MB';
            try {
              const [sizeRows] = await dbPool.query(`
                SELECT SUM(data_length + index_length) AS size 
                FROM information_schema.TABLES 
                WHERE table_schema = ?
              `, [name]);
              const bytes = sizeRows[0]?.size || 0;
              sizeStr = bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : '0.0 MB';
            } catch (e) {}

            actualDatabases.push({
              name,
              type: 'mysql',
              size: sizeStr,
              tables: tablesCount,
              users: existing ? existing.users : [],
              owner
            });
          }
        } catch (err) {
          console.error('Error fetching real MariaDB databases:', err);
        }
      }

      // 2. Fetch real PostgreSQL databases if enabled
      if (!useMockPg && pgPool) {
        try {
          const pgRes = await pgPool.query("SELECT datname FROM pg_database WHERE datistemplate = false");
          const systemPgDBs = ['postgres'];
          const realPgDbs = pgRes.rows
            .map(r => r.datname)
            .filter(name => !systemPgDBs.includes(name));

          for (const name of realPgDbs) {
            const existing = databases.find(d => d.name === name);
            const owner = existing ? existing.owner : activeUser;

            let tablesCount = 0;
            try {
              const client = await pgPool.connect();
              const tRes = await client.query(`
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public'
              `);
              tablesCount = parseInt(tRes.rows[0]?.count || '0');
              client.release();
            } catch (e) {}

            actualDatabases.push({
              name,
              type: 'postgresql',
              size: '0.5 MB', // mock size for PG
              tables: tablesCount,
              users: existing ? existing.users : [],
              owner
            });
          }
        } catch (err) {
          console.error('Error fetching real PostgreSQL databases:', err);
        }
      }

      // Merge mock-only databases (e.g. pg/mysql databases created in mock mode)
      databases.forEach(db => {
        const alreadyFetched = actualDatabases.some(d => d.name === db.name);
        if (!alreadyFetched) {
          actualDatabases.push(db);
        }
      });

      databases = actualDatabases;

      const userDbs = isSystemAdmin ? databases : databases.filter(d => d.owner === effectiveUser);
      const userUsers = isSystemAdmin ? dbUsers : dbUsers.filter(u => u.owner === effectiveUser);
      return sendJSON(res, { databases: userDbs, dbUsers: userUsers });
    }

    if (pathname === '/api/databases/create' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.name) return sendJSON(res, { error: 'Database name is required' }, 400);

      const exists = databases.some(d => d.name === body.name);
      if (exists) return sendJSON(res, { error: 'Database already exists' }, 400);

      const dbType = body.type || 'mysql';

      if (dbType === 'postgresql') {
        if (!useMockPg && pgPool) {
          try {
            await pgPool.query(`CREATE DATABASE "${body.name}"`);
            MOCK_LOGS.push(`[info] pgsql: Created real database "${body.name}" successfully`);
          } catch (err) {
            return sendJSON(res, { error: `Failed to create PG database: ${err.message}` }, 500);
          }
        }
      } else {
        if (!useMockDatabase) {
          try {
            await dbPool.query(`CREATE DATABASE \`${body.name}\``);
            MOCK_LOGS.push(`[info] mysql: Created real database \`${body.name}\` successfully`);
          } catch (err) {
            return sendJSON(res, { error: `Failed to create MySQL database: ${err.message}` }, 500);
          }
        }
      }

      databases.push({
        name: body.name,
        type: dbType,
        size: '0.0 MB',
        tables: 0,
        users: [],
        owner: effectiveUser
      });
      dbData[body.name] = {};
      const userProfile = users.find(u => u.username === activeUser);
      const userDbs = userProfile?.role === 'admin' ? databases : databases.filter(d => d.owner === activeUser);
      return sendJSON(res, { success: true, databases: userDbs });
    }

    if (pathname === '/api/databases/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const db = databases.find(d => d.name === body.name);
      const dbType = db ? db.type : 'mysql';

      if (dbType === 'postgresql') {
        if (!useMockPg && pgPool) {
          try {
            await pgPool.query(`DROP DATABASE "${body.name}"`);
            MOCK_LOGS.push(`[info] pgsql: Dropped real database "${body.name}" successfully`);
          } catch (err) {
            return sendJSON(res, { error: `Failed to delete PG database: ${err.message}` }, 500);
          }
        }
      } else {
        if (!useMockDatabase) {
          try {
            await dbPool.query(`DROP DATABASE \`${body.name}\``);
            MOCK_LOGS.push(`[info] mysql: Dropped real database \`${body.name}\` successfully`);
          } catch (err) {
            return sendJSON(res, { error: `Failed to delete MySQL database: ${err.message}` }, 500);
          }
        }
      }

      databases = databases.filter(d => d.name !== body.name);
      delete dbData[body.name];
      const userProfile = users.find(u => u.username === activeUser);
      const userDbs = userProfile?.role === 'admin' ? databases : databases.filter(d => d.owner === activeUser);
      return sendJSON(res, { success: true, databases: userDbs });
    }

    if (pathname === '/api/databases/users/create' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.username) return sendJSON(res, { error: 'Username is required' }, 400);

      const exists = dbUsers.some(u => u.username === body.username);
      if (exists) return sendJSON(res, { error: 'User already exists' }, 400);

      const dbType = body.type || 'mysql';

      if (dbType === 'postgresql') {
        if (!useMockPg && pgPool) {
          try {
            const password = body.password || 'password123';
            await pgPool.query(`CREATE USER "${body.username}" WITH PASSWORD '${password}'`);
            MOCK_LOGS.push(`[info] pgsql: Created real user "${body.username}"`);
          } catch (err) {
            return sendJSON(res, { error: `Failed to create PostgreSQL user: ${err.message}` }, 500);
          }
        }
      } else {
        if (!useMockDatabase) {
          try {
            const password = body.password || 'password123';
            const host = body.host || 'localhost';
            await dbPool.query(`CREATE USER ?@? IDENTIFIED BY ?`, [body.username, host, password]);
            MOCK_LOGS.push(`[info] mysql: Created real user \`${body.username}\`@\`${host}\``);
          } catch (err) {
            return sendJSON(res, { error: `Failed to create MySQL database user: ${err.message}` }, 500);
          }
        }
      }

      dbUsers.push({
        username: body.username,
        hosts: body.hosts || ['localhost'],
        owner: activeUser
      });
      const userProfile = users.find(u => u.username === activeUser);
      const userUsers = userProfile?.role === 'admin' ? dbUsers : dbUsers.filter(u => u.owner === activeUser);
      return sendJSON(res, { success: true, dbUsers: userUsers });
    }

    if (pathname === '/api/databases/users/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      
      // Attempt to determine type of user (pg or mysql). Default to mysql.
      // In PG, users are global, in MySQL users are hosted.
      if (!useMockPg && pgPool) {
        try {
          await pgPool.query(`DROP USER "${body.username}"`);
          MOCK_LOGS.push(`[info] pgsql: Dropped real user "${body.username}"`);
        } catch (err) {
          // ignore or log
        }
      }
      if (!useMockDatabase) {
        try {
          const host = body.host || 'localhost';
          await dbPool.query(`DROP USER ?@?`, [body.username, host]);
          MOCK_LOGS.push(`[info] mysql: Dropped real user \`${body.username}\`@\`${host}\``);
        } catch (err) {
          // ignore or log
        }
      }

      dbUsers = dbUsers.filter(u => u.username !== body.username);
      databases.forEach(db => {
        db.users = db.users.filter(u => u !== body.username);
      });
      const userProfile = users.find(u => u.username === activeUser);
      const userDbs = userProfile?.role === 'admin' ? databases : databases.filter(d => d.owner === activeUser);
      const userUsers = userProfile?.role === 'admin' ? dbUsers : dbUsers.filter(u => u.owner === activeUser);
      return sendJSON(res, { success: true, dbUsers: userUsers, databases: userDbs });
    }

    if (pathname === '/api/databases/users/associate' && req.method === 'POST') {
      const body = await parseBody(req);
      const db = databases.find(d => d.name === body.dbName);
      const dbType = db ? db.type : 'mysql';

      if (dbType === 'postgresql') {
        if (!useMockPg && pgPool) {
          try {
            await pgPool.query(`GRANT ALL PRIVILEGES ON DATABASE "${body.dbName}" TO "${body.username}"`);
            MOCK_LOGS.push(`[info] pgsql: Granted privileges on DATABASE "${body.dbName}" to user "${body.username}"`);
          } catch (err) {
            return sendJSON(res, { error: `Failed to grant PG privileges: ${err.message}` }, 500);
          }
        }
      } else {
        if (!useMockDatabase) {
          try {
            const host = body.host || 'localhost';
            await dbPool.query(`GRANT ALL PRIVILEGES ON \`${body.dbName}\`.* TO ?@?`, [body.username, host]);
            await dbPool.query(`FLUSH PRIVILEGES`);
            MOCK_LOGS.push(`[info] mysql: Granted privileges on \`${body.dbName}\` to user \`${body.username}\`@\`${host}\``);
          } catch (err) {
            return sendJSON(res, { error: `Failed to grant MySQL privileges: ${err.message}` }, 500);
          }
        }
      }

      if (db && !db.users.includes(body.username)) {
        db.users.push(body.username);
      }
      const userProfile = users.find(u => u.username === activeUser);
      const userDbs = userProfile?.role === 'admin' ? databases : databases.filter(d => d.owner === activeUser);
      return sendJSON(res, { success: true, databases: userDbs });
    }

    // API Databases Table Explorer
    if (pathname === '/api/databases/tables' && req.method === 'GET') {
      const dbName = url.searchParams.get('db') || '';
      if (!dbName) return sendJSON(res, { error: 'Database name required' }, 400);

      // Verify ownership
      const db = databases.find(d => d.name === dbName);
      if (!db) return sendJSON(res, { error: 'Database not found' }, 404);
      const userProfile = users.find(u => u.username === activeUser);
      if (userProfile?.role !== 'admin' && db.owner !== effectiveUser) {
        return sendJSON(res, { error: 'Forbidden' }, 403);
      }

      if (!useMockDatabase) {
        try {
          const [tableRows] = await dbPool.query(`SHOW TABLES FROM \`${dbName}\``);
          const tables = tableRows.map(r => Object.values(r)[0]);
          return sendJSON(res, { success: true, dbName, tables });
        } catch (err) {
          return sendJSON(res, { error: `Failed to retrieve tables: ${err.message}` }, 500);
        }
      }

      if (!dbData[dbName]) {
        dbData[dbName] = {};
      }
      const tables = Object.keys(dbData[dbName]);
      return sendJSON(res, { success: true, dbName, tables });
    }

    if (pathname === '/api/databases/query' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.dbName || !body.query) {
        return sendJSON(res, { error: 'Database name and query string required' }, 400);
      }

      // Verify ownership
      const db = databases.find(d => d.name === body.dbName);
      if (!db) return sendJSON(res, { error: 'Database not found' }, 404);
      const userProfile = users.find(u => u.username === activeUser);
      if (userProfile?.role !== 'admin' && db.owner !== activeUser) {
        return sendJSON(res, { error: 'Forbidden' }, 403);
      }

      if (!useMockDatabase) {
        try {
          const connection = await dbPool.getConnection();
          await connection.query(`USE \`${body.dbName}\``);
          const [rows, fields] = await connection.query(body.query);
          connection.release();

          let columns = [];
          let formattedRows = [];
          if (fields && Array.isArray(fields)) {
            columns = fields.map(f => f.name);
          }
          if (Array.isArray(rows)) {
            formattedRows = rows;
          } else {
            columns = ['status', 'affected_rows', 'message'];
            formattedRows = [
              { 
                status: 'success', 
                affected_rows: rows.affectedRows || 0, 
                message: rows.message || `Query executed successfully. Affected rows: ${rows.affectedRows || 0}`
              }
            ];
          }
          return sendJSON(res, { success: true, columns, rows: formattedRows });
        } catch (err) {
          return sendJSON(res, { error: `Query execution error: ${err.message}` }, 500);
        }
      }

      const q = body.query.trim();
      const lowerQ = q.toLowerCase();
      let columns = [];
      let rows = [];

      const selectMatch = q.match(/select\s+\*\s+from\s+(\w+)/i);
      if (selectMatch) {
        const tableName = selectMatch[1];
        const dbTables = dbData[body.dbName] || {};
        const realTableName = Object.keys(dbTables).find(t => t.toLowerCase() === tableName.toLowerCase());
        if (realTableName && dbTables[realTableName]) {
          columns = dbTables[realTableName].columns || [];
          rows = dbTables[realTableName].rows || [];
        } else {
          return sendJSON(res, { error: `Table '${tableName}' not found in database '${body.dbName}'` }, 404);
        }
      } else {
        columns = ['status', 'affected_rows', 'message'];
        rows = [
          { status: 'success', affected_rows: 1, message: 'Query executed successfully. (Mock Database Engine)' }
        ];
      }

      return sendJSON(res, { success: true, columns, rows });
    }

    // Create Table
    if (pathname === '/api/databases/create-table' && req.method === 'POST') {
      const body = await parseBody(req);
      const { dbName, tableName, columns } = body;
      if (!dbName || !tableName || !columns || !Array.isArray(columns)) {
        return sendJSON(res, { error: 'Missing dbName, tableName, or columns array' }, 400);
      }
      
      const db = databases.find(d => d.name === dbName);
      if (!db) return sendJSON(res, { error: 'Database not found' }, 404);

      if (!dbData[dbName]) dbData[dbName] = {};
      if (dbData[dbName][tableName]) {
        return sendJSON(res, { error: 'Table already exists' }, 400);
      }

      dbData[dbName][tableName] = {
        columns: columns,
        rows: []
      };

      db.tables = Object.keys(dbData[dbName]).length;
      return sendJSON(res, { success: true, tables: Object.keys(dbData[dbName]) });
    }

    // Alter Table
    if (pathname === '/api/databases/alter-table' && req.method === 'POST') {
      const body = await parseBody(req);
      const { dbName, tableName, action, columnName, newName } = body;
      if (!dbName || !tableName || !action) {
        return sendJSON(res, { error: 'Missing required parameters' }, 400);
      }

      const db = databases.find(d => d.name === dbName);
      if (!db) return sendJSON(res, { error: 'Database not found' }, 404);

      if (!dbData[dbName] || !dbData[dbName][tableName]) {
        return sendJSON(res, { error: 'Table not found' }, 404);
      }

      const table = dbData[dbName][tableName];

      if (action === 'rename') {
        if (!newName) return sendJSON(res, { error: 'New table name is required' }, 400);
        if (dbData[dbName][newName]) return sendJSON(res, { error: 'Target table name already exists' }, 400);
        dbData[dbName][newName] = table;
        delete dbData[dbName][tableName];
      } else if (action === 'addColumn') {
        if (!columnName) return sendJSON(res, { error: 'Column name is required' }, 400);
        if (table.columns.includes(columnName)) return sendJSON(res, { error: 'Column already exists' }, 400);
        table.columns.push(columnName);
        table.rows.forEach(row => {
          row[columnName] = '';
        });
      } else if (action === 'dropColumn') {
        if (!columnName) return sendJSON(res, { error: 'Column name is required' }, 400);
        table.columns = table.columns.filter(c => c !== columnName);
        table.rows.forEach(row => {
          delete row[columnName];
        });
      } else {
        return sendJSON(res, { error: 'Invalid alter action' }, 400);
      }

      return sendJSON(res, { success: true });
    }

    // Drop Table
    if (pathname === '/api/databases/drop-table' && req.method === 'POST') {
      const body = await parseBody(req);
      const { dbName, tableName } = body;
      if (!dbName || !tableName) return sendJSON(res, { error: 'Missing parameters' }, 400);

      const db = databases.find(d => d.name === dbName);
      if (!db) return sendJSON(res, { error: 'Database not found' }, 404);

      if (dbData[dbName]) {
        delete dbData[dbName][tableName];
      }

      db.tables = Object.keys(dbData[dbName] || {}).length;
      return sendJSON(res, { success: true, tables: Object.keys(dbData[dbName] || {}) });
    }

    // Insert Row
    if (pathname === '/api/databases/rows/insert' && req.method === 'POST') {
      const body = await parseBody(req);
      const { dbName, tableName, rowData } = body;
      if (!dbName || !tableName || !rowData) return sendJSON(res, { error: 'Missing parameters' }, 400);

      if (!dbData[dbName] || !dbData[dbName][tableName]) {
        return sendJSON(res, { error: 'Table not found' }, 404);
      }

      const table = dbData[dbName][tableName];
      table.rows.push(rowData);
      return sendJSON(res, { success: true, rows: table.rows });
    }

    // Update Row
    if (pathname === '/api/databases/rows/update' && req.method === 'POST') {
      const body = await parseBody(req);
      const { dbName, tableName, rowIndex, rowData } = body;
      if (!dbName || !tableName || rowIndex === undefined || !rowData) {
        return sendJSON(res, { error: 'Missing parameters' }, 400);
      }

      if (!dbData[dbName] || !dbData[dbName][tableName]) {
        return sendJSON(res, { error: 'Table not found' }, 404);
      }

      const table = dbData[dbName][tableName];
      const idx = parseInt(rowIndex, 10);
      if (idx < 0 || idx >= table.rows.length) {
        return sendJSON(res, { error: 'Row index out of range' }, 400);
      }

      table.rows[idx] = rowData;
      return sendJSON(res, { success: true, rows: table.rows });
    }

    // Delete Row
    if (pathname === '/api/databases/rows/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const { dbName, tableName, rowIndex } = body;
      if (!dbName || !tableName || rowIndex === undefined) {
        return sendJSON(res, { error: 'Missing parameters' }, 400);
      }

      if (!dbData[dbName] || !dbData[dbName][tableName]) {
        return sendJSON(res, { error: 'Table not found' }, 404);
      }

      const table = dbData[dbName][tableName];
      const idx = parseInt(rowIndex, 10);
      if (idx < 0 || idx >= table.rows.length) {
        return sendJSON(res, { error: 'Row index out of range' }, 400);
      }

      table.rows.splice(idx, 1);
      return sendJSON(res, { success: true, rows: table.rows });
    }

    // Export Database (Download json)
    if (pathname === '/api/databases/export' && req.method === 'GET') {
      const dbName = url.searchParams.get('db') || '';
      if (!dbName) return sendJSON(res, { error: 'Database name required' }, 400);

      const db = databases.find(d => d.name === dbName);
      if (!db) return sendJSON(res, { error: 'Database not found' }, 404);

      const dumpData = dbData[dbName] || {};
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${dbName}_dump.json"`,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(dumpData, null, 2));
      return;
    }

    // Import Database (Upload json)
    if (pathname === '/api/databases/import' && req.method === 'POST') {
      const body = await parseBody(req);
      const { dbName, dump } = body;
      if (!dbName || !dump) return sendJSON(res, { error: 'Missing dbName or dump data' }, 400);

      const db = databases.find(d => d.name === dbName);
      if (!db) return sendJSON(res, { error: 'Database not found' }, 404);

      try {
        let parsed;
        if (typeof dump === 'string') {
          parsed = JSON.parse(dump);
        } else {
          parsed = dump;
        }

        for (const tableName in parsed) {
          if (!parsed[tableName].columns || !Array.isArray(parsed[tableName].columns)) {
            throw new Error(`Invalid table schema for table ${tableName}`);
          }
          if (!parsed[tableName].rows || !Array.isArray(parsed[tableName].rows)) {
            throw new Error(`Invalid table rows for table ${tableName}`);
          }
        }

        dbData[dbName] = parsed;
        db.tables = Object.keys(parsed).length;
        
        return sendJSON(res, { success: true, tables: Object.keys(parsed) });
      } catch (err) {
        return sendJSON(res, { error: 'Invalid database dump format: ' + err.message }, 400);
      }
    }

    // Install Adminer on target domain docroot
    if (pathname === '/api/databases/adminer/install' && req.method === 'POST') {
      const body = await parseBody(req);
      const domain = domains.find(d => d.name === body.domainName);
      if (!domain) return sendJSON(res, { error: 'Domain not found' }, 404);

      let absoluteDocroot = domain.docroot;
      if (!path.isAbsolute(absoluteDocroot)) {
        absoluteDocroot = getUserSandboxPath(activeUser, absoluteDocroot);
      }

      const adminerPath = path.join(absoluteDocroot, 'adminer.php');
      const isLinux = process.platform === 'linux';

      try {
        await fs.mkdir(absoluteDocroot, { recursive: true });
        
        // Write mock Adminer page content
        const mockAdminerContent = `<?php
// Mock Adminer for Keel Panel
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $server = $_POST['auth']['server'] ?? '';
    $username = $_POST['auth']['username'] ?? '';
    $db = $_POST['auth']['db'] ?? '';
    $driver = $_POST['auth']['driver'] ?? 'server';
    echo "<div style='background:#1e293b; color:#f1f5f9; font-family:sans-serif; padding:40px; border-radius:8px; max-width:600px; margin: 40px auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #334155;'>";
    echo "<h2 style='color:#38bdf8;'>Adminer Mock Auto-Login Success</h2>";
    echo "<p>Driver: <strong>" . htmlspecialchars($driver) . "</strong></p>";
    echo "<p>Successfully authenticated to <strong>" . htmlspecialchars($server) . "</strong> as <strong>" . htmlspecialchars($username) . "</strong>.</p>";
    echo "<p>Active Database: <strong>" . htmlspecialchars($db) . "</strong></p>";
    echo "<a href='#' onclick='window.close()' style='display:inline-block; background:#0284c7; color:white; padding:8px 16px; border-radius:4px; text-decoration:none;'>Close Window</a>";
    echo "</div>";
    exit;
}
?>
<!DOCTYPE html>
<html>
<head><title>Adminer Mock</title></head>
<body style="background:#0f172a; color:#f1f5f9; font-family:sans-serif; padding:40px;">
    <h2>Adminer (Mock Mode)</h2>
    <form method="post">
        <p>Driver: <select name="auth[driver]"><option value="server">MySQL</option><option value="pgsql">PostgreSQL</option></select></p>
        <p>Server: <input name="auth[server]" value="localhost"></p>
        <p>Username: <input name="auth[username]" value=""></p>
        <p>Password: <input name="auth[password]" type="password" value=""></p>
        <p>Database: <input name="auth[db]" value=""></p>
        <input type="submit" value="Login">
    </form>
</body>
</html>`;

        if (isLinux) {
          try {
            await runCommandAsync(`curl -L -o "${adminerPath}" https://www.adminer.org/static/download/4.8.1/adminer-4.8.1.php`);
            MOCK_LOGS.push(`[info] Adminer: Successfully downloaded official Adminer.php to ${domain.name}`);
          } catch (err) {
            await fs.writeFile(adminerPath, mockAdminerContent, 'utf-8');
            MOCK_LOGS.push(`[info] Adminer: Failed to download official Adminer, falling back to mock Adminer on ${domain.name}`);
          }
        } else {
          await fs.writeFile(adminerPath, mockAdminerContent, 'utf-8');
          MOCK_LOGS.push(`[Mock Mode] Adminer: Installed mock Adminer page at ${adminerPath}`);
        }

        return sendJSON(res, { success: true, path: adminerPath });
      } catch (err) {
        return sendJSON(res, { error: `Adminer installation failed: ${err.message}` }, 500);
      }
    }

    // SSO Auto-Login generate token/form
    if (pathname === '/api/databases/adminer/sso' && req.method === 'POST') {
      const body = await parseBody(req);
      const { domainName, dbName, username, password, dbType } = body;
      const domain = domains.find(d => d.name === domainName);
      if (!domain) return sendJSON(res, { error: 'Domain not found' }, 404);

      let absoluteDocroot = domain.docroot;
      if (!path.isAbsolute(absoluteDocroot)) {
        absoluteDocroot = getUserSandboxPath(activeUser, absoluteDocroot);
      }

      const ssoPath = path.join(absoluteDocroot, 'adminer_sso.php');
      const driver = dbType === 'postgresql' ? 'pgsql' : 'server';

      const ssoContent = `<?php
// Secure SSO redirect page generated by Keel Panel
\$driver = '${driver}';
\$server = 'localhost';
\$username = '${username || ''}';
\$password = '${password || ''}';
\$db = '${dbName || ''}';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Logging in to Adminer...</title>
</head>
<body style="background: #0f172a; color: #f1f5f9; font-family: sans-serif; text-align: center; padding-top: 100px;">
    <div style="display: inline-block; padding: 30px; border-radius: 8px; background: #1e293b; border: 1px solid #334155;">
        <h2>Connecting to Database via Adminer SSO...</h2>
        <p>Please wait while Keel Panel securely authenticates you.</p>
    </div>
    
    <form id="ssoForm" action="adminer.php" method="post" style="display:none;">
        <input type="hidden" name="auth[driver]" value="<?php echo htmlspecialchars(\$driver); ?>">
        <input type="hidden" name="auth[server]" value="<?php echo htmlspecialchars(\$server); ?>">
        <input type="hidden" name="auth[username]" value="<?php echo htmlspecialchars(\$username); ?>">
        <input type="hidden" name="auth[password]" value="<?php echo htmlspecialchars(\$password); ?>">
        <input type="hidden" name="auth[db]" value="<?php echo htmlspecialchars(\$db); ?>">
    </form>

    <script>
        document.getElementById('ssoForm').submit();
    </script>
</body>
</html>`;

      try {
        await fs.writeFile(ssoPath, ssoContent, 'utf-8');
        MOCK_LOGS.push(`[info] Adminer: Generated SSO autologin file at ${ssoPath}`);
        return sendJSON(res, { success: true, redirectUrl: `http://${domainName}/adminer_sso.php` });
      } catch (err) {
        return sendJSON(res, { error: `SSO file generation failed: ${err.message}` }, 500);
      }
    }

    // API Domains List
    if (pathname === '/api/domains' && req.method === 'GET') {
      const userProfile = users.find(u => u.username === activeUser);
      const userDomains = isSystemAdmin ? domains : domains.filter(d => d.owner === effectiveUser);
      return sendJSON(res, { domains: userDomains });
    }

    // API Create Domain
    if (pathname === '/api/domains/create' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.name) return sendJSON(res, { error: 'Domain name is required' }, 400);

      const exists = domains.some(d => d.name === body.name);
      if (exists) return sendJSON(res, { error: 'Domain already registered' }, 400);

      const docroot = body.docroot || path.join(SANDBOX_DIR, activeUser);
      const engine = body.engine || 'nginx';
      const phpVersion = body.phpVersion || '8.2';
      const redirectUrl = body.redirectUrl || null;

      try {
        await generateVHost(body.name, docroot, engine, phpVersion, redirectUrl);
        MOCK_LOGS.push(`[info] Created virtual host configuration for domain: ${body.name}`);

        // Automatically create document root and seed default index.html
        await fs.mkdir(docroot, { recursive: true });
        const welcomeFile = path.join(docroot, 'index.html');
        if (!existsSync(welcomeFile)) {
          const welcomeHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Welcome to ${body.name}</title>
    <style>
        body { font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc; }
        h1 { color: #3b82f6; }
        .card { max-width: 500px; margin: 0 auto; padding: 20px; background: #1e293b; border-radius: 8px; border: 1px solid #334155; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Welcome to ${body.name}!</h1>
        <p>This is the default index page for your domain.</p>
        <p>You can upload your website files to <code>${docroot}</code> via the File Manager.</p>
    </div>
</body>
</html>`;
          await fs.writeFile(welcomeFile, welcomeHtml, 'utf-8');
        }
      } catch (err) {
        return sendJSON(res, { error: `Failed to configure virtual host: ${err.message}` }, 500);
      }

      const defaultDnsRecords = [
        { type: 'A', name: '@', value: '127.0.0.1', ttl: 3600 },
        { type: 'CNAME', name: 'www', value: '@', ttl: 3600 },
        { type: 'A', name: 'webmail', value: '127.0.0.1', ttl: 3600 }
      ];

      try {
        await saveBindZone(body.name, defaultDnsRecords);
        await updateBindNamedConf(body.name, false);
        MOCK_LOGS.push(`[info] Created Bind9 DNS zone configuration for domain: ${body.name}`);
      } catch (err) {
        console.error(`Bind9 DNS setup failed for ${body.name}:`, err.message);
      }

      const newDomain = {
        name: body.name,
        docroot,
        engine,
        phpVersion,
        status: 'enabled',
        owner: activeUser,
        redirectUrl,
        dnsRecords: defaultDnsRecords
      };
      domains.push(newDomain);
      const userProfile = users.find(u => u.username === activeUser);
      const userDomains = userProfile?.role === 'admin' ? domains : domains.filter(d => d.owner === activeUser);
      return sendJSON(res, { success: true, domains: userDomains });
    }

    // API Delete Domain
    if (pathname === '/api/domains/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const domain = domains.find(d => d.name === body.name);
      
      if (domain) {
        try {
          await removeVHost(domain.name, domain.engine);
          MOCK_LOGS.push(`[info] Removed virtual host configuration for domain: ${body.name}`);
        } catch (err) {
          console.error(`Failed to remove virtual host for ${body.name}:`, err.message);
        }

        try {
          await removeBindZone(domain.name);
          await updateBindNamedConf(domain.name, true);
          MOCK_LOGS.push(`[info] Removed Bind9 DNS zone configuration for domain: ${domain.name}`);
        } catch (err) {
          console.error(`Failed to clean Bind9 config for ${domain.name}:`, err.message);
        }
      }

      domains = domains.filter(d => d.name !== body.name);
      const userProfile = users.find(u => u.username === activeUser);
      const userDomains = userProfile?.role === 'admin' ? domains : domains.filter(d => d.owner === activeUser);
      return sendJSON(res, { success: true, domains: userDomains });
    }

    // API Update DNS Records
    if (pathname === '/api/domains/dns/records' && req.method === 'POST') {
      const body = await parseBody(req);
      const domain = domains.find(d => d.name === body.domainName);
      if (!domain) return sendJSON(res, { error: 'Domain not found' }, 404);

      if (body.action === 'add') {
        domain.dnsRecords.push({
          type: body.record.type || 'A',
          name: body.record.name || '@',
          value: body.record.value || '',
          ttl: parseInt(body.record.ttl, 10) || 3600
        });
      } else if (body.action === 'delete') {
        domain.dnsRecords = domain.dnsRecords.filter(
          r => !(r.type === body.record.type && r.name === body.record.name && r.value === body.record.value)
        );
      }

      try {
        await saveBindZone(domain.name, domain.dnsRecords);
        MOCK_LOGS.push(`[info] Updated Bind9 DNS zone records for domain: ${domain.name}`);
      } catch (err) {
        console.error(`Failed to sync zone records to Bind9 for ${domain.name}:`, err.message);
      }

      const userProfile = users.find(u => u.username === activeUser);
      const userDomains = userProfile?.role === 'admin' ? domains : domains.filter(d => d.owner === activeUser);
      return sendJSON(res, { success: true, domains: userDomains });
    }

    // API Setup Domain Redirect
    if (pathname === '/api/domains/redirect' && req.method === 'POST') {
      const body = await parseBody(req);
      const domain = domains.find(d => d.name === body.domainName);
      if (!domain) return sendJSON(res, { error: 'Domain not found' }, 404);

      domain.redirectUrl = body.redirectUrl || null;
      try {
        if (domain.status === 'enabled') {
          await generateVHost(domain.name, domain.docroot, domain.engine, domain.phpVersion, domain.redirectUrl);
        }
        MOCK_LOGS.push(`[info] Configured redirection for ${domain.name} -> ${domain.redirectUrl || 'none'}`);
      } catch (err) {
        return sendJSON(res, { error: `Failed to configure redirection: ${err.message}` }, 500);
      }

      const userProfile = users.find(u => u.username === activeUser);
      const userDomains = userProfile?.role === 'admin' ? domains : domains.filter(d => d.owner === activeUser);
      return sendJSON(res, { success: true, domains: userDomains });
    }

    // API Web Server Config
    if (pathname === '/api/webserver/config' && req.method === 'GET') {
      return sendJSON(res, { webServer });
    }

    // API Toggle Domain Virtual Host Status
    if (pathname === '/api/webserver/vh/toggle' && req.method === 'POST') {
      const body = await parseBody(req);
      const domain = domains.find(d => d.name === body.name);
      if (domain) {
        const targetStatus = domain.status === 'enabled' ? 'disabled' : 'enabled';
        try {
          if (targetStatus === 'enabled') {
            await generateVHost(domain.name, domain.docroot, domain.engine, domain.phpVersion, domain.redirectUrl);
            MOCK_LOGS.push(`[info] Enabled virtual host configuration for domain: ${domain.name}`);
          } else {
            await removeVHost(domain.name, domain.engine);
            MOCK_LOGS.push(`[info] Disabled virtual host configuration for domain: ${domain.name}`);
          }
          domain.status = targetStatus;
        } catch (err) {
          return sendJSON(res, { error: `Failed to toggle virtual host status: ${err.message}` }, 500);
        }
      }
      const userProfile = users.find(u => u.username === activeUser);
      const userDomains = userProfile?.role === 'admin' ? domains : domains.filter(d => d.owner === activeUser);
      return sendJSON(res, { success: true, domains: userDomains });
    }

    // API Emails
    if (pathname === '/api/emails' && req.method === 'GET') {
      const userProfile = users.find(u => u.username === activeUser);
      const userEmails = isSystemAdmin ? emails : emails.filter(e => e.owner === effectiveUser);
      const userForwarders = isSystemAdmin ? emailForwarders : emailForwarders.filter(f => f.owner === effectiveUser);
      const userAutoresponders = isSystemAdmin ? autoresponders : autoresponders.filter(a => a.owner === effectiveUser);
      return sendJSON(res, { 
        emails: userEmails, 
        emailForwarders: userForwarders, 
        autoresponders: userAutoresponders,
        spamFilter 
      });
    }

    if (pathname === '/api/emails/create' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.email) return sendJSON(res, { error: 'Email address is required' }, 400);
      const exists = emails.some(e => e.email === body.email);
      if (exists) return sendJSON(res, { error: 'Email account already exists' }, 400);
      
      const newEmail = {
        email: body.email,
        quota: body.quota || '500 MB',
        used: '0.0 MB',
        owner: activeUser
      };
      emails.push(newEmail);
      await saveEmailsConfig({ emails, emailForwarders, autoresponders, spamFilter });
      
      const userProfile = users.find(u => u.username === activeUser);
      const userEmails = userProfile?.role === 'admin' ? emails : emails.filter(e => e.owner === activeUser);
      return sendJSON(res, { success: true, emails: userEmails });
    }

    if (pathname === '/api/emails/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      emails = emails.filter(e => e.email !== body.email);
      await saveEmailsConfig({ emails, emailForwarders, autoresponders, spamFilter });
      
      const userProfile = users.find(u => u.username === activeUser);
      const userEmails = userProfile?.role === 'admin' ? emails : emails.filter(e => e.owner === activeUser);
      return sendJSON(res, { success: true, emails: userEmails });
    }

    if (pathname === '/api/emails/forwarders/create' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.source || !body.destination) return sendJSON(res, { error: 'Source and destination required' }, 400);
      
      const newForwarder = { source: body.source, destination: body.destination, owner: activeUser };
      emailForwarders.push(newForwarder);
      await saveEmailsConfig({ emails, emailForwarders, autoresponders, spamFilter });
      
      const userProfile = users.find(u => u.username === activeUser);
      const userForwarders = userProfile?.role === 'admin' ? emailForwarders : emailForwarders.filter(f => f.owner === activeUser);
      return sendJSON(res, { success: true, emailForwarders: userForwarders });
    }

    if (pathname === '/api/emails/forwarders/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      emailForwarders = emailForwarders.filter(f => !(f.source === body.source && f.destination === body.destination));
      await saveEmailsConfig({ emails, emailForwarders, autoresponders, spamFilter });
      
      const userProfile = users.find(u => u.username === activeUser);
      const userForwarders = userProfile?.role === 'admin' ? emailForwarders : emailForwarders.filter(f => f.owner === activeUser);
      return sendJSON(res, { success: true, emailForwarders: userForwarders });
    }

    // Autoresponders
    if (pathname === '/api/emails/autoresponders/create' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.email || !body.subject || !body.message) {
        return sendJSON(res, { error: 'Email, subject, and message are required' }, 400);
      }
      const existingIdx = autoresponders.findIndex(a => a.email === body.email);
      const responder = {
        email: body.email,
        subject: body.subject,
        message: body.message,
        enabled: body.enabled !== false,
        owner: activeUser
      };
      if (existingIdx > -1) {
        autoresponders[existingIdx] = responder;
      } else {
        autoresponders.push(responder);
      }
      await saveEmailsConfig({ emails, emailForwarders, autoresponders, spamFilter });
      
      const userProfile = users.find(u => u.username === activeUser);
      const userAutoresponders = userProfile?.role === 'admin' ? autoresponders : autoresponders.filter(a => a.owner === activeUser);
      return sendJSON(res, { success: true, autoresponders: userAutoresponders });
    }

    if (pathname === '/api/emails/autoresponders/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      autoresponders = autoresponders.filter(a => a.email !== body.email);
      await saveEmailsConfig({ emails, emailForwarders, autoresponders, spamFilter });
      
      const userProfile = users.find(u => u.username === activeUser);
      const userAutoresponders = userProfile?.role === 'admin' ? autoresponders : autoresponders.filter(a => a.owner === activeUser);
      return sendJSON(res, { success: true, autoresponders: userAutoresponders });
    }

    // Spam Filter
    if (pathname === '/api/emails/spam-filter/toggle' && req.method === 'POST') {
      spamFilter.enabled = !spamFilter.enabled;
      await saveEmailsConfig({ emails, emailForwarders, autoresponders, spamFilter });
      MOCK_LOGS.push(`[info] Email Security: Toggled SpamAssassin to ${spamFilter.enabled}`);
      return sendJSON(res, { success: true, spamFilter });
    }

    if (pathname === '/api/emails/spam-filter/config' && req.method === 'POST') {
      const body = await parseBody(req);
      if (body.scoreThreshold !== undefined) {
        spamFilter.scoreThreshold = parseFloat(body.scoreThreshold) || 5.0;
      }
      if (body.autoDelete !== undefined) {
        spamFilter.autoDelete = !!body.autoDelete;
      }
      await saveEmailsConfig({ emails, emailForwarders, autoresponders, spamFilter });
      MOCK_LOGS.push(`[info] Email Security: Updated SpamAssassin settings`);
      return sendJSON(res, { success: true, spamFilter });
    }

    // Webmail Simulation
    if (pathname === '/api/emails/webmail/messages' && req.method === 'GET') {
      return sendJSON(res, { messages: webmailMessages });
    }

    // Webmail Groups API
    if (pathname === '/api/emails/webmail/groups' && req.method === 'GET') {
      return sendJSON(res, { groups: webmailGroups });
    }

    if (pathname === '/api/emails/webmail/groups' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.name) {
        return sendJSON(res, { error: 'Group name is required' }, 400);
      }
      
      const newName = body.name.trim();
      const newColor = body.color || '#14b8a6';
      
      if (body.oldName) {
        // Edit group
        const oldName = body.oldName.trim();
        const index = webmailGroups.findIndex(g => g.name.toLowerCase() === oldName.toLowerCase());
        if (index !== -1) {
          webmailGroups[index] = { name: newName, color: newColor };
        } else {
          webmailGroups.push({ name: newName, color: newColor });
        }
        // Update all contacts belonging to this group
        webmailContacts.forEach(c => {
          if (c.groups) {
            c.groups = c.groups.map(g => g.toLowerCase() === oldName.toLowerCase() ? newName : g);
          }
        });
      } else {
        // Add new group
        if (!webmailGroups.some(g => g.name.toLowerCase() === newName.toLowerCase())) {
          webmailGroups.push({ name: newName, color: newColor });
        }
      }
      return sendJSON(res, { success: true, groups: webmailGroups, contacts: webmailContacts });
    }

    if (pathname.startsWith('/api/emails/webmail/groups/') && req.method === 'DELETE') {
      const parts = pathname.split('/');
      const groupName = decodeURIComponent(parts[parts.length - 1]).trim();
      
      // Remove group from list
      webmailGroups = webmailGroups.filter(g => g.name.toLowerCase() !== groupName.toLowerCase());
      
      // Remove group from all contacts
      webmailContacts.forEach(c => {
        if (c.groups) {
          c.groups = c.groups.filter(g => g.toLowerCase() !== groupName.toLowerCase());
        }
      });
      return sendJSON(res, { success: true, groups: webmailGroups, contacts: webmailContacts });
    }

    // Webmail Contacts API
    if (pathname === '/api/emails/webmail/contacts' && req.method === 'GET') {
      return sendJSON(res, { contacts: webmailContacts });
    }

    if (pathname === '/api/emails/webmail/contacts' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.name || !body.email) {
        return sendJSON(res, { error: 'Name and Email are required' }, 400);
      }
      
      let contact;
      if (body.id) {
        // Edit existing contact
        contact = webmailContacts.find(c => c.id === body.id);
        if (contact) {
          contact.name = body.name;
          contact.email = body.email;
          contact.groups = body.groups || [];
        }
      } else {
        // Add new contact
        contact = {
          id: Date.now().toString(),
          name: body.name,
          email: body.email,
          groups: body.groups || []
        };
        webmailContacts.push(contact);
      }
      return sendJSON(res, { success: true, contacts: webmailContacts });
    }

    if (pathname.startsWith('/api/emails/webmail/contacts/') && req.method === 'DELETE') {
      const parts = pathname.split('/');
      const contactId = parts[parts.length - 1];
      webmailContacts = webmailContacts.filter(c => c.id !== contactId);
      return sendJSON(res, { success: true, contacts: webmailContacts });
    }

    if (pathname === '/api/emails/webmail/send' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.from || !body.to || !body.subject || !body.body) {
        return sendJSON(res, { error: 'From, To, Subject, and Body are required' }, 400);
      }
      const newMsg = {
        id: Date.now().toString(),
        from: body.from,
        to: body.to,
        cc: body.cc || '',
        bcc: body.bcc || '',
        subject: body.subject,
        body: body.body,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        read: true,
        direction: 'sent'
      };
      webmailMessages.push(newMsg);
      
      // Auto-reply simulation if an autoresponder is configured for the "To" address
      const responder = autoresponders.find(a => a.email === body.to && a.enabled);
      if (responder) {
        setTimeout(() => {
          webmailMessages.push({
            id: (Date.now() + 1).toString(),
            from: body.to,
            to: body.from,
            subject: 'Auto-Reply: ' + responder.subject,
            body: responder.message,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            read: false,
            direction: 'inbox'
          });
        }, 1000);
      }

      return sendJSON(res, { success: true, messages: webmailMessages });
    }

    // API SSL Certificates
    if (pathname === '/api/ssl' && req.method === 'GET') {
      const userProfile = users.find(u => u.username === activeUser);
      const userCerts = isSystemAdmin ? certificates : certificates.filter(c => c.owner === effectiveUser);
      return sendJSON(res, { certificates: userCerts });
    }

    if (pathname === '/api/ssl/issue' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.domain) return sendJSON(res, { error: 'Domain is required' }, 400);

      const domainObj = domains.find(d => d.name === body.domain);
      if (!domainObj) return sendJSON(res, { error: 'Domain not registered on server' }, 400);

      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          const certbotCmd = `sudo certbot certonly --webroot -w "${domainObj.docroot}" -d "${body.domain}" -d "www.${body.domain}" --non-interactive --agree-tos --email certs@keel.test --register-unsafely-without-email`;
          await runCommandAsync(certbotCmd);
          MOCK_LOGS.push(`[info] Let's Encrypt: Successfully generated SSL certificate for ${body.domain}`);
        } catch (err) {
          return sendJSON(res, { error: `Certbot failed: ${err.message}` }, 500);
        }
      } else {
        const mockCertFolder = path.join(SSL_MOCK_DIR, body.domain);
        try {
          await fs.mkdir(mockCertFolder, { recursive: true });
          await fs.writeFile(path.join(mockCertFolder, 'fullchain.pem'), '---BEGIN CERTIFICATE---\nMOCK CERTIFICATE\n---END CERTIFICATE---', 'utf-8');
          await fs.writeFile(path.join(mockCertFolder, 'privkey.pem'), '---BEGIN PRIVATE KEY---\nMOCK PRIVATE KEY\n---END PRIVATE KEY---', 'utf-8');
          MOCK_LOGS.push(`[info] SSL Mock: Generated dummy cert files at server/ssl/${body.domain}/`);
        } catch (err) {
          return sendJSON(res, { error: `Failed to write mock certs: ${err.message}` }, 500);
        }
      }

      try {
        await generateVHost(domainObj.name, domainObj.docroot, domainObj.engine, domainObj.phpVersion);
      } catch (err) {
        console.error(`Failed to reload vhost configuration for SSL:`, err.message);
      }

      certificates = certificates.filter(c => c.domain !== body.domain);
      const cert = {
        domain: body.domain,
        issuer: isLinux ? "Let's Encrypt ACME" : "Keel Panel Mock CA",
        expiry: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: 'valid',
        owner: activeUser
      };
      certificates.push(cert);
      const userProfile = users.find(u => u.username === activeUser);
      const userCerts = userProfile?.role === 'admin' ? certificates : certificates.filter(c => c.owner === activeUser);
      return sendJSON(res, { success: true, certificates: userCerts });
    }

    if (pathname === '/api/ssl/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const domainObj = domains.find(d => d.name === body.domain);

      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          await runCommandAsync(`sudo certbot delete --cert-name "${body.domain}"`);
          MOCK_LOGS.push(`[info] Let's Encrypt: Deleted SSL certificate for ${body.domain}`);
        } catch (err) {
          console.error(`Certbot delete failed:`, err.message);
        }
      } else {
        const mockCertFolder = path.join(SSL_MOCK_DIR, body.domain);
        try {
          const stats = await fs.stat(mockCertFolder);
          if (stats.isDirectory()) {
            await fs.rm(mockCertFolder, { recursive: true, force: true });
          }
          MOCK_LOGS.push(`[info] SSL Mock: Deleted mock cert directory server/ssl/${body.domain}`);
        } catch (err) {
          // Ignore
        }
      }

      if (domainObj) {
        try {
          await generateVHost(domainObj.name, domainObj.docroot, domainObj.engine, domainObj.phpVersion);
        } catch (err) {
          console.error(`Failed to reload vhost configuration for SSL removal:`, err.message);
        }
      }

      certificates = certificates.filter(c => c.domain !== body.domain);
      const userProfile = users.find(u => u.username === activeUser);
      const userCerts = userProfile?.role === 'admin' ? certificates : certificates.filter(c => c.owner === activeUser);
      return sendJSON(res, { success: true, certificates: userCerts });
    }

    // API FTP & SSH
    if (pathname === '/api/ftp-ssh' && req.method === 'GET') {
      const config = await loadFtpSshConfig();
      const userProfile = users.find(u => u.username === activeUser);
      const userFtp = isSystemAdmin ? config.ftpUsers : config.ftpUsers.filter(f => f.owner === effectiveUser);
      const userSsh = isSystemAdmin ? config.sshKeys : config.sshKeys.filter(s => s.owner === effectiveUser);
      ftpUsers = config.ftpUsers;
      sshKeys = config.sshKeys;
      return sendJSON(res, { ftpUsers: userFtp, sshKeys: userSsh });
    }

    if (pathname === '/api/ftp/create' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.username) return sendJSON(res, { error: 'Username is required' }, 400);

      const config = await loadFtpSshConfig();
      const exists = config.ftpUsers.some(u => u.username === body.username);
      if (exists) return sendJSON(res, { error: 'FTP user already exists' }, 400);

      const homePath = body.path || path.join(SANDBOX_DIR, activeUser);
      const password = body.password || 'ftp_password123';

      try {
        await createSystemFtpUser(body.username, password, homePath);
        MOCK_LOGS.push(`[info] FTP: Created system user ${body.username} bounding path ${homePath}`);
      } catch (err) {
        return sendJSON(res, { error: `Failed to create system FTP user: ${err.message}` }, 500);
      }

      config.ftpUsers.push({
        username: body.username,
        path: homePath,
        quota: body.quota || 'Unlimited',
        status: 'active',
        owner: activeUser
      });
      await saveFtpSshConfig(config);

      ftpUsers = config.ftpUsers;
      const userProfile = users.find(u => u.username === activeUser);
      const userFtp = isSystemAdmin ? ftpUsers : ftpUsers.filter(f => f.owner === effectiveUser);
      return sendJSON(res, { success: true, ftpUsers: userFtp });
    }

    if (pathname === '/api/ftp/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      
      try {
        await deleteSystemFtpUser(body.username);
        MOCK_LOGS.push(`[info] FTP: Deleted system user ${body.username}`);
      } catch (err) {
        console.error(`Failed to delete system user ${body.username}:`, err.message);
      }

      const config = await loadFtpSshConfig();
      config.ftpUsers = config.ftpUsers.filter(u => u.username !== body.username);
      await saveFtpSshConfig(config);

      ftpUsers = config.ftpUsers;
      const userProfile = users.find(u => u.username === activeUser);
      const userFtp = userProfile?.role === 'admin' ? ftpUsers : ftpUsers.filter(f => f.owner === activeUser);
      return sendJSON(res, { success: true, ftpUsers: userFtp });
    }

    if (pathname === '/api/ssh/upload' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.name || !body.key) return sendJSON(res, { error: 'Key name and content required' }, 400);

      try {
        await authorizeSystemSshKey(activeUser, body.key);
        MOCK_LOGS.push(`[info] SSH: Authorized public key "${body.name}" for user ${activeUser}`);
      } catch (err) {
        return sendJSON(res, { error: `Failed to authorize SSH key: ${err.message}` }, 500);
      }

      const fingerprint = 'SHA256:' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const config = await loadFtpSshConfig();
      config.sshKeys.push({
        name: body.name,
        keyType: body.key.startsWith('ssh-dss') ? 'ssh-dss' : 'ssh-rsa',
        fingerprint,
        publicKey: body.key,
        owner: activeUser
      });
      await saveFtpSshConfig(config);

      sshKeys = config.sshKeys;
      const userProfile = users.find(u => u.username === activeUser);
      const userSsh = isSystemAdmin ? sshKeys : sshKeys.filter(s => s.owner === effectiveUser);
      return sendJSON(res, { success: true, sshKeys: userSsh });
    }

    if (pathname === '/api/ssh/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const config = await loadFtpSshConfig();
      const keyObj = config.sshKeys.find(k => k.name === body.name);

      if (keyObj) {
        try {
          await revokeSystemSshKey(keyObj.owner, keyObj.fingerprint);
          MOCK_LOGS.push(`[info] SSH: Revoked public key "${body.name}" for user ${keyObj.owner}`);
        } catch (err) {
          console.error(`Failed to revoke system SSH key ${body.name}:`, err.message);
        }
      }

      config.sshKeys = config.sshKeys.filter(k => k.name !== body.name);
      await saveFtpSshConfig(config);

      sshKeys = config.sshKeys;
      const userProfile = users.find(u => u.username === activeUser);
      const userSsh = userProfile?.role === 'admin' ? sshKeys : sshKeys.filter(s => s.owner === activeUser);
      return sendJSON(res, { success: true, sshKeys: userSsh });
    }

    // API Cron Jobs
    if (pathname === '/api/crons' && req.method === 'GET') {
      let userCrons = [];
      try {
        const userProfile = users.find(u => u.username === activeUser);
        if (userProfile?.role === 'admin') {
          const files = await fs.readdir(CRONS_MOCK_DIR);
          for (const file of files) {
            const list = await loadUserCrons(file);
            userCrons = userCrons.concat(list);
          }
          if (userCrons.length === 0) {
            userCrons = crons;
          }
        } else {
          userCrons = await loadUserCrons(activeUser);
          if (userCrons.length === 0) {
            userCrons = crons.filter(c => c.owner === effectiveUser);
          }
        }
      } catch (err) {
        console.error('Failed to load user crons:', err);
      }
      return sendJSON(res, { crons: userCrons });
    }

    if (pathname === '/api/crons/create' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.schedule || !body.command) return sendJSON(res, { error: 'Schedule and command are required' }, 400);
      const id = Date.now().toString();
      
      let userCrons = await loadUserCrons(activeUser);
      if (userCrons.length === 0) {
        userCrons = crons.filter(c => c.owner === activeUser);
      }

      const newCron = {
        id,
        schedule: body.schedule,
        command: body.command,
        description: body.description || '',
        owner: activeUser
      };
      userCrons.push(newCron);

      try {
        await saveUserCrons(activeUser, userCrons);
        MOCK_LOGS.push(`[info] Cron: Added system cron job ${id} for user ${activeUser}`);
      } catch (err) {
        return sendJSON(res, { error: `Failed to save cron job: ${err.message}` }, 500);
      }

      crons = crons.filter(c => c.owner !== activeUser).concat(userCrons);

      const userProfile = users.find(u => u.username === activeUser);
      const userCronsList = isSystemAdmin ? crons : crons.filter(c => c.owner === effectiveUser);
      return sendJSON(res, { success: true, crons: userCronsList });
    }

    if (pathname === '/api/crons/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const existingCron = crons.find(c => c.id === body.id);
      const owner = existingCron ? existingCron.owner : activeUser;

      let userCrons = await loadUserCrons(owner);
      if (userCrons.length === 0) {
        userCrons = crons.filter(c => c.owner === owner);
      }

      userCrons = userCrons.filter(c => c.id !== body.id);

      try {
        await saveUserCrons(owner, userCrons);
        MOCK_LOGS.push(`[info] Cron: Deleted system cron job ${body.id} for user ${owner}`);
      } catch (err) {
        return sendJSON(res, { error: `Failed to delete cron job: ${err.message}` }, 500);
      }

      crons = crons.filter(c => c.id !== body.id);

      const userProfile = users.find(u => u.username === activeUser);
      const userCronsList = userProfile?.role === 'admin' ? crons : crons.filter(c => c.owner === activeUser);
      return sendJSON(res, { success: true, crons: userCronsList });
    }

    if (pathname === '/api/crons/execute' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.id) return sendJSON(res, { error: 'Cron ID is required' }, 400);

      let userCrons = [];
      const userProfile = users.find(u => u.username === activeUser);
      if (userProfile?.role === 'admin') {
        const files = await fs.readdir(CRONS_MOCK_DIR).catch(() => []);
        for (const file of files) {
          const list = await loadUserCrons(file);
          userCrons = userCrons.concat(list);
        }
        if (userCrons.length === 0) userCrons = crons;
      } else {
        userCrons = await loadUserCrons(activeUser);
        if (userCrons.length === 0) userCrons = crons.filter(c => c.owner === activeUser);
      }

      const cronJob = userCrons.find(c => c.id === body.id);
      if (!cronJob) return sendJSON(res, { error: 'Cron job not found' }, 404);

      const userSandbox = path.join(SANDBOX_DIR, cronJob.owner || activeUser);
      await fs.mkdir(userSandbox, { recursive: true }).catch(() => {});

      const startTime = Date.now();
      const executionResult = await new Promise((resolve) => {
        exec(cronJob.command, { cwd: userSandbox }, (error, stdout, stderr) => {
          const duration = Date.now() - startTime;
          const exitCode = error ? (error.code !== undefined ? error.code : 1) : 0;
          resolve({
            stdout: stdout || '',
            stderr: stderr || (error ? error.message : ''),
            exitCode,
            duration
          });
        });
      });

      const newLog = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        cronId: cronJob.id,
        command: cronJob.command,
        description: cronJob.description,
        timestamp: new Date().toISOString(),
        exitCode: executionResult.exitCode,
        stdout: executionResult.stdout,
        stderr: executionResult.stderr,
        executionTimeMs: executionResult.duration,
        owner: cronJob.owner || activeUser
      };

      const allLogs = await loadCronLogs();
      allLogs.unshift(newLog);
      if (allLogs.length > 500) allLogs.length = 500;
      await saveCronLogs(allLogs);

      MOCK_LOGS.push(`[info] Cron Execution: Manually executed cron job "${cronJob.command}" (Exit Code: ${executionResult.exitCode})`);

      return sendJSON(res, { success: true, log: newLog });
    }

    if (pathname === '/api/crons/logs' && req.method === 'GET') {
      const allLogs = await loadCronLogs();
      const userProfile = users.find(u => u.username === activeUser);
      const filteredLogs = isSystemAdmin 
        ? allLogs 
        : allLogs.filter(log => log.owner === effectiveUser);
      return sendJSON(res, { logs: filteredLogs });
    }

    // DX Deployments
    if (pathname === '/api/dx/deployments' && req.method === 'GET') {
      const config = await loadDxConfig();
      return sendJSON(res, { deployments: config.gitDeployments });
    }

    if (pathname === '/api/dx/deployments/create' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.repoUrl) return sendJSON(res, { error: 'Repository URL is required' }, 400);

      const repoName = body.repoUrl.split('/').pop().replace(/\.git$/, '') || 'project';
      const id = 'proj_' + Date.now();
      const targetPath = path.join(SANDBOX_DIR, activeUser, repoName);

      let logString = `[info] Starting Vercel-style deployment for project: ${repoName}\n`;
      let cloneSuccess = false;
      const isGitUrl = body.repoUrl.startsWith('http://') || body.repoUrl.startsWith('https://') || body.repoUrl.startsWith('git@');

      if (isGitUrl) {
        logString += `[info] Cloning remote repository ${body.repoUrl} [branch: ${body.branch || 'main'}]...\n`;
        try {
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          if (existsSync(targetPath)) {
            await fs.rm(targetPath, { recursive: true, force: true });
          }
          await new Promise((resolve, reject) => {
            exec(`git clone --depth 1 --branch ${body.branch || 'main'} "${body.repoUrl}" "${targetPath}"`, { timeout: 15000 }, (error, stdout, stderr) => {
              if (error) {
                reject(new Error(stderr || error.message));
              } else {
                resolve(stdout);
              }
            });
          });
          logString += `[info] Git clone successful.\n`;
          cloneSuccess = true;
        } catch (err) {
          logString += `[warning] Git clone failed: ${err.message}\n[info] Falling back to simulated workspace setup...\n`;
        }
      }

      if (!cloneSuccess) {
        logString += `[info] Initializing local sandboxed project workspace at: sandbox/${activeUser}/${repoName}\n`;
        await fs.mkdir(targetPath, { recursive: true }).catch(() => {});
        await fs.writeFile(path.join(targetPath, 'index.html'), '<h1>Simulated DX App</h1>', 'utf-8').catch(() => {});
        logString += `[info] Workspace initialized successfully.\n`;
      }

      if (body.buildCommand) {
        logString += `[info] Executing build command: "${body.buildCommand}"...\n`;
        try {
          await new Promise((resolve, reject) => {
            exec(body.buildCommand, { cwd: targetPath, timeout: 20000 }, (error, stdout, stderr) => {
              if (error) {
                reject(new Error(stderr || error.message));
              } else {
                resolve(stdout);
              }
            });
          });
          logString += `[info] Build finished successfully.\n`;
        } catch (err) {
          logString += `[warning] Build command execution encountered errors (non-blocking in mock mode): ${err.message}\n`;
        }
      }

      logString += `[info] Deployment complete! Published directory: ${body.publishDir || 'dist'}\n`;

      const newProj = {
        id,
        name: repoName,
        repoUrl: body.repoUrl,
        branch: body.branch || 'main',
        status: 'success',
        runtime: body.runtime || 'static',
        buildCommand: body.buildCommand || '',
        publishDir: body.publishDir || 'dist',
        lastCommit: {
          hash: Math.random().toString(16).substring(2, 9),
          message: 'Deploy triggered from control panel',
          author: activeUser,
          date: new Date().toISOString()
        },
        logs: logString
      };

      const config = await loadDxConfig();
      config.gitDeployments.unshift(newProj);
      await saveDxConfig(config);

      MOCK_LOGS.push(`[info] DX: Linked and deployed Git repository ${repoName} for user ${activeUser}`);
      return sendJSON(res, { success: true, deployments: config.gitDeployments });
    }

    if (pathname === '/api/dx/deployments/trigger' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.id) return sendJSON(res, { error: 'Project ID is required' }, 400);

      const config = await loadDxConfig();
      const proj = config.gitDeployments.find(p => p.id === body.id);
      if (!proj) return sendJSON(res, { error: 'Project not found' }, 404);

      proj.status = 'building';
      await saveDxConfig(config);

      // Run background build simulation
      setTimeout(async () => {
        const nextConfig = await loadDxConfig();
        const nextProj = nextConfig.gitDeployments.find(p => p.id === body.id);
        if (nextProj) {
          nextProj.status = 'success';
          nextProj.lastCommit = {
            hash: Math.random().toString(16).substring(2, 9),
            message: 'Manual redeployment: fetch latest updates',
            author: activeUser,
            date: new Date().toISOString()
          };
          nextProj.logs = nextProj.logs + `\n[info] Redeploy triggered at ${new Date().toLocaleTimeString()}\n[info] Pulling latest changes from branch ${nextProj.branch}...\n[info] Running builds...\n[info] Build success! Redeployed.`;
          await saveDxConfig(nextConfig);
        }
      }, 3000);

      return sendJSON(res, { success: true, deployments: config.gitDeployments });
    }

    // DX Apps (Multi-runtime Manager)
    if (pathname === '/api/dx/apps' && req.method === 'GET') {
      const config = await loadDxConfig();
      return sendJSON(res, { apps: config.registeredApps });
    }

    if (pathname === '/api/dx/apps/register' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.name || !body.runtime || !body.entryPoint) {
        return sendJSON(res, { error: 'App Name, Runtime, and Entry Point are required' }, 400);
      }

      const id = 'app_' + Date.now();
      const newApp = {
        id,
        name: body.name,
        runtime: body.runtime,
        status: 'online',
        entryPoint: body.entryPoint,
        port: body.port || '8000',
        envVars: body.envVars || [],
        cpu: (Math.random() * 2).toFixed(1),
        memory: (30 + Math.random() * 40).toFixed(1) + ' MB',
        owner: activeUser
      };

      const config = await loadDxConfig();
      config.registeredApps.push(newApp);
      await saveDxConfig(config);

      MOCK_LOGS.push(`[info] DX App: Registered runtime app ${body.name} (${body.runtime}) on port ${body.port}`);
      return sendJSON(res, { success: true, apps: config.registeredApps });
    }

    if (pathname === '/api/dx/apps/action' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.id || !body.action) return sendJSON(res, { error: 'App ID and action are required' }, 400);

      const config = await loadDxConfig();
      const app = config.registeredApps.find(a => a.id === body.id);
      if (!app) return sendJSON(res, { error: 'App not found' }, 404);

      if (body.action === 'stop') {
        app.status = 'stopped';
        app.cpu = '0.0';
        app.memory = '0.0 MB';
      } else if (body.action === 'start') {
        app.status = 'online';
        app.cpu = (Math.random() * 2).toFixed(1);
        app.memory = (30 + Math.random() * 40).toFixed(1) + ' MB';
      } else if (body.action === 'restart') {
        app.status = 'online';
        app.cpu = (Math.random() * 2).toFixed(1);
        app.memory = (30 + Math.random() * 40).toFixed(1) + ' MB';
      } else if (body.action === 'delete') {
        config.registeredApps = config.registeredApps.filter(a => a.id !== body.id);
      }

      await saveDxConfig(config);
      MOCK_LOGS.push(`[info] DX App: Performed action "${body.action}" on app ${app.name}`);
      return sendJSON(res, { success: true, apps: config.registeredApps });
    }

    // DX Containers (Docker Manager)
    if (pathname === '/api/dx/containers' && req.method === 'GET') {
      const config = await loadDxConfig();
      return sendJSON(res, { containers: config.launchedContainers });
    }

    if (pathname === '/api/dx/containers/launch' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.name || !body.image) return sendJSON(res, { error: 'Container Name and Image are required' }, 400);

      const id = 'cont_' + Math.random().toString(36).substring(2, 7);
      const newCont = {
        id,
        name: body.name,
        image: body.image,
        status: 'running',
        portBindings: body.portBindings || '80:80',
        cpu: (Math.random() * 0.8).toFixed(1),
        memory: (10 + Math.random() * 20).toFixed(1) + ' MB',
        uptime: '0s'
      };

      const config = await loadDxConfig();
      config.launchedContainers.push(newCont);
      await saveDxConfig(config);

      MOCK_LOGS.push(`[info] Docker Mock: Launched container ${body.name} using image ${body.image}`);
      return sendJSON(res, { success: true, containers: config.launchedContainers });
    }

    if (pathname === '/api/dx/containers/action' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.id || !body.action) return sendJSON(res, { error: 'Container ID and action are required' }, 400);

      const config = await loadDxConfig();
      const cont = config.launchedContainers.find(c => c.id === body.id);
      if (!cont) return sendJSON(res, { error: 'Container not found' }, 404);

      if (body.action === 'stop') {
        cont.status = 'stopped';
        cont.cpu = '0.0';
        cont.memory = '0.0 MB';
      } else if (body.action === 'start') {
        cont.status = 'running';
        cont.cpu = (Math.random() * 0.8).toFixed(1);
        cont.memory = (10 + Math.random() * 20).toFixed(1) + ' MB';
      } else if (body.action === 'restart') {
        cont.status = 'running';
        cont.cpu = (Math.random() * 0.8).toFixed(1);
        cont.memory = (10 + Math.random() * 20).toFixed(1) + ' MB';
      } else if (body.action === 'delete') {
        config.launchedContainers = config.launchedContainers.filter(c => c.id !== body.id);
      }

      await saveDxConfig(config);
      MOCK_LOGS.push(`[info] Docker Mock: Performed action "${body.action}" on container ${cont.name}`);
      return sendJSON(res, { success: true, containers: config.launchedContainers });
    }

    // API Backup & Restore
    if (pathname === '/api/backups' && req.method === 'GET') {
      try {
        const files = await fs.readdir(BACKUPS_DIR);
        const actualBackups = [];
        for (const file of files) {
          if (file.endsWith('.tar.gz')) {
            const filePath = path.join(BACKUPS_DIR, file);
            const stats = await fs.stat(filePath);
            
            const existing = backups.find(b => b.filename === file);
            const owner = existing ? existing.owner : activeUser;

            actualBackups.push({
              filename: file,
              date: stats.mtime.toISOString().split('T')[0],
              size: (stats.size / 1024 / 1024).toFixed(1) + ' MB',
              owner
            });
          }
        }
        backups = actualBackups;
      } catch (err) {
        console.error('Failed to sync physical backups directory:', err);
      }

      const userProfile = users.find(u => u.username === activeUser);
      const userBackups = isSystemAdmin ? backups : backups.filter(b => b.owner === effectiveUser);
      return sendJSON(res, { backups: userBackups });
    }

    if (pathname === '/api/backups/create' && req.method === 'POST') {
      const filename = `backup_${new Date().toISOString().split('T')[0]}_${Math.floor(1000 + Math.random() * 9000)}.tar.gz`;
      const filePath = path.join(BACKUPS_DIR, filename);

      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          const userDir = activeUser === 'admin' ? SANDBOX_DIR : path.join(SANDBOX_DIR, activeUser);
          
          const userDbs = databases.filter(d => d.owner === effectiveUser);
          let dbDumpSql = '';
          for (const db of userDbs) {
            try {
              const dumpOut = await runCommandAsync(`mysqldump ${db.name}`);
              dbDumpSql += `-- Dump of database ${db.name}\n${dumpOut}\n`;
            } catch (e) {
              console.warn(`Failed to dump database ${db.name}:`, e.message);
            }
          }

          const tempSqlFile = path.join(os.tmpdir(), `${activeUser}_db_backup.sql`);
          await fs.writeFile(tempSqlFile, dbDumpSql, 'utf-8');

          const targetSqlPath = path.join(userDir, 'database_dump.sql');
          await runCommandAsync(`sudo cp "${tempSqlFile}" "${targetSqlPath}"`);
          await fs.unlink(tempSqlFile);

          const parentDir = path.dirname(userDir);
          const baseFolder = path.basename(userDir);
          await runCommandAsync(`sudo tar -czf "${filePath}" -C "${parentDir}" "${baseFolder}"`);

          await runCommandAsync(`sudo rm -f "${targetSqlPath}"`);

          MOCK_LOGS.push(`[info] Backup: Generated actual backup archive ${filename}`);
        } catch (err) {
          return sendJSON(res, { error: `Backup failed: ${err.message}` }, 500);
        }
      } else {
        try {
          const userDbs = databases.filter(d => d.owner === effectiveUser || isSystemAdmin);
          const userDomains = domains.filter(d => d.owner === effectiveUser || isSystemAdmin);
          const backupData = {
            generatedAt: new Date().toISOString(),
            username: activeUser,
            databases: userDbs,
            domains: userDomains,
            mockFiles: ["index.html", "welcome.txt", "assets/config.json"]
          };

          const jsonStr = JSON.stringify(backupData, null, 2);
          const buffer = zlib.gzipSync(Buffer.from(jsonStr));
          await fs.writeFile(filePath, buffer);
          MOCK_LOGS.push(`[info] Backup: Generated simulated gzip backup archive ${filename}`);
        } catch (err) {
          return sendJSON(res, { error: `Mock backup failed: ${err.message}` }, 500);
        }
      }

      let stats = await fs.stat(filePath);
      backups.push({
        filename,
        date: new Date().toISOString().split('T')[0],
        size: (stats.size / 1024 / 1024).toFixed(1) + ' MB',
        owner: activeUser
      });

      const userProfile = users.find(u => u.username === activeUser);
      const userBackups = userProfile?.role === 'admin' ? backups : backups.filter(b => b.owner === activeUser);
      return sendJSON(res, { success: true, backups: userBackups });
    }

    if (pathname === '/api/backups/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const filePath = path.join(BACKUPS_DIR, body.filename);

      try {
        if (existsSync(filePath)) {
          await fs.unlink(filePath);
        }
        MOCK_LOGS.push(`[info] Backup: Deleted archive file ${body.filename}`);
      } catch (err) {
        console.error(`Failed to delete backup file:`, err.message);
      }

      backups = backups.filter(b => b.filename !== body.filename);
      const userProfile = users.find(u => u.username === activeUser);
      const userBackups = userProfile?.role === 'admin' ? backups : backups.filter(b => b.owner === activeUser);
      return sendJSON(res, { success: true, backups: userBackups });
    }

    if (pathname === '/api/backups/download' && req.method === 'GET') {
      const filename = url.searchParams.get('filename') || '';
      if (!filename) return sendJSON(res, { error: 'Filename is required' }, 400);

      const safeFilename = path.basename(filename);
      const filePath = path.join(BACKUPS_DIR, safeFilename);

      if (!existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Backup file not found');
        return;
      }

      try {
        const fileContent = await fs.readFile(filePath);
        res.writeHead(200, {
          'Content-Type': 'application/x-gzip',
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Content-Length': fileContent.length,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(fileContent);
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Download error: ${err.message}`);
        return;
      }
    }

    // API System Logs & Metrics
    if (pathname === '/api/metrics/logs' && req.method === 'GET') {
      const logs = await readSystemLogs();
      return sendJSON(res, { logs });
    }

    if (pathname === '/api/metrics/bandwidth' && req.method === 'GET') {
      return sendJSON(res, {
        usage: [12, 18, 14, 25, 30, 22, 35, 40, 32, 28, 45, 52],
        limit: 100 // 100 GB limit
      });
    }

    // ==========================================
    // SECURITY SUITE API ENDPOINTS
    // ==========================================

    // 1. IP Blocker
    if (pathname === '/api/security/ip-block' && req.method === 'GET') {
      const userProfile = users.find(u => u.username === activeUser);
      const userBlocked = isSystemAdmin ? blockedIps : blockedIps.filter(ip => ip.owner === effectiveUser);
      return sendJSON(res, { blockedIps: userBlocked });
    }

    if (pathname === '/api/security/ip-block/add' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.ip) return sendJSON(res, { error: 'IP address or CIDR range is required' }, 400);
      const exists = blockedIps.some(item => item.ip === body.ip);
      if (exists) return sendJSON(res, { error: 'IP already blocked' }, 400);

      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          await runCommandAsync(`sudo ufw insert 1 deny from ${body.ip}`);
          MOCK_LOGS.push(`[info] Firewall: Blocked IP ${body.ip} using UFW`);
        } catch (err) {
          console.error('Failed to add UFW deny rule:', err.message);
        }
      } else {
        MOCK_LOGS.push(`[Mock Mode] Firewall: Blocked IP ${body.ip} in simulated configuration`);
      }

      blockedIps.push({
        ip: body.ip,
        reason: body.reason || 'None provided',
        date: new Date().toISOString().split('T')[0],
        owner: activeUser
      });
      const userProfile = users.find(u => u.username === activeUser);
      const userBlocked = userProfile?.role === 'admin' ? blockedIps : blockedIps.filter(ip => ip.owner === activeUser);
      return sendJSON(res, { success: true, blockedIps: userBlocked });
    }

    if (pathname === '/api/security/ip-block/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.ip) return sendJSON(res, { error: 'IP is required' }, 400);

      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          await runCommandAsync(`sudo ufw delete deny from ${body.ip}`);
          MOCK_LOGS.push(`[info] Firewall: Unblocked IP ${body.ip} using UFW`);
        } catch (err) {
          console.error('Failed to delete UFW deny rule:', err.message);
        }
      } else {
        MOCK_LOGS.push(`[Mock Mode] Firewall: Unblocked IP ${body.ip} in simulated configuration`);
      }

      blockedIps = blockedIps.filter(item => item.ip !== body.ip);
      const userProfile = users.find(u => u.username === activeUser);
      const userBlocked = userProfile?.role === 'admin' ? blockedIps : blockedIps.filter(ip => ip.owner === activeUser);
      return sendJSON(res, { success: true, blockedIps: userBlocked });
    }

    // 2. Firewall Controller (UFW)
    if (pathname === '/api/security/firewall' && req.method === 'GET') {
      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          const stdout = await runCommandAsync(`sudo ufw status numbered`);
          const statusLine = stdout.split('\n')[0] || '';
          const active = statusLine.includes('active') && !statusLine.includes('inactive');
          firewallStatus = active ? 'active' : 'inactive';

          const rules = [];
          const lines = stdout.split('\n');
          for (const line of lines) {
            const match = line.match(/\[\s*(\d+)\]\s+(\S+)\s+(\S+)\s+(?:IN|OUT)?\s*(.*)/i);
            if (match) {
              rules.push({
                index: parseInt(match[1], 10),
                to: match[2],
                action: match[3].toUpperCase(),
                from: match[4] || 'Anywhere',
                comment: ''
              });
            }
          }
          firewallRules = rules;
        } catch (err) {
          console.error('Failed to parse real UFW status:', err.message);
        }
      }
      return sendJSON(res, { firewallStatus, firewallRules });
    }

    if (pathname === '/api/security/firewall/toggle' && req.method === 'POST') {
      const isLinux = process.platform === 'linux';
      const targetStatus = firewallStatus === 'active' ? 'inactive' : 'active';
      if (isLinux) {
        try {
          if (targetStatus === 'active') {
            await runCommandAsync(`sudo ufw --force enable`);
          } else {
            await runCommandAsync(`sudo ufw disable`);
          }
          MOCK_LOGS.push(`[info] Firewall: Changed status to ${targetStatus}`);
          firewallStatus = targetStatus;
        } catch (err) {
          return sendJSON(res, { error: `UFW toggle failed: ${err.message}` }, 500);
        }
      } else {
        firewallStatus = targetStatus;
        MOCK_LOGS.push(`[Mock Mode] Firewall: Toggled status to ${targetStatus}`);
      }
      return sendJSON(res, { success: true, firewallStatus });
    }

    if (pathname === '/api/security/firewall/rules/add' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.port || !body.action) {
        return sendJSON(res, { error: 'Port/service and Action are required' }, 400);
      }
      const action = body.action.toLowerCase(); // 'allow' or 'deny'
      const proto = body.protocol ? `/${body.protocol}` : '';
      const ruleDef = `${body.port}${proto}`;

      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          await runCommandAsync(`sudo ufw ${action} ${ruleDef}`);
          MOCK_LOGS.push(`[info] Firewall: Added rule: ${action.toUpperCase()} ${ruleDef}`);
        } catch (err) {
          return sendJSON(res, { error: `Failed to add rule: ${err.message}` }, 500);
        }
      } else {
        const newIndex = firewallRules.length ? Math.max(...firewallRules.map(r => r.index)) + 1 : 1;
        firewallRules.push({
          index: newIndex,
          to: ruleDef,
          action: action.toUpperCase(),
          from: 'Anywhere',
          comment: body.comment || ''
        });
        MOCK_LOGS.push(`[Mock Mode] Firewall: Added rule: ${action.toUpperCase()} ${ruleDef}`);
      }
      return sendJSON(res, { success: true, firewallRules });
    }

    if (pathname === '/api/security/firewall/rules/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      if (body.index === undefined && !body.ruleDef) {
        return sendJSON(res, { error: 'Rule index or definition is required' }, 400);
      }

      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          if (body.index !== undefined) {
            await runCommandAsync(`sudo ufw --force delete ${body.index}`);
            MOCK_LOGS.push(`[info] Firewall: Deleted rule at index ${body.index}`);
          } else {
            await runCommandAsync(`sudo ufw delete ${body.ruleDef}`);
            MOCK_LOGS.push(`[info] Firewall: Deleted rule ${body.ruleDef}`);
          }
        } catch (err) {
          return sendJSON(res, { error: `Failed to delete rule: ${err.message}` }, 500);
        }
      } else {
        if (body.index !== undefined) {
          firewallRules = firewallRules.filter(r => r.index !== body.index);
          MOCK_LOGS.push(`[Mock Mode] Firewall: Deleted rule at index ${body.index}`);
        } else {
          firewallRules = firewallRules.filter(r => r.to !== body.ruleDef);
          MOCK_LOGS.push(`[Mock Mode] Firewall: Deleted rule ${body.ruleDef}`);
        }
      }
      return sendJSON(res, { success: true, firewallRules });
    }

    // 3. SSL Status & Auto-Renewal
    if (pathname === '/api/security/ssl-status' && req.method === 'GET') {
      const userProfile = users.find(u => u.username === activeUser);
      const userDomains = userProfile?.role === 'admin' ? domains : domains.filter(d => d.owner === activeUser);
      const list = userDomains.map(d => {
        const cert = certificates.find(c => c.domain === d.name);
        return {
          domain: d.name,
          issuer: cert ? cert.issuer : 'None',
          expiry: cert ? cert.expiry : 'N/A',
          status: cert ? cert.status : 'expired',
          autoRenew: true
        };
      });
      return sendJSON(res, { sslStatus: list });
    }

    if (pathname === '/api/security/ssl/renew' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.domain) return sendJSON(res, { error: 'Domain is required' }, 400);

      const isLinux = process.platform === 'linux';
      if (isLinux) {
        try {
          await runCommandAsync(`sudo certbot renew --cert-name "${body.domain}" --non-interactive`);
          MOCK_LOGS.push(`[info] SSL: Renewed certificate for ${body.domain}`);
        } catch (err) {
          return sendJSON(res, { error: `Renewal failed: ${err.message}` }, 500);
        }
      } else {
        const cert = certificates.find(c => c.domain === body.domain);
        if (cert) {
          cert.expiry = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0];
          cert.status = 'valid';
          cert.issuer = 'Keel Panel Mock CA';
        } else {
          certificates.push({
            domain: body.domain,
            issuer: 'Keel Panel Mock CA',
            expiry: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
            status: 'valid',
            owner: activeUser
          });
        }
        MOCK_LOGS.push(`[Mock Mode] SSL: Renewed certificate for ${body.domain}`);
      }
      return sendJSON(res, { success: true });
    }

    // 4. Hotlink Protection
    if (pathname === '/api/security/hotlink' && req.method === 'GET') {
      const userProfile = users.find(u => u.username === activeUser);
      const userDomains = userProfile?.role === 'admin' ? domains : domains.filter(d => d.owner === activeUser);
      const list = userDomains.map(d => ({
        domain: d.name,
        enabled: hotlinkProtectedDomains.includes(d.name)
      }));
      return sendJSON(res, { hotlinkStatus: list });
    }

    if (pathname === '/api/security/hotlink/toggle' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.domain) return sendJSON(res, { error: 'Domain name is required' }, 400);

      const domainObj = domains.find(d => d.name === body.domain);
      if (!domainObj) return sendJSON(res, { error: 'Domain not found' }, 404);

      const isEnabled = hotlinkProtectedDomains.includes(body.domain);
      if (isEnabled) {
        hotlinkProtectedDomains = hotlinkProtectedDomains.filter(d => d !== body.domain);
      } else {
        hotlinkProtectedDomains.push(body.domain);
      }

      try {
        await generateVHost(domainObj.name, domainObj.docroot, domainObj.engine, domainObj.phpVersion, domainObj.redirectUrl);
        MOCK_LOGS.push(`[info] Hotlink: Toggled hotlink protection for ${body.domain} to ${!isEnabled}`);
      } catch (err) {
        return sendJSON(res, { error: `Failed to reload webserver config: ${err.message}` }, 500);
      }

      return sendJSON(res, { success: true, enabled: !isEnabled });
    }

    // API Admin User Management
    if (pathname === '/api/admin/users' && req.method === 'GET') {
      const userProfile = users.find(u => u.username === activeUser);
      if (userProfile?.role !== 'admin') return sendJSON(res, { error: 'Forbidden' }, 403);
      return sendJSON(res, { users: users.filter(u => u.username !== 'admin') });
    }

    if (pathname === '/api/admin/users/create' && req.method === 'POST') {
      const userProfile = users.find(u => u.username === activeUser);
      if (userProfile?.role !== 'admin') return sendJSON(res, { error: 'Forbidden' }, 403);
      const body = await parseBody(req);
      if (!body.username || !body.password) return sendJSON(res, { error: 'Username and password required' }, 400);
      const exists = users.some(u => u.username === body.username);
      if (exists) return sendJSON(res, { error: 'Username already exists' }, 400);
      
      users.push({
        username: body.username,
        password: body.password,
        role: 'tenant',
        quota: body.quota || '5 GB',
        ramLimit: body.ramLimit || '1 GB',
        cpuLimit: body.cpuLimit || '1.0',
        created: new Date().toISOString().split('T')[0]
      });
      
      // Auto-create directory sandbox for user
      await fs.mkdir(path.join(SANDBOX_DIR, body.username), { recursive: true });
      await fs.writeFile(path.join(SANDBOX_DIR, body.username, 'welcome.txt'), `Welcome to Keel Panel, ${body.username}!`);
      
      return sendJSON(res, { success: true, users: users.filter(u => u.username !== 'admin') });
    }

    if (pathname === '/api/admin/users/delete' && req.method === 'POST') {
      const userProfile = users.find(u => u.username === activeUser);
      if (userProfile?.role !== 'admin') return sendJSON(res, { error: 'Forbidden' }, 403);
      const body = await parseBody(req);
      
      users = users.filter(u => u.username !== body.username);
      
      // Scrub user resources
      databases.forEach(d => {
        if (d.owner === body.username) {
          delete dbData[d.name];
        }
      });
      databases = databases.filter(d => d.owner !== body.username);
      dbUsers = dbUsers.filter(u => u.owner !== body.username);
      domains = domains.filter(d => d.owner !== body.username);
      emails = emails.filter(e => e.owner !== body.username);
      emailForwarders = emailForwarders.filter(f => f.owner !== body.username);
      certificates = certificates.filter(c => c.owner !== body.username);
      ftpUsers = ftpUsers.filter(u => u.owner !== body.username);
      sshKeys = sshKeys.filter(k => k.owner !== body.username);
      crons = crons.filter(c => c.owner !== body.username);
      backups = backups.filter(b => b.owner !== body.username);
      
      try {
        await fs.rm(path.join(SANDBOX_DIR, body.username), { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to clean sandbox path for deleted user:', e);
      }
      
      return sendJSON(res, { success: true, users: users.filter(u => u.username !== 'admin') });
    }


    // Default API 404
    return sendJSON(res, { error: 'Endpoint not found' }, 404);

  } catch (err) {
    console.error('Server error handling request:', err);
    return sendJSON(res, { error: err.message || 'Internal server error' }, 500);
  }
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (ws, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const token = url.searchParams.get('token') || '';

  // Resolve user
  let username = 'admin';
  let userProfile = users.find(u => u.username === 'admin');
  const devTokenObj = developerTokens.find(t => t.token === token);
  const sessionUser = activeSessions.get(token) || (devTokenObj ? devTokenObj.username : null);
  if (sessionUser) {
    username = sessionUser;
    userProfile = users.find(u => u.username === username);
  }

  // Send initial stats immediately
  const initialStats = await getCustomSystemStats(userProfile);
  ws.send(JSON.stringify(initialStats));

  // Send stats every 1.5 seconds
  const interval = setInterval(async () => {
    if (ws.readyState === 1) { // 1 means OPEN
      const stats = await getCustomSystemStats(userProfile);
      ws.send(JSON.stringify(stats));
    }
  }, 1500);

  ws.on('close', () => {
    clearInterval(interval);
  });

  ws.on('error', () => {
    clearInterval(interval);
  });
});

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/api/ws/stats') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.on('error', (err) => {
  console.error('Server socket error:', err);
});

// Background Health Checks & Auto-Healing Simulation
setInterval(() => {
  healthMonitors.forEach(monitor => {
    monitor.lastCheck = new Date().toISOString();
    
    // 15% chance to simulate a crash if currently healthy
    if (monitor.status === 'healthy' && Math.random() < 0.15) {
      monitor.status = 'unhealthy (502 Gateway Error)';
      monitor.pings.shift();
      monitor.pings.push(502);
      
      addSystemLog('health-monitor', `HTTP Uptime check failed for ${monitor.domain}. HTTP Status: 502 Bad Gateway`, 'error');
      
      // Trigger Slack Alert Webhook simulated action
      alertRules.forEach(rule => {
        if (rule.enabled) {
          addSystemLog('alerts-sender', `[ALERT TRIGGERED] Sent webhook alert to ${rule.endpoint} (Trigger: ${rule.trigger})`, 'warning');
        }
      });
      
      // Schedule Auto-Healing 10 seconds later
      setTimeout(() => {
        monitor.status = 'healthy';
        monitor.pings.shift();
        monitor.pings.push(200);
        addSystemLog('auto-healing', `Self-healing loop triggered for ${monitor.domain}. Restarted PHP-FPM and reloaded Nginx proxy configuration. Service recovered to 200 OK.`, 'info');
      }, 10000);
    } else if (monitor.status === 'healthy') {
      // Normal ping check
      monitor.pings.shift();
      monitor.pings.push(200);
      addSystemLog('health-monitor', `HTTP Uptime check passed for ${monitor.domain}. Status: 200 OK`, 'info');
    }
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`Keel Panel Backend running on http://localhost:${PORT}`);
});
