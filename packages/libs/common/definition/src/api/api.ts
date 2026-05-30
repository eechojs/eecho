import { z } from "zod";

import type { Definition } from "../model/model.define.type.js";
import type { ServerAPISpecification } from "../spec.js";



export function genAPIDefinition(params: {
  definition: Definition;
  endpointPrefix: string;
}){
  const CreateAPISpecification = {
    APIEndpoint: `${params.endpointPrefix}/create`,
    Method: 'POST',
    Request: {

    },
    Response: {
      body: z.object({})
    }
  } as const satisfies ServerAPISpecification;
  
  const ReadAPISpecification = {};
  const UpdateAPISpecification = {};
  const DeleteAPISpecification = {};

}
