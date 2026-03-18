import { PetStoreAPIClient } from '../../../api-lib/src/index.ts';

interface PetCardModel {
  id: string;
  name: string;
  category: string;
  status: 'available' | 'pending' | 'sold';
}

const petsList = document.querySelector<HTMLDivElement>('#pets-list');

PetStoreAPIClient.setHost('http://localhost:3100');

function renderStatusColor(status: PetCardModel['status']) {
  if (status === 'available') {
    return '#1e6f5c';
  }

  if (status === 'pending') {
    return '#bb7d2f';
  }

  return '#a5383a';
}

function renderPets(pets: PetCardModel[]) {
  if (!petsList) {
    return;
  }

  const cardsMarkup = pets.map((pet) => `
    <article class="pet-card">
      <p class="pet-card__label">Pet #{pet.id.slice(-4)}</p>
      <h3>${pet.name}</h3>
      <p class="pet-card__meta"><strong>Category:</strong> ${pet.category}</p>
      <p class="pet-card__meta">
        <strong>Status:</strong>
        <span class="pet-card__status" style="color: ${renderStatusColor(pet.status)}">${pet.status}</span>
      </p>
    </article>
  `).join('');

  petsList.innerHTML = cardsMarkup;
}

async function loadPets() {
  if (!petsList) {
    return;
  }

  try {
    const petsResponse = await PetStoreAPIClient.API.Pet.getItems();
    const petsData = petsResponse.success ? petsResponse.data : [];

    const pets: PetCardModel[] = petsData.map((pet) => ({
      id: String(pet._id),
      name: pet.breed || 'Unknown Pet',
      category: String(pet.species),
      status: 'available',
    }));

    renderPets(pets);
  } catch (error) {
    console.error('Failed to load pets:', error);
    petsList.innerHTML = '<p class="status-message status-message--error">Failed to load pets from API</p>';
  }
}

void loadPets();
