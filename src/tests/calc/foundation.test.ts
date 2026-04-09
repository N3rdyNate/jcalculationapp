import { describe, it, expect } from 'vitest';
import { foundationHeatingLoad } from '@/lib/calc/components/foundation';

describe('foundationHeatingLoad', () => {
  it('slab: F * perimeter * dT', () => {
    // 0.73 * 180 * 70 = 9198
    expect(
      foundationHeatingLoad({
        type: 'slab',
        factor: 0.73,
        perimeter: 180,
        floorArea: 2000,
        dT: 70,
      })
    ).toBeCloseTo(9198, 1);
  });

  it('heated basement: factor * (perimeter*7) * groundDT', () => {
    // 0.12 * (180*7) * 40 = 0.12 * 1260 * 40 = 6048
    expect(
      foundationHeatingLoad({
        type: 'heated_basement',
        factor: 0.12,
        perimeter: 180,
        floorArea: 2000,
        dT: 70,
        groundDT: 40,
      })
    ).toBeCloseTo(6048, 1);
  });

  it('vented crawl applies 0.5 multiplier by default', () => {
    // 0.053 * 2000 * 70 * 0.5 = 3710
    expect(
      foundationHeatingLoad({
        type: 'crawlspace',
        factor: 0.053,
        perimeter: 180,
        floorArea: 2000,
        dT: 70,
        crawlFactor: 0.5,
      })
    ).toBeCloseTo(3710, 0);
  });

  it('better slab insulation → lower heating load', () => {
    const uninsulated = foundationHeatingLoad({
      type: 'slab',
      factor: 0.73,
      perimeter: 180,
      floorArea: 2000,
      dT: 70,
    });
    const insulated = foundationHeatingLoad({
      type: 'slab',
      factor: 0.42,
      perimeter: 180,
      floorArea: 2000,
      dT: 70,
    });
    expect(insulated).toBeLessThan(uninsulated);
  });
});
