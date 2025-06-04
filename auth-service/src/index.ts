import { App } from './app.js';

async function main() {
  const app = new App();

  try {
    await app.start();
  } catch (error) {
    console.error('Failed to start the app:', error);
    process.exit(1);
  }

  // Optional: graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT. Shutting down...');
    await app.stop?.();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Shutting down...');
    await app.stop?.();
    process.exit(0);
  });
}

main();
