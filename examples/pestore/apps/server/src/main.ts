import cors from 'cors';
import express from 'express';
import type { Server } from 'node:http';

import { closeMongoServer } from './db.js';
import { PetStoreServerRouter } from './router.js';
import { seedPetstore } from './seed.js';

const port = Number(process.env.PORT ?? 3100);
const app = express();
let server: Server | undefined;

app.set('query parser', 'extended');
app.use(cors());
app.use(express.json());

app.get('/', (_request, response) => {
  response.send('Hello, Petstore Server.');
});

app.use(PetStoreServerRouter);

async function startServer() {
  await seedPetstore();

  server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

async function stopServer() {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => error ? reject(error) : resolve());
    });
  }

  await closeMongoServer();
}

function registerShutdown(signal: NodeJS.Signals) {
  process.once(signal, () => {
    void stopServer()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        console.error('Failed to stop Petstore server.', error);
        process.exit(1);
      });
  });
}

registerShutdown('SIGINT');
registerShutdown('SIGTERM');

void startServer().catch((error: unknown) => {
  console.error('Failed to start Petstore server.', error);
  process.exitCode = 1;
});
