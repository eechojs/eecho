import { ObjectId } from 'mongodb';

import { PetRepository } from './routers/pet/pet.definition.js';

export async function seedPetstore() {
  const now = new Date();
  const initialPets = [
    {
      _id: new ObjectId().toString(),
      species: 'Dog' as const,
      breed: 'Cogi',
      birthDate: new Date('2025-04-04'),
      description: 'Friendly',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId().toString(),
      species: 'Dog' as const,
      breed: 'Labrador',
      birthDate: new Date('2025-07-07'),
      description: 'Gentle and loving.',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId().toString(),
      species: 'Dog' as const,
      breed: 'Bulldog',
      birthDate: new Date('2025-10-16'),
      description: 'Strong and courageous.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  await PetRepository.createItems({ items: initialPets });
}
