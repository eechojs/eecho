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
