/**
 * LL97Accumulator — Energy and emissions tracking for LL97 compliance.
 *
 * Tracks cumulative energy consumption and greenhouse gas emissions for the
 * Four Seasons Hotel as the simulation advances. Each simulated hour increments
 * accumulators based on LL84 annual constants divided by 8,760 hours, with a
 * seasonal adjustment factor derived from outdoor temperature.
 *
 * LL97 2024 compliance limit for hotels: 15.0 kgCO2e/sqft
 *
 * Attached to window.LL97Accumulator (no import/export — Babel standalone).
 */

(function () {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────

  /** Hours in a year — used to derive hourly rates from annual totals */
  var HOURS_PER_YEAR = 8760;

  /** LL97 2024 carbon intensity limit for hotels (kgCO2e/sqft) */
  var LL97_LIMIT_2024_KGCO2_PER_SQFT = 15.0;

  /** Metric tons to kg conversion */
  var MT_TO_KG = 1000;

  // ─── Accumulator State ──────────────────────────────────────────────────────

  var totalEnergy_kBTU = 0;
  var electricEnergy_kWh = 0;
  var steamEnergy_kBTU = 0;
  var ghgEmissions_mtCO2e = 0;

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Get LL84 constants from the window global.
   * @returns {Object|null}
   */
  function getLL84Constants() {
    return window.LL84_CONSTANTS || window.LL84 || null;
  }

  /**
   * Calculate a seasonal energy factor based on outdoor dry bulb temperature.
   *
   * In extreme temperatures (very hot or very cold), HVAC systems work harder,
   * increasing energy consumption. The factor is centered around 1.0 for
   * mild conditions (around 55°F) and increases for extremes.
   *
   * Factor range: approximately 0.7 (mild) to 1.5 (extreme)
   *
   * @param {number} outdoorTemp - Outdoor dry bulb temperature in °F
   * @returns {number} Seasonal adjustment factor (0.7 – 1.5)
   */
  function getSeasonalFactor(outdoorTemp) {
    if (outdoorTemp === undefined || outdoorTemp === null || isNaN(outdoorTemp)) {
      return 1.0;
    }

    // Base temperature for minimal HVAC load
    var baseTemp = 55; // °F — mild condition

    // Distance from the comfort base
    var deviation = Math.abs(outdoorTemp - baseTemp);

    // Linear scaling: factor = 1.0 at baseTemp, increases with deviation
    // Max deviation ~40°F (e.g., 15°F or 95°F) → factor ~1.4
    var factor = 1.0 + (deviation / 100);

    // Clamp to reasonable range
    return Math.max(0.7, Math.min(factor, 1.5));
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Increment accumulators by one simulated hour.
   *
   * Uses LL84 annual totals divided by 8,760 to get base hourly rates,
   * then applies a seasonal factor based on outdoor temperature.
   *
   * @param {Object} hourlyData - Contains at least { outdoorTemp } for seasonal adjustment
   * @param {Object} [ll84Constants] - LL84 constants override (defaults to window.LL84_CONSTANTS)
   */
  function tick(hourlyData, ll84Constants) {
    var constants = ll84Constants || getLL84Constants();
    if (!constants) {
      console.warn('[LL97Accumulator] No LL84 constants available. Skipping tick.');
      return;
    }

    // Base hourly rates from annual totals
    var hourlyElectric = (constants.annualElectric_kWh || 0) / HOURS_PER_YEAR;
    var hourlySteam = (constants.annualSteam_kBTU || 0) / HOURS_PER_YEAR;
    var hourlyEnergy = (constants.annualSiteEnergy_kBTU || 0) / HOURS_PER_YEAR;
    var hourlyGHG = (constants.annualGHG_mtCO2e || 0) / HOURS_PER_YEAR;

    // Apply seasonal factor if outdoor temperature is available
    var outdoorTemp = (hourlyData && hourlyData.outdoorTemp !== undefined)
      ? hourlyData.outdoorTemp
      : null;
    var factor = getSeasonalFactor(outdoorTemp);

    // Increment accumulators
    electricEnergy_kWh += hourlyElectric * factor;
    steamEnergy_kBTU += hourlySteam * factor;
    totalEnergy_kBTU += hourlyEnergy * factor;
    ghgEmissions_mtCO2e += hourlyGHG * factor;
  }

  /**
   * Reset all accumulators to zero.
   * Called on simulation reset or scenario change.
   */
  function reset() {
    totalEnergy_kBTU = 0;
    electricEnergy_kWh = 0;
    steamEnergy_kBTU = 0;
    ghgEmissions_mtCO2e = 0;
  }

  /**
   * Get current accumulator values.
   * @returns {Object} { totalEnergy_kBTU, electricEnergy_kWh, steamEnergy_kBTU, ghgEmissions_mtCO2e }
   */
  function getValues() {
    return {
      totalEnergy_kBTU: totalEnergy_kBTU,
      electricEnergy_kWh: electricEnergy_kWh,
      steamEnergy_kBTU: steamEnergy_kBTU,
      ghgEmissions_mtCO2e: ghgEmissions_mtCO2e
    };
  }

  /**
   * Check LL97 2024 compliance status.
   *
   * Compares accumulated GHG emissions (extrapolated to annual) against
   * the LL97 2024 limit (carbon intensity × floor area).
   *
   * @returns {Object} {
   *   compliant: boolean,
   *   currentIntensity_kgCO2PerSqft: number,
   *   limit_kgCO2PerSqft: number,
   *   annualProjected_mtCO2e: number,
   *   annualLimit_mtCO2e: number,
   *   grossFloorArea_sqft: number,
   *   percentOfLimit: number
   * }
   */
  function getComplianceStatus() {
    var constants = getLL84Constants();
    var grossFloorArea = (constants && constants.grossFloorArea_sqft) || 0;

    // Convert accumulated mtCO2e to kgCO2e, then to intensity
    var accumulated_kgCO2e = ghgEmissions_mtCO2e * MT_TO_KG;
    var currentIntensity = grossFloorArea > 0
      ? accumulated_kgCO2e / grossFloorArea
      : 0;

    // Annual limit in mtCO2e
    var annualLimit_mtCO2e = (LL97_LIMIT_2024_KGCO2_PER_SQFT * grossFloorArea) / MT_TO_KG;

    // Projected annual GHG based on current accumulation rate
    // If we have some hours accumulated, extrapolate
    var annualProjected = constants && constants.annualGHG_mtCO2e
      ? constants.annualGHG_mtCO2e
      : ghgEmissions_mtCO2e; // fallback to accumulated if no constants

    var percentOfLimit = annualLimit_mtCO2e > 0
      ? (ghgEmissions_mtCO2e / annualLimit_mtCO2e) * 100
      : 0;

    return {
      compliant: ghgEmissions_mtCO2e <= annualLimit_mtCO2e,
      currentIntensity_kgCO2PerSqft: currentIntensity,
      limit_kgCO2PerSqft: LL97_LIMIT_2024_KGCO2_PER_SQFT,
      annualProjected_mtCO2e: annualProjected,
      annualLimit_mtCO2e: annualLimit_mtCO2e,
      grossFloorArea_sqft: grossFloorArea,
      percentOfLimit: percentOfLimit
    };
  }

  // ─── Expose as window global ────────────────────────────────────────────────

  window.LL97Accumulator = {
    // State accessors (via getters for live values)
    get totalEnergy_kBTU() { return totalEnergy_kBTU; },
    get electricEnergy_kWh() { return electricEnergy_kWh; },
    get steamEnergy_kBTU() { return steamEnergy_kBTU; },
    get ghgEmissions_mtCO2e() { return ghgEmissions_mtCO2e; },

    // Methods
    tick: tick,
    reset: reset,
    getValues: getValues,
    getComplianceStatus: getComplianceStatus,

    // Constants (exposed for testing)
    HOURS_PER_YEAR: HOURS_PER_YEAR,
    LL97_LIMIT_2024_KGCO2_PER_SQFT: LL97_LIMIT_2024_KGCO2_PER_SQFT,

    // Testing helper — expose seasonal factor for unit tests
    _getSeasonalFactor: getSeasonalFactor
  };
})();
