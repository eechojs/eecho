import { Definition, PrimitiveDefinition, APIIndex } from '../model/model.define.type';

export function extractCreateFieldWithSystem<TDefinition extends Definition>(params: { definition: TDefinition }) {
  const { definition } = params;
  const createFields = Object.fromEntries(
    Object.entries(definition).filter(([_, value])=>{
      // Optional만 제외하고, System은 포함
      if(value.kind === 'primitive' && value.api?.create?.includes("Optional")) return false
      else return true;
    }).map(([key, value])=>([key, value.type]))
  );

  return createFields as {
    [K in keyof TDefinition as
      TDefinition[K] extends PrimitiveDefinition
        ? TDefinition[K]['api'] extends { create: infer Indices }
          ? Indices extends APIIndex['create']
            ? 'Optional' extends Indices[number]
              ? never
              : K
            : K
          : K
        : K
    ] : TDefinition[K]['type'];
  };
};
