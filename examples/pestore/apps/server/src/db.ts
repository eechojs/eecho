import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PetRepository } from "./routers/pet/pet.definition";

let MongoServer: MongoMemoryServer;

export async function initMongoDB() {
  MongoServer = await MongoMemoryServer.create();
  return MongoServer.getUri();
}

export async function closeMongoServer() {
  if (MongoServer) {
    await MongoServer.stop();
  }
}

export async function getDBClient() {
  const mongoUri = await initMongoDB();
  return MongoClient.connect(mongoUri);
}

export function initCollectionData() {
  const curDate = new Date();
  const InitPets = [
    { _id: new ObjectId().toString(), 
      species: "Dog" as const, 
      breed: "Cogi", 
      birthDate: new Date('2025-04-04'), 
      description: "Friendly",
      createdAt: curDate,
      updatedAt: curDate
    },
    { _id: new ObjectId().toString(), 
      species: "Dog" as const, 
      breed: "Labrador", 
      birthDate: new Date('2025-07-07'), 
      description: "Gentle and loving.",
      createdAt: curDate,
      updatedAt: curDate
    },
    { _id: new ObjectId().toString(), 
      species: "Dog" as const, 
      breed: "Bulldog", 
      birthDate: new Date('2025-10-16'), 
      description: "Strong and courageous.",
      createdAt: curDate,
      updatedAt: curDate
    },
  ];

  PetRepository.createItems({ items: InitPets });
}
