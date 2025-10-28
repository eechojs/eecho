import express from 'express';
import cors from 'cors';

import { PetStoreServerRouter } from './router';
import { initCollectionData } from './db';

const app = express();
const port = 3100;

// CORS 모두 허용
app.use(cors());

app.get('/', (_req, res) => {
  res.send('Hello, Petstore Server.');
});

app.use(PetStoreServerRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Init PetStore Data
initCollectionData();
