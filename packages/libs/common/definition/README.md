# @eecho/definition

Core type definitions and schema library for the EEcho framework.

## Installation

```bash
npm install @eecho/definition zod
```

## Features

- API definition types
- Model definition types  
- Repository helper functions
- Zod schema utilities
- Type-safe schema validation

## Usage

```typescript
import { z } from 'zod';
import { defineModel, type InputDefinition, type ModelDocument } from '@eecho/definition';

export const PetDefinition = defineModel({
  id: {
    type: z.string(),
    index: ['Identifier'],
  },
  species: {
    type: z.enum(['Dog', 'Cat']),
    api: {
      read: ['Searchable'],
    },
  },
});

export type Pet = ModelDocument<typeof PetDefinition>;
```

Let `defineModel` infer the model type from the value you pass in.

```typescript
// Good: preserves field names, literal flags, and Zod schema inference.
const PetDefinition = defineModel({
  id: {
    type: z.string(),
    index: ['Identifier'],
  },
});

// Avoid: this widens the result to the broad Definition shape.
// const PetDefinition: Definition = defineModel({ ... });
```

If you need to validate a reusable input object before passing it to `defineModel`,
use `satisfies InputDefinition` on the input value instead of annotating the result.

```typescript
const petInput = {
  id: {
    type: z.string(),
    index: ['Identifier'],
  },
} as const satisfies InputDefinition;

const PetDefinition = defineModel(petInput);
```
