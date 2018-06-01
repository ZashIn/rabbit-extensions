// ==UserScript==
// @name         Rabbit toggle controls
// @namespace    rabb.it
// @version      1.0
// @description  Toggles rabbit controls on fullscreen and with # (default key).
// @author       Zash
// @match        *://www.rabb.it/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Settings and controls definitions //
    var settings = {
        toggleHotkey: '#' // Set to false ('' or similar) to disable.
       ,keepBubblesDisabled: true // true = keeps bubbles tray disabled.
    }

    var lazyProperty = function(object, prop, value) {
        Object.defineProperty(object, prop, {value: value});
        return value;
    };

    var controls = {
        // Elements, set on first use.
        get bgImageEl() { return lazyProperty(this, 'bgImageEl', document.querySelector('.initialRoomState')); }
        ,get controlsEl() { return lazyProperty(this, 'controlsEl', document.querySelector('.controls')); }
        ,get chatButtonEl() { return lazyProperty(this, 'chatButtonEl', document.querySelector('.chatButton.showButton > .toolbarButtonView')); }
        ,get bubbleTrayEl() { return lazyProperty(this, 'bubbleTrayEl', document.querySelector('.tray.screencast')); }
        // Status
        ,get disabled() { return this.controlsEl.hidden; }
        ,get chatDisabled() { return document.querySelector('.chatLayout') === null; }
        // Methods
        ,toggle : function() {
            this.chatButtonEl.click();
            if (settings.keepBubblesDisabled) (this.bubbleTrayEl.classList.remove('shown')); // Disable bubbles.
            this.bgImageEl.style.backgroundImage = (this.controlsEl.hidden ^= true) ? 'none' : '';
        }
        ,enable : function() {
            if (this.chatDisabled) { this.chatButtonEl.click(); } // Enable chat.
            if (settings.keepBubblesDisabled) (this.bubbleTrayEl.classList.remove('shown')); // Disable bubbles.
            this.bgImageEl.style.backgroundImage = '';
            this.controlsEl.hidden = false;
        }
        ,disable : function() {
            if (!this.chatDisabled) { this.chatButtonEl.click(); } // Disable chat.
            if (settings.keepBubblesDisabled) (this.bubbleTrayEl.classList.remove('shown')); // Disable bubbles.
            this.bgImageEl.style.backgroundImage = 'none';
            this.controlsEl.hidden = true;
        }
    };

    // Events //
    var fullscreenElement = 'fullscreenElement mozFullScreenElement webkitFullscreenElement'.split(' ').find(p => document[p] !== undefined)
    , fullscreenchange = 'fullscreenchange mozfullscreenchange webkitfullscreenchange'.split(' ').find(p => document['on' + p] !== undefined);

    /*
    // Remove previous event listener, for testing.
    var f,f2;
    document.removeEventListener('keyup', f);
    document.removeEventListener(fullscreenchange, f2);
    */
    document.addEventListener(fullscreenchange, /*f2 = */function() {
        if (document[fullscreenElement] === null) {
            controls.enable();
        } else {
            controls.disable();
        }
    });

    if (settings.toggleHotkey) {
        document.addEventListener('keyup',/*f = */function(e) {
            if (e.key === settings.toggleHotkey && !(e.ctrlKey || e.shiftKey || e.altKey)) {
                controls.toggle();
            }/* else if (e.key === 'Escape' && controls.disabled) {
                controls.enable();
            }*/
        }, false);
    }
})();