/**
 * AHU44NewController.js — Control logic engine for AHU-4-4_NEW
 *
 * Implements reactive BMS control sequences for the Pre-Function/Ballroom
 * Level 2 AHU (based on the Honeywell SymmetrE TecSystems screenshot).
 *
 * Engineering Relationships:
 * ┌────────────────────────────────────────────────────────────────────────────┐
 * │ Run Schedule On/Off  → Fan ON/OFF status + CFM display                    │
 * │ Cooling Coil SP      → Modulates CHW valve % to maintain SAT              │
 * │ Heating Coil SP      → Modulates PHT valve %                              │
 * │ OAT + Enthalpy OK    → Determines if economizer active (OA damper > min)  │
 * │ Minimum Position 20% → OA damper floor                                    │
 * │ CO₂ > setpoint       → OA damper increases above minimum                  │
 * │ Fan Speed %          → CFM = fan speed × design CFM (16500) / 100         │
 * │ Interlock ON         → Related equipment interlocked                      │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Data flow:
 *   Controls Sidebar (WRITES) → window.AHU44NewState → Graphic (READS)
 *
 * Exposed as:
 *   window.AHU44NewController — public API { getState, setValue, subscribe, recalculate }
 *   window.AHU44NewState      — shared state object (read by graphic)
 */

(function() {
  'use strict';

  // ─── Design Constants ───────────────────────────────────────────────────────

  var DESIGN_CFM = 16500;          // Rated max supply airflow at 100% fan speed
  var RETURN_AIR_TEMP = 75;        // Assumed return air temperature (°F)
  var OA_DAMPER_FLOOR = 20;        // Minimum damper position (%) per ASHRAE 62.1

  // ─── Shared State Object ────────────────────────────────────────────────────

  var state = {
    // ═══ INPUTS (editable from Controls Sidebar) ═══════════════════════════════
    runSchedule: true,
    systemStarting: false,
    startingTimeSetpoint: 240,     // seconds
    startingTimeLeft: 0,           // seconds remaining
    coolingCoilSetpoint: 60.0,     // °F
    heatingCoilSetpoint: 55.0,     // °F
    plenumMinSetpoint: 40.0,       // °F — freeze protection
    oaTemperature: 83.4,           // °F
    lowOATLockout: true,           // Low OAT lockout (ON in screenshot)
    oaEnthalpy: 32.0,             // BTU/lb
    enthalpyOKForEconomizer: false, // Enthalpy permits economizer
    economizerMinPosition: 20,     // % — OA damper floor
    minPositionFanSpeedLock: 5,    // %
    economizerTempControlSP: 52.0, // °F
    co2Sensor: 538,                // PPM
    co2Setpoint: 900,              // PPM
    minOAAirflowSetpoint: 4900,    // CFM
    fanTrackMode: 'CFM',
    fanSpeedSetpoint: 75,          // %
    fireAlarmShutdown: false,      // NORM
    fireAlarmSmokePurge: false,    // NORM

    // Additional inputs from diagram
    interlockOn: true,             // Interlock ON status
    exhaustFanOn: true,            // Exhaust/INT fan status
    commonDamperOpen: true,        // Common damper position
    freezePumpOn: true,            // Freeze pump running

    // ═══ OUTPUTS (calculated — READ-ONLY on diagram) ═════════════════════════
    fanRunning: true,
    fanSpeed: 75,                  // % actual
    cfm: 12375,                    // Supply air CFM
    oaCFM: 4900,                   // Outside air CFM (min OA)
    oaDamperPosition: 20,          // %
    economizerActive: false,
    phtValvePosition: 0,           // % — preheat valve
    chwValvePosition: 0,           // % — chilled water valve
    supplyAirTemp: 60.0,           // °F — discharge air temp
    preheatTemp: 72.9,             // °F — after preheat coil
    mixedAirTemp: 75.0,            // °F — mixed air
    returnAirTemp: 75.0,           // °F — return air
    supplyStaticPressure: 87.6,    // % (kBn reading)
    returnStaticPressure: 80.0,    // %
    chwSupplyTemp: 41.8,           // °F
    cwSupplyTemp: 75.2,            // °F
    phtValveStatus: 'OFF',
    chwValveStatus: 'ON',
    supplyFanStatus: 'ON',
    returnFanStatus: 'ON',
    exhaustDamperPct: 100,         // %
  };

  window.AHU44NewState = state;

  var subscribers = [];

  // ─── Engineering Calculations ───────────────────────────────────────────────

  function recalculate() {

    // 1. FAN LOGIC: Run Schedule → Fan ON/OFF + CFM
    if (state.fireAlarmShutdown || !state.runSchedule) {
      state.fanRunning = false;
      state.fanSpeed = 0;
      state.cfm = 0;
      state.oaCFM = 0;
      state.supplyFanStatus = 'OFF';
      state.returnFanStatus = 'OFF';
    } else {
      state.fanRunning = true;
      state.fanSpeed = state.fanSpeedSetpoint;
      state.cfm = Math.round(DESIGN_CFM * state.fanSpeed / 100);
      state.supplyFanStatus = 'ON';
      state.returnFanStatus = 'ON';
    }

    // 2. ECONOMIZER LOGIC: OAT + Enthalpy OK → economizer active
    state.economizerActive = false;

    if (state.fanRunning) {
      if (state.oaTemperature < state.economizerTempControlSP &&
          state.enthalpyOKForEconomizer &&
          !state.lowOATLockout) {
        state.economizerActive = true;
        state.oaDamperPosition = 100;
      } else {
        state.oaDamperPosition = Math.max(state.economizerMinPosition, OA_DAMPER_FLOOR);
      }

      // CO₂ DCV override
      if (state.co2Sensor > state.co2Setpoint && !state.economizerActive) {
        var co2Excess = state.co2Sensor - state.co2Setpoint;
        var co2DamperCommand = Math.min(100, state.economizerMinPosition + (co2Excess / 5));
        state.oaDamperPosition = Math.round(co2DamperCommand);
      }

      // OA CFM based on damper position
      state.oaCFM = Math.round(state.minOAAirflowSetpoint * (state.oaDamperPosition / state.economizerMinPosition));
      state.oaCFM = Math.min(state.oaCFM, state.cfm);
    } else {
      state.oaDamperPosition = 0;
      state.oaCFM = 0;
    }

    // Exhaust damper follows OA damper
    state.exhaustDamperPct = state.fanRunning ? state.oaDamperPosition : 0;

    // 3. HEATING LOGIC: Heating Coil SP → PHT valve %
    if (state.fanRunning) {
      if (state.oaTemperature < state.heatingCoilSetpoint) {
        var heatError = state.heatingCoilSetpoint - state.oaTemperature;
        state.phtValvePosition = Math.min(100, Math.round(heatError * 5));
        state.phtValveStatus = 'ON';
        state.preheatTemp = state.oaTemperature +
          (state.phtValvePosition / 100) * (state.heatingCoilSetpoint - state.oaTemperature + 20);
      } else {
        state.phtValvePosition = 0;
        state.phtValveStatus = 'OFF';
        state.preheatTemp = state.oaTemperature;
      }

      // Freeze protection
      if (state.preheatTemp < state.plenumMinSetpoint) {
        state.phtValvePosition = 100;
        state.phtValveStatus = 'ON';
        state.preheatTemp = state.plenumMinSetpoint;
      }
    } else {
      state.phtValvePosition = 0;
      state.phtValveStatus = 'OFF';
      state.preheatTemp = state.oaTemperature;
    }

    // 4. COOLING LOGIC: Cooling Coil SP → CHW valve %
    if (state.fanRunning) {
      var oaFraction = state.oaDamperPosition / 100;
      state.mixedAirTemp = Math.round(
        (state.preheatTemp * oaFraction + RETURN_AIR_TEMP * (1 - oaFraction)) * 10
      ) / 10;

      if (state.mixedAirTemp > state.coolingCoilSetpoint) {
        var coolError = state.mixedAirTemp - state.coolingCoilSetpoint;
        state.chwValvePosition = Math.min(100, Math.round(coolError * 8));
        state.chwValveStatus = 'ON';
        state.supplyAirTemp = state.mixedAirTemp -
          (state.chwValvePosition / 100) * (state.mixedAirTemp - state.coolingCoilSetpoint);
      } else {
        state.chwValvePosition = 0;
        state.chwValveStatus = 'OFF';
        state.supplyAirTemp = state.mixedAirTemp;
      }
    } else {
      state.chwValvePosition = 0;
      state.chwValveStatus = 'OFF';
      state.mixedAirTemp = RETURN_AIR_TEMP;
      state.supplyAirTemp = state.oaTemperature;
    }

    // Round outputs
    state.supplyAirTemp = Math.round(state.supplyAirTemp * 10) / 10;
    state.preheatTemp = Math.round(state.preheatTemp * 10) / 10;
    state.mixedAirTemp = Math.round(state.mixedAirTemp * 10) / 10;
    state.returnAirTemp = RETURN_AIR_TEMP;

    notifySubscribers();
  }

  function notifySubscribers() {
    for (var i = 0; i < subscribers.length; i++) {
      try { subscribers[i](state); } catch(e) {}
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  function getState() {
    return Object.assign({}, state);
  }

  function setValue(key, value) {
    if (state.hasOwnProperty(key)) {
      state[key] = value;
      recalculate();
    }
  }

  function subscribe(callback) {
    subscribers.push(callback);
    try { callback(state); } catch(e) {}
    return function unsubscribe() {
      subscribers = subscribers.filter(function(cb) { return cb !== callback; });
    };
  }

  // Initial calculation
  recalculate();

  // ─── Expose ─────────────────────────────────────────────────────────────────

  window.AHU44NewController = {
    getState: getState,
    setValue: setValue,
    subscribe: subscribe,
    recalculate: recalculate,
  };

})();
