import { z } from 'zod';
import { insertFloorPlanSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  floorPlans: {
    list: {
      method: 'GET' as const,
      path: '/api/floor-plans' as const,
      responses: {
        200: z.array(z.custom<any>()), // FloorPlanWithDetails[]
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/floor-plans/:id' as const,
      responses: {
        200: z.custom<any>(), // FloorPlanWithDetails
        404: errorSchemas.notFound,
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/floor-plans/upload' as const,
      // Input is FormData, no JSON schema validation here
      responses: {
        201: z.custom<any>(), // UploadResponse
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/floor-plans/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
