import { z } from 'zod';
import { paginationQuerySchema } from './common';

const field = z.string().trim().min(1).max(100);

export const addLocationSchema = z
  .object({ city: field, state: field, zipCode: field.max(20), country: field })
  .strict();
export type AddLocationDto = z.infer<typeof addLocationSchema>;

export const updateLocationSchema = addLocationSchema
  .extend({ locationId: z.number().int().positive() })
  .strict();
export type UpdateLocationDto = z.infer<typeof updateLocationSchema>;

export const getLocationsQuerySchema = paginationQuerySchema.extend({
  City: z.string().trim().max(100).optional(),
  State: z.string().trim().max(100).optional(),
  ZipCode: z.string().trim().max(20).optional(),
  Country: z.string().trim().max(100).optional(),
});

export const locationDtoSchema = z.object({
  locationId: z.number().int(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
});
export type LocationDto = z.infer<typeof locationDtoSchema>;
