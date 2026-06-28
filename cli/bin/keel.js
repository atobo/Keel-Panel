#!/usr/bin/env node

/**
 * Keel CLI - Command Line Client for Keel Panel
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';

const CONFIG_PATH = path.join(os.homedir(), '.keelrc');

// Helper to load configuration
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (e) {
    // Ignore read errors, return default
  }
  return { panelUrl: 'http://localhost:3001', apiToken: '' };
}

// Helper to save configuration
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing config file:', e.message);
    return false;
  }
}

// Helper to perform API requests
function makeRequest(method, endpoint, payload = null) {
  const config = loadConfig();
  if (!config.apiToken && endpoint !== '/api/auth/me') {
    console.error('Error: No API token configured. Run "keel config --token <your_token>" first.');
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(endpoint, config.panelUrl);
    } catch (err) {
      console.error(`Error: Invalid Panel URL "${config.panelUrl}"`);
      process.exit(1);
    }

    const headers = {
      'Authorization': `Bearer ${config.apiToken}`,
      'Accept': 'application/json'
    };

    let postData = '';
    if (payload) {
      headers['Content-Type'] = 'application/json';
      postData = JSON.stringify(payload);
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          try {
            const parsedErr = JSON.parse(body);
            reject(new Error(parsedErr.error || parsedErr.message || `Status ${res.statusCode}`));
          } catch (e) {
            reject(new Error(`Server returned status code ${res.statusCode}`));
          }
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });

    if (payload) {
      req.write(postData);
    }
    req.end();
  });
}

// Print help details
function printHelp() {
  console.log(`
Keel CLI - Manage your Keel Panel VPS from the command line

Usage:
  keel <command> [options]

Commands:
  config                  View current configuration
  config --host <url>     Set the Keel Panel URL (default: http://localhost:3001)
  config --token <token>  Set the Developer API Token for authorization
  status                  Check connection status and fetch remote VPS system stats
  db:list                 List databases and tables owned by your user account
  backup:trigger <prov>   Trigger a remote cloud backup (e.g., s3, gcs, b2)

Examples:
  keel config --token keel_dev_testtoken12345
  keel status
  keel db:list
  keel backup:trigger s3
`);
}

// Main CLI Entrypoint
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'config') {
    const config = loadConfig();
    const hostIdx = args.indexOf('--host');
    const tokenIdx = args.indexOf('--token');

    let updated = false;
    if (hostIdx !== -1 && args[hostIdx + 1]) {
      config.panelUrl = args[hostIdx + 1];
      updated = true;
    }
    if (tokenIdx !== -1 && args[tokenIdx + 1]) {
      config.apiToken = args[tokenIdx + 1];
      updated = true;
    }

    if (updated) {
      if (saveConfig(config)) {
        console.log('Configuration updated successfully.');
      }
    } else {
      console.log('Current Keel CLI Configuration:');
      console.log(`  Panel URL: ${config.panelUrl}`);
      console.log(`  API Token: ${config.apiToken ? config.apiToken.substring(0, 12) + '...' : '(Not configured)'}`);
    }
    return;
  }

  if (command === 'status') {
    console.log('Connecting to Keel Panel...');
    try {
      const auth = await makeRequest('GET', '/api/auth/me');
      const stats = await makeRequest('GET', '/api/system/stats');
      console.log('\n--- Connection Status ---');
      console.log(`Status:    Connected`);
      console.log(`User:      ${auth.username} (${auth.role})`);
      console.log(`Endpoint:  ${loadConfig().panelUrl}`);
      
      console.log('\n--- Remote Server System Stats ---');
      console.log(`OS:        ${stats.osType} ${stats.osRelease} (${stats.arch})`);
      console.log(`Uptime:    ${(stats.uptime / 3600).toFixed(2)} hours`);
      console.log(`CPU Load:  ${stats.cpuLoad}%`);
      console.log(`Memory:    ${stats.memoryUsed} / ${stats.memoryTotal}`);
      console.log(`Disk Used: ${stats.diskUsed} of ${stats.diskTotal} (${stats.diskPercent})`);
    } catch (err) {
      console.error(`Error fetching server status: ${err.message}`);
    }
    return;
  }

  if (command === 'db:list') {
    console.log('Fetching databases...');
    try {
      const data = await makeRequest('GET', '/api/databases');
      const dbs = data.databases || [];
      console.log('\n--- Managed Databases ---');
      if (dbs.length === 0) {
        console.log('No databases found.');
      } else {
        dbs.forEach(db => {
          console.log(`- ${db.name} (${db.type.toUpperCase()})`);
          console.log(`  Size:   ${db.size}`);
          console.log(`  Tables: ${db.tables}`);
        });
      }
    } catch (err) {
      console.error(`Error listing databases: ${err.message}`);
    }
    return;
  }

  if (command === 'backup:trigger') {
    const provider = args[1];
    if (!provider || !['s3', 'gcs', 'b2'].includes(provider.toLowerCase())) {
      console.error('Error: Please specify a valid cloud provider (s3, gcs, b2).');
      console.log('Usage: keel backup:trigger <s3|gcs|b2>');
      process.exit(1);
    }
    console.log(`Triggering remote cloud backup to ${provider.toUpperCase()}...`);
    try {
      const data = await makeRequest('POST', '/api/backups/trigger', { provider: provider.toLowerCase() });
      if (data.success) {
        console.log(`Backup completed successfully!`);
        if (data.backups && data.backups.length > 0) {
          const latest = data.backups[0];
          console.log(`Archive size: ${latest.size}`);
          console.log(`Stored Path:  ${latest.path}`);
        }
      } else {
        console.error('Backup trigger failed: Unknown server error');
      }
    } catch (err) {
      console.error(`Backup trigger error: ${err.message}`);
    }
    return;
  }

  console.log(`Unknown command: "${command}"`);
  printHelp();
}

main();
