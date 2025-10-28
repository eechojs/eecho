import { APIDefinition, ModelDefinition } from "../model.definition";

export function extractCreateFieldWithSystem<TDefinition extends ModelDefinition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const createFields = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      // Optional만 제외하고, System은 포함
      if(value.api?.create?.includes("Optional")) return false
      else return true;
    }).map(([key, value])=>([key, value.type]))
  );

  return createFields as {
    [K in keyof TDefinition as
      TDefinition[K]['api'] extends { create: infer Indices }
        ? Indices extends APIDefinition['create']
          ? 'Optional' extends NonNullable<Indices>[number]
            ? never
            : K
          : K
        : K
    ] : TDefinition[K]['type'];
  };
};
