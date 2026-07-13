// ==UserScript==
// @name         CPT View - VSM + CIT
// @namespace    http://tampermonkey.net/
// @version      5.2
// @description  Display VSM next to Destination Lane and CIT (CPT - 2h20m) next to CPT times
// @author       @spatmaxi
// @match        https://trans-logistics-eu.amazon.com/ssp/dock/hrz/cpt*
// @updateURL    https://raw.githubusercontent.com/spatmaxi/-CPT-View-VSM/main/CPT-View-VSM.user.js
// @downloadURL  https://raw.githubusercontent.com/spatmaxi/-CPT-View-VSM/main/CPT-View-VSM.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = { debounceTime: 150, storageKey: 'vsmToolSettings', minSearchLength: 2 };

    const laneMap = {
        "NUE9->AMZL-DMU1-ND": ["A031"],
        "NUE9->LH-LIN8": ["C031", "C046"],
        "NUE9->AMZL-DVI2-ND": ["A051"],
        "NUE9->AMZL-DOQ8-ND": ["A082"],
        "NUE9->CC-DP60-DP-OBERTSHA-DE-H2": ["A080"],
        "NUE9->LH-LIN8-1": ["A033", "A053"],
        "NUE9->AMZL-DBX8-ND": ["A084"],
        "NUE9->AMZL-DOQ7-ND": ["A091"],
        "NUE9->AMZL-DFQ9-ND": ["B042"],
        "NUE9->AMZL-DMU2-ND": ["B020"],
        "NUE9->LH-BER8": ["C073"],
        "NUE9->AMZL-DBY8-ND": ["A042"],
        "NUE9->AMZL-DAP8-ND": ["A044"],
        "NUE9->CC-ATPO-WALS-AT-H2": ["A060"],
        "NUE9->CC-ATPO-ALLHAMIN-AT-H2": ["D555", "A-01"],
        "NUE9->AMZL-DCQ9-ND": ["A064"],
        "NUE9->LH-LIL8": ["C022"],
        "NUE9->CC-DE90-DEPO-NUERNBER-DE-H1": ["AXX3", "AXX2"],
        "NUE9->CC-ATPO-WALS-AT-H1": ["AXX4", "CXX3"],
        "NUE9->AMZL-DMU5-ND": ["B011"],
        "NUE9->CC-ATPO-THALGAU-H2-ND": ["B031"],
        "NUE9->AMZL-DVI1-ND": ["B051"],
        "NUE9->LH-HAJ8": ["B071"],
        "NUE9->AMZL-DBY5-ND": ["B024"],
        "NUE9->CC-ATPO-HAGENBRU-AT-H2": ["C020"],
        "NUE9->AMZL-DBV1-ND": ["B040"],
        "NUE9->CC-JLI-WROCLAW-PL-VR": ["A095"],
        "NUE9->CC-ATPO-WOLFURT-AT-H2": ["B060"],
        "NUE9->CC-ATPO-WERNBERG-AT-H2": ["B048"],
        "NUE9->CC-ATPO-KALSDORF-AT-H2": ["DXXX", "A-05"],
        "NUE9->AMZL-DBW8-ND": ["B062"],
        "NUE9->AMZL-DVI3-ND": ["C062"],
        "NUE9->AMZL-DBY4-ND": ["C011"],
        "NUE9->LH-MHG9": ["C040"],
        "NUE9->CC-ATPO-VOMP-AT-H2": ["C051"],
        "NUE9->CC-DP90-DP-FEUCHT-DE-H2": ["B080"],
        "NUE9->CC-DP73-DP-KOENGEN-DE-H2": ["C071"],
        "NUE9->AMZL-DBW6-ND": ["C042"],
        "NUE9->CC-DP97-DP-KITZINGE-DE-H2": ["C033"],
        "NUE9->AMZL-DMU3-ND": ["C053"],
        "NUE9->AMZL-DZQ5-ND": ["C064"],
        "NUE9->CC-DP63-DP-RODGAU-DE-H2": ["C082"],
        "NUE9->LH-HPHR-HP-CROATIA-HR-H1": ["A093"],
        "NUE9->AMZL-DBY3-ND": ["C080"],
        "NUE9->CC-DP76-DP-BRUCHSAL-DE-H2": ["D111"],
        "NUE9->CC-DP85-DP-ASCHHEIM-DE-H2": ["D888"],
        "NUE9->CC-DP89-DP-GUNZBURG-DE-H2": ["D000"],
        "NUE9->CC-DP86-DP-AUGSBURG-DE-H2": ["D444"],
        "NUE9->CC-DP08-DP-NEUMARK-DE-H2": ["D333"],
        "NUE9->CC-DP93-DP-REGENSBU-DE-H2": ["D777"],
        "NUE9->CC-DP99-DP-NOHRA-DE-H1": ["D222"],
        "NUE9->CC-DP72-DP-EUTINGEN-DE-H2": ["A075"],
        "NUE9->CC-DP77-DP-LAHR-DE-H2": ["A062"],
        "NUE9->AMZL-DBY2-ND": ["B086"],
        "NUE9->LH-HPSI-HP-SLOVENIA-SI-H1": ["A077"],
        "NUE9->AMZL-DBZ4-ND": ["B082"],
        "NUE9->LH-MUC7": ["B084"],
        "NUE9->LH-BLQ8": ["E999", "B-77"],
        "NUE9->CC-LOW-PL-DD-VR": ["A099"],
        "NUE9->CC-UPS-NUERNBER-DE-H1": ["B035"],
        "NUE9->AMZL-DOQ8-DOQ7-ND"	:	["A091", "A082"],
        "NUE9->NUE1": ["TransferPalletsCarts"],
        "NUE9->RELO-MUC7": ["RELO-ProblemSolve"]
    };

    const zoneColors = {
        A: { bg: '#e74c3c', text: '#fff', name: 'Zone A (Red)' },
        B: { bg: '#3498db', text: '#fff', name: 'Zone B (Blue)' },
        C: { bg: '#f1c40f', text: '#000', name: 'Zone C (Yellow)' },
        D: { bg: '#27ae60', text: '#fff', name: 'Zone D (Green)' },
        E: { bg: '#27ae60', text: '#fff', name: 'Zone E (Green)' },
        default: { bg: '#95a5a6', text: '#fff', name: 'Unknown' }
    };

    // State
    let observer, searchTerm = '', searchIndex = null, highlightedRows = new Set();
    let settings = (() => {
        try { const s = localStorage.getItem(CONFIG.storageKey); return s ? JSON.parse(s) : null; } catch(e) {}
        return null;
    })() || { isEnabled: true, citEnabled: true };

    const saveSettings = () => { try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(settings)); } catch(e) {} };
    const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
    const getZone = c => c && zoneColors[c[0].toUpperCase()] ? c[0].toUpperCase() : 'default';
    const getColors = c => zoneColors[getZone(c)] || zoneColors.default;

    function getStyle(code) {
        const c = getColors(code);
        return `background:${c.bg};color:${c.text};padding:2px 8px;border-radius:4px;font-weight:bold;margin-left:4px;display:inline-block;font-size:12px;font-family:'Amazon Ember',Arial,sans-serif;transition:all .2s;cursor:pointer;`;
    }

    function createSearchIndex() {
        const idx = {};
        const add = (key, lane) => { (idx[key] || (idx[key] = [])).push(lane); };
        Object.entries(laneMap).forEach(([lane, codes]) => {
            lane.split(/[->]+/).filter(p => p.length > 1).forEach(part => {
                part.split('-').filter(s => s.length > 1).forEach(s => add(s.toUpperCase(), lane));
                add(part.toUpperCase(), lane);
            });
            codes.forEach(c => add(c.toUpperCase(), lane));
        });
        return idx;
    }

    function calculateStats() {
        const s = { A: 0, B: 0, C: 0, D: 0, total: 0 };
        Object.values(laneMap).forEach(codes => codes.forEach(c => { s.total++; const z = getZone(c); if (s[z] !== undefined) s[z]++; }));
        return s;
    }

    function injectStyles() {
        const s = document.createElement('style');
        s.textContent = `
        .vsm-code-span{transition:transform .2s,box-shadow .2s;cursor:pointer;user-select:none}
        .vsm-code-span:hover{transform:scale(1.15);box-shadow:0 2px 8px rgba(0,0,0,.4);z-index:100;position:relative}
        .vsm-code-span:active{transform:scale(.95)}
        .vsm-code-span.vsm-selected{box-shadow:0 0 0 3px #fff,0 0 0 5px #333}
        .cit-code-span{background:#8e44ad;color:#fff;padding:2px 8px;border-radius:4px;font-weight:bold;margin-left:4px;display:inline-block;font-size:12px;font-family:'Amazon Ember',Arial,sans-serif;cursor:default;white-space:nowrap}
        .vsm-control-panel{position:fixed;top:10px;right:10px;z-index:99999;background:linear-gradient(135deg,#667eea,#764ba2);padding:15px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.3);font-family:'Amazon Ember',Arial,sans-serif;min-width:220px;color:#fff}
        .vsm-control-panel h3{margin:0 0 12px;font-size:16px;display:flex;align-items:center;gap:8px}
        .vsm-toggle{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .vsm-switch{position:relative;width:50px;height:26px}
        .vsm-switch input{opacity:0;width:0;height:0}
        .vsm-slider{position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,.3);transition:.4s;border-radius:26px}
        .vsm-slider:before{position:absolute;content:"";height:20px;width:20px;left:3px;bottom:3px;background:#fff;transition:.4s;border-radius:50%}
        .vsm-switch input:checked+.vsm-slider{background:#27ae60}
        .vsm-switch input:checked+.vsm-slider:before{transform:translateX(24px)}
        .vsm-search-container{position:relative;margin-bottom:8px}
        .vsm-search{width:100%;padding:8px 12px;padding-right:30px;border:none;border-radius:6px;font-size:13px;box-sizing:border-box}
        .vsm-search:focus{outline:2px solid #f1c40f}
        .vsm-search-clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#999;cursor:pointer;font-size:16px;padding:0;display:none}
        .vsm-search-clear.visible{display:block}
        .vsm-search-count{font-size:11px;margin-bottom:10px;opacity:.9;min-height:16px}
        .vsm-search-results{max-height:150px;overflow-y:auto;background:rgba(255,255,255,.1);border-radius:6px;margin-bottom:10px;display:none}
        .vsm-search-results.visible{display:block}
        .vsm-search-result-item{padding:6px 10px;font-size:11px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.1);transition:background .2s}
        .vsm-search-result-item:hover{background:rgba(255,255,255,.2)}
        .vsm-search-result-item:last-child{border-bottom:none}
        .vsm-search-result-lane{font-weight:bold;word-break:break-all}
        .vsm-search-result-codes{margin-top:2px;opacity:.8}
        .vsm-legend{background:rgba(255,255,255,.1);border-radius:8px;padding:10px;margin-top:10px}
        .vsm-legend-title{font-weight:bold;margin-bottom:8px;font-size:13px}
        .vsm-legend-item{display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:12px}
        .vsm-legend-color{width:24px;height:18px;border-radius:4px;display:inline-block}
        .vsm-stats{background:rgba(255,255,255,.1);border-radius:8px;padding:10px;margin-top:10px}
        .vsm-stats-title{font-weight:bold;margin-bottom:8px;font-size:13px}
        .vsm-stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
        .vsm-stat-item{text-align:center;padding:4px;background:rgba(255,255,255,.1);border-radius:4px;font-size:11px}
        .vsm-stat-value{font-size:16px;font-weight:bold}
        .vsm-buttons{display:flex;gap:8px;margin-top:10px}
        .vsm-btn{flex:1;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;transition:all .2s}
        .vsm-btn-refresh{background:#3498db;color:#fff}.vsm-btn-refresh:hover{background:#2980b9}
        .vsm-btn-export{background:#27ae60;color:#fff}.vsm-btn-export:hover{background:#1e8449}
        .vsm-btn-clear-highlights{background:#e74c3c;color:#fff;margin-top:8px;display:none}
        .vsm-btn-clear-highlights.visible{display:block}.vsm-btn-clear-highlights:hover{background:#c0392b}
        .vsm-btn-collapse{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.3);padding:4px 8px;font-size:18px;line-height:1}
        .vsm-btn-collapse:hover{background:rgba(255,255,255,.1)}
        .vsm-highlight{animation:vsm-pulse .6s ease-in-out}
        @keyframes vsm-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2);box-shadow:0 0 20px rgba(255,255,0,.8)}}
        .vsm-minimized{min-width:auto!important;padding:10px!important}
        .vsm-minimized .vsm-content{display:none}
        .vsm-version{font-size:10px;opacity:.7;margin-top:8px;text-align:center}
        .vsm-row-highlight{background:rgba(241,196,15,.4)!important;outline:2px solid #f1c40f;position:relative}
        .vsm-row-highlight td{background:rgba(241,196,15,.4)!important}
        .vsm-click-highlight{background:rgba(46,204,113,.5)!important;outline:3px solid #27ae60;box-shadow:0 0 10px rgba(46,204,113,.5)}
        .vsm-click-highlight td{background:rgba(46,204,113,.5)!important}
        .vsm-match-text{background:#f1c40f;color:#000;padding:0 2px;border-radius:2px}
        .vsm-highlight-count{font-size:11px;margin-top:8px;padding:6px 10px;background:rgba(46,204,113,.3);border-radius:6px;display:none}
        .vsm-highlight-count.visible{display:block}
        `;
        document.head.appendChild(s);
    }

    function createControlPanel() {
        const stats = calculateStats();
        const panel = document.createElement('div');
        panel.className = 'vsm-control-panel';
        panel.id = 'vsm-control-panel';
        panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>📦 VSM Tool</h3>
            <button class="vsm-btn vsm-btn-collapse" id="vsm-collapse-btn">−</button>
        </div>
        <div class="vsm-content">
            <div class="vsm-toggle"><span>Enable VSM Codes</span><label class="vsm-switch"><input type="checkbox" id="vsm-enable-toggle" ${settings.isEnabled?'checked':''}><span class="vsm-slider"></span></label></div>
            <div class="vsm-toggle"><span>Enable CIT</span><label class="vsm-switch"><input type="checkbox" id="cit-enable-toggle" ${settings.citEnabled?'checked':''}><span class="vsm-slider"></span></label></div>
            <div class="vsm-search-container"><input type="text" class="vsm-search" id="vsm-search" placeholder="🔍 Search (e.g. DVI1, DMU, A031...)"><button class="vsm-search-clear" id="vsm-search-clear">✕</button></div>
            <div class="vsm-search-count" id="vsm-search-count"></div>
            <div class="vsm-search-results" id="vsm-search-results"></div>
            <div class="vsm-highlight-count" id="vsm-highlight-count"><span id="vsm-highlight-text">0 rows highlighted</span></div>
            <button class="vsm-btn vsm-btn-clear-highlights" id="vsm-clear-highlights">🗑️ Clear All Highlights</button>
            <div class="vsm-legend">
                <div class="vsm-legend-title">📍 Zone Legend</div>
                ${Object.entries(zoneColors).filter(([k])=>k!=='default').map(([,v])=>`<div class="vsm-legend-item"><span class="vsm-legend-color" style="background:${v.bg}"></span><span>${v.name}</span></div>`).join('')}
                <div class="vsm-legend-item" style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.2)"><span style="font-size:11px;opacity:.8">💡 Click any VSM code to highlight row</span></div>
            </div>
            <div class="vsm-stats">
                <div class="vsm-stats-title">📊 Statistics</div>
                <div class="vsm-stats-grid">
                    <div class="vsm-stat-item"><div class="vsm-stat-value" style="color:#e74c3c">${stats.A}</div><div>Zone A</div></div>
                    <div class="vsm-stat-item"><div class="vsm-stat-value" style="color:#3498db">${stats.B}</div><div>Zone B</div></div>
                    <div class="vsm-stat-item"><div class="vsm-stat-value" style="color:#f1c40f">${stats.C}</div><div>Zone C</div></div>
                    <div class="vsm-stat-item"><div class="vsm-stat-value" style="color:#27ae60">${stats.D}</div><div>Zone D</div></div>
                    <div class="vsm-stat-item"><div class="vsm-stat-value" style="color:#e67e22">0</div><div>Unassigned</div></div>
                    <div class="vsm-stat-item"><div class="vsm-stat-value">${Object.keys(laneMap).length}</div><div>Lanes</div></div>
                </div>
            </div>
            <div class="vsm-buttons">
                <button class="vsm-btn vsm-btn-refresh" id="vsm-refresh-btn">🔄 Refresh</button>
                <button class="vsm-btn vsm-btn-export" id="vsm-export-btn">📥 Export</button>
            </div>
            <div class="vsm-version">v5.1 by @spatmaxi</div>
        </div>`;
        document.body.appendChild(panel);
        attachEventListeners();
    }

    function attachEventListeners() {
        document.getElementById('vsm-enable-toggle').addEventListener('change', function() {
            settings.isEnabled = this.checked; saveSettings();
            this.checked ? updateLanes() : removeAllCodes();
        });
        document.getElementById('cit-enable-toggle').addEventListener('change', function() {
            settings.citEnabled = this.checked; saveSettings();
            this.checked ? updateCIT() : removeAllCIT();
        });
        const searchInput = document.getElementById('vsm-search');
        const searchClear = document.getElementById('vsm-search-clear');
        searchInput.addEventListener('input', debounce(function() {
            searchTerm = this.value.trim().toUpperCase();
            searchClear.classList.toggle('visible', searchTerm.length > 0);
            performSearch();
        }, 200));
        searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') clearSearch(); });
        searchClear.addEventListener('click', clearSearch);
        document.getElementById('vsm-clear-highlights').addEventListener('click', clearAllHighlights);
        document.getElementById('vsm-refresh-btn').addEventListener('click', function() {
            this.textContent = '⏳ Refreshing...';
            setTimeout(() => { updateLanes(); this.textContent = '🔄 Refresh'; }, 500);
        });
        document.getElementById('vsm-export-btn').addEventListener('click', exportData);
        document.getElementById('vsm-collapse-btn').addEventListener('click', function() {
            const p = document.getElementById('vsm-control-panel');
            p.classList.toggle('vsm-minimized');
            this.textContent = p.classList.contains('vsm-minimized') ? '+' : '−';
        });
        makeDraggable(document.getElementById('vsm-control-panel'));
    }

    function handleVSMClick(e) {
        const span = e.target;
        if (!span.classList.contains('vsm-code-span')) return;
        const row = span.closest('tr');
        if (!row) return;
        if (row.classList.contains('vsm-click-highlight')) {
            row.classList.remove('vsm-click-highlight'); span.classList.remove('vsm-selected'); highlightedRows.delete(row);
        } else {
            row.classList.add('vsm-click-highlight'); span.classList.add('vsm-selected'); highlightedRows.add(row);
            span.classList.add('vsm-highlight'); setTimeout(() => span.classList.remove('vsm-highlight'), 600);
        }
        updateHighlightCount();
    }

    function updateHighlightCount() {
        const count = highlightedRows.size;
        document.getElementById('vsm-highlight-count').classList.toggle('visible', count > 0);
        document.getElementById('vsm-clear-highlights').classList.toggle('visible', count > 0);
        document.getElementById('vsm-highlight-text').textContent = `${count} row${count !== 1 ? 's' : ''} highlighted`;
    }

    function clearAllHighlights() {
        document.querySelectorAll('.vsm-click-highlight').forEach(r => r.classList.remove('vsm-click-highlight'));
        document.querySelectorAll('.vsm-selected').forEach(s => s.classList.remove('vsm-selected'));
        highlightedRows.clear(); updateHighlightCount();
    }

    function clearSearch() {
        const si = document.getElementById('vsm-search');
        si.value = ''; searchTerm = '';
        document.getElementById('vsm-search-clear').classList.remove('visible');
        document.getElementById('vsm-search-count').textContent = '';
        const sr = document.getElementById('vsm-search-results');
        sr.classList.remove('visible'); sr.innerHTML = '';
        removeSearchHighlights();
    }

    function removeSearchHighlights() {
        document.querySelectorAll('.vsm-row-highlight').forEach(el => el.classList.remove('vsm-row-highlight'));
    }

    function performSearch() {
        const countEl = document.getElementById('vsm-search-count');
        const resultsEl = document.getElementById('vsm-search-results');
        removeSearchHighlights();
        if (!searchTerm || searchTerm.length < CONFIG.minSearchLength) {
            countEl.textContent = searchTerm.length > 0 ? `Type at least ${CONFIG.minSearchLength} characters...` : '';
            resultsEl.classList.remove('visible'); resultsEl.innerHTML = ''; return;
        }
        const matches = findMatchingLanes(searchTerm);
        countEl.textContent = `Found: ${matches.length} lane${matches.length !== 1 ? 's' : ''}`;
        if (matches.length > 0 && matches.length <= 20) {
            resultsEl.classList.add('visible');
            resultsEl.innerHTML = matches.map(lane => {
                const hl = lane.replace(new RegExp(`(${searchTerm})`, 'gi'), '<span class="vsm-match-text">$1</span>');
                return `<div class="vsm-search-result-item" data-lane="${lane}"><div class="vsm-search-result-lane">${hl}</div><div class="vsm-search-result-codes">→ ${laneMap[lane].join(', ')}</div></div>`;
            }).join('');
            resultsEl.querySelectorAll('.vsm-search-result-item').forEach(item =>
                item.addEventListener('click', () => scrollToLane(item.dataset.lane)));
        } else if (matches.length > 20) {
            resultsEl.classList.add('visible');
            resultsEl.innerHTML = `<div class="vsm-search-result-item">Too many results (${matches.length}). Refine your search.</div>`;
        } else { resultsEl.classList.remove('visible'); resultsEl.innerHTML = ''; }
        highlightMatchingRows(matches);
    }

    function findMatchingLanes(term) {
        const results = new Set();
        Object.entries(searchIndex).forEach(([k, lanes]) => { if (k.includes(term)) lanes.forEach(l => results.add(l)); });
        Object.keys(laneMap).forEach(l => { if (l.toUpperCase().includes(term)) results.add(l); });
        Object.entries(laneMap).forEach(([l, codes]) => codes.forEach(c => { if (c.toUpperCase().includes(term)) results.add(l); }));
        return [...results].sort();
    }

    function highlightMatchingRows(lanes) {
        if (!lanes.length) return;
        const set = new Set(lanes);
        document.querySelectorAll('td, div, span').forEach(el => {
            if (el.closest('#vsm-control-panel')) return;
            const tmp = el.cloneNode(true); tmp.querySelectorAll('.vsm-code-span,.cit-code-span').forEach(s => s.remove());
            if (set.has(tmp.textContent.trim())) { const r = el.closest('tr'); if (r) r.classList.add('vsm-row-highlight'); }
        });
    }

    function scrollToLane(lane) {
        document.querySelectorAll('td, div, span').forEach(el => {
            if (el.closest('#vsm-control-panel')) return;
            const tmp = el.cloneNode(true); tmp.querySelectorAll('.vsm-code-span,.cit-code-span').forEach(s => s.remove());
            if (tmp.textContent.trim() === lane) {
                const row = el.closest('tr') || el;
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.classList.add('vsm-row-highlight');
            }
        });
    }

    function makeDraggable(el) {
        let x = 0, y = 0, px = 0, py = 0;
        el.querySelector('h3').style.cursor = 'move';
        el.querySelector('h3').onmousedown = e => {
            e.preventDefault(); px = e.clientX; py = e.clientY;
            document.onmouseup = () => { document.onmouseup = document.onmousemove = null; };
            document.onmousemove = ev => {
                x = px - ev.clientX; y = py - ev.clientY; px = ev.clientX; py = ev.clientY;
                el.style.top = (el.offsetTop - y) + 'px'; el.style.left = (el.offsetLeft - x) + 'px'; el.style.right = 'auto';
            };
        };
    }

    function exportData() {
        let csv = "Lane,VSM Codes,Zones\n";
        Object.entries(laneMap).forEach(([l, codes]) => { csv += `"${l}","${codes.join(', ')}","${codes.map(getZone).join(', ')}"\n`; });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        link.download = `vsm_lanes_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link); link.click(); link.remove();
    }

    // CIT & VSM removal
    function removeAllCodes() { document.querySelectorAll('.vsm-code-span').forEach(s => s.remove()); clearAllHighlights(); }
    function removeAllCIT() { document.querySelectorAll('.cit-code-span').forEach(s => s.remove()); }

    function computeCIT(timeStr) {
        const m = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (!m) return null;
        const h = parseInt(m[1], 10), min = parseInt(m[2], 10);
        if (h > 23 || min > 59) return null;
        let total = h * 60 + min - 140;
        if (total < 0) total += 1440;
        return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    }

    function updateCIT() {
        if (!settings.citEnabled) return;
        document.querySelectorAll('td, th, div, span').forEach(el => {
            if (el.closest('#vsm-control-panel')) return;
            if (el.querySelector('.cit-code-span')) return;
            if (el.classList.contains('cit-code-span') || el.classList.contains('vsm-code-span')) return;
            // Skip elements inside popups/modals/dialogs
            if (el.closest('.modal, .popup, .dialog, [role="dialog"], .ui-dialog, .view-packages, .popover')) return;
            if (el.closest('[class*="modal"], [class*="popup"], [class*="dialog"], [class*="overlay"]')) return;
            const tmp = el.cloneNode(true);
            tmp.querySelectorAll('.cit-code-span,.vsm-code-span').forEach(s => s.remove());
            const text = tmp.textContent.trim();
            // Only match CPT format: DD-Mon-YY HH:MM (e.g. "15-Jun-26 00:15")
            const cptMatch = text.match(/\d{1,2}-[A-Za-z]{3}-\d{2}\s+(\d{1,2}:\d{2})/);
            if (cptMatch) {
                const h = parseInt(cptMatch[1].split(':')[0], 10), min = parseInt(cptMatch[1].split(':')[1], 10);
                if (h <= 23 && min <= 59) {
                    const cit = computeCIT(cptMatch[1]);
                    if (cit) {
                        const span = document.createElement('span');
                        span.className = 'cit-code-span';
                        span.textContent = `CIT ${cit}`;
                        span.title = `CIT: CPT (${cptMatch[1]}) minus 2h20m`;
                        el.appendChild(document.createTextNode(' '));
                        el.appendChild(span);
                    }
                }
            }
        });
    }

    // Main update
    const observerOpts = { childList: true, subtree: true, characterData: true };

    function updateLanes() {
        if (!settings.isEnabled) return;
        observer.disconnect();
        try {
            document.querySelectorAll('td, div, span').forEach(el => {
                if (el.closest('#vsm-control-panel')) return;
                const existing = el.querySelectorAll('.vsm-code-span');
                const tmp = el.cloneNode(true);
                tmp.querySelectorAll('.vsm-code-span').forEach(s => s.remove());
                const text = tmp.textContent.trim();
                if (laneMap[text]) {
                    existing.forEach(s => s.remove());
                    const frag = document.createDocumentFragment();
                    laneMap[text].forEach(code => {
                        const span = document.createElement('span');
                        span.className = 'vsm-code-span';
                        span.style.cssText = getStyle(code);
                        span.textContent = code;
                        span.title = `${code} - ${getColors(code).name}\nClick to highlight row`;
                        span.addEventListener('click', handleVSMClick);
                        frag.appendChild(document.createTextNode(' '));
                        frag.appendChild(span);
                    });
                    el.appendChild(frag);
                }
            });
            updateCIT();
        } catch (err) { console.error('VSM Tool error:', err); }
        finally { observer.observe(document.body, observerOpts); }
    }

    const debouncedUpdate = debounce(updateLanes, CONFIG.debounceTime);

    // Init
    function init() {
        searchIndex = createSearchIndex();
        injectStyles();
        createControlPanel();
        observer = new MutationObserver(debouncedUpdate);
        observer.observe(document.body, observerOpts);
        updateLanes();
        console.log(`✅ VSM+CIT Tool v5.1 loaded | ${Object.keys(laneMap).length} lanes | ${Object.keys(searchIndex).length} search keys`);
    }

    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
    window.addEventListener('load', () => setTimeout(updateLanes, 1000));
})();
