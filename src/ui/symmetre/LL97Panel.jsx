/**
 * LL97Panel.jsx — LL97 Compliance Panel for SymmetrE Station
 *
 * Displays LL97 accumulator values within the SymmetrE Station interface:
 * - Annual Energy (kBTU)
 * - Electric Energy (kWh)
 * - Steam Energy (kBTU)
 * - GHG Emissions (mtCO2e)
 * - LL97 compliance status (compliant/non-compliant indicator)
 * - Percent of LL97 limit consumed
 *
 * Values update on each simulation tick.
 * Reads from window.LL97Accumulator.getValues() and window.LL97Accumulator.getComplianceStatus()
 * Dark themed matching SymmetrE aesthetic.
 * Green when compliant, amber when approaching limit (>75%), red when exceeding limit.
 *
 * No import/export — exposes window.LL97Panel
 */

const LL97Panel = (function () {
  'use strict';

  const { useState, useEffect, useCallback } = React;

  // ─── Thresholds ─────────────────────────────────────────────────────────────

  /** Percent of limit above which amber/warning is shown */
  var WARNING_THRESHOLD = 75;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Format large numbers with commas and fixed decimals.
   * @param {number} val
   * @param {number} decimals
   * @returns {string}
   */
  function formatNumber(val, decimals) {
    if (val === null || val === undefined || isNaN(val)) return '—';
    var fixed = val.toFixed(decimals);
    // Add thousand separators
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /**
   * Determine status color class based on compliance status.
   * @param {boolean} compliant
   * @param {number} percentOfLimit
   * @returns {string} Tailwind color class
   */
  function getStatusColor(compliant, percentOfLimit) {
    if (!compliant) return 'text-red-400';
    if (percentOfLimit > WARNING_THRESHOLD) return 'text-amber-400';
    return 'text-green-400';
  }

  /**
   * Get the background indicator class for the compliance badge.
   * @param {boolean} compliant
   * @param {number} percentOfLimit
   * @returns {string}
   */
  function getBadgeBg(compliant, percentOfLimit) {
    if (!compliant) return 'bg-red-900/50 border-red-600';
    if (percentOfLimit > WARNING_THRESHOLD) return 'bg-amber-900/50 border-amber-600';
    return 'bg-green-900/50 border-green-600';
  }

  /**
   * Get the status text for compliance.
   * @param {boolean} compliant
   * @param {number} percentOfLimit
   * @returns {string}
   */
  function getStatusText(compliant, percentOfLimit) {
    if (!compliant) return 'NON-COMPLIANT';
    if (percentOfLimit > WARNING_THRESHOLD) return 'APPROACHING LIMIT';
    return 'COMPLIANT';
  }

  /**
   * Get the dot color for the status indicator.
   * @param {boolean} compliant
   * @param {number} percentOfLimit
   * @returns {string}
   */
  function getDotColor(compliant, percentOfLimit) {
    if (!compliant) return 'bg-red-500';
    if (percentOfLimit > WARNING_THRESHOLD) return 'bg-amber-500';
    return 'bg-green-500';
  }

  // ─── Main Panel Component ───────────────────────────────────────────────────

  function LL97PanelComponent() {
    var _useState = useState(null);
    var values = _useState[0];
    var setValues = _useState[1];

    var _useState2 = useState(null);
    var compliance = _useState2[0];
    var setCompliance = _useState2[1];

    // Update values from the LL97Accumulator on a regular interval
    // tied to simulation ticks. We poll every 500ms to catch tick updates.
    useEffect(function () {
      function updateFromAccumulator() {
        if (window.LL97Accumulator && typeof window.LL97Accumulator.getValues === 'function') {
          setValues(window.LL97Accumulator.getValues());
        }
        if (window.LL97Accumulator && typeof window.LL97Accumulator.getComplianceStatus === 'function') {
          setCompliance(window.LL97Accumulator.getComplianceStatus());
        }
      }

      // Initial read
      updateFromAccumulator();

      // Subscribe to simulation tick events if engine is available
      if (window.SimulationEngine && typeof window.SimulationEngine.onTick === 'function') {
        window.SimulationEngine.onTick(updateFromAccumulator);
      }

      // Also poll as fallback (in case tick subscription isn't wired)
      var intervalId = setInterval(updateFromAccumulator, 500);

      return function () {
        clearInterval(intervalId);
        if (window.SimulationEngine && typeof window.SimulationEngine.offTick === 'function') {
          window.SimulationEngine.offTick(updateFromAccumulator);
        }
      };
    }, []);

    // ─── Render ─────────────────────────────────────────────────────────────

    var totalEnergy = values ? values.totalEnergy_kBTU : 0;
    var electricEnergy = values ? values.electricEnergy_kWh : 0;
    var steamEnergy = values ? values.steamEnergy_kBTU : 0;
    var ghgEmissions = values ? values.ghgEmissions_mtCO2e : 0;

    var isCompliant = compliance ? compliance.compliant : true;
    var percentOfLimit = compliance ? compliance.percentOfLimit : 0;

    var statusColor = getStatusColor(isCompliant, percentOfLimit);
    var badgeBg = getBadgeBg(isCompliant, percentOfLimit);
    var statusText = getStatusText(isCompliant, percentOfLimit);
    var dotColor = getDotColor(isCompliant, percentOfLimit);

    return React.createElement('div', {
      className: 'bg-gray-900 border border-gray-700 rounded-md mx-2 my-2 overflow-hidden',
      'aria-label': 'LL97 Compliance Panel',
      role: 'region'
    },
      // Panel header
      React.createElement('div', {
        className: 'flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700'
      },
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('span', { className: 'text-xs font-bold text-gray-200 tracking-wide' }, 'LL97'),
          React.createElement('span', { className: 'text-[10px] text-gray-500' }, 'NYC Carbon Limit')
        ),
        // Compliance status badge
        React.createElement('div', {
          className: 'flex items-center gap-1.5 px-2 py-0.5 rounded border ' + badgeBg
        },
          React.createElement('span', { className: 'w-2 h-2 rounded-full ' + dotColor }),
          React.createElement('span', { className: 'text-[10px] font-semibold ' + statusColor }, statusText)
        )
      ),

      // Accumulator values grid
      React.createElement('div', {
        className: 'grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-2'
      },
        // Annual Energy
        React.createElement('div', { className: 'flex flex-col' },
          React.createElement('span', { className: 'text-[10px] text-gray-500 uppercase tracking-wider' }, 'Total Energy'),
          React.createElement('span', { className: 'text-xs font-mono text-gray-200' },
            formatNumber(totalEnergy, 0), ' ',
            React.createElement('span', { className: 'text-gray-500' }, 'kBTU')
          )
        ),
        // Electric Energy
        React.createElement('div', { className: 'flex flex-col' },
          React.createElement('span', { className: 'text-[10px] text-gray-500 uppercase tracking-wider' }, 'Electric'),
          React.createElement('span', { className: 'text-xs font-mono text-gray-200' },
            formatNumber(electricEnergy, 0), ' ',
            React.createElement('span', { className: 'text-gray-500' }, 'kWh')
          )
        ),
        // Steam Energy
        React.createElement('div', { className: 'flex flex-col' },
          React.createElement('span', { className: 'text-[10px] text-gray-500 uppercase tracking-wider' }, 'Steam'),
          React.createElement('span', { className: 'text-xs font-mono text-gray-200' },
            formatNumber(steamEnergy, 0), ' ',
            React.createElement('span', { className: 'text-gray-500' }, 'kBTU')
          )
        ),
        // GHG Emissions
        React.createElement('div', { className: 'flex flex-col' },
          React.createElement('span', { className: 'text-[10px] text-gray-500 uppercase tracking-wider' }, 'GHG Emissions'),
          React.createElement('span', { className: 'text-xs font-mono text-gray-200' },
            formatNumber(ghgEmissions, 2), ' ',
            React.createElement('span', { className: 'text-gray-500' }, 'mtCO₂e')
          )
        )
      ),

      // Progress bar showing percent of limit consumed
      React.createElement('div', {
        className: 'px-3 pb-2'
      },
        React.createElement('div', { className: 'flex items-center justify-between mb-1' },
          React.createElement('span', { className: 'text-[10px] text-gray-500' }, 'Limit Consumed'),
          React.createElement('span', { className: 'text-[10px] font-mono ' + statusColor },
            formatNumber(percentOfLimit, 1) + '%'
          )
        ),
        // Progress bar track
        React.createElement('div', {
          className: 'h-1.5 rounded-full bg-gray-700 overflow-hidden',
          role: 'progressbar',
          'aria-valuenow': Math.min(percentOfLimit, 100),
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-label': 'LL97 limit consumption progress'
        },
          // Progress bar fill
          React.createElement('div', {
            className: 'h-full rounded-full transition-all duration-300 ' +
              (!isCompliant ? 'bg-red-500' :
                percentOfLimit > WARNING_THRESHOLD ? 'bg-amber-500' : 'bg-green-500'),
            style: { width: Math.min(percentOfLimit, 100) + '%' }
          })
        )
      )
    );
  }

  return LL97PanelComponent;
})();

// Expose globally — no import/export
window.LL97Panel = LL97Panel;
