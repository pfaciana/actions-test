(function () {
	var timers = {};

	window.debouncer = (id, callback, ms = 100) => {
		if (timers[id]) {
			clearTimeout(timers[id]);
		}
		timers[id] = setTimeout(callback, ms);
	}
}());