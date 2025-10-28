import { z } from 'zod'
import { defineModel } from '@eecho/definition'

export const PetDefinition = defineModel({
  _id: {
    type: z.string().regex(/^[0-9a-fA-F]{24}$/),
    index: ["Identifier", "ObjectId"],
    api: {
      read: ["Searchable"]
    }
  },
  createdAt: {
    type: z.coerce.date(),
    api: {
      create: ["System"]
    }
  },
  updatedAt: {
    type: z.coerce.date(),
    api: {
      create: ["System"]
    }
  },
  species: {
    type: z.enum(["Dog", "Cat"]),
    api: {
      read: ["Searchable"]
    }
  },
  breed: {
    type: z.string(),
    api: {
      read: ["Searchable"]
    }
  },
  birthDate: {
    type: z.coerce.date(),
  },

  description: {
    type: z.string(),
  },
});

export const PetToyDefinition = defineModel({
});

export const OrderDefinition = defineModel({
  _id: {
    type: z.string().regex(/^[0-9a-fA-F]{24}$/),
    index: ["Identifier", "ObjectId"],
    api: {
      read: ["Searchable"]
    }
  },
  petId: {
    type: z.string().regex(/^[0-9a-fA-F]{24}$/).nullish(),
    index: ["ForeignIdentifier", "ObjectId"],
    api: {
      read: ["Searchable"]
    }
  },
  toyId: {
    type: z.string().regex(/^[0-9a-fA-F]{24}$/).nullish(),
    index: ["ForeignIdentifier", "ObjectId"],
    api: {
      read: ["Searchable"]
    }
  },
  createdAt: {
    type: z.coerce.date(),
  },
  updatedAt: {
    type: z.coerce.date(),
  },

  orderType: {
    type: z.enum(['Adot', 'Toy']),
    api: {
      read: ["Searchable"]
    }
  },

  notes: {
    type: z.string().optional(),
  },
});

export type Pet = {
  [K in keyof typeof PetDefinition]: z.infer<typeof PetDefinition[K]['type']>;
}
export type PetToy = {
  [K in keyof typeof PetToyDefinition]: z.infer<typeof PetDefinition[K]['type']>;
}
export type Order = {
  [K in keyof typeof OrderDefinition]: z.infer<typeof OrderDefinition[K]['type']>;
}
