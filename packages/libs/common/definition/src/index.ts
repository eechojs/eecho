export type {
  DefinitionDocument,
  DefinitionValue,
  IdentifierField,
  ModelDocument,
  SearchField,
  SortField,
  UpdateField,
  // Compatibility alias for the earlier plural name.
  UpdateField as UpdateFields,
} from './definition.type.js';

export {
  Context,
  findRepositoryContext,
  registerModel,
  registerRepositoryContext,
} from './definition.context.js';
export type { RepositoryContextEntry } from './definition.context.js';

export type {
  APISpecification,
  ClientAPISpecification,
  ServerAPISpecification,
} from './spec.js';
export { genAPIDefinition } from './api/api.js';

export {
  extractCreateOptionalField,
  extractCreateRequiredField,
  extractObjectIdFields,
  extractReadableField,
  extractReadbleField,
  extractSearchArrayOption,
  extractSearchOption,
  extractSortableOption,
  extractUpdateOption,
} from './api/definition.api.helper.js';
export { extractCreateFieldWithSystem } from './repository/definition.repository.helper.js';

export { defineModel } from './model/model.define.js';
export type {
  Definition,
  DefinitionFrom,
  InputArrayDefinition,
  InputDefinition,
  InputObjectDefinition,
  InputPrimitiveDefinition,
} from './model/model.define.type.js';
export type { ViewDefinition } from './view.definition.js';
