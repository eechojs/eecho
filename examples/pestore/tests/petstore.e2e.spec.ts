import { test, expect, type APIRequestContext } from '@playwright/test';

const serverApiUrl = 'http://127.0.0.1:3100/pet/getItems';
const expectedBreeds = ['Cogi', 'Labrador', 'Bulldog'] as const;
const apiReadyTimeoutMs = 3 * 60 * 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForSeededPets(request: APIRequestContext) {
  const startedAt = Date.now();
  let lastPayload: unknown;

  while (Date.now() - startedAt < apiReadyTimeoutMs) {
    const response = await request.get(serverApiUrl);

    if (response.ok()) {
      const payload = await response.json();
      lastPayload = payload;

      if (payload?.success === true && Array.isArray(payload.data) && payload.data.length >= expectedBreeds.length) {
        return payload;
      }
    }

    await wait(500);
  }

  throw new Error(`Timed out waiting for seeded pet data from ${serverApiUrl}.\nLast payload: ${JSON.stringify(lastPayload)}`);
}

test('petstore client renders seeded pets from the running server', async ({ page, request }) => {
  const apiPayload = await waitForSeededPets(request);

  for (const breed of expectedBreeds) {
    expect(apiPayload.data.some((pet: { breed?: string }) => pet.breed === breed)).toBeTruthy();
  }

  await page.goto('/');
  await expect(page.getByText('Available Pets')).toBeVisible();

  for (const breed of expectedBreeds) {
    await expect(page.getByText(breed)).toBeVisible();
  }
});

test('petstore API filters and sorts generated read endpoints', async ({ request }) => {
  const seededPayload = await waitForSeededPets(request);

  const filteredResponse = await request.get(`${serverApiUrl}?filter%5Bbreed%5D=Lab`);
  expect(filteredResponse.ok()).toBeTruthy();
  const filteredPayload = await filteredResponse.json();
  expect(filteredPayload.data.map((pet: { breed: string }) => pet.breed)).toEqual(['Labrador']);

  const sortedResponse = await request.get(`${serverApiUrl}?sort%5Bbreed%5D=desc`);
  expect(sortedResponse.ok()).toBeTruthy();
  const sortedPayload = await sortedResponse.json();
  expect(sortedPayload.data.map((pet: { breed: string }) => pet.breed)).toEqual([
    'Labrador',
    'Cogi',
    'Bulldog',
  ]);

  const firstPetId = seededPayload.data[0]._id;
  const objectIdResponse = await request.get(
    `${serverApiUrl}?filter%5B_id%5D=${encodeURIComponent(firstPetId)}`,
  );
  expect(objectIdResponse.ok()).toBeTruthy();
  const objectIdPayload = await objectIdResponse.json();
  expect(objectIdPayload.data.map((pet: { _id: string }) => pet._id)).toEqual([firstPetId]);
});

test('petstore API returns a structured validation error', async ({ request }) => {
  await waitForSeededPets(request);

  const response = await request.get(`${serverApiUrl}?page=0`);
  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({
    success: false,
    error: {
      code: 'INVALID_REQUEST',
    },
  });
});
