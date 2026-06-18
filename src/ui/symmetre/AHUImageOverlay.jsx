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
    'AHU-23-1': 'assets/AHU_23_1_Honeywell.png',
  };

  // ─── Hotspot definitions ────────────────────────────────────────────────────
  // x, y = top-left corner as % of image width/height
  // w, h = width/height as % of image
  // Positions based on the Honeywell SymmetrE AHU-23-1 screenshot

  const HOTSPOT_MAP = {
    'AHU-23-1': [
      { id: 'phtTemp', address: 'AI301@DEV4004', label: 'Preheat Temp (TS-1)', units: '°F',
        x: 26, y: 28, w: 8, h: 7 },
      { id: 'chwTemp', address: 'AI201@DEV4004', label: 'CHW Temp (TS-2)', units: '%',
        x: 42, y: 28, w: 6, h: 7 },
      { id: 'fanSpeed', address: 'AO101@DEV4004', label: 'Fan Speed', units: '%',
        x: 74, y: 28, w: 6, h: 7 },
      { id: 'cfm', address: 'AO101@DEV4004', label: 'CFM', units: 'CFM',
        x: 58, y: 15, w: 10, h: 7 },
      { id: 'phtValve', address: 'AO103@DEV4004', label: 'PHT Valve (V-1)', units: '%',
        x: 26, y: 45, w: 6, h: 5 },
      { id: 'chwValve', address: 'AO102@DEV4004', label: 'CHW Valve (V-2)', units: '%',
        x: 42, y: 45, w: 6, h: 5 },
      { id: 'plinMin', address: 'AO104@DEV4004', label: 'PLIN MIN', units: '°F',
        x: 38, y: 45, w: 7, h: 5 },
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
      // Cropped to show only the schematic area (removes station toolbar and status bar)
      React.createElement('div', {
        className: 'w-full h-full overflow-hidden',
        style: { position: 'relative' }
      },
        React.createElement('img', {
          src: imageSrc,
          alt: effectiveId + ' — Honeywell SymmetrE AHU Schematic',
          className: 'absolute',
          draggable: false,
          style: {
            // Crop: zoom into the schematic area, skip top toolbar (~12%) and bottom status (~8%)
            top: '-8%',
            left: '-2%',
            width: '104%',
            height: '120%',
            objectFit: 'cover',
            objectPosition: 'center 55%',
            imageRendering: 'auto',
          },
        })
      ),

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
