import { registerRepositoryContext } from './definition.context.js';
import { Definition, PrimitiveDefinition } from './model/model.define.type.js';

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
  index?: [];
};

export function registerModel(params: {
  definition: Definition;
  collectionName: string;
  dbName: string;
}){
  registerRepositoryContext({
    model: params.definition,
    collectionName: params.collectionName,
    dbName: params.dbName,
  });
}
