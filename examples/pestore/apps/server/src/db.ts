import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | undefined;
let mongoClientPromise: Promise<MongoClient> | undefined;

async function connectMongoDB() {
  mongoServer = await MongoMemoryServer.create();
  return MongoClient.connect(mongoServer.getUri());
}

export function getDBClient() {
  mongoClientPromise ??= connectMongoDB();
  return mongoClientPromise;
}

export async function closeMongoServer() {
  const mongoClient = await mongoClientPromise;
  await mongoClient?.close();
  await mongoServer?.stop();

  mongoClientPromise = undefined;
  mongoServer = undefined;
}
