/**
 * Unit tests for LL97Accumulator.
 * LL97Accumulator.js attaches to `window`, so we set up globals before loading.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

// Mock browser globals
globalThis.window = globalThis;

// Mock LL84 constants (matching the structure in ll84_constants.js)
const mockLL84 = {
  annualSiteEnergy_kBTU: 58970482.7,
  annualElectric_kWh: 7807555.8,
  annualSteam_kBTU: 31986006.8,
  annualGHG_mtCO2e: 5038.5,
  grossFloorArea_sqft: 715320
};

window.LL84_CONSTANTS = mockLL84;

// Load LL97Accumulator.js
const require = createRequire(import.meta.url);
require('./LL97Accumulator.js');

describe('LL97Accumulator', () => {
  let accumulator;

  beforeEach(() => {
    accumulator = window.LL97Accumulator;
    accumulator.reset();
  });

  describe('Constants', () => {
    it('HOURS_PER_YEAR is 8760', () => {
      expect(accumulator.HOURS_PER_YEAR).toBe(8760);
    });

    it('LL97 limit for 2024 is 15.0 kgCO2e/sqft', () => {
      expect(accumulator.LL97_LIMIT_2024_KGCO2_PER_SQFT).toBe(15.0);
    });
  });

  describe('reset', () => {
    it('zeros all accumulators', () => {
      // Tick once to get non-zero values
      accumulator.tick({ outdoorTemp: 55 }, mockLL84);

      // Reset
      accumulator.reset();

      const values = accumulator.getValues();
      expect(values.totalEnergy_kBTU).toBe(0);
      expect(values.electricEnergy_kWh).toBe(0);
      expect(values.steamEnergy_kBTU).toBe(0);
      expect(values.ghgEmissions_mtCO2e).toBe(0);
    });

    it('zeros values accessible via getters', () => {
      accumulator.tick({ outdoorTemp: 55 }, mockLL84);
      accumulator.reset();

      expect(accumulator.totalEnergy_kBTU).toBe(0);
      expect(accumulator.electricEnergy_kWh).toBe(0);
      expect(accumulator.steamEnergy_kBTU).toBe(0);
      expect(accumulator.ghgEmissions_mtCO2e).toBe(0);
    });
  });

  describe('tick', () => {
    it('increments accumulators by hourly rates at mild temperature (factor ~1.0)', () => {
      // At 55°F (base temp), factor should be 1.0
      accumulator.tick({ outdoorTemp: 55 }, mockLL84);

      const values = accumulator.getValues();
      const expectedElectric = mockLL84.annualElectric_kWh / 8760;
      const expectedSteam = mockLL84.annualSteam_kBTU / 8760;
      const expectedEnergy = mockLL84.annualSiteEnergy_kBTU / 8760;
      const expectedGHG = mockLL84.annualGHG_mtCO2e / 8760;

      // Factor at 55°F = 1.0 + (|55-55|/100) = 1.0
      expect(values.electricEnergy_kWh).toBeCloseTo(expectedElectric * 1.0, 2);
      expect(values.steamEnergy_kBTU).toBeCloseTo(expectedSteam * 1.0, 2);
      expect(values.totalEnergy_kBTU).toBeCloseTo(expectedEnergy * 1.0, 2);
      expect(values.ghgEmissions_mtCO2e).toBeCloseTo(expectedGHG * 1.0, 4);
    });

    it('applies higher factor at extreme temperature', () => {
      // At 95°F, deviation = |95-55| = 40, factor = 1.0 + 40/100 = 1.4
      accumulator.tick({ outdoorTemp: 95 }, mockLL84);

      const values = accumulator.getValues();
      const expectedElectric = (mockLL84.annualElectric_kWh / 8760) * 1.4;

      expect(values.electricEnergy_kWh).toBeCloseTo(expectedElectric, 2);
    });

    it('applies higher factor at cold temperature', () => {
      // At 15°F, deviation = |15-55| = 40, factor = 1.0 + 40/100 = 1.4
      accumulator.tick({ outdoorTemp: 15 }, mockLL84);

      const values = accumulator.getValues();
      const expectedElectric = (mockLL84.annualElectric_kWh / 8760) * 1.4;

      expect(values.electricEnergy_kWh).toBeCloseTo(expectedElectric, 2);
    });

    it('accumulates over multiple ticks', () => {
      accumulator.tick({ outdoorTemp: 55 }, mockLL84);
      accumulator.tick({ outdoorTemp: 55 }, mockLL84);
      accumulator.tick({ outdoorTemp: 55 }, mockLL84);

      const values = accumulator.getValues();
      const expectedElectric = (mockLL84.annualElectric_kWh / 8760) * 3;

      expect(values.electricEnergy_kWh).toBeCloseTo(expectedElectric, 2);
    });

    it('uses default factor 1.0 when no outdoor temp provided', () => {
      accumulator.tick({}, mockLL84);

      const values = accumulator.getValues();
      const expectedEnergy = mockLL84.annualSiteEnergy_kBTU / 8760;

      expect(values.totalEnergy_kBTU).toBeCloseTo(expectedEnergy, 2);
    });

    it('uses window.LL84_CONSTANTS when no explicit constants passed', () => {
      accumulator.tick({ outdoorTemp: 55 });

      const values = accumulator.getValues();
      expect(values.electricEnergy_kWh).toBeGreaterThan(0);
      expect(values.totalEnergy_kBTU).toBeGreaterThan(0);
    });

    it('skips tick when no LL84 constants are available', () => {
      const originalConstants = window.LL84_CONSTANTS;
      window.LL84_CONSTANTS = null;
      window.LL84 = null;

      accumulator.tick({ outdoorTemp: 55 }, null);

      const values = accumulator.getValues();
      expect(values.totalEnergy_kBTU).toBe(0);

      // Restore
      window.LL84_CONSTANTS = originalConstants;
    });
  });

  describe('getValues', () => {
    it('returns an object with all four accumulator fields', () => {
      const values = accumulator.getValues();
      expect(values).toHaveProperty('totalEnergy_kBTU');
      expect(values).toHaveProperty('electricEnergy_kWh');
      expect(values).toHaveProperty('steamEnergy_kBTU');
      expect(values).toHaveProperty('ghgEmissions_mtCO2e');
    });
  });

  describe('getComplianceStatus', () => {
    it('returns compliant status when accumulated GHG is within limit', () => {
      // Just tick once — far below annual limit
      accumulator.tick({ outdoorTemp: 55 }, mockLL84);

      const status = accumulator.getComplianceStatus();
      expect(status.compliant).toBe(true);
      expect(status.limit_kgCO2PerSqft).toBe(15.0);
      expect(status.grossFloorArea_sqft).toBe(715320);
      expect(status.annualLimit_mtCO2e).toBeCloseTo((15.0 * 715320) / 1000, 2);
    });

    it('reports correct current intensity', () => {
      // Tick 100 times
      for (let i = 0; i < 100; i++) {
        accumulator.tick({ outdoorTemp: 55 }, mockLL84);
      }

      const status = accumulator.getComplianceStatus();
      const expectedGHG = (mockLL84.annualGHG_mtCO2e / 8760) * 100;
      const expectedIntensity = (expectedGHG * 1000) / mockLL84.grossFloorArea_sqft;

      expect(status.currentIntensity_kgCO2PerSqft).toBeCloseTo(expectedIntensity, 4);
    });

    it('includes percentOfLimit', () => {
      accumulator.tick({ outdoorTemp: 55 }, mockLL84);
      const status = accumulator.getComplianceStatus();
      expect(status.percentOfLimit).toBeGreaterThan(0);
      expect(status.percentOfLimit).toBeLessThan(100);
    });
  });

  describe('_getSeasonalFactor', () => {
    it('returns 1.0 at 55°F (base temp)', () => {
      expect(accumulator._getSeasonalFactor(55)).toBe(1.0);
    });

    it('returns higher value at hot temperature', () => {
      const factor = accumulator._getSeasonalFactor(95);
      expect(factor).toBeGreaterThan(1.0);
      expect(factor).toBeCloseTo(1.4, 5);
    });

    it('returns higher value at cold temperature', () => {
      const factor = accumulator._getSeasonalFactor(15);
      expect(factor).toBeGreaterThan(1.0);
      expect(factor).toBeCloseTo(1.4, 5);
    });

    it('clamps to minimum 0.7', () => {
      // Factor can never go below 0.7 (but in practice it won't with our formula)
      const factor = accumulator._getSeasonalFactor(55);
      expect(factor).toBeGreaterThanOrEqual(0.7);
    });

    it('clamps to maximum 1.5', () => {
      // At extreme temps, e.g., -50°F: deviation = 105, factor = 1 + 1.05 = 2.05 → clamped to 1.5
      const factor = accumulator._getSeasonalFactor(-50);
      expect(factor).toBe(1.5);
    });

    it('returns 1.0 for null/undefined input', () => {
      expect(accumulator._getSeasonalFactor(null)).toBe(1.0);
      expect(accumulator._getSeasonalFactor(undefined)).toBe(1.0);
      expect(accumulator._getSeasonalFactor(NaN)).toBe(1.0);
    });
  });
});
