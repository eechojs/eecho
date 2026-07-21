import { PetStoreAPIClient } from '@pestore/api-lib';

interface PetCardModel {
  id: string;
  name: string;
  category: string;
  status: 'available' | 'pending' | 'sold';
}

const statusColors = {
  available: '#1e6f5c',
  pending: '#bb7d2f',
  sold: '#a5383a',
} satisfies Record<PetCardModel['status'], string>;

const petsList = document.querySelector<HTMLDivElement>('#pets-list');

PetStoreAPIClient.setHost('http://localhost:3100');

function createMetadata(label: string, value: string) {
  const metadata = document.createElement('p');
  metadata.className = 'pet-card__meta';

  const labelElement = document.createElement('strong');
  labelElement.textContent = `${label}: `;
  metadata.append(labelElement, value);

  return metadata;
}

function createPetCard(pet: PetCardModel) {
  const card = document.createElement('article');
  card.className = 'pet-card';

  const label = document.createElement('p');
  label.className = 'pet-card__label';
  label.textContent = `Pet #${pet.id.slice(-4)}`;

  const name = document.createElement('h3');
  name.textContent = pet.name;

  const status = document.createElement('span');
  status.className = 'pet-card__status';
  status.style.color = statusColors[pet.status];
  status.textContent = pet.status;

  const statusMetadata = createMetadata('Status', '');
  statusMetadata.append(status);

  card.append(label, name, createMetadata('Category', pet.category), statusMetadata);
  return card;
}

function renderPets(pets: PetCardModel[]) {
  petsList?.replaceChildren(...pets.map(createPetCard));
}

async function loadPets() {
  if (!petsList) {
    return;
  }

  try {
    const response = await PetStoreAPIClient.API.Pet.getItems();
    const pets = response.data.map((pet): PetCardModel => ({
      id: pet._id,
      name: pet.breed || 'Unknown Pet',
      category: pet.species,
      status: 'available',
    }));

    renderPets(pets);
  } catch (error) {
    console.error('Failed to load pets:', error);

    const errorMessage = document.createElement('p');
    errorMessage.className = 'status-message status-message--error';
    errorMessage.textContent = 'Failed to load pets from API';
    petsList.replaceChildren(errorMessage);
  }
}

void loadPets();
