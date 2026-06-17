/* App.jsx — Root application component
 * Sets up 5 React Context providers and hash-based routing.
 * Loaded by index.html via <script type="text/babel" src="src/App.jsx">
 * No import/export — uses globals (React, ReactDOM) and attaches contexts to window.
 */

const { useState, useEffect, useContext, useCallback, createContext } = React;

// ─── Context Definitions ────────────────────────────────────────────────────────

const AuthContext = createContext({
  authenticated: false,
  operator: '',
  securityLevel: 'ViewOnly'
});

const PointRegistryContext = createContext({
  points: new Map(),
  getValue: () => null,
  setValue: () => {},
  subscribe: () => {},
  unsubscribe: () => {}
});

const SimulationContext = createContext({
  currentRow: 1,
  speed: 'pause',
  interpolationFraction: 0
});

const ModeContext = createContext({
  currentMode: 'companion'
});

const AlarmContext = createContext({
  alarms: []
});

// Expose contexts on window so other script files can access them
window.AuthContext = AuthContext;
window.PointRegistryContext = PointRegistryContext;
window.SimulationContext = SimulationContext;
window.ModeContext = ModeContext;
window.AlarmContext = AlarmContext;

// ─── Route Parsing ──────────────────────────────────────────────────────────────

function parseRoute(hash) {
  const cleaned = hash.replace(/^#\/?/, '');
  const parts = cleaned.split('/');

  if (parts[0] === 'symmetre') {
    return { screen: 'symmetre', params: { ahuId: parts[1] || 'AHU-4-4' } };
  }
  if (parts[0] === 'ebi') {
    return { screen: 'ebi', params: { pointId: decodeURIComponent(parts[1] || ''), tab: parts[2] || 'general' } };
  }
  if (parts[0] === 'alarms') {
    return { screen: 'alarms', params: {} };
  }
  if (parts[0] === 'schedule') {
    return { screen: 'schedule', params: {} };
  }
  if (parts[0] === 'reports') {
    return { screen: 'reports', params: {} };
  }
  if (parts[0] === 'instructor') {
    return { screen: 'instructor', params: {} };
  }
  return { screen: 'auth', params: {} };
}

// Expose parseRoute globally for testing / other scripts
window.parseRoute = parseRoute;

// ─── Placeholder Screen Components ─────────────────────────────────────────────

function AuthScreen() {
  // Use the SignOn component if available (loaded from auth/SignOn.jsx)
  if (window.SignOn) {
    return React.createElement(window.SignOn, null);
  }
  // Fallback placeholder
  return React.createElement('div', { className: 'flex items-center justify-center h-screen bg-gray-900 text-white' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('h1', { className: 'text-2xl font-bold' }, 'Sign On'),
      React.createElement('p', { className: 'text-gray-400 mt-2' }, 'Honeywell BMS Simulator — Auth Screen')
    )
  );
}

function SymmetreScreen({ params }) {
  var modeCtx = useContext(ModeContext);
  var currentMode = (modeCtx && modeCtx.currentMode) || 'freeExplore';

  // Build the core BMS content
  var bmsContent = null;

  if (window.SymmetreAppChrome) {
    bmsContent = React.createElement(window.SymmetreAppChrome, null,
      React.createElement('div', { className: 'flex flex-col h-full bg-gray-800' },
        // Zone Tabs and Outside Air data strip
        window.ZoneTabs
          ? React.createElement(window.ZoneTabs, null)
          : null,
        // Main content area (AHU graphic + controls sidebar)
        React.createElement('div', { className: 'flex flex-1 overflow-hidden' },
          // Controls Sidebar + LL97 Panel
          React.createElement('div', { className: 'flex flex-col h-full flex-shrink-0 border-r border-gray-700 bg-gray-800' },
            window.ControlsSidebar
              ? React.createElement('div', { className: 'flex-1 overflow-y-auto' },
                  React.createElement(window.ControlsSidebar, { ahuId: params.ahuId || 'AHU-4-4' })
                )
              : null,
            window.LL97Panel
              ? React.createElement(window.LL97Panel, null)
              : null
          ),
          // AHU Graphic area
          React.createElement('div', { className: 'flex-1 relative flex items-center justify-center text-white' },
            window.AHUGraphic
              ? React.createElement(window.AHUGraphic, { ahuId: params.ahuId || 'AHU-4-4' })
              : React.createElement('div', { className: 'text-center' },
                  React.createElement('h1', { className: 'text-2xl font-bold' }, 'SymmetrE Station'),
                  React.createElement('p', { className: 'text-gray-400 mt-2' }, 'AHU: ' + (params.ahuId || 'AHU-4-4'))
                ),
            window.SimultaneousHeatCool
              ? React.createElement(window.SimultaneousHeatCool, { ahuId: params.ahuId || 'AHU-4-4' })
              : null
          )
        )
      )
    );
  } else {
    bmsContent = React.createElement('div', { className: 'flex items-center justify-center h-screen bg-gray-800 text-white' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('h1', { className: 'text-2xl font-bold' }, 'SymmetrE Station'),
        React.createElement('p', { className: 'text-gray-400 mt-2' }, 'AHU: ' + (params.ahuId || 'AHU-4-4'))
      )
    );
  }

  // Determine side panel content based on current mode
  var panelContent = null;
  if (currentMode === 'companion' && window.CompanionMode) {
    panelContent = React.createElement(window.CompanionMode, null);
  } else if (currentMode === 'capstone' && window.CapstoneModeShell) {
    panelContent = React.createElement(window.CapstoneModeShell, null);
  }

  // In freeExplore mode, wrap BMS content with FreeExplore overlay (scenario toolbar)
  if (currentMode === 'freeExplore' && window.FreeExplore) {
    return React.createElement('div', { className: 'relative h-full w-full' },
      bmsContent,
      React.createElement(window.FreeExplore, null)
    );
  }

  // Wrap with ModeLayoutWrapper when a side panel is active
  if (panelContent && window.ModeLayoutWrapper) {
    return React.createElement(window.ModeLayoutWrapper, {
      mainContent: bmsContent,
      panelContent: panelContent
    });
  }

  return bmsContent;
}

function EBIScreen({ params }) {
  // Use EBIAppChrome if available (loaded from ui/ebi/AppChrome.jsx)
  if (window.EBIAppChrome) {
    return React.createElement(window.EBIAppChrome, {
      pointId: params.pointId
    });
  }
  // Fallback placeholder
  return React.createElement('div', { className: 'flex items-center justify-center h-screen bg-gray-800 text-white' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('h1', { className: 'text-2xl font-bold' }, 'EBI Point Detail'),
      React.createElement('p', { className: 'text-gray-400 mt-2' }, 'Point: ' + (params.pointId || '—') + ' | Tab: ' + (params.tab || 'general'))
    )
  );
}

function AlarmsScreen() {
  // Use the AlarmSummary component if available (loaded from alarm/AlarmSummary.jsx)
  if (window.AlarmSummary) {
    return React.createElement(window.AlarmSummary, null);
  }
  // Fallback placeholder
  return React.createElement('div', { className: 'flex items-center justify-center h-screen bg-gray-800 text-white' },
    React.createElement('h1', { className: 'text-2xl font-bold' }, 'Alarm Summary')
  );
}

function ScheduleScreen() {
  const [selectedSchedule, setSelectedSchedule] = useState('AHU-4-4');
  const [activeTab, setActiveTab] = useState('weekly');

  // System Configuration tree data (schedulable objects)
  const scheduleTree = [
    { id: 'AHU-4-4', label: 'AHU-4-4 Schedule', parent: null },
    { id: 'AHU-4-6', label: 'AHU-4-6 Schedule', parent: null },
    { id: 'AHU-9-2', label: 'AHU-9-2 Schedule', parent: null }
  ];

  // Tree item renderer
  function renderTreeItem(item) {
    const isActive = selectedSchedule === item.id;
    return React.createElement('div', {
      key: item.id,
      className: 'flex items-center gap-2 px-3 py-2 cursor-pointer rounded text-sm transition-colors ' +
        (isActive ? 'bg-blue-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'),
      onClick: function() { setSelectedSchedule(item.id); }
    },
      // Calendar icon
      React.createElement('span', { className: 'text-base' }, '📅'),
      React.createElement('span', null, item.label),
      // Fault indicator for AHU-9-2
      item.id === 'AHU-9-2' && React.createElement('span', {
        className: 'ml-auto inline-block w-2 h-2 rounded-full bg-red-500',
        title: 'Scheduling fault detected'
      })
    );
  }

  // Tab button renderer
  function renderTab(tabId, label) {
    const isActive = activeTab === tabId;
    return React.createElement('button', {
      key: tabId,
      className: 'px-4 py-2 text-sm font-medium border-b-2 transition-colors ' +
        (isActive ? 'border-blue-400 text-white bg-gray-700' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'),
      onClick: function() { setActiveTab(tabId); }
    }, label);
  }

  return React.createElement('div', { className: 'flex h-screen bg-gray-800' },
    // Left sidebar: System Configuration tree
    React.createElement('div', { className: 'w-64 bg-gray-900 border-r border-gray-700 flex flex-col' },
      // Tree header
      React.createElement('div', { className: 'px-3 py-3 border-b border-gray-700' },
        React.createElement('h2', { className: 'text-white font-bold text-sm' }, 'System Configuration'),
        React.createElement('p', { className: 'text-gray-500 text-xs mt-1' }, 'Schedule Objects')
      ),
      // Tree items
      React.createElement('div', { className: 'flex-1 overflow-auto py-2 px-1' },
        scheduleTree.map(renderTreeItem)
      )
    ),

    // Right content area: selected schedule
    React.createElement('div', { className: 'flex-1 flex flex-col overflow-hidden' },
      // Title bar
      React.createElement('div', { className: 'px-4 py-3 bg-gray-750 border-b border-gray-600 flex items-center justify-between' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-white font-bold text-lg' }, selectedSchedule + ' Schedule'),
          React.createElement('p', { className: 'text-gray-400 text-xs mt-0.5' },
            selectedSchedule === 'AHU-9-2' ? 'Fault condition: 24/7 active (never turns off)' : 'Normal operating pattern'
          )
        ),
        // Back to SymmetrE button
        React.createElement('button', {
          className: 'px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 hover:text-white',
          onClick: function() { window.location.hash = '#/symmetre'; }
        }, '← Back to Station')
      ),

      // Tab bar
      React.createElement('div', { className: 'flex border-b border-gray-600 bg-gray-800' },
        renderTab('weekly', 'Weekly Schedule'),
        renderTab('exception', 'Exception Schedule')
      ),

      // Tab content
      React.createElement('div', { className: 'flex-1 overflow-hidden' },
        activeTab === 'weekly'
          ? (window.WeeklySchedule
              ? React.createElement(window.WeeklySchedule, { scheduleId: selectedSchedule })
              : React.createElement('div', { className: 'p-4 text-gray-400' }, 'Loading Weekly Schedule...'))
          : (window.ExceptionSchedule
              ? React.createElement(window.ExceptionSchedule, { scheduleId: selectedSchedule })
              : React.createElement('div', { className: 'p-4 text-gray-400' }, 'Loading Exception Schedule...'))
      )
    )
  );
}

function ReportsScreen() {
  // Use the PointAttributeReport component if available (loaded from reports/PointAttributeReport.jsx)
  if (window.PointAttributeReport) {
    return React.createElement(window.PointAttributeReport, null);
  }
  // Fallback placeholder
  return React.createElement('div', { className: 'flex items-center justify-center h-screen bg-gray-800 text-white' },
    React.createElement('h1', { className: 'text-2xl font-bold' }, 'Point Attribute Report')
  );
}

function InstructorScreen() {
  // Use InstructorDashboard if available (loaded from instructor/Dashboard.jsx)
  if (window.InstructorDashboard) {
    return React.createElement(window.InstructorDashboard, null);
  }
  // Fallback placeholder
  return React.createElement('div', { className: 'flex items-center justify-center h-screen bg-gray-800 text-white' },
    React.createElement('h1', { className: 'text-2xl font-bold' }, 'Instructor Dashboard')
  );
}

// ─── Router Component ───────────────────────────────────────────────────────────

function Router() {
  const auth = useContext(AuthContext);
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash || '#/auth';
    return parseRoute(hash);
  });

  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash || '#/auth';
      setRoute(parseRoute(hash));
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // If not authenticated and trying to access a non-auth route, redirect to auth
  useEffect(() => {
    if (!auth.authenticated && route.screen !== 'auth') {
      window.location.hash = '#/auth';
    }
  }, [auth.authenticated, route.screen]);

  // Render the appropriate screen based on the current route
  switch (route.screen) {
    case 'symmetre':
      return React.createElement(SymmetreScreen, { params: route.params });
    case 'ebi':
      return React.createElement(EBIScreen, { params: route.params });
    case 'alarms':
      return React.createElement(AlarmsScreen, null);
    case 'schedule':
      return React.createElement(ScheduleScreen, null);
    case 'reports':
      return React.createElement(ReportsScreen, null);
    case 'instructor':
      return React.createElement(InstructorScreen, null);
    case 'auth':
    default:
      return React.createElement(AuthScreen, null);
  }
}

// ─── App Component (Root with Context Providers) ────────────────────────────────

function App() {
  // Auth state — use AuthHelpers for full privilege methods if available
  const [authState, setAuthState] = useState(function() {
    if (window.AuthHelpers) {
      return window.AuthHelpers.createUnauthenticatedState();
    }
    return {
      authenticated: false,
      operator: '',
      securityLevel: 'ViewOnly',
      canWrite: function() { return false; },
      canAcknowledge: function() { return false; },
      canModifySchedules: function() { return false; },
      canConfigurePoints: function() { return false; },
      canManageAccounts: function() { return false; }
    };
  });

  // Mode state
  const [modeState, setModeState] = useState({
    currentMode: 'companion'
  });

  // Simulation state
  const [simulationState, setSimulationState] = useState({
    currentRow: 1,
    speed: 'pause',
    interpolationFraction: 0
  });

  // Point Registry state
  const [pointRegistryState, setPointRegistryState] = useState({
    points: new Map(),
    getValue: () => null,
    setValue: () => {},
    subscribe: () => {},
    unsubscribe: () => {}
  });

  // Alarm state
  const [alarmState, setAlarmState] = useState({
    alarms: []
  });

  // Expose state setters on window for other scripts to use
  window.setAuthState = setAuthState;
  window.setModeState = setModeState;
  window.setSimulationState = setSimulationState;
  window.setPointRegistryState = setPointRegistryState;
  window.setAlarmState = setAlarmState;

  // Provider order (outer to inner):
  // AuthContext → ModeContext → SimulationContext → PointRegistryContext → AlarmContext → Router
  return React.createElement(AuthContext.Provider, { value: authState },
    React.createElement(ModeContext.Provider, { value: modeState },
      React.createElement(SimulationContext.Provider, { value: simulationState },
        React.createElement(PointRegistryContext.Provider, { value: pointRegistryState },
          React.createElement(AlarmContext.Provider, { value: alarmState },
            React.createElement(Router, null)
          )
        )
      )
    )
  );
}

// Expose App and Router globally
window.App = App;
window.Router = Router;

// ─── Mount ──────────────────────────────────────────────────────────────────────

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
