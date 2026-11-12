import type { Definition, PrimitiveDefinition } from './model/model.define.type.js';

// Never permit directional m:n relation.
export interface ViewDefinition {
  baseModel: Definition;
  viewDefinition: {
    [field: string]: PrimitiveDefinition & {
      model?: Definition;
    };
  };
  relations: {
    relationModel: Definition;
    baseKey: string;
    relationKey: string;
  }[];
  index?: readonly never[];
}
