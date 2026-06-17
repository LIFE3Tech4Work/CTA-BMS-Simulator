/**
 * AHUImageOverlay.jsx — Real Honeywell SymmetrE AHU graphic as background
 * image with interactive hotspot overlays for live point values.
 *
 * Uses the actual BMS screenshots as background, then positions clickable
 * value displays on top at the locations where data appears in the real system.
 * This mirrors how many real BMS systems work — static graphic with data overlays.
 *
 * Props:
 *   ahuId - 'AHU-4-4' or 'AHU-4-6'
 *
 * Hotspot positions are defined as percentages of image dimensions.
 * To adjust positions: open the image, measure pixel coords, divide by
 * image size (3604 × 1452) and multiply by 100 to get %.
 *
 * No import/export — exposed as window.AHUImageOverlay
 */

const AHUImageOverlay = (() => {
  'use strict';

  const { useState, useEffect, useCallback } = React;

  // ─── Image paths (served from src/assets/) ──────────────────────────────────

  const IMAGE_MAP = {
    'AHU-4-4': 'assets/AHU_4_4_Hotel.png',
    'AHU-4-6': 'assets/AHU_4_6_Hotel.png',
  };

  // ─── Hotspot definitions ────────────────────────────────────────────────────
  // x, y = top-left corner as % of image width/height
  // w, h = width/height as % of image
  // These are approximate — adjust after visual inspection

  const HOTSPOT_MAP = {
    'AHU-4-4': [
      { id: 'oaDamper', address: 'AO104@DEV4004', label: 'OA Damper', units: '%',
        x: 5.5, y: 55, w: 5.5, h: 5 },
      { id: 'phtCoilValve', address: 'AO103@DEV4004', label: 'PHT Coil Valve', units: '%',
        x: 24, y: 55, w: 5.5, h: 5 },
      { id: 'chwCoilValve', address: 'AO102@DEV4004', label: 'CHW Coil Valve', units: '%',
        x: 38, y: 55, w: 5.5, h: 5 },
      { id: 'saFanSpeed', address: 'AO101@DEV4004', label: 'Fan Speed', units: '%',
        x: 58, y: 42, w: 5.5, h: 5 },
      { id: 'saTemp', address: 'AI301@DEV4004', label: 'Supply Air Temp', units: '°F',
        x: 72, y: 32, w: 6, h: 5 },
      { id: 'raTemp', address: 'AI201@DEV4004', label: 'Return Air Temp', units: '°F',
        x: 80, y: 60, w: 6, h: 5 },
      { id: 'raCO2', address: 'AI401@DEV4004', label: 'CO₂', units: 'ppm',
        x: 80, y: 68, w: 6, h: 5 },
      { id: 'branchStatic', address: 'AI501@DEV4004', label: 'Static Pressure', units: 'in.W.C.',
        x: 68, y: 60, w: 7, h: 5 },
    ],
    'AHU-4-6': [
      { id: 'oaDamper', address: 'AO104@DEV4006', label: 'OA Damper', units: '%',
        x: 5.5, y: 55, w: 5.5, h: 5 },
      { id: 'phtCoilValve', address: 'AO103@DEV4006', label: 'PHT Coil Valve', units: '%',
        x: 24, y: 55, w: 5.5, h: 5 },
      { id: 'chwCoilValve', address: 'AO102@DEV4006', label: 'CHW Coil Valve', units: '%',
        x: 38, y: 55, w: 5.5, h: 5 },
      { id: 'saFanSpeed', address: 'AO101@DEV4006', label: 'Fan Speed', units: '%',
        x: 58, y: 42, w: 5.5, h: 5 },
      { id: 'saTemp', address: 'AI301@DEV4006', label: 'Supply Air Temp', units: '°F',
        x: 72, y: 32, w: 6, h: 5 },
      { id: 'raTemp', address: 'AI201@DEV4006', label: 'Return Air Temp', units: '°F',
        x: 80, y: 60, w: 6, h: 5 },
      { id: 'raCO2', address: 'AI401@DEV4006', label: 'CO₂', units: 'ppm',
        x: 80, y: 68, w: 6, h: 5 },
      { id: 'branchStatic', address: 'AI501@DEV4006', label: 'Static Pressure', units: 'in.W.C.',
        x: 68, y: 60, w: 7, h: 5 },
    ],
  };

  // ─── Hook: live value from PointRegistry ────────────────────────────────────

  function useLiveValue(address) {
    var _state = useState(null);
    var value = _state[0];
    var setValue = _state[1];

    useEffect(function() {
      var reg = window.PointRegistry;
      if (!reg) return;
      var init = reg.getValue(address);
      if (init !== undefined) setValue(init);
      function onUpdate(pt) { setValue(pt.currentValue); }
      reg.subscribe(address, onUpdate);
      return function() { reg.unsubscribe(address, onUpdate); };
    }, [address]);

    return value;
  }

  // ─── Hotspot Component ──────────────────────────────────────────────────────

  function Hotspot({ spot, onClick }) {
    var value = useLiveValue(spot.address);

    var display = '--.-';
    if (value !== null && value !== undefined) {
      if (typeof value === 'number') {
        if (spot.units === 'ppm') {
          display = Math.round(value).toString();
        } else if (spot.units === 'in.W.C.') {
          display = value.toFixed(2);
        } else {
          display = value.toFixed(1);
        }
      } else {
        display = String(value);
      }
    }

    return React.createElement('button', {
      className: 'absolute flex items-center justify-center rounded ' +
        'bg-black/70 hover:bg-cyan-900/80 ' +
        'border border-cyan-500/50 hover:border-cyan-300 ' +
        'transition-all cursor-pointer ' +
        'text-[10px] sm:text-xs font-mono text-white font-bold ' +
        'shadow-lg backdrop-blur-sm',
      style: {
        left: spot.x + '%',
        top: spot.y + '%',
        width: spot.w + '%',
        height: spot.h + '%',
        minWidth: '50px',
        minHeight: '22px',
      },
      onClick: function() { onClick(spot.address); },
      title: spot.label + ': ' + display + ' ' + spot.units + ' — Click for point detail',
      'aria-label': spot.label + ' ' + display + ' ' + spot.units,
    },
      React.createElement('span', null, display + ' ' + spot.units)
    );
  }

  // ─── Main Component ─────────────────────────────────────────────────────────

  function AHUImageOverlayComponent({ ahuId }) {
    var effectiveId = ahuId || 'AHU-4-4';
    var imageSrc = IMAGE_MAP[effectiveId] || IMAGE_MAP['AHU-4-4'];
    var hotspots = HOTSPOT_MAP[effectiveId] || [];

    var handleClick = useCallback(function(address) {
      window.location.hash = '#/ebi/' + address + '/general';
    }, []);

    return React.createElement('div', {
      className: 'relative w-full h-full overflow-hidden bg-gray-900',
      'data-testid': 'ahu-image-overlay',
    },
      // Background image (the real Honeywell SymmetrE screenshot)
      React.createElement('img', {
        src: imageSrc,
        alt: effectiveId + ' — Honeywell SymmetrE AHU Schematic',
        className: 'w-full h-full object-contain',
        draggable: false,
        style: { imageRendering: 'auto' },
      }),

      // Hotspot overlay layer (absolute positioned on top of image)
      React.createElement('div', {
        className: 'absolute inset-0',
        'aria-label': 'Interactive point hotspots — click any value to view point detail',
      },
        hotspots.map(function(spot) {
          return React.createElement(Hotspot, {
            key: spot.id,
            spot: spot,
            onClick: handleClick,
          });
        })
      )
    );
  }

  return AHUImageOverlayComponent;
})();

window.AHUImageOverlay = AHUImageOverlay;
