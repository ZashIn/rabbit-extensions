// ==UserScript==
// @name         Rabbit toggle controls
// @namespace    https://github.com/ZashIn/rabbit-extensions
// @version      2.2
// @description  Toggles rabb.it controls on fullscreen change and with # (default key), controls bar is shown on hover by default. Does also hide the custom black bars (letterbox).
// @author       Zash
// @updateURL    https://github.com/ZashIn/rabbit-extensions/raw/master/rabbit_toggle_controls.user.js
// @downloadURL  https://github.com/ZashIn/rabbit-extensions/raw/master/rabbit_toggle_controls.user.js
// @supportURL   https://github.com/ZashIn/rabbit-extensions/issues
// @match        *://www.rabb.it/*
// @grant        none
// ==/UserScript==

/*
See settings below:
- fullscreen: options
  - enter = disable controls - exceptions
  - leave = enable controls - exceptions
- hotkey: toggle = all on / off, but exceptions (keep on / off)
*/

(function() {
    'use strict';

    // Options enum per setting, use for e.g. as: opt.toggle
    var opt = Object.freeze({
        unchanged:1 // Does not change the element
        ,enabled:2  // Enables the element permanent.
        ,disabled:3 // Disables the element permanent.
        ,toggle:4   // Toggles the element on/off
    });
    // Settings and controls definitions //
    var settings = {};
    {
        let fs =
        settings.fullscreen = {
            enabled: true // true = toggles (enables/disables) on fullscreen change
            // Use the opt enum to toggle / disable (permanent) / enable (permanent) / not change the following elements
            ,HD: opt.enabled // Enables hd
            ,bubbles: opt.toggle // Toggle bubbles "everyone"
            ,controls: opt.toggle // Bottom controls: toggle
            ,blackBarsBackground: opt.toggle // Video black bars (letterbox) background image (not fully black): toggle
            ,chat: opt.toggle
        };
        settings.hotkey = {
            enabled: true // true = hotkey to toggle controls
            ,hotkeyTest: e => (
                e.key === '#'
                && e.altKey === false
                && e.shiftKey === false
                && e.ctrlKey === false
            )
            // See fs = fullscreen above. Change here for different settings using the hotkey.
            ,HD: fs.HD
            ,bubbles: fs.bubbles
            ,controls: fs.controls
            ,blackBarsBackground: fs.blackBarsBackground
            ,chat: fs.chat
        };
        settings.hoverControls = true; // Hover over controls bar to show it (when disabled / toggled).
    }

    /**
     * Control class
     * @class
     * @prop {string} selector - The selector of the control element.
     * @method {function} enable
     * @method {function} disable
     * @method {function} toggle
     * @property {boolean} disabled - whether the control is disabled. (dynamic: use getter)
     * @prop {Element} element - The reference to the DOM element.
     */
    var Control = class {
      constructor(selector, definitions) {
        this.selector = selector;
        // Copies properties with getter
        for (let p of Object.keys(definitions)) {
            Object.defineProperty(this, p, Object.getOwnPropertyDescriptor(definitions, p));
        }
      }
      /**
       * Lazy property on first call.
       * @return {Element} The reference to the DOM element.
       */
      get element() { var v = document.querySelector(this.selector); Object.defineProperty(this, 'element', {value: v}); return v; }
    };

    var controlsHover, controlsHoverOut;
    var controls = {
      controls: {
        HD: new Control('.screencastQualityButton', {
            enable() { this.disabled && this.element.click(); }
            ,disable() { !this.disabled && this.element.click(); }
            ,toggle() { this.element.click(); }
            ,get disabled() { return this.element.classList.contains('HD'); }
        })
        ,bubbles: new Control('.tray.screencast', {
            enable() { this.element.classList.add('shown'); }
            ,disable() { this.element.classList.remove('shown'); }
            ,toggle() { (this.disabled) ? this.enable() : this.disable(); }
            ,get disabled() { return !this.element.classList.contains('shown'); }
        })
        ,controls: (settings.hoverControls ? 
            // Show on hover
            new Control('.controls', {
                enable() {
                    if (controlsHover) {
                        controlsHover();
                        this.element.removeEventListener('mouseover', controlsHover);
                    }
                    if (controlsHoverOut) this.element.removeEventListener('mouseout', controlsHoverOut);
                }
                ,disable() { this.showOnlyOnHover(); this.disabled = true; }
                ,toggle() { (this.disabled ^= true) ? this.disable() : this.enable(); }
                ,disabled: false
                ,showOnlyOnHover() {
                    var el = this.element;
                    if (controlsHover) el.removeEventListener('mouseover', controlsHover);
                    if (controlsHoverOut) el.removeEventListener('mouseout', controlsHoverOut);
                    el.addEventListener('mouseover', controlsHover = function(e) {
                        el.style.backgroundColor = '';
                        el.firstChild.style.display = '';
                    });
                    el.addEventListener('mouseout', controlsHoverOut = function(e) {
                        el.style.backgroundColor = 'transparent';
                        el.firstChild.style.display = 'none';
                    });
                    controlsHoverOut();
                }
            })
            // Simply hide
            : new Control('.controls', {
                enable() { this.element.hidden = false; }
                ,disable() { this.element.hidden = true; }
                ,toggle() { this.element.hidden ^= true; }
                ,get disabled() { return this.element.hidden; }
            })
        )
        ,blackBarsBackground: new Control('.initialRoomState', {
            enable() { this.element.style.backgroundImage = ''; }
            ,disable() { this.element.style.backgroundImage = 'none'; }
            ,toggle() { (this.disabled) ? this.enable() : this.disable(); }
            ,get disabled() { return this.element.style.backgroundImage === 'none'; }
        })
        ,chat: new Control('.chatButton.showButton > .toolbarButtonView', {
            enable() { this.disabled && this.element.click(); }
            ,disable() { !this.disabled && this.element.click(); }
            ,toggle() { this.element.click(); }
            ,get disabled() { return document.querySelector('.chatLayout') === null; }
        })
        /*,: new control('', {
            ,enable() {  }
            ,disable() {  }
            ,toggle() {  }
            ,get disabled() { return ; }
        })*/
      }
      ,disable(setting) {
          for (const [name, c] of Object.entries(this.controls)) {
              if ([opt.disabled, opt.toggle].includes(setting[name])) { c.disable(); }
          }
      }
      ,enable(setting) {
          for (const [name, c] of Object.entries(this.controls)) {
              if ([opt.enabled, opt.toggle].includes(setting[name])) { c.enable(); }
          }
      }
      ,toggle(setting) {
          for (const [name, c] of Object.entries(this.controls)) {
              switch (setting[name]) {
                  case opt.toggle:
                      c.toggle();
                      break;
                  case opt.enabled:
                      c.enable();
                      break;
                  case opt.disabled:
                      c.disable();
              }
          }
      }
    };

    // Events //
    var fullscreenElement = 'fullscreenElement mozFullScreenElement webkitFullscreenElement'.split(' ').find(p => document[p] !== undefined)
    , fullscreenchange = 'fullscreenchange mozfullscreenchange webkitfullscreenchange'.split(' ').find(p => document['on' + p] !== undefined);

    // Remove previous event listener, for testing.
    var f,f2;
    document.removeEventListener('keyup', f);
    document.removeEventListener(fullscreenchange, f2);
    /**/

    if (settings.fullscreen.enabled) {
        document.addEventListener(fullscreenchange, /*f2 = */function() {
            if (document[fullscreenElement] === null) {
                controls.enable(settings.fullscreen);
            } else {
                controls.disable(settings.fullscreen);
            }
        });
    }

    if (settings.hotkey.enabled) {
        document.addEventListener('keyup', /*f = */function(e) {
            if (settings.hotkey.hotkeyTest(e)) {
                controls.toggle(settings.hotkey);
            }/* else if (e.key === 'Escape' && controls.disabled) {
                controls.enable();
            }*/
        }, false);
    }
})();