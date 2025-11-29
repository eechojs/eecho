import { DefinitionFrom, InputArrayDefinition, InputDefinition, InputObjectDefinition, InputPrimitiveDefinition, PrimitiveDefinition } from "./model.define.type";

type FieldDefinition = InputPrimitiveDefinition | InputArrayDefinition | InputObjectDefinition

function definePrimitive(input: InputPrimitiveDefinition, key: string){
  return {
    ...input,
    key,
    kind: "primitive" as const,
    index: input.index || [],
    api: {
      index: input.api?.index || [],
      create: input.api?.create || [],
      read: input.api?.read || [],
      update: input.api?.update || [],
      delete: input.api?.delete || [],
    },
  } satisfies PrimitiveDefinition;
}
function defineArray(input: InputArrayDefinition, key: string){
  const itemDef = input.type[0];
  if(isPrimitiveDefine(itemDef)){
    return {
      kind: "array" as const,
      key,
      type: definePrimitive(itemDef, key + "Item")
    };
  } else if(isObjectDefine(itemDef)){
    return {
      kind: "array" as const,
      key,
      type: defineObject(itemDef, key + "Item")
    };
  }
  throw new Error("Unreacable code");
}
function defineObject(input: InputObjectDefinition, key: string){
  return {
    kind: "object" as const,
    key,
    type: defineModel(input.type)
  };
}

function isPrimitiveDefine(input: FieldDefinition): input is InputPrimitiveDefinition {
  return 'type' in input && !Array.isArray(input.type);
}
function isArrayDefine(input: FieldDefinition): input is InputArrayDefinition {
  return 'type' in input && Array.isArray(input);
}
function isObjectDefine(input: FieldDefinition): input is InputObjectDefinition {
  return !('type' in input)
}

export function defineModel<const T extends InputDefinition>(input: T): DefinitionFrom<T> {
  const result: any = {};

  Object.keys(input).forEach((key)=>{
    let fieldDef = input[key];
    if(isPrimitiveDefine(fieldDef)){
      result[key] = definePrimitive(fieldDef, key);
    } else if(isArrayDefine(fieldDef)){
      result[key] = defineArray(fieldDef, key);
    } else if(isObjectDefine(fieldDef)){
      result[key] = defineObject(fieldDef, key);
    }
  });

  return result;
};
