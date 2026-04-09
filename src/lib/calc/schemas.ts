import { z } from 'zod';

export const orientationSchema = z.enum(['N', 'E', 'S', 'W']);

export const wallMassSchema = z.enum(['light', 'medium', 'heavy']);
export const roofColorSchema = z.enum(['light', 'medium', 'dark']);
export const foundationTypeSchema = z.enum([
  'slab',
  'heated_basement',
  'crawlspace',
]);

export const houseSchema = z.object({
  squareFootage: z.number().min(100).max(50000),
  ceilingHeight: z.number().min(6).max(20),
  stories: z.number().int().min(1).max(4),
  perimeter: z.number().min(20).max(2000).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
});

export const envelopeSchema = z.object({
  wallRValue: z.number().min(1).max(60),
  wallMass: wallMassSchema,
  doorArea: z.number().min(0).max(500),
  doorUValue: z.number().min(0.05).max(2),
  roofRValue: z.number().min(1).max(80),
  roofColor: roofColorSchema,
  foundationType: foundationTypeSchema,
  foundationFactor: z.number().min(0).max(2),
  crawlFactor: z.number().min(0).max(1).optional(),
});

const areaByOrientationSchema = z.object({
  N: z.number().min(0).max(5000),
  E: z.number().min(0).max(5000),
  S: z.number().min(0).max(5000),
  W: z.number().min(0).max(5000),
});

const perOrientationGlazingSchema = z.object({
  uValue: z.number().min(0.1).max(2.0),
  shgc: z.number().min(0).max(1),
  area: z.number().min(0).max(5000),
});

export const windowsGlobalSchema = z.object({
  mode: z.literal('global'),
  uValue: z.number().min(0.1).max(2.0),
  shgc: z.number().min(0).max(1),
  areaByOrientation: areaByOrientationSchema,
});

export const windowsPerOrientationSchema = z.object({
  mode: z.literal('per_orientation'),
  byOrientation: z.object({
    N: perOrientationGlazingSchema,
    E: perOrientationGlazingSchema,
    S: perOrientationGlazingSchema,
    W: perOrientationGlazingSchema,
  }),
});

export const windowsSchema = z.discriminatedUnion('mode', [
  windowsGlobalSchema,
  windowsPerOrientationSchema,
]);

export const infiltrationSchema = z.object({
  ach: z.number().min(0).max(5),
});

export const internalSchema = z.object({
  occupants: z.number().int().min(0).max(30),
  applianceWatts: z.number().min(0).max(20000),
  lightingWatts: z.number().min(0).max(20000),
});

export const calculationInputSchema = z.object({
  climateZoneId: z.string().min(1),
  house: houseSchema,
  envelope: envelopeSchema,
  windows: windowsSchema,
  infiltration: infiltrationSchema,
  internal: internalSchema,
});

export const saveScenarioSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  input: calculationInputSchema,
});

export const compareRequestSchema = z.object({
  ids: z.array(z.number().int().positive()).min(2).max(4),
});
