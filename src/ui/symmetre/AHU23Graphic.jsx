/**
 * AHU23Graphic.jsx — Honeywell SymmetrE-style AHU-23-1 Graphic (SVG)
 *
 * Detailed SVG that replicates the exact visual grammar of a real Honeywell
 * SymmetrE AHU screen: 3D duct illusion, coil cross-hatching, pipe runs,
 * valve indicators, VFD panel, alarm status panel.
 *
 * This is a TEST/DEMO tab showing AHU-23-1 (the Memorial Sloan Kettering
 * unit referenced in Lev's training lectures).
 *
 * Uses static values for now (not connected to PointRegistry).
 * No import/export — exposed as window.AHU23Graphic
 */

const AHU23Graphic = (() => {
  const { useState } = React;

  function AHU23GraphicComponent() {
    // Static demo values (this AHU is for visual reference, not live data)
    var phtTemp = 94.0;
    var chwTemp = 0;
    var fanSpeed = 75;
    var cfm = 12425;
    var fanRunning = true;
    var oaDamperPct = 0;
    var phtValvePct = 0;
    var chwValvePct = 0;
    var plinMin = 50.0;
    var datSetpoint = 55.0;

    return React.createElement('div', {
      className: 'relative w-full h-full flex flex-col',
      'data-testid': 'ahu-23-graphic'
    },
      // Title
      React.createElement('div', { className: 'px-4 pt-2 pb-1' },
        React.createElement('div', { className: 'text-sm font-semibold text-gray-300' },
          'AHU-23-1 — Air Handling Unit Schematic'
        ),
        React.createElement('div', { className: 'text-[11px] text-cyan-400 mt-0.5' },
          'Reference: Honeywell SymmetrE R410.2 (Test/Demo)'
        )
      ),

      // SVG
      React.createElement('div', { className: 'flex-1 flex items-center justify-center px-2' },
        React.createElement('svg', {
          viewBox: '0 0 900 400',
          className: 'w-full h-full',
          style: { maxHeight: 'calc(100% - 40px)' },
          preserveAspectRatio: 'xMidYMid meet'
        },
          // ── Background ──
          React.createElement('defs', null,
            React.createElement('linearGradient', { id: 'sky23', x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
              React.createElement('stop', { offset: '0%', stopColor: '#9dd4ed' }),
              React.createElement('stop', { offset: '100%', stopColor: '#c5e6f5' })
            )
          ),
          React.createElement('rect', { width: '900', height: '400', fill: 'url(#sky23)' }),

          // ══════════════════════════════════════════════════════════════════════
          // MAIN HORIZONTAL DUCT (3D layered rects)
          // ══════════════════════════════════════════════════════════════════════
          // Shadow
          React.createElement('rect', { x: 72, y: 103, width: 756, height: 44, fill: '#8a8a8a', rx: 3 }),
          // Body
          React.createElement('rect', { x: 70, y: 100, width: 756, height: 44, fill: '#b8b8b8', stroke: '#6a6a6a', strokeWidth: 1.5, rx: 3 }),
          // Top highlight
          React.createElement('rect', { x: 73, y: 101, width: 750, height: 5, fill: '#d8d8d8', rx: 2 }),
          // Bottom edge
          React.createElement('rect', { x: 73, y: 139, width: 750, height: 3, fill: '#909090', rx: 1 }),

          // Duct sections dividers (vertical lines on duct)
          React.createElement('line', { x1: 180, y1: 100, x2: 180, y2: 144, stroke: '#888', strokeWidth: 0.5 }),
          React.createElement('line', { x1: 370, y1: 100, x2: 370, y2: 144, stroke: '#888', strokeWidth: 0.5 }),
          React.createElement('line', { x1: 520, y1: 100, x2: 520, y2: 144, stroke: '#888', strokeWidth: 0.5 }),

          // Section labels on duct
          React.createElement('text', { x: 275, y: 94, textAnchor: 'middle', fontSize: 9, fill: '#333', fontWeight: 'bold', fontFamily: 'Arial' }, 'PREHEAT'),
          React.createElement('text', { x: 445, y: 94, textAnchor: 'middle', fontSize: 9, fill: '#333', fontWeight: 'bold', fontFamily: 'Arial' }, 'COIL 2'),

          // ── OUTDOOR AIR (left) ──
          React.createElement('text', { x: 30, y: 127, fontSize: 9, fill: '#333', fontWeight: 'bold', fontFamily: 'Arial' }, 'OUTDOOR AIR'),
          React.createElement('polygon', { points: '55,132 65,127 65,137', fill: '#333' }),
          React.createElement('line', { x1: 65, y1: 132, x2: 70, y2: 132, stroke: '#333', strokeWidth: 2 }),

          // ── SUPPLY AIR (right) ──
          React.createElement('text', { x: 840, y: 127, fontSize: 9, fill: '#333', fontWeight: 'bold', fontFamily: 'Arial' }, 'SUPPLY AIR'),
          React.createElement('line', { x1: 826, y1: 127, x2: 838, y2: 127, stroke: '#333', strokeWidth: 2 }),
          React.createElement('polygon', { points: '838,127 832,122 832,132', fill: '#333' }),

          // ══════════════════════════════════════════════════════════════════════
          // FILTER SECTION
          // ══════════════════════════════════════════════════════════════════════
          // Filter housing
          React.createElement('rect', { x: 100, y: 78, width: 50, height: 65, fill: '#d5d5d5', stroke: '#888', strokeWidth: 1, rx: 2 }),
          React.createElement('text', { x: 125, y: 73, textAnchor: 'middle', fontSize: 8, fill: '#333', fontWeight: 'bold', fontFamily: 'Arial' }, 'FILTER'),
          // Green filter media blocks
          React.createElement('rect', { x: 106, y: 84, width: 16, height: 52, fill: '#2e8b2e', stroke: '#1a5c1a', strokeWidth: 0.8 }),
          React.createElement('rect', { x: 128, y: 84, width: 16, height: 52, fill: '#2e8b2e', stroke: '#1a5c1a', strokeWidth: 0.8 }),
          // Hatch lines on filters
          [0, 8, 16, 24, 32, 40, 48].map(function(dy, i) {
            return React.createElement('line', { key: 'fl' + i, x1: 106, y1: 84 + dy, x2: 144, y2: 84 + dy, stroke: '#1a5c1a', strokeWidth: 0.4 });
          }),

          // DPS-3 (differential pressure switch)
          React.createElement('rect', { x: 108, y: 148, width: 36, height: 24, fill: '#e8e8e8', stroke: '#999', strokeWidth: 0.8, rx: 2 }),
          React.createElement('text', { x: 126, y: 163, textAnchor: 'middle', fontSize: 7, fill: '#333', fontFamily: 'Arial' }, 'DPS-3'),

          // ══════════════════════════════════════════════════════════════════════
          // PREHEAT COIL (Coil 1)
          // ══════════════════════════════════════════════════════════════════════
          // Coil housing with cross-hatch
          React.createElement('rect', { x: 210, y: 88, width: 70, height: 55, fill: '#c8c8c8', stroke: '#777', strokeWidth: 1 }),
          // Cross-hatch horizontal
          [0, 7, 14, 21, 28, 35, 42, 49].map(function(dy, i) {
            return React.createElement('line', { key: 'ph' + i, x1: 212, y1: 90 + dy, x2: 278, y2: 90 + dy, stroke: '#888', strokeWidth: 0.4 });
          }),
          // Cross-hatch vertical
          [0, 10, 20, 30, 40, 50, 60].map(function(dx, i) {
            return React.createElement('line', { key: 'pv' + i, x1: 212 + dx, y1: 88, x2: 212 + dx, y2: 143, stroke: '#888', strokeWidth: 0.4 });
          }),
          // Sensor icons (yellow/green squares on top)
          React.createElement('rect', { x: 225, y: 82, width: 8, height: 8, fill: '#e6c619', stroke: '#999', strokeWidth: 0.5 }),
          React.createElement('rect', { x: 255, y: 82, width: 8, height: 8, fill: '#2e8b2e', stroke: '#999', strokeWidth: 0.5 }),
          // FZ-1 / TS-1 labels
          React.createElement('text', { x: 229, y: 80, textAnchor: 'middle', fontSize: 6, fill: '#333', fontFamily: 'Arial' }, 'FZ-1'),
          React.createElement('text', { x: 259, y: 80, textAnchor: 'middle', fontSize: 6, fill: '#333', fontFamily: 'Arial' }, 'TS-1'),
          // Temperature display
          React.createElement('text', { x: 245, y: 115, textAnchor: 'middle', fontSize: 16, fill: '#000', fontWeight: 'bold', fontFamily: 'Arial' }, phtTemp.toFixed(1) + '°F'),

          // Preheat pipes (dark red, 3D)
          React.createElement('rect', { x: 225, y: 145, width: 10, height: 95, fill: '#7a0000', stroke: '#4a0000', strokeWidth: 1 }),
          React.createElement('rect', { x: 225, y: 145, width: 10, height: 95, fill: '#8b1a1a', stroke: '#4a0000', strokeWidth: 0.5 }),
          React.createElement('rect', { x: 260, y: 145, width: 10, height: 95, fill: '#7a0000', stroke: '#4a0000', strokeWidth: 1 }),
          React.createElement('rect', { x: 260, y: 145, width: 10, height: 95, fill: '#8b1a1a', stroke: '#4a0000', strokeWidth: 0.5 }),

          // P-1 pump circle
          React.createElement('circle', { cx: 230, cy: 245, r: 12, fill: '#ddd', stroke: '#777', strokeWidth: 1 }),
          React.createElement('text', { x: 230, y: 241, textAnchor: 'middle', fontSize: 6, fill: '#333', fontFamily: 'Arial' }, 'P-1'),
          React.createElement('text', { x: 230, y: 250, textAnchor: 'middle', fontSize: 6, fill: '#333', fontFamily: 'Arial' }, 'F'),

          // Valve V-1
          React.createElement('rect', { x: 218, y: 260, width: 24, height: 28, fill: '#e0e0e0', stroke: '#888', strokeWidth: 0.8, rx: 2 }),
          React.createElement('circle', { cx: 230, cy: 270, r: 7, fill: '#cc0000', stroke: '#800000', strokeWidth: 1 }),
          React.createElement('text', { x: 230, y: 273, textAnchor: 'middle', fontSize: 5, fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial' }, 'OFF'),
          React.createElement('text', { x: 230, y: 283, textAnchor: 'middle', fontSize: 6, fill: '#000', fontFamily: 'Arial' }, 'OFF'),
          React.createElement('text', { x: 230, y: 300, textAnchor: 'middle', fontSize: 7, fill: '#333', fontWeight: 'bold', fontFamily: 'Arial' }, 'V-1'),

          // Preheat valve % display
          React.createElement('text', { x: 245, y: 165, textAnchor: 'middle', fontSize: 10, fill: '#000', fontWeight: 'bold', fontFamily: 'Arial' }, phtValvePct + ' %'),

          // ══════════════════════════════════════════════════════════════════════
          // CHW COIL (Coil 2)
          // ══════════════════════════════════════════════════════════════════════
          React.createElement('rect', { x: 380, y: 88, width: 70, height: 55, fill: '#c8c8c8', stroke: '#777', strokeWidth: 1 }),
          // Cross-hatch horizontal
          [0, 7, 14, 21, 28, 35, 42, 49].map(function(dy, i) {
            return React.createElement('line', { key: 'ch' + i, x1: 382, y1: 90 + dy, x2: 448, y2: 90 + dy, stroke: '#888', strokeWidth: 0.4 });
          }),
          // Cross-hatch vertical
          [0, 10, 20, 30, 40, 50, 60].map(function(dx, i) {
            return React.createElement('line', { key: 'cv' + i, x1: 382 + dx, y1: 88, x2: 382 + dx, y2: 143, stroke: '#888', strokeWidth: 0.4 });
          }),
          // Sensor icons
          React.createElement('rect', { x: 395, y: 82, width: 8, height: 8, fill: '#e6c619', stroke: '#999', strokeWidth: 0.5 }),
          React.createElement('rect', { x: 425, y: 82, width: 8, height: 8, fill: '#2e8b2e', stroke: '#999', strokeWidth: 0.5 }),
          React.createElement('text', { x: 399, y: 80, textAnchor: 'middle', fontSize: 6, fill: '#333', fontFamily: 'Arial' }, 'FZ-2'),
          React.createElement('text', { x: 429, y: 80, textAnchor: 'middle', fontSize: 6, fill: '#333', fontFamily: 'Arial' }, 'TS-2'),
          // Temperature display
          React.createElement('text', { x: 415, y: 115, textAnchor: 'middle', fontSize: 16, fill: '#000', fontWeight: 'bold', fontFamily: 'Arial' }, chwTemp + ' %'),

          // CHW pipes (dark red)
          React.createElement('rect', { x: 395, y: 145, width: 10, height: 95, fill: '#7a0000', stroke: '#4a0000', strokeWidth: 1 }),
          React.createElement('rect', { x: 430, y: 145, width: 10, height: 95, fill: '#7a0000', stroke: '#4a0000', strokeWidth: 1 }),

          // P-2 pump
          React.createElement('circle', { cx: 400, cy: 245, r: 12, fill: '#ddd', stroke: '#777', strokeWidth: 1 }),
          React.createElement('text', { x: 400, y: 241, textAnchor: 'middle', fontSize: 6, fill: '#333', fontFamily: 'Arial' }, 'P-2'),
          React.createElement('text', { x: 400, y: 250, textAnchor: 'middle', fontSize: 6, fill: '#333', fontFamily: 'Arial' }, 'F'),

          // Valve V-2
          React.createElement('rect', { x: 388, y: 260, width: 24, height: 28, fill: '#e0e0e0', stroke: '#888', strokeWidth: 0.8, rx: 2 }),
          React.createElement('circle', { cx: 400, cy: 270, r: 7, fill: '#cc0000', stroke: '#800000', strokeWidth: 1 }),
          React.createElement('text', { x: 400, y: 273, textAnchor: 'middle', fontSize: 5, fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial' }, 'OFF'),
          React.createElement('text', { x: 400, y: 283, textAnchor: 'middle', fontSize: 6, fill: '#000', fontFamily: 'Arial' }, 'OFF'),
          React.createElement('text', { x: 400, y: 300, textAnchor: 'middle', fontSize: 7, fill: '#333', fontWeight: 'bold', fontFamily: 'Arial' }, 'V-2'),

          // CHW valve % display
          React.createElement('text', { x: 415, y: 165, textAnchor: 'middle', fontSize: 10, fill: '#000', fontWeight: 'bold', fontFamily: 'Arial' }, chwValvePct + ' %'),

          // ══════════════════════════════════════════════════════════════════════
          // SETPOINTS (between coils)
          // ══════════════════════════════════════════════════════════════════════
          // PLIN MIN
          React.createElement('rect', { x: 340, y: 155, width: 60, height: 16, fill: '#fff', stroke: '#555', strokeWidth: 0.5 }),
          React.createElement('text', { x: 352, y: 166, fontSize: 8, fill: '#000', fontFamily: 'Arial' }, '⊕ ' + plinMin.toFixed(1) + ' °F'),
          React.createElement('text', { x: 370, y: 178, textAnchor: 'middle', fontSize: 6, fill: '#555', fontFamily: 'Arial' }, 'PLIN MIN'),

          // DAT SETPOINT
          React.createElement('rect', { x: 340, y: 182, width: 60, height: 16, fill: '#fff', stroke: '#555', strokeWidth: 0.5 }),
          React.createElement('text', { x: 352, y: 193, fontSize: 8, fill: '#000', fontFamily: 'Arial' }, '⊕ ' + datSetpoint.toFixed(1) + ' °F'),
          React.createElement('text', { x: 370, y: 205, textAnchor: 'middle', fontSize: 6, fill: '#555', fontFamily: 'Arial' }, 'DAT SETPOINT'),

          // ══════════════════════════════════════════════════════════════════════
          // FAN / VFD SECTION
          // ══════════════════════════════════════════════════════════════════════
          // CFM panel
          React.createElement('rect', { x: 545, y: 75, width: 120, height: 35, fill: '#e8e8e8', stroke: '#888', strokeWidth: 1, rx: 3 }),
          React.createElement('text', { x: 605, y: 97, textAnchor: 'middle', fontSize: 18, fill: '#000', fontWeight: 'bold', fontFamily: 'Arial' }, cfm + 'CFM'),
          // AHU label
          React.createElement('text', { x: 605, y: 118, textAnchor: 'middle', fontSize: 8, fill: '#333', fontFamily: 'Arial' }, 'AHU-23-1'),

          // VFD motor
          React.createElement('ellipse', { cx: 590, cy: 130, rx: 16, ry: 12, fill: '#333', stroke: '#000', strokeWidth: 1 }),
          React.createElement('rect', { x: 606, y: 122, width: 22, height: 16, fill: '#1a6b1a', stroke: '#0a4a0a', strokeWidth: 0.8, rx: 2 }),
          React.createElement('text', { x: 617, y: 133, textAnchor: 'middle', fontSize: 7, fill: '#0f0', fontWeight: 'bold', fontFamily: 'Arial' }, 'VFD'),

          // Speed %
          React.createElement('rect', { x: 640, y: 114, width: 40, height: 22, fill: '#fff', stroke: '#333', strokeWidth: 0.5 }),
          React.createElement('text', { x: 660, y: 129, textAnchor: 'middle', fontSize: 12, fill: '#000', fontWeight: 'bold', fontFamily: 'Arial' }, fanSpeed + ' %'),

          // Status panel (SHUTDOWN / START / ON)
          React.createElement('rect', { x: 555, y: 150, width: 110, height: 60, fill: fanRunning ? '#00a651' : '#cc0000', stroke: '#333', strokeWidth: 1.5, rx: 4 }),
          React.createElement('text', { x: 610, y: 166, textAnchor: 'middle', fontSize: 9, fill: '#fff', fontFamily: 'Arial', fontWeight: 'bold' }, 'SHUTDOWN'),
          React.createElement('text', { x: 610, y: 180, textAnchor: 'middle', fontSize: 9, fill: '#fff', fontFamily: 'Arial', fontWeight: 'bold' }, 'START'),
          React.createElement('text', { x: 610, y: 203, textAnchor: 'middle', fontSize: 22, fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial' },
            fanRunning ? 'ON' : 'OFF'
          ),

          // ══════════════════════════════════════════════════════════════════════
          // ALARM STATUS PANEL (top right)
          // ══════════════════════════════════════════════════════════════════════
          React.createElement('rect', { x: 680, y: 55, width: 170, height: 80, fill: '#f2f2f2', stroke: '#aaa', strokeWidth: 1, rx: 3 }),
          ['FAN SHUTDOWN: AUTO', 'FAN START: AUTO', 'LOW AIRFLOW', 'SUCTION PRES    STATIC PRES', 'TAMPER              FAIL'].map(function(label, i) {
            return React.createElement('text', { key: 'al' + i, x: 690, y: 70 + i * 13, fontSize: 8, fill: '#444', fontFamily: 'Arial' }, label);
          }),

          // ══════════════════════════════════════════════════════════════════════
          // Color blocks (top-right corner, decorative)
          // ══════════════════════════════════════════════════════════════════════
          React.createElement('rect', { x: 855, y: 55, width: 10, height: 10, fill: '#ff0', stroke: '#999', strokeWidth: 0.5 }),
          React.createElement('rect', { x: 867, y: 55, width: 10, height: 10, fill: '#0f0', stroke: '#999', strokeWidth: 0.5 }),
          React.createElement('rect', { x: 879, y: 55, width: 10, height: 10, fill: '#f90', stroke: '#999', strokeWidth: 0.5 })
        )
      )
    );
  }

  return AHU23GraphicComponent;
})();

window.AHU23Graphic = AHU23Graphic;
