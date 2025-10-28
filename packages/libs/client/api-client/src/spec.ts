import { z } from "zod";
import { stringify } from 'qs';

import { createHttpClient } from "./client";
import { ClientAPISpecification } from '@eecho/definition';

export type APIMapOf<S extends ClientAPISpecification> = {
  [K in S["operationId"]]: (input?: {
    queryParams?: InferIfSchema<S["Request"]["queryParams"]>;
    body?: InferIfSchema<S["Request"]["body"]>;
  }) => Promise<z.infer<S["Response"]["body"]>>;
};

type InferIfSchema<T> = T extends z.ZodTypeAny ? z.infer<T> : never;

// Create API function
// this return a function that can be called with queryParams and body the types are inferred from the APISpecification
export function createAPI<S extends ClientAPISpecification>(p: {
  apiSpec: S;
  httpClient: ReturnType<typeof createHttpClient>;
  contentType?: 'application/json' | 'multipart/form-data';
    responseType?: 'json' | 'blob'; // 응답 타입 추가

}) {
  const { apiSpec, httpClient, contentType = "application/json", responseType = "json" } = p;

  type PQ = InferIfSchema<S["Request"]["queryParams"]>;
  type PB = InferIfSchema<S["Request"]["body"]>;
  type RB = z.infer<S["Response"]["body"]>;

  const handler = async (input?: { queryParams?: PQ; body?: PB }): Promise<RB> => {
      if (apiSpec.Request.queryParams && input?.queryParams) {
        const queryParamsParsing = apiSpec.Request.queryParams.safeParse(input.queryParams);
        if (!queryParamsParsing.success) {
          console.error(`API Query Params Validation Error: ${apiSpec.operationId} ${apiSpec.Method} ${apiSpec.APIEndpoint}`, queryParamsParsing.error);
          console.error(`Input Query Params:`, input?.queryParams);
          throw new Error(`API Query Params Validation Error: ${queryParamsParsing.error.message}`);
        }
      }
      if (apiSpec.Request.body && input?.body) {
        const bodyParamsParsing = apiSpec.Request.body.safeParse(input.body);
        if (!bodyParamsParsing.success) {
          console.error(`API Body Params Validation Error: ${apiSpec.operationId} ${apiSpec.Method} ${apiSpec.APIEndpoint}`, bodyParamsParsing.error);
          console.error(`Input Body Params:`, input?.body);
          throw new Error(`API Body Params Validation Error: ${bodyParamsParsing.error.message}`);
        }
      }

      let url = httpClient.host + apiSpec.APIEndpoint;
      let queryString = "";
      if (input?.queryParams) {
        queryString = stringify(input.queryParams, { addQueryPrefix: true, arrayFormat: 'brackets' });
      }
      url += queryString;

      // Content-Type에 따른 body 처리
      let body: BodyInit | undefined;
      let headers: Record<string, string> = {};
      if(input?.body) {
        if (contentType === 'application/json') {
          body = JSON.stringify(input.body);
          headers = { 'Content-Type': 'application/json' };
        } else if (contentType === 'multipart/form-data') {
          // FormData로 변환
          const formData = new FormData();
          if (typeof input.body === 'object' && input.body !== null) {
            Object.entries(input.body).forEach(([key, value]) => {
              if (value instanceof File) {
                formData.append(key, value);
              } else if (value !== undefined && value !== null) {
                formData.append(key, String(value));
              }
            });
          }
          body = formData;
          // multipart/form-data는 브라우저가 자동으로 Content-Type을 설정하므로 헤더를 설정하지 않음
        }
      }

      // 3) fetch
      const res = await httpClient.fetch({
        url: url.toString(),
        options: {
          method: apiSpec.Method,
          body,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        },
      });

      // 4) 응답 검증
      let data: any;
      if (responseType === 'json') {
        data = await res?.json();
      }
      else if (responseType === 'blob') {
        data = await res?.blob();
      }

      const parsedResult = apiSpec.Response.body.safeParse(data);
      
      if (res && !res.ok) {
        console.error(`API Error: ${apiSpec.operationId} ${apiSpec.Method} ${apiSpec.APIEndpoint}`, {
          status: res.status,
          statusText: res.statusText,
          data: parsedResult.error,
        });
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      if (!parsedResult.success) {
        console.error(`API Response Validation Error: ${apiSpec.operationId} ${apiSpec.Method} ${apiSpec.APIEndpoint}`, parsedResult.error);
        console.error(`Response Data:`, data);
        throw new Error(`API Response Validation Error: ${parsedResult.error.message}`);
      }

      return parsedResult.data as RB;
    };

    return {
    [apiSpec.operationId]: handler,
  } as APIMapOf<S>;
}
