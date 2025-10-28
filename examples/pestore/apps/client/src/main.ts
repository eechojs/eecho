import { PetStoreAPIClient } from '../../api-lib/src/index.js';

const app = document.querySelector<HTMLDivElement>('#app');
const petsList = document.querySelector<HTMLDivElement>('#pets-list');

interface Pet {
  id: number;
  name: string;
  category: string;
  status: 'available' | 'pending' | 'sold';
}

PetStoreAPIClient.setHost('http://localhost:3100');

function renderPets(pets: Pet[]) {
  if (!petsList) return;
  
  const petsHtml = pets.map(pet => `
    <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 5px;">
      <h3>${pet.name}</h3>
      <p><strong>Category:</strong> ${pet.category}</p>
      <p><strong>Status:</strong> <span style="color: ${pet.status === 'available' ? 'green' : pet.status === 'pending' ? 'orange' : 'red'}">${pet.status}</span></p>
    </div>
  `).join('');
  
  petsList.innerHTML = `
    <h2>Available Pets</h2>
    ${petsHtml}
    <p><em>Ready to integrate with @eecho/api-client! 🐾</em></p>
  `;
}

async function loadPets() {
  try {    
    const petsResponse = await PetStoreAPIClient.API.Pet.getItems();
    
    const petsData = petsResponse.success ? petsResponse.data : [];
    const pets: Pet[] = petsData.map((pet: any) => ({
      id: pet._id,
      name: pet.breed || 'Unknown Pet',
      category: pet.species,
      status: 'available'
    }));
    
    renderPets(pets);
    
  } catch (error) {
    console.error('Failed to load pets:', error);
    if (petsList) {
      petsList.innerHTML = '<p style="color: red;">Failed to load pets from API</p>';
    }
  }
}

if (app) {
  loadPets();
}
