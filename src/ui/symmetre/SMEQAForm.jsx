/**
 * SMEQAForm.jsx — SME Quality Assurance Observation Form
 *
 * Lev fills this out while looking at the live simulator screen.
 * On submit it generates a structured markdown block that can be
 * pasted directly into a Claude conversation for implementation.
 *
 * Access: Help menu → "SME QA: Log Observation"
 * Visible to: all security levels (SME may be ViewOnly)
 *
 * Usage:
 *   window.SMEQAForm.open()   // called from Help menu
 *   window.SMEQAForm.close()  // internal
 */

window.SMEQAForm = (function () {
  'use strict';
  const { useState, useCallback, useEffect } = React;

  // ── Data ──────────────────────────────────────────────────────────────────
  const SCREENS = [
    'AHU-4-4', 'AHU-4-6', 'AHU-23-1', 'VAV-4-4-02 (Ballroom)',
    'Alarm Summary', 'EBI Point Detail', 'Schedule Manager',
    'Point Attribute Report', 'Capstone Worksheet', 'LL97 Panel',
    'General / multiple screens',
  ];

  const ISSUE_TYPES = [
    'Wrong value or calculation',
    'Missing point or output',
    'Control logic wrong',
    'Label confusing or incorrect',
    'Missing feature',
    'Visual or layout issue',
    'Alarm not firing or wrong',
    'Physically wrong behavior',
  ];

  const PRIORITIES = [
    { label: 'High', color: 'bg-red-900 border-red-600 text-red-200' },
    { label: 'Medium', color: 'bg-amber-900 border-amber-600 text-amber-200' },
    { label: 'Low', color: 'bg-green-900 border-green-600 text-green-200' },
  ];

  const BLOCKING = [
    'Yes — students cannot complete the exercise',
    'No — but it creates confusion',
    'No — minor polish',
  ];

  // ── Empty state ────────────────────────────────────────────────────────────
  const EMPTY = {
    screen: '', point: '', types: [], observed: '',
    expected: '', soo: '', priority: '', blocking: '', fix: '',
  };

  // ── Form component ────────────────────────────────────────────────────────
  function SMEQAModal({ onClose }) {
    const [form, setForm]       = useState(EMPTY);
    const [output, setOutput]   = useState('');
    const [copied, setCopied]   = useState(false);
    const [errors, setErrors]   = useState([]);

    // Close on Escape
    useEffect(function () {
      function onKey(e) { if (e.key === 'Escape') onClose(); }
      window.addEventListener('keydown', onKey);
      return function () { window.removeEventListener('keydown', onKey); };
    }, [onClose]);

    // Auto-populate screen from current URL hash
    useEffect(function () {
      var hash = window.location.hash || '';
      var match = SCREENS.find(function (s) {
        return hash.toLowerCase().includes(s.toLowerCase().replace(/[^a-z0-9]/g, ''));
      });
      if (match) setForm(function (f) { return Object.assign({}, f, { screen: match }); });
    }, []);

    function set(key, val) {
      setForm(function (f) { return Object.assign({}, f, { [key]: val }); });
    }

    function toggleType(t) {
      setForm(function (f) {
        var next = f.types.includes(t)
          ? f.types.filter(function (x) { return x !== t; })
          : f.types.concat(t);
        return Object.assign({}, f, { types: next });
      });
    }

    function generate() {
      var missing = [];
      if (!form.screen)   missing.push('screen');
      if (!form.observed) missing.push('what you observed');
      if (!form.expected) missing.push('what you expected');
      if (!form.priority) missing.push('priority');
      if (missing.length) { setErrors(missing); return; }
      setErrors([]);

      var lines = [
        '## SME QA Observation',
        '',
        '**Screen:** ' + form.screen + (form.point ? ' — ' + form.point : ''),
        '**Type:** '    + (form.types.length ? form.types.join(', ') : 'not specified'),
        '**Priority:** ' + form.priority + (form.blocking ? ' | Blocks instruction: ' + form.blocking : ''),
        '',
        '**Observed:**',
        form.observed,
        '',
        '**Expected:**',
        form.expected,
      ];
      if (form.soo) lines.push('', '**SOO / Reference:** ' + form.soo);
      if (form.fix) lines.push('', '**Suggested fix:** ' + form.fix);
      lines.push('', '---', '*Paste this block into Claude to implement the fix.*');
      setOutput(lines.join('\n'));
    }

    function copy() {
      if (!output) return;
      navigator.clipboard.writeText(output).then(function () {
        setCopied(true);
        setTimeout(function () { setCopied(false); }, 2500);
      });
    }

    function reset() {
      setForm(EMPTY);
      setOutput('');
      setErrors([]);
    }

    // ── Shared styles ────────────────────────────────────────────────────────
    var label = 'block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1';
    var inp   = 'w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500';
    var pill  = 'px-2.5 py-1 rounded-full border text-[11px] cursor-pointer transition-colors ';

    return React.createElement('div', {
      className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60',
      onClick: function (e) { if (e.target === e.currentTarget) onClose(); },
    },
      React.createElement('div', {
        className: 'bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[680px] max-h-[90vh] overflow-y-auto',
        onClick: function (e) { e.stopPropagation(); },
      },

        // ── Header ───────────────────────────────────────────────────────────
        React.createElement('div', { className: 'flex items-center justify-between px-5 py-3 border-b border-gray-700' },
          React.createElement('div', null,
            React.createElement('h2', { className: 'text-sm font-semibold text-gray-100' }, 'SME QA Observation'),
            React.createElement('p', { className: 'text-[11px] text-gray-400 mt-0.5' },
              'Fill out while viewing the simulator → paste generated block into Claude'
            )
          ),
          React.createElement('button', {
            className: 'text-gray-500 hover:text-gray-200 text-lg leading-none',
            onClick: onClose,
          }, '✕')
        ),

        // ── Body ─────────────────────────────────────────────────────────────
        React.createElement('div', { className: 'px-5 py-4 space-y-4' },

          // Section 1 — Location
          React.createElement('div', { className: 'text-[10px] font-bold text-blue-500 uppercase tracking-widest' }, '1 — Location'),
          React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
            React.createElement('div', null,
              React.createElement('label', { className: label }, 'Which screen?'),
              React.createElement('select', {
                className: inp, value: form.screen,
                onChange: function (e) { set('screen', e.target.value); },
              },
                React.createElement('option', { value: '' }, '— select —'),
                SCREENS.map(function (s) {
                  return React.createElement('option', { key: s, value: s }, s);
                })
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: label }, 'Component or point (optional)'),
              React.createElement('input', {
                type: 'text', className: inp, value: form.point,
                placeholder: 'e.g. OA Damper Position, Supply Air %RH',
                onChange: function (e) { set('point', e.target.value); },
              })
            )
          ),

          React.createElement('hr', { className: 'border-gray-700' }),

          // Section 2 — Issue type
          React.createElement('div', { className: 'text-[10px] font-bold text-blue-500 uppercase tracking-widest' }, '2 — Issue type'),
          React.createElement('div', { className: 'flex flex-wrap gap-1.5' },
            ISSUE_TYPES.map(function (t) {
              var on = form.types.includes(t);
              return React.createElement('button', {
                key: t,
                className: pill + (on
                  ? 'bg-blue-900 border-blue-500 text-blue-200'
                  : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'),
                onClick: function () { toggleType(t); },
              }, t);
            })
          ),

          React.createElement('hr', { className: 'border-gray-700' }),

          // Section 3 — Observation
          React.createElement('div', { className: 'text-[10px] font-bold text-blue-500 uppercase tracking-widest' }, '3 — What you saw vs. what you expected'),
          React.createElement('div', null,
            React.createElement('label', { className: label }, 'What did you observe?'),
            React.createElement('p', { className: 'text-[10px] text-gray-500 mb-1' },
              'Include the value, what you changed, and what happened'
            ),
            React.createElement('textarea', {
              className: inp, rows: 3, value: form.observed,
              placeholder: 'e.g. When I lowered the Cooling Coil Setpoint to 50°F, Supply Air %RH did not change.',
              onChange: function (e) { set('observed', e.target.value); },
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: label }, 'What should have happened instead?'),
            React.createElement('p', { className: 'text-[10px] text-gray-500 mb-1' },
              'Ground expectation in the SOO, ASHRAE, or physical reality'
            ),
            React.createElement('textarea', {
              className: inp, rows: 3, value: form.expected,
              placeholder: 'e.g. Per SOO CLC #4, CHW cooling coil dehumidifies the airstream proportional to valve opening. Supply Air %RH should have decreased.',
              onChange: function (e) { set('expected', e.target.value); },
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: label }, 'SOO / standard reference (optional)'),
            React.createElement('input', {
              type: 'text', className: inp, value: form.soo,
              placeholder: 'e.g. SOO CLC #4, ASHRAE 62.1, Points List DA-3',
              onChange: function (e) { set('soo', e.target.value); },
            })
          ),

          React.createElement('hr', { className: 'border-gray-700' }),

          // Section 4 — Priority
          React.createElement('div', { className: 'text-[10px] font-bold text-blue-500 uppercase tracking-widest' }, '4 — Priority and impact'),
          React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
            React.createElement('div', null,
              React.createElement('label', { className: label }, 'Priority'),
              React.createElement('div', { className: 'flex gap-2' },
                PRIORITIES.map(function (p) {
                  var on = form.priority === p.label;
                  return React.createElement('button', {
                    key: p.label,
                    className: pill + (on ? p.color : 'border-gray-600 text-gray-400 hover:border-gray-400'),
                    onClick: function () { set('priority', p.label); },
                  }, p.label);
                })
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: label }, 'Blocks instruction?'),
              React.createElement('div', { className: 'space-y-1' },
                BLOCKING.map(function (b) {
                  var on = form.blocking === b;
                  return React.createElement('button', {
                    key: b,
                    className: 'block w-full text-left px-2 py-1 rounded border text-[11px] cursor-pointer transition-colors ' +
                      (on ? 'bg-gray-700 border-gray-400 text-gray-100' : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'),
                    onClick: function () { set('blocking', b); },
                  }, b);
                })
              )
            )
          ),

          React.createElement('div', null,
            React.createElement('label', { className: label }, 'Suggested fix (optional)'),
            React.createElement('textarea', {
              className: inp, rows: 2, value: form.fix,
              placeholder: 'e.g. In AHU44NewController.js, supplyRH should decrease when chwValvePosition increases',
              onChange: function (e) { set('fix', e.target.value); },
            })
          ),

          // Validation errors
          errors.length > 0 && React.createElement('div', { className: 'text-[11px] text-red-400 bg-red-900/30 border border-red-700 rounded px-3 py-2' },
            'Please complete: ' + errors.join(', ')
          ),

          // ── Actions ────────────────────────────────────────────────────────
          React.createElement('div', { className: 'flex gap-2 pt-1' },
            React.createElement('button', {
              className: 'px-4 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded font-medium',
              onClick: generate,
            }, 'Generate observation block'),
            React.createElement('button', {
              className: 'px-3 py-1.5 border border-gray-600 hover:border-gray-400 text-gray-400 hover:text-gray-200 text-xs rounded',
              onClick: reset,
            }, 'Clear'),
          ),

          // ── Output ────────────────────────────────────────────────────────
          output && React.createElement('div', null,
            React.createElement('div', { className: 'flex items-center justify-between mb-1' },
              React.createElement('label', { className: label }, 'Generated block — paste into Claude'),
              React.createElement('button', {
                className: 'text-[11px] px-2.5 py-1 border rounded ' +
                  (copied ? 'border-green-600 text-green-400' : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'),
                onClick: copy,
              }, copied ? '✓ Copied!' : 'Copy')
            ),
            React.createElement('pre', {
              className: 'bg-gray-800 border border-gray-700 rounded p-3 text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed overflow-auto max-h-60',
            }, output)
          )

        ) // end body
      ) // end modal
    ); // end backdrop
  }

  // ── Mount / unmount via singleton ────────────────────────────────────────
  var _container = null;

  function open() {
    if (!_container) {
      _container = document.createElement('div');
      document.body.appendChild(_container);
    }
    ReactDOM.render(
      React.createElement(SMEQAModal, { onClose: close }),
      _container
    );
  }

  function close() {
    if (_container) {
      ReactDOM.unmountComponentAtNode(_container);
    }
  }

  return { open: open, close: close };
})();
