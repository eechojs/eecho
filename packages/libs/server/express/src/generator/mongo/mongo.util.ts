import { z } from 'zod';
import type { ObjectId } from 'bson';

export const ObjectIdCompatible = z.union([
  z.string().regex(/^[a-fA-F0-9]{24}$/),
  z.custom<ObjectId>()
]);
