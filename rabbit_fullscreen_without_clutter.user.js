// ==UserScript==
// @name         Rabbit fullscreen without clutter
// @namespace    rabb.it
// @version      0.1
// @description  Toggles fullscreen, bubbles and chat with Alt+C (by default)
// @author       Zash
// @match        *://www.rabb.it/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  // Hotkey settings;
  var hotkeyTest = e => (
    e.key === 'c'
    && e.altKey === true
    && e.shiftKey === false
    && e.ctrlKey === false
  );

  var qS = sel => document.querySelector(sel)
  , HDon = false
  , notifyed = false
  , toggleCleanFullscreen = () => {
    // Quality: HD on (only once)
    if (!HDon) {
      var hd = qS('.screencastQualityButton:not(.HD)');
      if (hd) {
        hd.click();
        HDon = true;
      }
    }
    // Dismiss notification reminder (only once)
    if (!notifyed) {
      var notify = qS('.desktopNotificationReminderView > .dismiss');
      if (notify) {
        notify.click();
        notify = true;
      }
    }
    qS('.chatButton > :first-child').click();  // Toggle chat
    qS('.tray').classList.toggle('shown');  // Toggle bubbles
    qS('.fullscreenButton').click();  // Toggle full screen
    qS('.controls').hidden ^= 1;  // Toggle full screen controls
    document.body.focus();
  };
  document.addEventListener('keyup', e => hotkeyTest(e) && toggleCleanFullscreen());
})();