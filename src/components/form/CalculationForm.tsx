'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { calculationInputSchema } from '@/lib/calc/schemas';
import type { CalculationInput, CalculationResult } from '@/lib/calc/types';
import { CLIMATE_ZONES, getClimateZone } from '@/lib/calc/constants/climate-zones';
import { lookupClimateZoneByZip } from '@/lib/calc/utils/zip-lookup';
import { WINDOW_GLAZING_PRESETS, getWindowGlazingPreset } from '@/lib/calc/presets/window-glazing';
import { WALL_ASSEMBLY_PRESETS, getWallAssemblyPreset } from '@/lib/calc/presets/wall-assembly';
import { ROOF_ASSEMBLY_PRESETS, getRoofAssemblyPreset } from '@/lib/calc/presets/roof-assembly';
import { FOUNDATION_PRESETS, getFoundationPreset } from '@/lib/calc/presets/foundation';
import { INFILTRATION_PRESETS, getInfiltrationPreset } from '@/lib/calc/presets/infiltration';
import { INTERNAL_LOAD_PRESETS, getInternalLoadPreset } from '@/lib/calc/presets/internal';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

const DEFAULT_VALUES: CalculationInput = {
  climateZoneId: '4A',
  altitude: 'sea_level',
  house: {
    squareFootage: 2000,
    ceilingHeight: 8,
    stories: 1,
    bedrooms: 3,
  },
  envelope: {
    wallRValue: 13,
    wallMass: 'light',
    doorArea: 40,
    doorUValue: 0.4,
    roofRValue: 30,
    roofColor: 'medium',
    roofPitch: 'standard',
    atticVented: true,
    foundationType: 'slab',
    foundationFactor: 0.55,
    basementConditioning: 'conditioned',
    floorInsulated: true,
  },
  windows: {
    mode: 'global',
    uValue: 0.28,
    shgc: 0.38,
    areaByOrientation: { N: 75, E: 75, S: 75, W: 75 },
    shading: 'none',
    frameMaterial: 'vinyl',
  },
  infiltration: { ach: 0.5 },
  internal: {
    occupants: 4,
    applianceWatts: 1200,
    lightingWatts: 800,
    activityLevel: 'moderate',
    lightingType: 'mixed',
  },
  ducts: { location: 'conditioned', rValue: 8 },
  ventilation: { type: 'none', cfm: 0 },
  garage: { attached: false, sharedWallArea: 0, wallRValue: 11 },
};

interface Props {
  initialValues?: CalculationInput;
  onResult: (result: CalculationResult, input: CalculationInput) => void;
}

export function CalculationForm({ initialValues, onResult }: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CalculationInput>({
    resolver: zodResolver(calculationInputSchema),
    defaultValues: initialValues ?? DEFAULT_VALUES,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [zipStatus, setZipStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'found'; zoneId: string }
    | { kind: 'not_found' }
  >({ kind: 'idle' });

  const climateZoneId = useWatch({ control, name: 'climateZoneId' });
  const selectedZone = getClimateZone(climateZoneId);

  function handleZipChange(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 5) {
      setZipStatus({ kind: 'idle' });
      return;
    }
    const zone = lookupClimateZoneByZip(digits);
    if (zone) {
      setValue('climateZoneId', zone, { shouldDirty: true });
      setZipStatus({ kind: 'found', zoneId: zone });
    } else {
      setZipStatus({ kind: 'not_found' });
    }
  }
  const foundationType = useWatch({ control, name: 'envelope.foundationType' });
  const garageAttached = useWatch({ control, name: 'garage.attached' });
  const ventType = useWatch({ control, name: 'ventilation.type' });

  async function onSubmit(data: CalculationInput) {
    setSubmitError(null);
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Calculation failed');
      }
      const result = (await res.json()) as CalculationResult;
      onResult(result, data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  // ---- Preset handlers -------------------------------------------
  function applyWindowPreset(id: string) {
    const p = getWindowGlazingPreset(id);
    if (!p) return;
    setValue('windows.uValue', p.uValue);
    setValue('windows.shgc', p.shgc);
  }

  function applyWallPreset(id: string) {
    const p = getWallAssemblyPreset(id);
    if (!p) return;
    setValue('envelope.wallRValue', p.rValue);
    setValue('envelope.wallMass', p.mass);
  }

  function applyRoofPreset(id: string) {
    const p = getRoofAssemblyPreset(id);
    if (!p) return;
    setValue('envelope.roofRValue', p.rValue);
  }

  function applyFoundationPreset(id: string) {
    const p = getFoundationPreset(id);
    if (!p) return;
    setValue('envelope.foundationType', p.type);
    setValue('envelope.foundationFactor', p.factor);
    if (p.crawlFactor !== undefined) {
      setValue('envelope.crawlFactor', p.crawlFactor);
    }
  }

  function applyInfiltrationPreset(id: string) {
    const p = getInfiltrationPreset(id);
    if (!p) return;
    setValue('infiltration.ach', p.ach);
  }

  function applyInternalPreset(id: string) {
    const p = getInternalLoadPreset(id);
    if (!p) return;
    setValue('internal.applianceWatts', p.applianceWatts);
    setValue('internal.lightingWatts', p.lightingWatts);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* -------- Climate + altitude -------- */}
      <Card title="Climate Zone" description="Select the IECC zone and altitude band">
        <Field
          label="ZIP code (optional)"
          hint={
            zipStatus.kind === 'found'
              ? `Auto-selected zone ${zipStatus.zoneId}`
              : zipStatus.kind === 'not_found'
                ? 'ZIP not recognized — pick manually below'
                : 'Auto-selects the climate zone'
          }
        >
          <Input
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="e.g. 10001"
            onChange={(e) => handleZipChange(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Field label="Climate zone" error={errors.climateZoneId?.message}>
            <Select {...register('climateZoneId')}>
              {CLIMATE_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Altitude" hint="Air density correction">
            <Select {...register('altitude')}>
              <option value="sea_level">Sea level</option>
              <option value="2000_ft">2,000 ft</option>
              <option value="5000_ft">5,000 ft</option>
              <option value="higher">Higher (≥8,000 ft)</option>
            </Select>
          </Field>
        </div>
        {selectedZone && (
          <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 rounded p-3 grid grid-cols-2 gap-1">
            <span>Winter design: <strong>{selectedZone.winterDesignTemp}°F</strong></span>
            <span>Summer design: <strong>{selectedZone.summerDesignTemp}°F</strong></span>
            <span>Annual avg: <strong>{selectedZone.annualAvgTemp}°F</strong></span>
            <span>Humidity Δ: <strong>{selectedZone.humidityRatioDelta} grains</strong></span>
          </div>
        )}
      </Card>

      {/* -------- House dimensions -------- */}
      <Card title="House Dimensions">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Square footage" error={errors.house?.squareFootage?.message}>
            <Input type="number" step="1" {...register('house.squareFootage', { valueAsNumber: true })} />
          </Field>
          <Field label="Ceiling height (ft)" error={errors.house?.ceilingHeight?.message}>
            <Input type="number" step="0.5" {...register('house.ceilingHeight', { valueAsNumber: true })} />
          </Field>
          <Field label="Stories" error={errors.house?.stories?.message}>
            <Select {...register('house.stories', { valueAsNumber: true })}>
              <option value={1}>1 story</option>
              <option value={2}>2 stories</option>
              <option value={3}>3 stories</option>
            </Select>
          </Field>
          <Field label="Bedrooms (for occupancy default)" error={errors.house?.bedrooms?.message}>
            <Input type="number" step="1" {...register('house.bedrooms', { valueAsNumber: true })} />
          </Field>
        </div>
      </Card>

      {/* -------- Walls -------- */}
      <Card title="Walls">
        <Field label="Wall assembly preset">
          <Select defaultValue="" onChange={(e) => applyWallPreset(e.target.value)}>
            <option value="">— Choose a preset —</option>
            {WALL_ASSEMBLY_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} (R-{p.rValue}, {p.mass})
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Effective R-value">
            <Input type="number" step="0.5" {...register('envelope.wallRValue', { valueAsNumber: true })} />
          </Field>
          <Field label="Thermal mass">
            <Select {...register('envelope.wallMass')}>
              <option value="light">Light (frame)</option>
              <option value="medium">Medium (brick veneer)</option>
              <option value="heavy">Heavy (masonry)</option>
            </Select>
          </Field>
          <Field label="Door area (ft²)">
            <Input type="number" step="1" {...register('envelope.doorArea', { valueAsNumber: true })} />
          </Field>
          <Field label="Door U-value">
            <Input type="number" step="0.05" {...register('envelope.doorUValue', { valueAsNumber: true })} />
          </Field>
        </div>
      </Card>

      {/* -------- Roof -------- */}
      <Card title="Roof / Ceiling">
        <Field label="Roof assembly preset">
          <Select defaultValue="" onChange={(e) => applyRoofPreset(e.target.value)}>
            <option value="">— Choose a preset —</option>
            {ROOF_ASSEMBLY_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Effective R-value">
            <Input type="number" step="1" {...register('envelope.roofRValue', { valueAsNumber: true })} />
          </Field>
          <Field label="Roof color">
            <Select {...register('envelope.roofColor')}>
              <option value="light">Light / reflective</option>
              <option value="medium">Medium (tan, gray)</option>
              <option value="dark">Dark (asphalt shingle)</option>
            </Select>
          </Field>
          <Field label="Roof pitch" hint="Rise over 12 in of run">
            <Select {...register('envelope.roofPitch')}>
              <optgroup label="Flat / low slope">
                <option value="flat">Flat</option>
                <option value="1_12">1/12 (shed, ≈0.3%)</option>
                <option value="2_12">2/12 (≈1.4%)</option>
                <option value="3_12">3/12 (≈3%)</option>
              </optgroup>
              <optgroup label="Standard">
                <option value="4_12">4/12 (≈5%)</option>
                <option value="5_12">5/12 (≈8%)</option>
                <option value="standard">6/12 — typical residential</option>
                <option value="7_12">7/12</option>
                <option value="8_12">8/12</option>
              </optgroup>
              <optgroup label="Steep">
                <option value="9_12">9/12</option>
                <option value="10_12">10/12</option>
                <option value="11_12">11/12</option>
                <option value="12_12">12/12 (45°)</option>
              </optgroup>
            </Select>
          </Field>
          <Field label="Attic ventilation">
            <Select
              {...register('envelope.atticVented', {
                setValueAs: (v) => v === 'true',
              })}
            >
              <option value="true">Vented</option>
              <option value="false">Unvented / sealed</option>
            </Select>
          </Field>
        </div>
      </Card>

      {/* -------- Foundation -------- */}
      <Card title="Foundation">
        <Field label="Foundation preset">
          <Select defaultValue="" onChange={(e) => applyFoundationPreset(e.target.value)}>
            <option value="">— Choose a preset —</option>
            {FOUNDATION_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Type">
            <Select {...register('envelope.foundationType')}>
              <option value="slab">Slab-on-grade</option>
              <option value="vented_crawlspace">Vented crawlspace</option>
              <option value="unvented_crawlspace">Unvented crawlspace</option>
              <option value="heated_basement">Heated basement</option>
              <option value="unheated_basement">Unheated basement</option>
            </Select>
          </Field>
          <Field
            label={foundationType === 'slab' ? 'F-factor' : 'Effective U'}
            hint={foundationType === 'slab' ? 'BTU/(hr·ft·°F)' : 'BTU/(hr·ft²·°F)'}
          >
            <Input type="number" step="0.01" {...register('envelope.foundationFactor', { valueAsNumber: true })} />
          </Field>
          {(foundationType === 'heated_basement' ||
            foundationType === 'unheated_basement') && (
            <Field label="Basement conditioning">
              <Select {...register('envelope.basementConditioning')}>
                <option value="conditioned">Conditioned</option>
                <option value="semi">Semi-conditioned</option>
                <option value="unconditioned">Unconditioned</option>
              </Select>
            </Field>
          )}
          <Field label="Floor insulation">
            <Select
              {...register('envelope.floorInsulated', {
                setValueAs: (v) => v === 'true',
              })}
            >
              <option value="true">Yes (insulated)</option>
              <option value="false">No</option>
            </Select>
          </Field>
        </div>
      </Card>

      {/* -------- Windows -------- */}
      <Card title="Windows" description="Glazing type, frame material, shading, and area by orientation">
        <Field label="Glazing preset">
          <Select defaultValue="" onChange={(e) => applyWindowPreset(e.target.value)}>
            <option value="">— Choose a preset —</option>
            {WINDOW_GLAZING_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — U={p.uValue}, SHGC={p.shgc}
              </option>
            ))}
          </Select>
        </Field>
        <Controller
          control={control}
          name="windows"
          render={({ field }) => {
            const value = field.value;
            if (value.mode !== 'global') return <></>;
            return (
              <>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field label="U-value">
                    <Input
                      type="number"
                      step="0.01"
                      value={value.uValue}
                      onChange={(e) =>
                        field.onChange({ ...value, uValue: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="SHGC">
                    <Input
                      type="number"
                      step="0.01"
                      value={value.shgc}
                      onChange={(e) =>
                        field.onChange({ ...value, shgc: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Frame material">
                    <Select
                      value={value.frameMaterial ?? 'vinyl'}
                      onChange={(e) =>
                        field.onChange({ ...value, frameMaterial: e.target.value as 'wood' | 'vinyl' | 'aluminum' | 'fiberglass' })
                      }
                    >
                      <option value="wood">Wood</option>
                      <option value="vinyl">Vinyl</option>
                      <option value="aluminum">Aluminum</option>
                      <option value="fiberglass">Fiberglass</option>
                    </Select>
                  </Field>
                  <Field label="Shading">
                    <Select
                      value={value.shading ?? 'none'}
                      onChange={(e) =>
                        field.onChange({ ...value, shading: e.target.value as 'none' | 'interior_blinds' | 'exterior_blinds' | 'awnings' | 'trees' })
                      }
                    >
                      <option value="none">None</option>
                      <option value="interior_blinds">Interior blinds</option>
                      <option value="exterior_blinds">Exterior blinds</option>
                      <option value="awnings">Awnings</option>
                      <option value="trees">Trees</option>
                    </Select>
                  </Field>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Area by orientation (ft²)</p>
                  <div className="grid grid-cols-4 gap-3">
                    {(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const).map((o) => (
                      <Field key={o} label={o}>
                        <Input
                          type="number"
                          step="1"
                          value={value.areaByOrientation[o] ?? 0}
                          onChange={(e) =>
                            field.onChange({
                              ...value,
                              areaByOrientation: {
                                ...value.areaByOrientation,
                                [o]: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              </>
            );
          }}
        />
      </Card>

      {/* -------- Infiltration -------- */}
      <Card title="Infiltration" description="Construction quality / air tightness">
        <Field label="Tightness preset">
          <Select defaultValue="" onChange={(e) => applyInfiltrationPreset(e.target.value)}>
            <option value="">— Choose a preset —</option>
            {INFILTRATION_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.ach} ACH ({p.ach50Equivalent} ACH50)
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Natural ACH" className="mt-3">
          <Input type="number" step="0.05" {...register('infiltration.ach', { valueAsNumber: true })} />
        </Field>
      </Card>

      {/* -------- Mechanical ventilation -------- */}
      <Card title="Mechanical Ventilation">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select {...register('ventilation.type')}>
              <option value="none">None</option>
              <option value="exhaust_only">Exhaust only</option>
              <option value="supply_only">Supply only</option>
              <option value="balanced_erv">Balanced ERV (sensible + latent recovery)</option>
              <option value="balanced_hrv">Balanced HRV (sensible recovery)</option>
            </Select>
          </Field>
          <Field label="CFM" hint="0 if none">
            <Input
              type="number"
              step="5"
              disabled={ventType === 'none'}
              {...register('ventilation.cfm', { valueAsNumber: true })}
            />
          </Field>
        </div>
      </Card>

      {/* -------- Ducts -------- */}
      <Card title="Ducts">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duct location">
            <Select {...register('ducts.location')}>
              <option value="conditioned">Inside conditioned space</option>
              <option value="attic">Attic</option>
              <option value="garage">Garage</option>
              <option value="crawlspace">Crawlspace</option>
            </Select>
          </Field>
          <Field label="Duct insulation">
            <Select {...register('ducts.rValue', { valueAsNumber: true })}>
              <option value={0}>R-0 (uninsulated)</option>
              <option value={4}>R-4</option>
              <option value={8}>R-8</option>
              <option value={15}>R-15</option>
            </Select>
          </Field>
        </div>
      </Card>

      {/* -------- Garage -------- */}
      <Card title="Attached Garage">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Attached?">
            <Select
              {...register('garage.attached', {
                setValueAs: (v) => v === 'true',
              })}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
          </Field>
          {garageAttached && (
            <>
              <Field label="Shared wall area (ft²)">
                <Input type="number" step="10" {...register('garage.sharedWallArea', { valueAsNumber: true })} />
              </Field>
              <Field label="Partition R-value">
                <Input type="number" step="1" {...register('garage.wallRValue', { valueAsNumber: true })} />
              </Field>
            </>
          )}
        </div>
      </Card>

      {/* -------- Internal loads -------- */}
      <Card title="Internal Loads">
        <Field label="Lifestyle preset">
          <Select defaultValue="" onChange={(e) => applyInternalPreset(e.target.value)}>
            <option value="">— Choose a preset —</option>
            {INTERNAL_LOAD_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field
            label="Occupancy activity level"
            hint="Most homes: Moderate. Use Light for bedrooms, Vigorous for gyms."
          >
            <Select {...register('internal.activityLevel')}>
              <option value="sedentary">
                Sedentary (sleeping, reading)
              </option>
              <option value="light">Light (seated, TV/PC)</option>
              <option value="moderate">
                Moderate (standing, cooking) — standard
              </option>
              <option value="heavy">Heavy (housework, chores)</option>
              <option value="vigorous">
                Vigorous (exercise, dancing)
              </option>
            </Select>
          </Field>
          <Field
            label="Lighting type"
            hint="Newer homes are mostly LED. Mixed matches typical stock."
          >
            <Select {...register('internal.lightingType')}>
              <option value="incandescent">
                Incandescent (2.5 W/ft²)
              </option>
              <option value="halogen">Halogen (2.0 W/ft²)</option>
              <option value="fluorescent">Fluorescent (1.0 W/ft²)</option>
              <option value="led">LED (0.5 W/ft²)</option>
              <option value="mixed">Mixed (1.2 W/ft²)</option>
            </Select>
          </Field>
          <Field
            label="Occupants (count)"
            hint="Manual J default: bedrooms + 1"
          >
            <Input type="number" step="1" {...register('internal.occupants', { valueAsNumber: true })} />
          </Field>
          <Field
            label="Appliances (W)"
            hint="Typical home: 1000–1800 W continuous"
          >
            <Input type="number" step="50" {...register('internal.applianceWatts', { valueAsNumber: true })} />
          </Field>
          <Field label="Lighting (W, override)" hint="Used only if no lighting type is chosen">
            <Input type="number" step="50" {...register('internal.lightingWatts', { valueAsNumber: true })} />
          </Field>
        </div>
      </Card>

      {submitError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {submitError}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Calculating…' : 'Calculate loads'}
      </Button>
    </form>
  );
}
