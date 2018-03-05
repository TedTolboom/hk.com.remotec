'use strict';

const Homey = require('homey');

module.exports = class ZXT123Driver extends Homey.Driver {

	onInit() {
    new Homey.FlowCardAction('setmode')
    			.register()
    			.registerRunListener(this._onModeChange.bind(this));
	}


	_onModeChange(args) {
		return args.device.setMode(args.mode);
	}
};
