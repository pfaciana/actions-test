"use strict";

(function () {
  var timers = {};
  window.debouncer = function (id, callback) {
    let ms = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 500;
    if (timers[id]) {
      clearTimeout(timers[id]);
    }
    timers[id] = setTimeout(callback, ms);
  };
})();