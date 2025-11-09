// ==UserScript==
// @name         CPT View - VSM 2.0
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  A CPT View Tool to display VSM next to Destination Lane
// @author       @spatmaxi
// @match        https://trans-logistics-eu.amazon.com/ssp/dock/hrz/cpt*
// @updateURL    https://raw.githubusercontent.com/spatmaxi/-CPT-View-VSM/main/CPT-View-VSM.user.js
// @downloadURL  https://raw.githubusercontent.com/spatmaxi/-CPT-View-VSM/main/CPT-View-VSM.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    let observer;
    const laneMap = {
        "NUE9->AMZL-DMU1-ND": ["A031"],
        "NUE9->LH-LIN8": ["A033", "C031" , "C046"],
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
        "NUE9->CC-DE90-DEPO-NUERNBER-DE-H1": ["AXX3" , "CXX2"],
        "NUE9->CC-ATPO-WALS-AT-H1": ["AXX4" , "CXX3"],
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
        "NUE9->CC-ATPO-KALSDORF-AT-H2": ["DXXX" , "B060"],
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
        "NUE9->CC-DP08-DP-NEUMARK-DE-H2" : ["D333"],
        "NUE9->CC-DP93-DP-REGENSBU-DE-H2": ["D777"],
        "NUE9->CC-DP99-DP-NOHRA-DE-H1": ["D222"],
        "NUE9->CC-DP72-DP-EUTINGEN-DE-H2": ["A075"],
        "NUE9->CC-DP77-DP-LAHR-DE-H2": ["A062"],
        "NUE9->AMZL-DBY2-ND": ["XXX3"],
        "NUE9->LH-HPSI-HP-SLOVENIA-SI-H1": ["A077"],
	"NUE9->AMZL-DBZ4-ND": ["B082"],
	"NUE9->LH-MUC7": ["B084"]

    };

    function getStyle(code) {
        const commonStyles = "padding:2px 6px; border-radius:4px; font-weight:bold; margin-left:4px; display:inline-block;";
        switch (code.charAt(0)) {
            case "A": return `background-color:red; color:white; ${commonStyles}`;
            case "B": return `background-color:blue; color:white; ${commonStyles}`;
            case "C": return `background-color:yellow; color:black; ${commonStyles}`;
            case "D": return `background-color:green; color:white; ${commonStyles}`;
            default: return `background-color:gray; color:white; ${commonStyles}`;
        }
    }

    const observerOptions = {
        childList: true,
        subtree: true,
        characterData: true
    };

    function updateLanes() {

        observer.disconnect();

        try {
            document.querySelectorAll("td, div, span").forEach(el => {
                const existingSpans = el.querySelectorAll(".vsm-code-span");
                let baseText = el.textContent;
                if(existingSpans.length > 0) {
                   const tempEl = el.cloneNode(true);
                   tempEl.querySelectorAll(".vsm-code-span").forEach(s => s.remove());
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
                        fragment.appendChild(document.createTextNode(' '));
                        fragment.appendChild(span);
                    });
                    el.appendChild(fragment);
                }
            });
        } finally {
   	observer.observe(document.body, observerOptions);
        }
    }

    window.addEventListener('load', updateLanes);
    observer = new MutationObserver(updateLanes);
    observer.observe(document.body, observerOptions);


})();

