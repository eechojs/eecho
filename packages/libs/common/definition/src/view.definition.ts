import { ModelDefinition, Definition } from "./model.definition";

// Never permit directional m:n relation.
export interface ViewDefinition {
  baseModel: ModelDefinition;
  viewDefinition: {
    [field: string]: Definition & {
      model?: Definition;
    };
  };
  relations: {
    relationModel: ModelDefinition;
    baseKey: string;
    relationKey: string;
  }[];
  index?: [];
};
