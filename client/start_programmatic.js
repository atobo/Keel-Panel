import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  const server = await createServer({
    configFile: path.join(__dirname, 'vite.config.ts'),
    root: __dirname,
    server: {
      port: 3000
    }
  });
  
  await server.listen();
  server.printUrls();
  console.log('Keel Panel Frontend Vite server listening programmatically!');
}

start().catch(err => {
  console.error('Error starting Vite programmatically:', err);
});
