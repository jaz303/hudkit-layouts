window.hkinit = function() {
	window.hudkit = require('hudkit');

	hudkit.init();
	window.hk = hudkit.instance(window);

	window.hl = require('../');	
}
