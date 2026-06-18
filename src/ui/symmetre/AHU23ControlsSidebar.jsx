/**
 * AHU23ControlsSidebar.jsx — Honeywell SymmetrE-style Controls Panel for AHU-23-1
 *
 * Renders a blue-themed controls panel matching the real Honeywell SymmetrE
 * interface style. Static demo values (not connected to PointRegistry).
 * Only shown when AHU-23-1 tab is active.
 *
 * No import/export — exposed as window.AHU23ControlsSidebar
 */

const AHU23ControlsSidebar = (() => {
  'use strict';

  const { useState } = React;

  // Section header (blue bar with white text)
  function SectionHeader({ title }) {
    return React.createElement('div', {
      className: 'bg-blue-600 px-2 py-1 text-xs font-bold text-white uppercase tracking-wide'
    }, title);
  }

  // Row: label + value
  function Row({ label, value, units, editable, pink }) {
    var valueClass = 'px-2 py-0.5 text-xs font-mono rounded border ';
    if (pink) {
      valueClass += 'bg-pink-200 text-pink-900 border-pink-300';
    } else if (editable) {
      valueClass += 'bg-white text-black border-gray-400';
    } else {
      valueClass += 'bg-transparent text-gray-900 border-transparent font-bold';
    }

    return React.createElement('div', {
      className: 'flex items-center justify-between px-2 py-0.5 text-xs text-gray-800'
    },
      React.createElement('span', null, label),
      React.createElement('div', { className: 'flex items-center gap-1' },
        React.createElement('span', { className: valueClass }, value),
        units && React.createElement('span', { className: 'text-[10px] text-gray-600' }, units)
      )
    );
  }

  // Toggle indicator (On/Off with colored box)
  function ToggleRow({ label, value }) {
    var isOn = value === 'On' || value === 'NORM';
    return React.createElement('div', {
      className: 'flex items-center justify-between px-2 py-0.5 text-xs text-gray-800'
    },
      React.createElement('span', null, label),
      React.createElement('span', {
        className: 'px-2 py-0.5 text-xs font-bold rounded ' +
          (isOn ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700')
      }, value)
    );
  }

  function AHU23ControlsSidebarComponent() {
    var [collapsed, setCollapsed] = useState(false);

    if (collapsed) {
      return React.createElement('aside', {
        className: 'w-8 flex flex-col items-center pt-2 border-r border-gray-400',
        style: { backgroundColor: '#7fb3d4' }
      },
        React.createElement('button', {
          className: 'text-xs text-gray-700 hover:text-black',
          onClick: function() { setCollapsed(false); }
        }, '▶')
      );
    }

    return React.createElement('aside', {
      className: 'flex-shrink-0 overflow-y-auto border-r border-gray-400',
      style: { width: '260px', backgroundColor: '#a8d0e6' },
      'aria-label': 'Controls — AHU-23-1'
    },
      // Header
      React.createElement('div', {
        className: 'flex items-center justify-between px-2 py-1 border-b border-gray-400',
        style: { backgroundColor: '#7fb3d4' }
      },
        React.createElement('span', { className: 'text-xs font-bold text-gray-800' }, 'Controls — AHU-23-1'),
        React.createElement('button', {
          className: 'text-xs text-gray-600 hover:text-black',
          onClick: function() { setCollapsed(true); }
        }, '◀')
      ),

      // ─── SCHEDULE ───
      React.createElement(SectionHeader, { title: 'Schedule' }),
      React.createElement('div', { className: 'py-1' },
        React.createElement('div', {
          className: 'flex items-center justify-between px-2 py-0.5 text-xs text-gray-800'
        },
          React.createElement('span', null, 'Run Schedule'),
          React.createElement('div', { className: 'flex items-center gap-1' },
            React.createElement('span', { className: 'text-[10px]' }, '📅'),
            React.createElement('span', {
              className: 'px-2 py-0.5 text-xs font-bold rounded bg-green-500 text-white'
            }, 'On')
          )
        )
      ),

      // ─── TIMER CONTROL ───
      React.createElement(SectionHeader, { title: 'Timer Control' }),
      React.createElement('div', { className: 'py-1' },
        React.createElement(ToggleRow, { label: 'System Starting', value: 'Off' }),
        React.createElement(Row, { label: 'Starting Time Setpoint', value: '240', units: 'SEC', editable: true }),
        React.createElement('div', {
          className: 'flex items-center justify-between px-2 py-0.5 text-xs text-gray-800'
        },
          React.createElement('span', null, 'Starting Time Left'),
          React.createElement('div', { className: 'flex items-center gap-1' },
            React.createElement('span', {
              className: 'px-2 py-0.5 text-xs font-bold rounded bg-yellow-300 text-black border border-yellow-500'
            }, 'CLEAR'),
            React.createElement('span', { className: 'text-xs font-mono font-bold' }, '0'),
            React.createElement('span', { className: 'text-[10px] text-gray-600' }, 'SEC')
          )
        )
      ),

      // ─── SUPPLY AIR TEMPERATURE CONTROL ───
      React.createElement(SectionHeader, { title: 'Supply Air Temperature Control' }),
      React.createElement('div', { className: 'py-1' },
        React.createElement(Row, { label: 'Cooling Coil Active Setpoint', value: '60.0', units: '°F', pink: true }),
        React.createElement(Row, { label: 'Heating Coil Active Setpoint', value: '55.0', units: '°F', editable: true })
      ),

      // ─── PLENUM AIR TEMPERATURE CONTROL ───
      React.createElement(SectionHeader, { title: 'Plenum Air Temperature Control' }),
      React.createElement('div', { className: 'py-1' },
        React.createElement(Row, { label: 'Active Minimum Setpoint', value: '40.0', units: '°F', editable: true })
      ),

      // ─── ECONOMIZER CONTROL ───
      React.createElement(SectionHeader, { title: 'Economizer Control' }),
      React.createElement('div', { className: 'py-1' },
        React.createElement(Row, { label: 'Unit Outside Air Temperature', value: '83.4', units: '°F' }),
        React.createElement(ToggleRow, { label: 'Low Outside Air Temperature Lockout', value: 'Off' }),
        React.createElement(Row, { label: 'Unit Outside Air Enthalpy', value: '32.0', units: 'BTU' }),
        React.createElement(ToggleRow, { label: 'Enthalpy OK For Economizer', value: 'Off' }),
        React.createElement(Row, { label: 'Minimum Position', value: '20', units: '%', editable: true }),
        React.createElement(Row, { label: 'Min. Position for Fan Speed Lock', value: '5', units: '%', editable: true }),
        React.createElement(Row, { label: 'Economizer Temp Control SP', value: '58.0', units: '°F', editable: true })
      ),

      // ─── OUTSIDE AIR DAMPER CONTROL ───
      React.createElement(SectionHeader, { title: 'Outside Air Damper Control' }),
      React.createElement('div', { className: 'py-1' },
        React.createElement(Row, { label: 'Controlling CO₂ Sensor', value: '538', units: 'PPM' }),
        React.createElement(Row, { label: 'CO₂ Setpoint', value: '900', units: 'PPM', editable: true }),
        React.createElement(Row, { label: 'Min OA Airflow Active Setpoint', value: '4900', units: 'CFM', editable: true })
      ),

      // ─── FAN TRACKING ───
      React.createElement(SectionHeader, { title: 'Fan Tracking' }),
      React.createElement('div', { className: 'py-1' },
        React.createElement('div', {
          className: 'flex items-center justify-between px-2 py-0.5 text-xs text-gray-800'
        },
          React.createElement('span', null, 'Return Fan Track Mode'),
          React.createElement('span', {
            className: 'px-2 py-0.5 text-xs bg-white border border-gray-400 rounded text-black'
          }, 'CFM ▼')
        )
      ),

      // ─── FIRE ALARM SYSTEM ───
      React.createElement(SectionHeader, { title: 'Fire Alarm System' }),
      React.createElement('div', { className: 'py-1 flex gap-2 px-2' },
        React.createElement('div', { className: 'flex items-center gap-1 text-xs' },
          React.createElement('span', { className: 'text-gray-800' }, 'Shutdown'),
          React.createElement('span', { className: 'px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded' }, 'NORM')
        ),
        React.createElement('div', { className: 'flex items-center gap-1 text-xs' },
          React.createElement('span', { className: 'text-gray-800' }, 'Smoke Purge'),
          React.createElement('span', { className: 'px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded' }, 'NORM')
        )
      ),

      // ─── ALARM RESET ───
      React.createElement(SectionHeader, { title: 'Alarm Reset' }),
      React.createElement('div', { className: 'py-2 px-2 flex justify-center' },
        React.createElement('button', {
          className: 'px-6 py-1 bg-white border-2 border-gray-500 rounded text-xs font-bold text-black hover:bg-gray-100'
        }, 'RESET')
      )
    );
  }

  return AHU23ControlsSidebarComponent;
})();

window.AHU23ControlsSidebar = AHU23ControlsSidebar;
