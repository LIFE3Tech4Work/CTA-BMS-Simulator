/**
 * CapstoneModeShell.jsx — Capstone mode with 35% right panel worksheet
 *
 * Displays a structured 5-section worksheet for capstone assessment.
 * Features:
 * - 5 sections each with title, prompt, and text input (max 2000 chars)
 * - Section navigation sidebar showing completion status
 * - Auto-save to localStorage within 2 seconds of last keystroke (debounced)
 * - Warning if localStorage is unavailable
 * - Progress indicator showing X/5 sections complete
 *
 * localStorage key: capstone_worksheet_{operator}
 *
 * No import/export — exposes as window.CapstoneModeShell.
 * Validates: Requirements 22.1, 22.2, 22.3, 22.4
 */

(function () {
  'use strict';

  var useState = React.useState;
  var useEffect = React.useEffect;
  var useCallback = React.useCallback;
  var useRef = React.useRef;
  var useContext = React.useContext;

  // ─── Constants ──────────────────────────────────────────────────────────────

  var AUTOSAVE_DELAY_MS = 2000;
  var TOTAL_SECTIONS = 5;

  // ─── Helper: localStorage key ───────────────────────────────────────────────

  function getStorageKey(operator) {
    return 'capstone_worksheet_' + operator;
  }

  // ─── Helper: Check localStorage availability ────────────────────────────────

  function isLocalStorageAvailable() {
    try {
      var testKey = '__capstone_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ─── Helper: Load saved data from localStorage ──────────────────────────────

  function loadSavedData(operator) {
    try {
      var key = getStorageKey(operator);
      var raw = localStorage.getItem(key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.sections && Array.isArray(parsed.sections)) {
          // Return an array of 5 strings
          var contents = [];
          for (var i = 0; i < TOTAL_SECTIONS; i++) {
            var section = parsed.sections[i];
            contents.push(section && section.content ? section.content : '');
          }
          return contents;
        }
      }
    } catch (e) {
      console.warn('[CapstoneModeShell] Failed to load saved data:', e);
    }
    return ['', '', '', '', ''];
  }

  // ─── Helper: Save data to localStorage ──────────────────────────────────────

  function saveData(operator, sectionContents) {
    var SECTION_TITLES = window.WorksheetSections
      ? window.WorksheetSections.SECTIONS.map(function (s) { return s.title; })
      : [
        'Building Overview & Energy Performance',
        'BMS Data Analysis',
        'Fault Detection & Diagnosis',
        'LL97 Compliance Assessment',
        'Recommendations & Action Items'
      ];

    var data = {
      sections: sectionContents.map(function (content, idx) {
        return {
          id: idx + 1,
          title: SECTION_TITLES[idx],
          content: content
        };
      }),
      lastSaved: new Date().toISOString(),
      submitted: false
    };

    try {
      localStorage.setItem(getStorageKey(operator), JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('[CapstoneModeShell] Failed to save:', e);
      return false;
    }
  }

  // ─── CapstoneModeShell Component ───────────────────────────────────────────

  function CapstoneModeShell() {
    // Get operator from AuthContext
    var authCtx = window.AuthContext ? useContext(window.AuthContext) : {};
    var operator = (authCtx && authCtx.operator) || 'anonymous';
    var storageAvailable = isLocalStorageAvailable();

    // Load initial state from localStorage
    var initialContents = storageAvailable ? loadSavedData(operator) : ['', '', '', '', ''];

    var stateSections = useState(initialContents);
    var sectionContents = stateSections[0];
    var setSectionContents = stateSections[1];

    var stateActiveSection = useState(1);
    var activeSection = stateActiveSection[0];
    var setActiveSection = stateActiveSection[1];

    var stateStorageWarning = useState(!storageAvailable);
    var storageWarning = stateStorageWarning[0];
    var setStorageWarning = stateStorageWarning[1];

    var stateLastSaved = useState(null);
    var lastSaved = stateLastSaved[0];
    var setLastSaved = stateLastSaved[1];

    var stateSaveError = useState(false);
    var saveError = stateSaveError[0];
    var setSaveError = stateSaveError[1];

    var autoSaveTimerRef = useRef(null);

    // ─── Auto-save with debounce (2 seconds after last keystroke) ─────────────

    var triggerAutoSave = useCallback(function (contents) {
      if (!storageAvailable) return;

      // Clear any existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set a new debounced timer
      autoSaveTimerRef.current = setTimeout(function () {
        var success = saveData(operator, contents);
        if (success) {
          setLastSaved(new Date().toLocaleTimeString());
          setSaveError(false);
        } else {
          setSaveError(true);
          setStorageWarning(true);
        }
      }, AUTOSAVE_DELAY_MS);
    }, [operator, storageAvailable]);

    // Cleanup timer on unmount
    useEffect(function () {
      return function () {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
      };
    }, []);

    // ─── Handle section content change ────────────────────────────────────────

    var handleSectionChange = useCallback(function (sectionId, newValue) {
      setSectionContents(function (prev) {
        var updated = prev.slice();
        updated[sectionId - 1] = newValue;
        // Trigger auto-save with the updated contents
        triggerAutoSave(updated);
        return updated;
      });
    }, [triggerAutoSave]);

    // ─── Handle section navigation ────────────────────────────────────────────

    var handleSectionSelect = useCallback(function (sectionNum) {
      setActiveSection(sectionNum);
    }, []);

    // ─── Count completed sections ─────────────────────────────────────────────

    var completedCount = 0;
    for (var i = 0; i < sectionContents.length; i++) {
      if (sectionContents[i] && sectionContents[i].trim().length > 0) {
        completedCount++;
      }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return React.createElement('div', {
      className: 'flex flex-col h-full bg-gray-900 text-white',
      'aria-label': 'Capstone Mode Worksheet'
    },
      // Header bar
      React.createElement('div', {
        className: 'px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between'
      },
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('span', { className: 'text-blue-400 text-lg' }, '📝'),
          React.createElement('h2', {
            className: 'text-sm font-bold text-gray-100'
          }, 'Capstone Worksheet')
        ),
        // Progress badge
        React.createElement('span', {
          className: 'text-xs font-mono px-2 py-1 rounded ' +
            (completedCount === 5
              ? 'bg-green-900/50 text-green-300 border border-green-700/50'
              : 'bg-gray-700 text-gray-400')
        }, completedCount + '/5 complete')
      ),

      // Storage warning banner
      storageWarning && React.createElement('div', {
        className: 'px-4 py-2 bg-yellow-900/50 border-b border-yellow-700/50 flex items-center gap-2',
        role: 'alert'
      },
        React.createElement('span', { className: 'text-yellow-400 text-sm' }, '⚠'),
        React.createElement('span', {
          className: 'text-xs text-yellow-300'
        }, 'localStorage unavailable — worksheet content will not be saved automatically.'),
        React.createElement('button', {
          type: 'button',
          className: 'ml-auto text-yellow-500 hover:text-yellow-300 text-sm',
          onClick: function () { setStorageWarning(false); },
          'aria-label': 'Dismiss warning'
        }, '✕')
      ),

      // Save error banner
      saveError && !storageWarning && React.createElement('div', {
        className: 'px-4 py-2 bg-red-900/50 border-b border-red-700/50 flex items-center gap-2',
        role: 'alert'
      },
        React.createElement('span', { className: 'text-red-400 text-sm' }, '⚠'),
        React.createElement('span', {
          className: 'text-xs text-red-300'
        }, 'Failed to save worksheet. Storage may be full.')
      ),

      // Main content area: sidebar + section content
      React.createElement('div', {
        className: 'flex-1 flex min-h-0 overflow-hidden'
      },
        // Left sidebar: section navigation
        React.createElement('div', {
          className: 'w-44 flex-shrink-0 overflow-hidden border-r border-gray-700'
        },
          window.WorksheetSidebar
            ? React.createElement(window.WorksheetSidebar, {
              activeSection: activeSection,
              onSectionSelect: handleSectionSelect,
              sectionContents: sectionContents
            })
            : React.createElement('div', { className: 'p-2 text-xs text-gray-500' },
              'Loading sidebar...')
        ),

        // Right: active section content
        React.createElement('div', {
          className: 'flex-1 flex flex-col min-h-0 overflow-auto'
        },
          window.WorksheetSection
            ? React.createElement(window.WorksheetSection, {
              sectionId: activeSection,
              value: sectionContents[activeSection - 1] || '',
              onChange: handleSectionChange
            })
            : React.createElement('div', { className: 'p-4 text-gray-500' },
              'Loading worksheet section...'),
          // Chapter 14: Troubleshooting Framework reference card
          window.TroubleshootingCard
            ? React.createElement('div', { className: 'px-4 pb-4 flex-shrink-0' },
                React.createElement(window.TroubleshootingCard, null)
              )
            : null
        )
      ),

      // Footer: auto-save status and navigation
      React.createElement('div', {
        className: 'px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between'
      },
        // Auto-save status
        React.createElement('div', { className: 'flex items-center gap-2 text-xs text-gray-500' },
          lastSaved && React.createElement(React.Fragment, null,
            React.createElement('span', {
              className: 'w-2 h-2 rounded-full bg-green-500 inline-block'
            }),
            React.createElement('span', null, 'Saved at ' + lastSaved)
          ),
          !lastSaved && storageAvailable && React.createElement('span', null, 'Auto-save enabled (2s debounce)'),
          !storageAvailable && React.createElement('span', {
            className: 'text-yellow-400'
          }, 'Auto-save disabled')
        ),

        // Section navigation arrows
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('button', {
            type: 'button',
            className: 'px-2 py-1 text-xs rounded transition-colors ' +
              (activeSection <= 1
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'),
            onClick: function () {
              if (activeSection > 1) setActiveSection(activeSection - 1);
            },
            disabled: activeSection <= 1,
            'aria-label': 'Previous section'
          }, '← Prev'),
          React.createElement('span', {
            className: 'text-xs text-gray-500 font-mono'
          }, activeSection + '/' + TOTAL_SECTIONS),
          React.createElement('button', {
            type: 'button',
            className: 'px-2 py-1 text-xs rounded transition-colors ' +
              (activeSection >= TOTAL_SECTIONS
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'),
            onClick: function () {
              if (activeSection < TOTAL_SECTIONS) setActiveSection(activeSection + 1);
            },
            disabled: activeSection >= TOTAL_SECTIONS,
            'aria-label': 'Next section'
          }, 'Next →')
        )
      )
    );
  }

  // ─── Expose on window ──────────────────────────────────────────────────────

  window.CapstoneModeShell = CapstoneModeShell;

})();
