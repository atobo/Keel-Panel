import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['vite', '--port', '3000'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Failed to start Vite:', err);
});

child.on('close', (code) => {
  console.log(`Vite exited with code ${code}`);
});

process.on('SIGTERM', () => child.kill());
process.on('SIGINT', () => child.kill());
