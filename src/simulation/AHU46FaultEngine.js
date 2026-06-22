/**
 * AHU46FaultEngine.js — Fault detection rules for AHU-4-6
 *
 * Mirrors AHU44NewFaultEngine.js's rule pattern, adapted for the Meeting
 * Room 2nd Level AHU. Fault rule IDs use the M-series prefix (M-01..M-04)
 * to distinguish from AHU-4-4's N-series rules.
 *
 * M-01: Supply air too warm — cooling coil cannot maintain setpoint
 * M-02: CO₂ exceeds 1,100 ppm (ASHRAE 62.1 upper guideline)
 * M-03: Economizer active while mechanical cooling still engaged
 * M-04: OA damper below ASHRAE 62.1 minimum (60% for meeting rooms)
 *        Note: the 60% floor makes this fault pedagogically distinct —
 *        a damper stuck at 30% on this unit starves 2× more fresh air
 *        than the same fault would on AHU-4-4 (20% floor).
 *
 * Attached to window.AHU46FaultEngine (no import/export — Babel standalone).
 */

(function() {
  'use strict';

  var activeAlarms = {};

  var rules = [
    {
      id: 'M-01',
      description: 'Supply air temp exceeds cooling setpoint — cooling coil unable to maintain discharge setpoint (chilled water pressure, valve fault, or coil fouling)',
      priority: 'high',
      sourceField: 'supplyAirTemp',
      relatedStateKeys: ['supplyAirTemp', 'coolingCoilSetpoint', 'chwValvePosition'],
      condition: function(state) {
        if (state.supplyAirTemp === undefined || state.coolingCoilSetpoint === undefined) return false;
        if (!state.fanRunning) return false;
        return state.supplyAirTemp > (state.coolingCoilSetpoint + 3);
      }
    },
    {
      id: 'M-02',
      description: 'CO₂ exceeds ventilation threshold (>1,100 ppm, ASHRAE 62.1 upper guideline) — meeting-room occupancy driving up CO₂ faster than OA delivery can dilute it',
      priority: 'urgent',
      sourceField: 'co2Sensor',
      relatedStateKeys: ['co2Sensor'],
      condition: function(state) {
        if (state.co2Sensor === undefined) return false;
        return state.co2Sensor > 1100;
      }
    },
    {
      id: 'M-03',
      description: 'Economizer fully open (free cooling) while mechanical cooling (CHW valve) is still active — setpoint and economizer changeover SP may be misconfigured',
      priority: 'high',
      sourceField: 'chwValvePosition',
      relatedStateKeys: ['chwValvePosition', 'economizerActive'],
      condition: function(state) {
        if (state.economizerActive === undefined || state.chwValvePosition === undefined) return false;
        return state.economizerActive === true && state.chwValvePosition > 0;
      }
    },
    {
      id: 'M-04',
      description: 'OA damper below the ASHRAE 62.1 minimum position (60%) while fan is running — ventilation shortfall. At 60% min, this fault is especially significant: a stuck damper at 10% starves meeting-room occupants of ~5,000 CFM of required fresh air.',
      priority: 'high',
      sourceField: 'oaDamperPosition',
      relatedStateKeys: ['oaDamperPosition', 'oaCFM', 'minOAAirflowSetpoint'],
      condition: function(state) {
        if (state.fanRunning === undefined || state.oaDamperPosition === undefined) return false;
        return state.fanRunning === true && state.oaDamperPosition < 60;
      }
    }
  ];

  function evaluate(state) {
    var newAlarms = [];
    rules.forEach(function(rule) {
      var fires = false;
      try { fires = rule.condition(state); } catch(e) {}
      if (fires) {
        if (!activeAlarms[rule.id]) {
          activeAlarms[rule.id] = {
            condition: rule.id,
            description: rule.description,
            priority: rule.priority,
            sourceField: rule.sourceField,
            value: state[rule.sourceField],
            timestamp: new Date().toISOString(),
          };
        }
        newAlarms.push(activeAlarms[rule.id]);
      } else {
        delete activeAlarms[rule.id];
      }
    });
    return newAlarms;
  }

  function getActiveAlarms() {
    return Object.values(activeAlarms);
  }

  window.AHU46FaultEngine = {
    rules: rules,
    evaluate: evaluate,
    getActiveAlarms: getActiveAlarms,
  };

})();
