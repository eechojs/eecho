# EEcho

EEcho is a TypeScript toolkit for declaring a model once and carrying the same
runtime-validated API contract through a browser client, Express, and MongoDB.

The project is organized around one dependency flow:

```text
model + API contract -> API client -> Express adapter -> example application
```

Zod schemas are both the runtime validation boundary and the source of inferred
TypeScript types. A field's API capabilities describe whether it can be created,
read, searched, sorted, or updated.

## Packages

| Package | Owns |
| --- | --- |
| `@eecho/definition` | Model definitions, field capabilities, shared API contracts, inferred types |
| `@eecho/api-client` | Validated HTTP execution of a shared contract |
| `@eecho/express` | Express route validation and MongoDB repository adapters |
| `@pestore/api-lib` | Example models, contracts, and browser-facing client |

The active server package is `@eecho/express`. The older
`packages/server/eecho` prototype remains in the repository for reference, but
is intentionally excluded from the npm workspace and the active build.

## Quick start

```bash
npm install
npm run verify
```

`npm run verify` builds all libraries and example applications, runs focused
contract tests, and exercises the Petstore application end to end.

To run the example interactively:

```bash
# Terminal 1
npm run example:pet-store:server

# Terminal 2
npm run example:pet-store:client
```

The API server listens on `http://localhost:3100`; the Astro development server
prints its browser URL when it starts.

## Core usage

Create the model and contract in a package shared by the client and server:

```ts
import { defineModel, genAPIDefinition } from '@eecho/definition';
import { z } from 'zod';

export const PetDefinition = defineModel({
  _id: {
    type: z.string().regex(/^[0-9a-fA-F]{24}$/),
    index: ['Identifier', 'ObjectId'],
    api: { create: ['System'], read: ['Searchable'] },
  },
  name: {
    type: z.string(),
    api: { read: ['Searchable', 'Sortable'], update: ['Updatable'] },
  },
});

export const PetAPI = genAPIDefinition({
  definition: PetDefinition,
  endpointPrefix: '/pet',
});
```

Execute that contract in the browser:

```ts
import { createAPI, createHttpClient } from '@eecho/api-client';

const httpClient = createHttpClient();
httpClient.setHost('http://localhost:3100');

export const petAPI = createAPI({
  apiSpec: PetAPI.ReadAPISpecification,
  httpClient,
});
```

Use the same contract on the server:

```ts
import { Router } from 'express';
import { MongoGenerator, registerMongoReadEndpoint } from '@eecho/express';

const repository = MongoGenerator.genRepository({
  definition: PetDefinition,
  collectionName: 'Pet',
  dbClient,
});

const router = Router();
registerMongoReadEndpoint({
  router,
  apiSpec: PetAPI.ReadAPISpecification,
  repository,
});
```

## Current scope

- Shared create, read, update, delete, and put transport specifications
- Validated client requests and responses
- Express request validation and error responses
- Generated MongoDB reads with pagination, filters, sorting, and ObjectId support
- MongoDB create, update, upsert, and view repository primitives
- A tested Petstore vertical slice using the generated read path

Write endpoint policy is deliberately application-owned for now: use
`setAPIEndpoint` with the generated write specifications and repository
primitives. A future high-level write adapter should define system-field and
authorization policies explicitly rather than hiding them in a generic router.

See [docs/architecture.md](docs/architecture.md) for ownership rules and the
extension model.
