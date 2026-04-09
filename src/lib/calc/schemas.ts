import { z } from 'zod';

export const orientationSchema = z.enum([
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
]);

export const wallMassSchema = z.enum(['light', 'medium', 'heavy']);
export const roofColorSchema = z.enum(['light', 'medium', 'dark']);
export const roofPitchSchema = z.enum([
  // Legacy coarse buckets (kept for backwards compat with saved scenarios)
  'flat',
  'low',
  'standard',
  'steep',
  // Granular rise/run pitches
  '1_12',
  '2_12',
  '3_12',
  '4_12',
  '5_12',
  '6_12',
  '7_12',
  '8_12',
  '9_12',
  '10_12',
  '11_12',
  '12_12',
]);
export const foundationTypeSchema = z.enum([
  'slab',
  'heated_basement',
  'unheated_basement',
  'vented_crawlspace',
  'unvented_crawlspace',
]);
export const basementConditioningSchema = z.enum([
  'conditioned',
  'unconditioned',
  'semi',
]);

export const shadingSchema = z.enum([
  'none',
  'interior_blinds',
  'exterior_blinds',
  'awnings',
  'trees',
]);
export const frameMaterialSchema = z.enum([
  'wood',
  'vinyl',
  'aluminum',
  'fiberglass',
]);
export const altitudeSchema = z.enum([
  'sea_level',
  '2000_ft',
  '5000_ft',
  'higher',
]);
export const ductLocationSchema = z.enum([
  'conditioned',
  'attic',
  'garage',
  'crawlspace',
]);
export const ductRValueSchema = z.union([
  z.literal(0),
  z.literal(4),
  z.literal(8),
  z.literal(15),
]);
export const ventilationTypeSchema = z.enum([
  'none',
  'exhaust_only',
  'supply_only',
  'balanced_erv',
  'balanced_hrv',
]);
export const activityLevelSchema = z.enum([
  'sedentary',
  'light',
  'moderate',
  'heavy',
  'vigorous',
]);
export const lightingTypeSchema = z.enum([
  'incandescent',
  'halogen',
  'fluorescent',
  'led',
  'mixed',
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
  roofPitch: roofPitchSchema.optional(),
  atticVented: z.boolean().optional(),
  foundationType: foundationTypeSchema,
  foundationFactor: z.number().min(0).max(2),
  crawlFactor: z.number().min(0).max(1).optional(),
  basementConditioning: basementConditioningSchema.optional(),
  floorInsulated: z.boolean().optional(),
});

// Area map — all 8 orientations optional, default to 0 in engine
const areaByOrientationSchema = z.object({
  N: z.number().min(0).max(5000).optional(),
  NE: z.number().min(0).max(5000).optional(),
  E: z.number().min(0).max(5000).optional(),
  SE: z.number().min(0).max(5000).optional(),
  S: z.number().min(0).max(5000).optional(),
  SW: z.number().min(0).max(5000).optional(),
  W: z.number().min(0).max(5000).optional(),
  NW: z.number().min(0).max(5000).optional(),
});

const perOrientationGlazingSchema = z.object({
  uValue: z.number().min(0.1).max(2.0),
  shgc: z.number().min(0).max(1),
  area: z.number().min(0).max(5000),
});

const byOrientationMapSchema = z.object({
  N: perOrientationGlazingSchema.optional(),
  NE: perOrientationGlazingSchema.optional(),
  E: perOrientationGlazingSchema.optional(),
  SE: perOrientationGlazingSchema.optional(),
  S: perOrientationGlazingSchema.optional(),
  SW: perOrientationGlazingSchema.optional(),
  W: perOrientationGlazingSchema.optional(),
  NW: perOrientationGlazingSchema.optional(),
});

export const windowsGlobalSchema = z.object({
  mode: z.literal('global'),
  uValue: z.number().min(0.1).max(2.0),
  shgc: z.number().min(0).max(1),
  areaByOrientation: areaByOrientationSchema,
  shading: shadingSchema.optional(),
  frameMaterial: frameMaterialSchema.optional(),
});

export const windowsPerOrientationSchema = z.object({
  mode: z.literal('per_orientation'),
  byOrientation: byOrientationMapSchema,
  shading: shadingSchema.optional(),
  frameMaterial: frameMaterialSchema.optional(),
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
  activityLevel: activityLevelSchema.optional(),
  lightingType: lightingTypeSchema.optional(),
});

export const ductsSchema = z.object({
  location: ductLocationSchema,
  rValue: ductRValueSchema,
});

export const ventilationSchema = z.object({
  type: ventilationTypeSchema,
  cfm: z.number().min(0).max(1000),
});

export const garageSchema = z.object({
  attached: z.boolean(),
  sharedWallArea: z.number().min(0).max(2000),
  wallRValue: z.number().min(1).max(60),
});

export const calculationInputSchema = z.object({
  climateZoneId: z.string().min(1),
  altitude: altitudeSchema.optional(),
  house: houseSchema,
  envelope: envelopeSchema,
  windows: windowsSchema,
  infiltration: infiltrationSchema,
  internal: internalSchema,
  ducts: ductsSchema.optional(),
  ventilation: ventilationSchema.optional(),
  garage: garageSchema.optional(),
});

export const saveScenarioSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  input: calculationInputSchema,
});

export const compareRequestSchema = z.object({
  ids: z.array(z.number().int().positive()).min(2).max(4),
});
