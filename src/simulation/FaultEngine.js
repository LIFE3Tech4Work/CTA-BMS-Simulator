/**
 * FaultEngine.js — Fault detection engine for the BMS Simulator
 *
 * Evaluates 6 fault detection rules (F-01 through F-06) on every simulation tick.
 * Generates alarms when fault conditions are met, transitions alarms to inactive
 * when conditions clear (preserving acknowledgment state), and prevents duplicates.
 *
 * Attached to window.FaultEngine (no import/export — Babel standalone).
 *
 * Validates: Requirements 17.1, 17.2, 17.4, 17.5
 */

(function () {
  'use strict';

  // ─── Fault Rules (F-01 through F-06) ───────────────────────────────────────
  // Defined inline to avoid import dependency (no bundler).
  // These match the design spec's 6 fault conditions.

  const rules = [
    {
      id: 'F-01',
      description: 'Simultaneous heating and cooling',
      priority: 'urgent',
      sourcePoint: 'AO_PHT@DEV4004',
      condition: function (values) {
        const pht = values.get('AO_PHT@DEV4004');
        const chw = values.get('AO_CHW@DEV4004');
        return pht > 20 && chw > 20;
      }
    },
    {
      id: 'F-02',
      description: 'Supply air temperature deviation',
      priority: 'high',
      sourcePoint: 'AI_SAT@DEV4004',
      condition: function (values) {
        const sat = values.get('AI_SAT@DEV4004');
        const satSp = values.get('AO_SAT_SP@DEV4004');
        if (sat === undefined || satSp === undefined) return false;
        return Math.abs(sat - satSp) > 5;
      }
    },
    {
      id: 'F-03',
      description: 'AHU running during unoccupied hours',
      priority: 'high',
      sourcePoint: 'BI_FAN@DEV4004',
      condition: function (values) {
        const fan = values.get('BI_FAN@DEV4004');
        const schedule = values.get('BI_OCC@DEV4004');
        return fan === 1 && schedule === 0;
      }
    },
    {
      id: 'F-04',
      description: 'Outdoor air damper fully closed during occupied hours',
      priority: 'urgent',
      sourcePoint: 'AO_OAD@DEV4004',
      condition: function (values) {
        const oad = values.get('AO_OAD@DEV4004');
        const schedule = values.get('BI_OCC@DEV4004');
        return oad < 5 && schedule === 1;
      }
    },
    {
      id: 'F-05',
      description: 'Economizer not active when OAT permits',
      priority: 'high',
      sourcePoint: 'AI_OAT@DEV5000',
      condition: function (values) {
        const oat = values.get('AI_OAT@DEV5000');
        const oad = values.get('AO_OAD@DEV4004');
        const chw = values.get('AO_CHW@DEV4004');
        return oat < 55 && oad < 50 && chw > 20;
      }
    },
    {
      id: 'F-06',
      description: 'CO2 exceeds ventilation threshold',
      priority: 'urgent',
      sourcePoint: 'AI_CO2@DEV4004',
      condition: function (values) {
        const co2 = values.get('AI_CO2@DEV4004');
        return co2 > 800;
      }
    }
  ];

  // ─── Active Alarms ──────────────────────────────────────────────────────────
  // Map<ruleId, Alarm> — one active alarm per rule at most (Property 20)

  const activeAlarms = new Map();

  // ─── Core Methods ───────────────────────────────────────────────────────────

  /**
   * Evaluate all fault rules against current point values.
   * Called on each simulation tick with the current point values.
   *
   * - If a rule's condition is TRUE and no active alarm exists: generate alarm (Property 20)
   * - If a rule's condition is FALSE and an active alarm exists: transition to inactive (Property 21)
   *
   * @param {Map<string, number>} pointValues - Current point values keyed by BACnet address
   * @returns {Alarm[]} - Array of newly generated alarms (for notification to AlarmStore)
   */
  function evaluate(pointValues) {
    const newAlarms = [];

    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var conditionMet = false;

      try {
        conditionMet = rule.condition(pointValues);
      } catch (e) {
        // If condition evaluation fails, treat as not met
        conditionMet = false;
      }

      if (conditionMet) {
        // Condition is TRUE — generate alarm if none exists for this rule
        if (!activeAlarms.has(rule.id)) {
          var triggerValue = pointValues.get(rule.sourcePoint);
          var alarm = {
            id: rule.id + '_' + Date.now(),
            timestamp: new Date(),
            source: rule.sourcePoint,
            condition: rule.id,
            priority: rule.priority,
            description: rule.description,
            value: triggerValue !== undefined ? triggerValue : 'N/A',
            lifecycle: 'active',
            acknowledged: false,
            operator: '',
            action: ''
          };

          activeAlarms.set(rule.id, alarm);
          newAlarms.push(alarm);
        }
      } else {
        // Condition is FALSE — if alarm exists, transition to inactive
        // Property 21: preserve acknowledgment state
        if (activeAlarms.has(rule.id)) {
          var existingAlarm = activeAlarms.get(rule.id);
          if (existingAlarm.lifecycle === 'active') {
            existingAlarm.lifecycle = 'inactive';
            // acknowledged state is preserved (no change)
          }
        }
      }
    }

    return newAlarms;
  }

  /**
   * Returns array of all currently active alarms (lifecycle === 'active').
   * @returns {Alarm[]}
   */
  function getActiveAlarms() {
    var result = [];
    activeAlarms.forEach(function (alarm) {
      if (alarm.lifecycle === 'active') {
        result.push(alarm);
      }
    });
    return result;
  }

  /**
   * Returns array of ALL alarms (active and inactive) still tracked.
   * @returns {Alarm[]}
   */
  function getAllAlarms() {
    return Array.from(activeAlarms.values());
  }

  /**
   * Acknowledge an alarm by its fault rule ID.
   * @param {string} ruleId - Fault rule ID (e.g., "F-01")
   * @param {string} operator - Name of operator acknowledging
   */
  function acknowledge(ruleId, operator) {
    var alarm = activeAlarms.get(ruleId);
    if (alarm) {
      alarm.acknowledged = true;
      alarm.operator = operator || '';
    }
  }

  /**
   * Reset all active alarms (for scenario changes).
   */
  function reset() {
    activeAlarms.clear();
  }

  // ─── Expose as window global ────────────────────────────────────────────────

  window.FaultEngine = {
    // State accessors
    get rules() { return rules; },
    get activeAlarms() { return activeAlarms; },

    // Methods
    evaluate: evaluate,
    getActiveAlarms: getActiveAlarms,
    getAllAlarms: getAllAlarms,
    acknowledge: acknowledge,
    reset: reset,

    // Testing helper — reset internal state
    _reset: function () {
      activeAlarms.clear();
    }
  };
})();
