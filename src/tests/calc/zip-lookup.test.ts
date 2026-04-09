import { describe, it, expect } from 'vitest';
import { lookupClimateZoneByZip } from '@/lib/calc/utils/zip-lookup';

describe('lookupClimateZoneByZip', () => {
  it('resolves NYC ZIP 10001 to 4A', () => {
    expect(lookupClimateZoneByZip('10001')).toBe('4A');
  });

  it('resolves Miami ZIP 33101 to 1A', () => {
    expect(lookupClimateZoneByZip('33101')).toBe('1A');
  });

  it('resolves Houston ZIP 77001 to 2A', () => {
    expect(lookupClimateZoneByZip('77001')).toBe('2A');
  });

  it('resolves Denver ZIP 80202 to 5B', () => {
    expect(lookupClimateZoneByZip('80202')).toBe('5B');
  });

  it('resolves Minneapolis ZIP 55401 to 6A', () => {
    expect(lookupClimateZoneByZip('55401')).toBe('6A');
  });

  it('accepts ZIP+4 format with dash', () => {
    expect(lookupClimateZoneByZip('10001-1234')).toBe('4A');
  });

  it('accepts 9-digit ZIP without dash', () => {
    expect(lookupClimateZoneByZip('100011234')).toBe('4A');
  });

  it('trims whitespace', () => {
    expect(lookupClimateZoneByZip('  10001  ')).toBe('4A');
  });

  it('returns null for non-numeric', () => {
    expect(lookupClimateZoneByZip('abcde')).toBeNull();
  });

  it('returns null for too-short', () => {
    expect(lookupClimateZoneByZip('100')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(lookupClimateZoneByZip('')).toBeNull();
  });
});
