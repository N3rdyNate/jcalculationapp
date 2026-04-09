/**
 * IECC climate zones 1-8 with representative design conditions.
 *
 * - winterDesignTemp: 99% heating design dry-bulb temp (°F) per ASHRAE
 * - summerDesignTemp: 1% cooling design dry-bulb temp (°F) per ASHRAE
 * - summerDesignWetBulb: coincident wet-bulb (°F)
 * - annualAvgTemp: used as ground temperature approximation for basement/slab calcs
 * - humidityRatioDelta: grains of moisture per lb dry air, outdoor-indoor at
 *   design conditions, for latent infiltration load
 * - dailyRange: Manual J daily range classification (L/M/H)
 */

export type DailyRange = 'L' | 'M' | 'H';

export interface ClimateZone {
  id: string;
  label: string;
  representativeCity: string;
  winterDesignTemp: number;
  summerDesignTemp: number;
  summerDesignWetBulb: number;
  dailyRange: DailyRange;
  annualAvgTemp: number;
  humidityRatioDelta: number;
}

export const CLIMATE_ZONES: ClimateZone[] = [
  {
    id: '1A',
    label: '1A — Very Hot, Humid (Miami)',
    representativeCity: 'Miami, FL',
    winterDesignTemp: 47,
    summerDesignTemp: 91,
    summerDesignWetBulb: 78,
    dailyRange: 'L',
    annualAvgTemp: 76,
    humidityRatioDelta: 45,
  },
  {
    id: '2A',
    label: '2A — Hot, Humid (Houston)',
    representativeCity: 'Houston, TX',
    winterDesignTemp: 29,
    summerDesignTemp: 96,
    summerDesignWetBulb: 77,
    dailyRange: 'M',
    annualAvgTemp: 68,
    humidityRatioDelta: 38,
  },
  {
    id: '2B',
    label: '2B — Hot, Dry (Phoenix)',
    representativeCity: 'Phoenix, AZ',
    winterDesignTemp: 34,
    summerDesignTemp: 108,
    summerDesignWetBulb: 71,
    dailyRange: 'H',
    annualAvgTemp: 75,
    humidityRatioDelta: 8,
  },
  {
    id: '3A',
    label: '3A — Warm, Humid (Atlanta)',
    representativeCity: 'Atlanta, GA',
    winterDesignTemp: 23,
    summerDesignTemp: 92,
    summerDesignWetBulb: 75,
    dailyRange: 'M',
    annualAvgTemp: 62,
    humidityRatioDelta: 25,
  },
  {
    id: '3B',
    label: '3B — Warm, Dry (Los Angeles)',
    representativeCity: 'Los Angeles, CA',
    winterDesignTemp: 43,
    summerDesignTemp: 83,
    summerDesignWetBulb: 68,
    dailyRange: 'M',
    annualAvgTemp: 63,
    humidityRatioDelta: 8,
  },
  {
    id: '4A',
    label: '4A — Mixed, Humid (New York City)',
    representativeCity: 'New York, NY',
    winterDesignTemp: 14,
    summerDesignTemp: 89,
    summerDesignWetBulb: 73,
    dailyRange: 'M',
    annualAvgTemp: 55,
    humidityRatioDelta: 20,
  },
  {
    id: '4B',
    label: '4B — Mixed, Dry (Albuquerque)',
    representativeCity: 'Albuquerque, NM',
    winterDesignTemp: 16,
    summerDesignTemp: 94,
    summerDesignWetBulb: 61,
    dailyRange: 'H',
    annualAvgTemp: 57,
    humidityRatioDelta: 5,
  },
  {
    id: '5A',
    label: '5A — Cool, Humid (Chicago)',
    representativeCity: 'Chicago, IL',
    winterDesignTemp: 2,
    summerDesignTemp: 89,
    summerDesignWetBulb: 74,
    dailyRange: 'M',
    annualAvgTemp: 50,
    humidityRatioDelta: 18,
  },
  {
    id: '5B',
    label: '5B — Cool, Dry (Denver)',
    representativeCity: 'Denver, CO',
    winterDesignTemp: 1,
    summerDesignTemp: 91,
    summerDesignWetBulb: 59,
    dailyRange: 'H',
    annualAvgTemp: 50,
    humidityRatioDelta: 5,
  },
  {
    id: '6A',
    label: '6A — Cold, Humid (Minneapolis)',
    representativeCity: 'Minneapolis, MN',
    winterDesignTemp: -11,
    summerDesignTemp: 89,
    summerDesignWetBulb: 73,
    dailyRange: 'M',
    annualAvgTemp: 45,
    humidityRatioDelta: 15,
  },
  {
    id: '6B',
    label: '6B — Cold, Dry (Helena)',
    representativeCity: 'Helena, MT',
    winterDesignTemp: -14,
    summerDesignTemp: 90,
    summerDesignWetBulb: 60,
    dailyRange: 'H',
    annualAvgTemp: 45,
    humidityRatioDelta: 5,
  },
  {
    id: '7',
    label: '7 — Very Cold (Duluth)',
    representativeCity: 'Duluth, MN',
    winterDesignTemp: -16,
    summerDesignTemp: 83,
    summerDesignWetBulb: 69,
    dailyRange: 'M',
    annualAvgTemp: 39,
    humidityRatioDelta: 12,
  },
  {
    id: '8',
    label: '8 — Subarctic (Fairbanks)',
    representativeCity: 'Fairbanks, AK',
    winterDesignTemp: -47,
    summerDesignTemp: 78,
    summerDesignWetBulb: 60,
    dailyRange: 'H',
    annualAvgTemp: 28,
    humidityRatioDelta: 5,
  },
];

export function getClimateZone(id: string): ClimateZone | undefined {
  return CLIMATE_ZONES.find((z) => z.id === id);
}
