/**
 * ZoneTabs.jsx — Zone tab navigation and Outside Air data strip.
 *
 * Displays a horizontal tab row for AHU zone switching (water droplet + fan icons)
 * and a live outdoor conditions data strip below it.
 *
 * Attached to window.ZoneTabs (no import/export — Babel standalone).
 */

(function () {
  'use strict';

  const { useState, useEffect, useContext, useCallback } = React;

  // ─── Tab Definitions ────────────────────────────────────────────────────────

  const ZONE_TABS = [
    // { id: 'AHU-4-4', label: 'AHU-4-4', icon: '🌀', route: '#/symmetre/AHU-4-4', isZone: false },
    { id: 'AHU-4-6', label: 'AHU-4-6', icon: '🌀', route: '#/symmetre/AHU-4-6', isZone: false },
    { id: 'AHU-4-4_NEW', label: 'AHU-4-4_NEW', icon: '🌀', route: '#/symmetre/AHU-4-4_NEW', isZone: false },
    { id: 'AHU-23-1', label: 'AHU-23-1', icon: '🌀', route: '#/symmetre/AHU-23-1', isZone: false },
    { id: 'VAV-4-4-02', label: 'VAV-4-4-02 (Ballroom)', icon: '🌬️', route: '#/symmetre/VAV-4-4-02', isZone: false }
  ];

  // ─── Outside Air Data Strip ─────────────────────────────────────────────────

  function OutsideAirStrip() {
    const simContext = useContext(window.SimulationContext);
    const [weatherData, setWeatherData] = useState(null);

    useEffect(function () {
      // Get current simulation state from context
      var row = simContext.currentRow || 1;
      var fraction = simContext.interpolationFraction || 0;

      // Fetch interpolated weather from TMY3 projector
      if (window.TMY3Projector && window.TMY3Projector.interpolateWeather) {
        var data = window.TMY3Projector.interpolateWeather(row, fraction);
        setWeatherData(data);
      }
    }, [simContext.currentRow, simContext.interpolationFraction]);

    /**
     * Format a number to 1 decimal place.
     * @param {number|null|undefined} value
     * @returns {string}
     */
    function fmt(value) {
      if (value == null || isNaN(value)) return '--.-';
      return Number(value).toFixed(1);
    }

    var items = [
      { label: 'OA Temp', value: weatherData ? fmt(weatherData.dryBulb) : '--.-', units: '°F' },
      { label: 'OA Humidity', value: weatherData ? fmt(weatherData.relHumidity) : '--.-', units: '%RH' },
      { label: 'OA Wetbulb', value: weatherData ? fmt(weatherData.wetBulb) : '--.-', units: '°F' },
      { label: 'OA Dewpoint', value: weatherData ? fmt(weatherData.dewPoint) : '--.-', units: '°F' },
      { label: 'OA Enthalpy', value: weatherData ? fmt(weatherData.enthalpy) : '--.-', units: 'BTU/lb' }
    ];

    return React.createElement('div', {
      className: 'flex items-center bg-gray-900 border-t border-b border-gray-700 px-2 py-1',
      style: { minHeight: '32px' }
    },
      items.map(function (item, index) {
        return React.createElement('div', {
          key: item.label,
          className: 'flex items-center px-3 text-xs' + (index < items.length - 1 ? ' border-r border-gray-600' : '')
        },
          React.createElement('span', { className: 'text-gray-400 mr-1' }, item.label + ':'),
          React.createElement('span', { className: 'text-white font-mono font-semibold mr-1' }, item.value),
          React.createElement('span', { className: 'text-gray-500' }, item.units)
        );
      })
    );
  }

  // ─── Honeywell-style OA Strip (blue theme, for AHU-23-1) ─────────────────────

  function HoneywellOAStrip({ ahuId }) {
    const simContext = useContext(window.SimulationContext);
    const [weatherData, setWeatherData] = useState(null);

    useEffect(function () {
      var row = simContext.currentRow || 1;
      var fraction = simContext.interpolationFraction || 0;
      if (window.TMY3Projector && window.TMY3Projector.interpolateWeather) {
        var data = window.TMY3Projector.interpolateWeather(row, fraction);
        setWeatherData(data);
      }
    }, [simContext.currentRow, simContext.interpolationFraction]);

    function fmt(value) {
      if (value == null || isNaN(value)) return '--.-';
      return Number(value).toFixed(1);
    }

    // TecSystems style for AHU-4-4_NEW includes CHW/CW readings
    var items;
    if (ahuId === 'AHU-4-4_NEW') {
      items = [
        { label: 'OA TEMPERATURE', value: weatherData ? fmt(weatherData.dryBulb) : '--.-', units: '°F' },
        { label: 'OA HUMIDITY', value: weatherData ? fmt(weatherData.relHumidity) : '--.-', units: '%RH' },
        { label: 'OA DEWPOINT', value: weatherData ? fmt(weatherData.dewPoint) : '--.-', units: '°F' },
        { label: 'OA WETBULB', value: weatherData ? fmt(weatherData.wetBulb) : '--.-', units: '°F' },
        { label: 'OA ENTHALPY', value: weatherData ? fmt(weatherData.enthalpy) : '--.-', units: 'BTU' },
        { label: 'CW SUPPLY', value: '75.2', units: '°F' },
        { label: 'CHW SUPPLY', value: '41.8', units: '°F' },
        { label: 'CHW FLOW', value: '1103', units: 'GPM' },
      ];
    } else if (ahuId === 'AHU-4-6') {
      // Meeting Room 2nd Level — CW/CHW from AHU-4-6 screenshot status bar
      items = [
        { label: 'OA TEMPERATURE', value: weatherData ? fmt(weatherData.dryBulb) : '--.-', units: '°F' },
        { label: 'OA HUMIDITY', value: weatherData ? fmt(weatherData.relHumidity) : '--.-', units: '%RH' },
        { label: 'OA DEWPOINT', value: weatherData ? fmt(weatherData.dewPoint) : '--.-', units: '°F' },
        { label: 'OA WETBULB', value: weatherData ? fmt(weatherData.wetBulb) : '--.-', units: '°F' },
        { label: 'OA ENTHALPY', value: weatherData ? fmt(weatherData.enthalpy) : '--.-', units: 'BTU' },
        { label: 'CW SUPPLY', value: '77.7', units: '°F' },
        { label: 'CHW SUPPLY', value: '41.9', units: '°F' },
        { label: 'CHW FLOW', value: '1192', units: 'GPM' },
      ];
    } else {
      items = [
        { label: 'OA TEMPERATURE', value: weatherData ? fmt(weatherData.dryBulb) : '--.-', units: '°F' },
        { label: 'OA RH', value: weatherData ? fmt(weatherData.relHumidity) : '--.-', units: '%RH' },
        { label: 'OA ENTHALPY', value: weatherData ? fmt(weatherData.enthalpy) : '--.-', units: 'BTU' },
        { label: 'CWS TEMPERATURE', value: weatherData ? fmt(weatherData.wetBulb) : '--.-', units: '°F' },
        { label: 'OA WETBULB', value: weatherData ? fmt(weatherData.dewPoint) : '--.-', units: '°F' },
      ];
    }

    return React.createElement('div', {
      className: 'flex items-center justify-around px-4 py-1',
      style: { minHeight: '28px', background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)', borderTop: '2px solid #1a5276', borderBottom: '2px solid #1a5276' }
    },
      items.map(function (item, index) {
        return React.createElement('div', {
          key: item.label,
          className: 'flex items-center gap-2 text-xs'
        },
          React.createElement('span', { className: 'text-gray-300 font-semibold tracking-wide', style: { fontSize: '10px', letterSpacing: '0.5px' } }, item.label),
          React.createElement('span', { className: 'text-white font-mono font-bold' }, item.value),
          React.createElement('span', { className: 'text-gray-400', style: { fontSize: '9px' } }, item.units)
        );
      })
    );
  }

  // ─── Zone Tabs Component ────────────────────────────────────────────────────

  function ZoneTabs() {
    var [activeTab, setActiveTab] = useState('AHU-4-4_NEW');

    // Sync active tab from hash on mount and hash changes
    useEffect(function () {
      function syncFromHash() {
        var hash = window.location.hash || '';
        if (hash.indexOf('VAV-4-4-02') !== -1) {
          setActiveTab('VAV-4-4-02');
        } else if (hash.indexOf('AHU-4-4_NEW') !== -1) {
          setActiveTab('AHU-4-4_NEW');
        } else if (hash.indexOf('AHU-23-1') !== -1) {
          setActiveTab('AHU-23-1');
        } else if (hash.indexOf('AHU-4-6') !== -1) {
          setActiveTab('AHU-4-6');
        } else if (hash.indexOf('AHU-4-4') !== -1) {
          setActiveTab('AHU-4-4');
        } else {
          setActiveTab('AHU-4-4_NEW');
        }
      }

      syncFromHash();
      window.addEventListener('hashchange', syncFromHash);
      return function () {
        window.removeEventListener('hashchange', syncFromHash);
      };
    }, []);

    function handleTabClick(tab) {
      setActiveTab(tab.id === 'zone-overview' ? tab.id : tab.id);
      window.location.hash = tab.route;
    }

    return React.createElement('div', { className: 'flex flex-col' },
      // Tab bar row
      React.createElement('div', {
        className: 'flex items-center bg-gray-800 border-b border-gray-700 px-1',
        style: { minHeight: '36px' }
      },
        ZONE_TABS.map(function (tab) {
          var isActive = activeTab === tab.id;

          var tabClasses = 'flex items-center px-3 py-1 mx-0.5 cursor-pointer text-sm rounded-t transition-colors ';
          if (isActive) {
            tabClasses += 'bg-gray-600 text-white border-b-2 border-bms-cyan';
          } else {
            tabClasses += 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white';
          }

          return React.createElement('div', {
            key: tab.id,
            className: tabClasses,
            onClick: function () { handleTabClick(tab); },
            role: 'tab',
            'aria-selected': isActive,
            tabIndex: 0,
            onKeyDown: function (e) {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabClick(tab);
              }
            }
          },
            React.createElement('span', { className: 'mr-1', 'aria-hidden': 'true' }, tab.icon),
            tab.label ? React.createElement('span', null, tab.label) : null
          );
        })
      ),

      // Outside Air data strip (Honeywell blue style for AHU-23-1 and AHU-4-4_NEW, standard for others)
      (activeTab === 'AHU-23-1' || activeTab === 'AHU-4-4_NEW')
        ? React.createElement(HoneywellOAStrip, { ahuId: activeTab })
        : React.createElement(OutsideAirStrip, null)
    );
  }

  // ─── Expose as window global ────────────────────────────────────────────────

  window.ZoneTabs = ZoneTabs;
  window.OutsideAirStrip = OutsideAirStrip;
})();
