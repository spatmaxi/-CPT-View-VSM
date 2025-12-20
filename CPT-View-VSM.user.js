// ==UserScript==
// @name         CPT View - VSM 3.2
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  A CPT View Tool to display VSM next to Destination Lane (Click to Highlight)
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

    // =====================
    // CONFIGURATION
    // =====================
    const CONFIG = {
        debounceTime: 150,
        showLegend: true,
        enableSearch: true,
        highlightOnHover: true,
        storageKey: 'vsmToolSettings',
        minSearchLength: 2
    };

    // =====================
    // LANE MAPPINGS
    // =====================
    const laneMap = {
        "NUE9->AMZL-DMU1-ND": ["A031"],
        "NUE9->LH-LIN8": ["A033", "C031", "C046"],
        "NUE9->AMZL-DVI2-ND": ["A051"],
        "NUE9->AMZL-DOQ8-ND": ["A082"],
        "NUE9->CC-DP60-DP-OBERTSHA-DE-H2": ["A080"],
        "NUE9->LH-LIN8-1": ["XXX6"],
        "NUE9->AMZL-DBX8-ND": ["XXX2"],
        "NUE9->AMZL-DOQ7-ND": ["A091"],
        "NUE9->AMZL-DFQ9-ND": ["XXX4"],
        "NUE9->AMZL-DMU2-ND": ["B020"],
        "NUE9->LH-BER8": ["C073"],
        "NUE9->AMZL-DBY8-ND": ["A042"],
        "NUE9->AMZL-DAP8-ND": ["A044"],
        "NUE9->CC-ATPO-WALS-AT-H2": ["A060"],
        "NUE9->CC-ATPO-ALLHAMIN-AT-H2": ["D555"],
        "NUE9->AMZL-DCQ9-ND": ["A064"],
        "NUE9->LH-LIL8": ["XXX5"],
        "NUE9->CC-DE90-DEPO-NUERNBER-DE-H1": ["AXX3", "CXX2"],
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
        "NUE9->CC-ATPO-KALSDORF-AT-H2": ["DXXX", "B060"],
        "NUE9->AMZL-DBW8-ND": ["B062"],
        "NUE9->AMZL-DVI3-ND": ["C062"],
        "NUE9->AMZL-DBY4-ND": ["C011"],
        "NUE9->LH-MHG9": ["C040"],
        "NUE9->CC-ATPO-VOMP-AT-H2": ["C051"],
        "NUE9->CC-DP90-DP-FEUCHT-DE-H2": ["B080"],
        "NUE9->CC-DP73-DP-KOENGEN-DE-H2": ["C071"],
        "NUE9->AMZL-DBW6-ND": ["XXX1"],
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
        "NUE9->AMZL-DBY2-ND": ["XXX3"],
        "NUE9->LH-HPSI-HP-SLOVENIA-SI-H1": ["A077"],
        "NUE9->AMZL-DBZ4-ND": ["B082"],
        "NUE9->LH-MUC7": ["B084"]
    };

    // =====================
    // ZONE COLORS
    // =====================
    const zoneColors = {
        'A': { bg: '#e74c3c', text: '#ffffff', name: 'Zone A (Red)' },
        'B': { bg: '#3498db', text: '#ffffff', name: 'Zone B (Blue)' },
        'C': { bg: '#f1c40f', text: '#000000', name: 'Zone C (Yellow)' },
        'D': { bg: '#27ae60', text: '#ffffff', name: 'Zone D (Green)' },
        'X': { bg: '#e67e22', text: '#000000', name: 'Unassigned (Orange)' },
        'default': { bg: '#95a5a6', text: '#ffffff', name: 'Unknown' }
    };

    // =====================
    // STATE MANAGEMENT
    // =====================
    let observer;
    let searchTerm = '';
    let settings = loadSettings();
    let searchIndex = null;
    let highlightedRows = new Set(); // Track highlighted rows

    function loadSettings() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKey);
            return saved ? JSON.parse(saved) : { isEnabled: true, showLegend: true };
        } catch (e) {
            return { isEnabled: true, showLegend: true };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(settings));
        } catch (e) {
            console.error('VSM Tool: Failed to save settings', e);
        }
    }

    // =====================
    // UTILITY FUNCTIONS
    // =====================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function getZoneFromCode(code) {
        if (!code || code.length === 0) return 'default';
        if (code.startsWith('XXX') || code.includes('XX')) return 'X';
        const firstChar = code.charAt(0).toUpperCase();
        return zoneColors[firstChar] ? firstChar : 'default';
    }

    function getStyle(code) {
        const zone = getZoneFromCode(code);
        const colors = zoneColors[zone] || zoneColors['default'];
        const isUnassigned = zone === 'X';

        let style = `
            background-color: ${colors.bg};
            color: ${colors.text};
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            margin-left: 4px;
            display: inline-block;
            font-size: 12px;
            font-family: 'Amazon Ember', Arial, sans-serif;
            transition: all 0.2s ease;
            cursor: pointer;
        `;

        if (isUnassigned) {
            style += `border: 2px dashed #c0392b;`;
        }

        return style;
    }

    // =====================
    // SEARCH INDEX
    // =====================
    function createSearchIndex() {
        const index = {};

        Object.entries(laneMap).forEach(([lane, codes]) => {
            const parts = lane.split(/[->]+/).filter(p => p.length > 1);

            parts.forEach(part => {
                const subParts = part.split('-').filter(sp => sp.length > 1);
                subParts.forEach(subPart => {
                    const key = subPart.toUpperCase();
                    if (!index[key]) {
                        index[key] = new Set();
                    }
                    index[key].add(lane);
                });

                const fullKey = part.toUpperCase();
                if (!index[fullKey]) {
                    index[fullKey] = new Set();
                }
                index[fullKey].add(lane);
            });

            codes.forEach(code => {
                const key = code.toUpperCase();
                if (!index[key]) {
                    index[key] = new Set();
                }
                index[key].add(lane);
            });
        });

        Object.keys(index).forEach(key => {
            index[key] = Array.from(index[key]);
        });

        return index;
    }

    // =====================
    // STATISTICS
    // =====================
    function calculateStats() {
        const stats = { A: 0, B: 0, C: 0, D: 0, X: 0, total: 0 };

        Object.values(laneMap).forEach(codes => {
            codes.forEach(code => {
                stats.total++;
                const zone = getZoneFromCode(code);
                if (stats[zone] !== undefined) {
                    stats[zone]++;
                }
            });
        });

        return stats;
    }

    // =====================
    // CSS STYLES
    // =====================
    function injectStyles() {
        const css = `
            .vsm-code-span {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                cursor: pointer;
                user-select: none;
            }

            .vsm-code-span:hover {
                transform: scale(1.15);
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                z-index: 100;
                position: relative;
            }

            .vsm-code-span:active {
                transform: scale(0.95);
            }

            .vsm-code-span.vsm-selected {
                box-shadow: 0 0 0 3px #fff, 0 0 0 5px #333;
            }

            .vsm-control-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 99999;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 15px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                font-family: 'Amazon Ember', Arial, sans-serif;
                min-width: 220px;
                color: white;
            }

            .vsm-control-panel h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .vsm-control-panel .vsm-toggle {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
            }

            .vsm-switch {
                position: relative;
                width: 50px;
                height: 26px;
            }

            .vsm-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .vsm-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(255,255,255,0.3);
                transition: 0.4s;
                border-radius: 26px;
            }

            .vsm-slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.4s;
                border-radius: 50%;
            }

            .vsm-switch input:checked + .vsm-slider {
                background-color: #27ae60;
            }

            .vsm-switch input:checked + .vsm-slider:before {
                transform: translateX(24px);
            }

            .vsm-search-container {
                position: relative;
                margin-bottom: 8px;
            }

            .vsm-search {
                width: 100%;
                padding: 8px 12px;
                padding-right: 30px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                box-sizing: border-box;
            }

            .vsm-search:focus {
                outline: 2px solid #f1c40f;
            }

            .vsm-search-clear {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 16px;
                padding: 0;
                line-height: 1;
                display: none;
            }

            .vsm-search-clear.visible {
                display: block;
            }

            .vsm-search-clear:hover {
                color: #333;
            }

            .vsm-search-count {
                font-size: 11px;
                margin-bottom: 10px;
                opacity: 0.9;
                min-height: 16px;
            }

            .vsm-search-results {
                max-height: 150px;
                overflow-y: auto;
                background: rgba(255,255,255,0.1);
                border-radius: 6px;
                margin-bottom: 10px;
                display: none;
            }

            .vsm-search-results.visible {
                display: block;
            }

            .vsm-search-result-item {
                padding: 6px 10px;
                font-size: 11px;
                cursor: pointer;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                transition: background 0.2s;
            }

            .vsm-search-result-item:hover {
                background: rgba(255,255,255,0.2);
            }

            .vsm-search-result-item:last-child {
                border-bottom: none;
            }

            .vsm-search-result-lane {
                font-weight: bold;
                word-break: break-all;
            }

            .vsm-search-result-codes {
                margin-top: 2px;
                opacity: 0.8;
            }

            .vsm-legend {
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 10px;
                margin-top: 10px;
            }

            .vsm-legend-title {
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 13px;
            }

            .vsm-legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
                font-size: 12px;
            }

            .vsm-legend-color {
                width: 24px;
                height: 18px;
                border-radius: 4px;
                display: inline-block;
            }

            .vsm-stats {
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 10px;
                margin-top: 10px;
            }

            .vsm-stats-title {
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 13px;
            }

            .vsm-stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 6px;
            }

            .vsm-stat-item {
                text-align: center;
                padding: 4px;
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
                font-size: 11px;
            }

            .vsm-stat-value {
                font-size: 16px;
                font-weight: bold;
            }

            .vsm-buttons {
                display: flex;
                gap: 8px;
                margin-top: 10px;
            }

            .vsm-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                transition: all 0.2s ease;
            }

            .vsm-btn-refresh {
                background: #3498db;
                color: white;
            }

            .vsm-btn-refresh:hover {
                background: #2980b9;
            }

            .vsm-btn-export {
                background: #27ae60;
                color: white;
            }

            .vsm-btn-export:hover {
                background: #1e8449;
            }

            .vsm-btn-clear-highlights {
                background: #e74c3c;
                color: white;
                margin-top: 8px;
                display: none;
            }

            .vsm-btn-clear-highlights.visible {
                display: block;
            }

            .vsm-btn-clear-highlights:hover {
                background: #c0392b;
            }

            .vsm-btn-collapse {
                background: transparent;
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                padding: 4px 8px;
                font-size: 18px;
                line-height: 1;
            }

            .vsm-btn-collapse:hover {
                background: rgba(255,255,255,0.1);
            }

            .vsm-highlight {
                animation: vsm-pulse 0.6s ease-in-out;
            }

            @keyframes vsm-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); box-shadow: 0 0 20px rgba(255,255,0,0.8); }
            }

            .vsm-minimized {
                min-width: auto !important;
                padding: 10px !important;
            }

            .vsm-minimized .vsm-content {
                display: none;
            }

            .vsm-version {
                font-size: 10px;
                opacity: 0.7;
                margin-top: 8px;
                text-align: center;
            }

            /* Row highlight styles */
            .vsm-row-highlight {
                background-color: rgba(241, 196, 15, 0.4) !important;
                outline: 2px solid #f1c40f;
                position: relative;
            }

            .vsm-row-highlight td {
                background-color: rgba(241, 196, 15, 0.4) !important;
            }

            /* Click highlight - more prominent */
            .vsm-click-highlight {
                background-color: rgba(46, 204, 113, 0.5) !important;
                outline: 3px solid #27ae60;
                box-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
            }

            .vsm-click-highlight td {
                background-color: rgba(46, 204, 113, 0.5) !important;
            }

            .vsm-match-text {
                background-color: #f1c40f;
                color: #000;
                padding: 0 2px;
                border-radius: 2px;
            }

            .vsm-highlight-count {
                font-size: 11px;
                margin-top: 8px;
                padding: 6px 10px;
                background: rgba(46, 204, 113, 0.3);
                border-radius: 6px;
                display: none;
            }

            .vsm-highlight-count.visible {
                display: block;
            }

            .vsm-tooltip {
                position: absolute;
                background: #333;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                white-space: nowrap;
                z-index: 100000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .vsm-tooltip.visible {
                opacity: 1;
            }
        `;

        const styleEl = document.createElement('style');
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    }

    // =====================
    // CONTROL PANEL UI
    // =====================
    function createControlPanel() {
        const stats = calculateStats();

        const panel = document.createElement('div');
        panel.className = 'vsm-control-panel';
        panel.id = 'vsm-control-panel';

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>📦 VSM Tool</h3>
                <button class="vsm-btn vsm-btn-collapse" id="vsm-collapse-btn">−</button>
            </div>

            <div class="vsm-content">
                <div class="vsm-toggle">
                    <span>Enable VSM Codes</span>
                    <label class="vsm-switch">
                        <input type="checkbox" id="vsm-enable-toggle" ${settings.isEnabled ? 'checked' : ''}>
                        <span class="vsm-slider"></span>
                    </label>
                </div>

                <div class="vsm-search-container">
                    <input type="text" class="vsm-search" id="vsm-search" placeholder="🔍 Search (e.g. DVI1, DMU, A031...)">
                    <button class="vsm-search-clear" id="vsm-search-clear">✕</button>
                </div>
                <div class="vsm-search-count" id="vsm-search-count"></div>
                <div class="vsm-search-results" id="vsm-search-results"></div>

                <div class="vsm-highlight-count" id="vsm-highlight-count">
                    <span id="vsm-highlight-text">0 rows highlighted</span>
                </div>
                <button class="vsm-btn vsm-btn-clear-highlights" id="vsm-clear-highlights">🗑️ Clear All Highlights</button>

                <div class="vsm-legend">
                    <div class="vsm-legend-title">📍 Zone Legend</div>
                    ${Object.entries(zoneColors).filter(([key]) => key !== 'default').map(([key, value]) => `
                        <div class="vsm-legend-item">
                            <span class="vsm-legend-color" style="background-color: ${value.bg}; ${key === 'X' ? 'border: 2px dashed #c0392b;' : ''}"></span>
                            <span>${value.name}</span>
                        </div>
                    `).join('')}
                    <div class="vsm-legend-item" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">
                        <span style="font-size: 11px; opacity: 0.8;">💡 Click any VSM code to highlight row</span>
                    </div>
                </div>

                <div class="vsm-stats">
                    <div class="vsm-stats-title">📊 Statistics</div>
                    <div class="vsm-stats-grid">
                        <div class="vsm-stat-item">
                            <div class="vsm-stat-value" style="color: #e74c3c;">${stats.A}</div>
                            <div>Zone A</div>
                        </div>
                        <div class="vsm-stat-item">
                            <div class="vsm-stat-value" style="color: #3498db;">${stats.B}</div>
                            <div>Zone B</div>
                        </div>
                        <div class="vsm-stat-item">
                            <div class="vsm-stat-value" style="color: #f1c40f;">${stats.C}</div>
                            <div>Zone C</div>
                        </div>
                        <div class="vsm-stat-item">
                            <div class="vsm-stat-value" style="color: #27ae60;">${stats.D}</div>
                            <div>Zone D</div>
                        </div>
                        <div class="vsm-stat-item">
                            <div class="vsm-stat-value" style="color: #e67e22;">${stats.X}</div>
                            <div>Unassigned</div>
                        </div>
                        <div class="vsm-stat-item">
                            <div class="vsm-stat-value">${Object.keys(laneMap).length}</div>
                            <div>Lanes</div>
                        </div>
                    </div>
                </div>

                <div class="vsm-buttons">
                    <button class="vsm-btn vsm-btn-refresh" id="vsm-refresh-btn">🔄 Refresh</button>
                    <button class="vsm-btn vsm-btn-export" id="vsm-export-btn">📥 Export</button>
                </div>

                <div class="vsm-version">v3.2 by @spatmaxi</div>
            </div>
        `;

        document.body.appendChild(panel);

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'vsm-tooltip';
        tooltip.id = 'vsm-tooltip';
        document.body.appendChild(tooltip);

        attachEventListeners();
    }

    function attachEventListeners() {
        // Toggle enable/disable
        document.getElementById('vsm-enable-toggle').addEventListener('change', function() {
            settings.isEnabled = this.checked;
            saveSettings();
            if (settings.isEnabled) {
                updateLanes();
            } else {
                removeAllCodes();
            }
        });

        // Search functionality
        const searchInput = document.getElementById('vsm-search');
        const searchClear = document.getElementById('vsm-search-clear');

        searchInput.addEventListener('input', debounce(function() {
            searchTerm = this.value.trim().toUpperCase();
            searchClear.classList.toggle('visible', searchTerm.length > 0);
            performSearch();
        }, 200));

        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });

        // Clear search button
        searchClear.addEventListener('click', clearSearch);

        // Clear all highlights button
        document.getElementById('vsm-clear-highlights').addEventListener('click', clearAllHighlights);

        // Refresh button
        document.getElementById('vsm-refresh-btn').addEventListener('click', function() {
            this.textContent = '⏳ Refreshing...';
            setTimeout(() => {
                updateLanes();
                this.textContent = '🔄 Refresh';
            }, 500);
        });

        // Export button
        document.getElementById('vsm-export-btn').addEventListener('click', exportData);

        // Collapse button
        document.getElementById('vsm-collapse-btn').addEventListener('click', function() {
            const panel = document.getElementById('vsm-control-panel');
            panel.classList.toggle('vsm-minimized');
            this.textContent = panel.classList.contains('vsm-minimized') ? '+' : '−';
        });

        // Make panel draggable
        makeDraggable(document.getElementById('vsm-control-panel'));
    }

    // =====================
    // VSM CODE CLICK HANDLER
    // =====================
    function handleVSMClick(event) {
        const span = event.target;
        if (!span.classList.contains('vsm-code-span')) return;

        const row = span.closest('tr');
        if (!row) return;

        // Toggle highlight
        if (row.classList.contains('vsm-click-highlight')) {
            row.classList.remove('vsm-click-highlight');
            span.classList.remove('vsm-selected');
            highlightedRows.delete(row);
        } else {
            row.classList.add('vsm-click-highlight');
            span.classList.add('vsm-selected');
            highlightedRows.add(row);

            // Add pulse animation to the span
            span.classList.add('vsm-highlight');
            setTimeout(() => span.classList.remove('vsm-highlight'), 600);
        }

        updateHighlightCount();
    }

    // =====================
    // UPDATE HIGHLIGHT COUNT
    // =====================
    function updateHighlightCount() {
        const countEl = document.getElementById('vsm-highlight-count');
        const textEl = document.getElementById('vsm-highlight-text');
        const clearBtn = document.getElementById('vsm-clear-highlights');

        const count = highlightedRows.size;

        if (count > 0) {
            countEl.classList.add('visible');
            clearBtn.classList.add('visible');
            textEl.textContent = `${count} row${count !== 1 ? 's' : ''} highlighted`;
        } else {
            countEl.classList.remove('visible');
            clearBtn.classList.remove('visible');
        }
    }

    // =====================
    // CLEAR ALL HIGHLIGHTS
    // =====================
    function clearAllHighlights() {
        document.querySelectorAll('.vsm-click-highlight').forEach(row => {
            row.classList.remove('vsm-click-highlight');
        });

        document.querySelectorAll('.vsm-selected').forEach(span => {
            span.classList.remove('vsm-selected');
        });

        highlightedRows.clear();
        updateHighlightCount();
    }

    // =====================
    // CLEAR SEARCH
    // =====================
    function clearSearch() {
        const searchInput = document.getElementById('vsm-search');
        const searchClear = document.getElementById('vsm-search-clear');
        const searchCount = document.getElementById('vsm-search-count');
        const searchResults = document.getElementById('vsm-search-results');

        searchInput.value = '';
        searchTerm = '';
        searchClear.classList.remove('visible');
        searchCount.textContent = '';
        searchResults.classList.remove('visible');
        searchResults.innerHTML = '';

        // Remove search highlights (but keep click highlights)
        removeSearchHighlights();
    }

    // =====================
    // REMOVE SEARCH HIGHLIGHTS
    // =====================
    function removeSearchHighlights() {
        document.querySelectorAll('.vsm-row-highlight').forEach(el => {
            el.classList.remove('vsm-row-highlight');
        });

        document.querySelectorAll('.vsm-code-span.vsm-highlight').forEach(el => {
            if (!el.classList.contains('vsm-selected')) {
                el.classList.remove('vsm-highlight');
            }
        });
    }

    // =====================
    // PERFORM SEARCH
    // =====================
    function performSearch() {
        const searchCount = document.getElementById('vsm-search-count');
        const searchResults = document.getElementById('vsm-search-results');

        // Remove previous search highlights
        removeSearchHighlights();

        if (!searchTerm || searchTerm.length < CONFIG.minSearchLength) {
            searchCount.textContent = searchTerm.length > 0 ? `Type at least ${CONFIG.minSearchLength} characters...` : '';
            searchResults.classList.remove('visible');
            searchResults.innerHTML = '';
            return;
        }

        const matchingLanes = findMatchingLanes(searchTerm);

        // Update count
        searchCount.textContent = `Found: ${matchingLanes.length} lane${matchingLanes.length !== 1 ? 's' : ''}`;

        // Show results dropdown
        if (matchingLanes.length > 0 && matchingLanes.length <= 20) {
            searchResults.classList.add('visible');
            searchResults.innerHTML = matchingLanes.map(lane => {
                const codes = laneMap[lane];
                const highlightedLane = highlightMatch(lane, searchTerm);
                return `
                    <div class="vsm-search-result-item" data-lane="${lane}">
                        <div class="vsm-search-result-lane">${highlightedLane}</div>
                        <div class="vsm-search-result-codes">→ ${codes.join(', ')}</div>
                    </div>
                `;
            }).join('');

            // Add click handlers to results
            searchResults.querySelectorAll('.vsm-search-result-item').forEach(item => {
                item.addEventListener('click', function() {
                    const lane = this.getAttribute('data-lane');
                    scrollToLane(lane);
                });
            });
        } else if (matchingLanes.length > 20) {
            searchResults.classList.add('visible');
            searchResults.innerHTML = `<div class="vsm-search-result-item">Too many results (${matchingLanes.length}). Please refine your search.</div>`;
        } else {
            searchResults.classList.remove('visible');
            searchResults.innerHTML = '';
        }

        // Highlight matching rows on the page
        highlightMatchingRows(matchingLanes);
    }

    // =====================
    // FIND MATCHING LANES
    // =====================
    function findMatchingLanes(term) {
        const matchingLanes = new Set();

        // Search in index
        Object.entries(searchIndex).forEach(([key, lanes]) => {
            if (key.includes(term)) {
                lanes.forEach(lane => matchingLanes.add(lane));
            }
        });

        // Direct partial match on full lane names
        Object.keys(laneMap).forEach(lane => {
            if (lane.toUpperCase().includes(term)) {
                matchingLanes.add(lane);
            }
        });

        // Search in VSM codes
        Object.entries(laneMap).forEach(([lane, codes]) => {
            codes.forEach(code => {
                if (code.toUpperCase().includes(term)) {
                    matchingLanes.add(lane);
                }
            });
        });

        return Array.from(matchingLanes).sort();
    }

    // =====================
    // HIGHLIGHT MATCH TEXT
    // =====================
    function highlightMatch(text, term) {
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<span class="vsm-match-text">$1</span>');
    }

    // =====================
    // HIGHLIGHT MATCHING ROWS
    // =====================
    function highlightMatchingRows(matchingLanes) {
        if (matchingLanes.length === 0) return;

        const matchingSet = new Set(matchingLanes);

        document.querySelectorAll('td, div, span').forEach(el => {
            if (el.closest('#vsm-control-panel')) return;

            const tempEl = el.cloneNode(true);
            tempEl.querySelectorAll('.vsm-code-span').forEach(s => s.remove());
            const baseText = tempEl.textContent.trim();

            if (matchingSet.has(baseText)) {
                const row = el.closest('tr');
                if (row && !row.classList.contains('vsm-row-highlight')) {
                    row.classList.add('vsm-row-highlight');
                }
            }
        });
    }

    // =====================
    // SCROLL TO LANE
    // =====================
    function scrollToLane(lane) {
        document.querySelectorAll('td, div, span').forEach(el => {
            if (el.closest('#vsm-control-panel')) return;

            const tempEl = el.cloneNode(true);
            tempEl.querySelectorAll('.vsm-code-span').forEach(s => s.remove());
            const baseText = tempEl.textContent.trim();

            if (baseText === lane) {
                const row = el.closest('tr') || el;
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Flash animation
                row.classList.add('vsm-row-highlight');
                el.querySelectorAll('.vsm-code-span').forEach(span => {
                    span.classList.add('vsm-highlight');
                });

                return;
            }
        });
    }

    // =====================
    // DRAGGABLE PANEL
    // =====================
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector('h3');

        header.style.cursor = 'move';
        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // =====================
    // EXPORT FUNCTIONALITY
    // =====================
    function exportData() {
        let csvContent = "Lane,VSM Codes,Zones\n";

        Object.entries(laneMap).forEach(([lane, codes]) => {
            const zones = codes.map(c => getZoneFromCode(c)).join(', ');
            csvContent += `"${lane}","${codes.join(', ')}","${zones}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `vsm_lanes_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // =====================
    // REMOVE ALL CODES
    // =====================
    function removeAllCodes() {
        document.querySelectorAll('.vsm-code-span').forEach(span => span.remove());
        clearAllHighlights();
    }

    // =====================
    // MAIN UPDATE FUNCTION
    // =====================
    const observerOptions = {
        childList: true,
        subtree: true,
        characterData: true
    };

    function updateLanes() {
        if (!settings.isEnabled) return;

        observer.disconnect();

        try {
            document.querySelectorAll('td, div, span').forEach(el => {
                // Skip our own control panel
                if (el.closest('#vsm-control-panel')) return;

                const existingSpans = el.querySelectorAll('.vsm-code-span');
                let baseText = el.textContent;

                if (existingSpans.length > 0) {
                    const tempEl = el.cloneNode(true);
                    tempEl.querySelectorAll('.vsm-code-span').forEach(s => s.remove());
                    baseText = tempEl.textContent;
                }
                baseText = baseText.trim();

                if (laneMap[baseText]) {
                    existingSpans.forEach(span => span.remove());
                    const fragment = document.createDocumentFragment();

                    laneMap[baseText].forEach(code => {
                        const span = document.createElement('span');
                        span.className = 'vsm-code-span';
                        span.style.cssText = getStyle(code);
                        span.textContent = code;
                        span.title = `${code} - ${zoneColors[getZoneFromCode(code)]?.name || 'Unknown Zone'}\nClick to highlight row`;

                        // Add click handler for highlighting
                        span.addEventListener('click', handleVSMClick);

                        fragment.appendChild(document.createTextNode(' '));
                        fragment.appendChild(span);
                    });

                    el.appendChild(fragment);
                }
            });
        } catch (error) {
            console.error('VSM Tool: Error updating lanes', error);
        } finally {
            observer.observe(document.body, observerOptions);
        }
    }

    const debouncedUpdateLanes = debounce(updateLanes, CONFIG.debounceTime);

    // =====================
    // INITIALIZATION
    // =====================
    function init() {
        console.log('🚀 VSM Tool v3.2 initializing...');

        // Create search index
        searchIndex = createSearchIndex();

        injectStyles();
        createControlPanel();

        observer = new MutationObserver(debouncedUpdateLanes);
        observer.observe(document.body, observerOptions);

        // Initial update
        updateLanes();

        console.log('✅ VSM Tool v3.2 loaded successfully!');
        console.log(`📊 Loaded ${Object.keys(laneMap).length} lane mappings`);
        console.log(`🔍 Search index created with ${Object.keys(searchIndex).length} keys`);
        console.log('💡 Click any VSM code to highlight its row!');
    }

    // Wait for page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also update on window load for dynamic content
    window.addEventListener('load', () => {
        setTimeout(updateLanes, 1000);
    });

})();
