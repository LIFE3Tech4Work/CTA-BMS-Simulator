/**
 * AHU44NewImageOverlay.jsx — Real Honeywell/TecSystems AHU graphic as background
 * image with READ-ONLY hotspot overlays for AHU-4-4_NEW.
 *
 * Service: Pre-Function / Ballroom Level 2, Location: Level 4
 *
 * Data flow:
 *   window.AHU44NewState (shared state) → this overlay (READ-ONLY display)
 *   The Controls Sidebar is the ONLY place where values are edited.
 *
 * Hotspot positions mapped from the Honeywell/TecSystems screenshot.
 * Image dimensions reference: ~1024 × 575 (approximate from screenshot aspect)
 *
 * No import/export — exposed as window.AHU44NewImageOverlay
 */

const AHU44NewImageOverlay = (() => {
  'use strict';

  const { useState, useEffect } = React;

  // ─── Image path ─────────────────────────────────────────────────────────────

  const IMAGE_SRC = 'assets/AHU_4_4_NEW_Honeywell.png';

  // ─── Hotspot definitions ────────────────────────────────────────────────────
  // Positions as % of image width/height, mapped from the screenshot.
  // The screenshot shows a complex multi-section AHU with:
  // - Exhaust air section (top left)
  // - OA plenum + filter + preheat coil (left-center)
  // - Cooling coils (center)
  // - Supply fan + VFD (center-right)
  // - Return air section (right)
  // - Interlock panel (top-right)

  const HOTSPOTS = [
    // OA Plenum CFM
    { id: 'oaCfm', stateKey: 'oaCFM', label: 'OA Plenum CFM', units: 'CFM',
      x: 18, y: 42, w: 8, h: 5 },
    // Preheat discharge temp
    { id: 'phtTemp', stateKey: 'preheatTemp', label: 'Preheat Discharge', units: '°F',
      x: 30, y: 42, w: 7, h: 5 },
    // Cooling coil 1 discharge (TS showing 57.0°F)
    { id: 'coolTemp1', stateKey: 'supplyAirTemp', label: 'Cooling Coil Temp', units: '°F',
      x: 42, y: 42, w: 7, h: 5 },
    // Cooling coil 2 discharge (56.5°F)
    { id: 'coolTemp2', stateKey: 'mixedAirTemp', label: 'Mixed Air Temp', units: '°F',
      x: 42, y: 50, w: 7, h: 5 },
    // Supply fan CFM (main, 8550 or 12438)
    { id: 'supplyCfm', stateKey: 'cfm', label: 'Supply CFM', units: 'CFM',
      x: 56, y: 28, w: 9, h: 5 },
    // VFD speed
    { id: 'fanSpeed', stateKey: 'fanSpeed', label: 'VFD Speed', units: '%',
      x: 67, y: 42, w: 6, h: 5 },
    // OA Damper %
    { id: 'oaDamper', stateKey: 'oaDamperPosition', label: 'OA Damper', units: '%',
      x: 12, y: 32, w: 6, h: 4 },
    // Exhaust damper
    { id: 'exhDamper', stateKey: 'exhaustDamperPct', label: 'Exhaust Damper', units: '%',
      x: 12, y: 18, w: 6, h: 4 },
    // CHW valve position
    { id: 'chwValve', stateKey: 'chwValvePosition', label: 'CHW Valve', units: '%',
      x: 42, y: 58, w: 6, h: 4 },
    // PHT valve position
    { id: 'phtValve', stateKey: 'phtValvePosition', label: 'PHT Valve', units: '%',
      x: 30, y: 58, w: 6, h: 4 },
    // Fan status (SHUTDOWN/START/ON)
    { id: 'fanStatus', stateKey: 'fanRunning', label: 'Fan Status', units: '',
      x: 60, y: 52, w: 10, h: 7 },
    // Interlock status
    { id: 'interlock', stateKey: 'interlockOn', label: 'Interlock', units: '',
      x: 60, y: 18, w: 9, h: 5 },
    // Supply static pressure
    { id: 'supplyStatic', stateKey: 'supplyStaticPressure', label: 'Supply Static', units: 'kBn',
      x: 78, y: 28, w: 7, h: 5 },
    // Return static pressure
    { id: 'returnStatic', stateKey: 'returnStaticPressure', label: 'Return Static', units: '%',
      x: 78, y: 42, w: 7, h: 5 },
    // Freeze pump status
    { id: 'freezePump', stateKey: 'freezePumpOn', label: 'Freeze Pump', units: '',
      x: 40, y: 72, w: 8, h: 5 },
  ];

  // ─── Hotspot Component ──────────────────────────────────────────────────────

  function Hotspot({ spot }) {
    var ctrl = window.AHU44NewController;
    var initialState = window.AHU44NewState || (ctrl ? ctrl.getState() : {});
    var [value, setValue] = useState(initialState[spot.stateKey]);

    useEffect(function() {
      if (!ctrl) return;
      var unsub = ctrl.subscribe(function(s) {
        setValue(s[spot.stateKey]);
      });
      return unsub;
    }, [spot.stateKey]);

    // Format display value
    var display = '--';
    if (value !== null && value !== undefined) {
      if (typeof value === 'boolean') {
        display = value ? 'ON' : 'OFF';
      } else if (typeof value === 'number') {
        if (spot.stateKey === 'cfm' || spot.stateKey === 'oaCFM') {
          display = Math.round(value).toLocaleString();
        } else {
          display = value.toFixed(1);
        }
      } else {
        display = String(value);
      }
    }

    // Color coding
    var bgClass = 'bg-black/70 border-cyan-500/50';
    if (typeof value === 'boolean') {
      bgClass = value
        ? 'bg-green-900/80 border-green-400/70'
        : 'bg-red-900/70 border-red-400/50';
    }

    return React.createElement('div', {
      className: 'absolute flex items-center justify-center rounded ' +
        bgClass + ' border ' +
        'text-[9px] sm:text-[10px] font-mono text-white font-bold ' +
        'shadow-lg pointer-events-none select-none',
      style: {
        left: spot.x + '%',
        top: spot.y + '%',
        width: spot.w + '%',
        height: spot.h + '%',
        minWidth: '40px',
        minHeight: '16px',
      },
      title: spot.label + ': ' + display + (spot.units ? ' ' + spot.units : '') + ' (read-only)',
      'aria-label': spot.label + ' ' + display + ' ' + spot.units,
      role: 'status',
    },
      React.createElement('span', null, display + (spot.units ? ' ' + spot.units : ''))
    );
  }

  // ─── Main Component ─────────────────────────────────────────────────────────

  function AHU44NewImageOverlayComponent() {
    return React.createElement('div', {
      className: 'relative w-full min-h-full bg-gray-900',
      'data-testid': 'ahu-44-new-image-overlay',
    },
      // Background image (the Honeywell/TecSystems screenshot)
      React.createElement('img', {
        src: IMAGE_SRC,
        alt: 'AHU-4-4_NEW — Honeywell SymmetrE / TecSystems AHU Schematic (Pre-Function/Ballroom Level 2)',
        className: 'w-full h-full object-contain',
        draggable: false,
        style: { imageRendering: 'auto' },
      }),

      // READ-ONLY hotspot overlay layer
      React.createElement('div', {
        className: 'absolute inset-0',
        'aria-label': 'AHU-4-4_NEW live values — read-only display driven by Controls Sidebar',
        role: 'region',
      },
        HOTSPOTS.map(function(spot) {
          return React.createElement(Hotspot, {
            key: spot.id,
            spot: spot,
          });
        })
      )
    );
  }

  return AHU44NewImageOverlayComponent;
})();

window.AHU44NewImageOverlay = AHU44NewImageOverlay;
