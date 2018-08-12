'use strict';

const Homey = require('homey');

class RemotecZwave extends Homey.App {

	onInit() {

		this.log('Remotec Z-wave app is running...');

		// Register actions for flows
		this._actionZXTThermostatMode = new Homey.FlowCardAction('action_ZXT_SetMode')
			.register()
			.registerRunListener((args, state) => {
				this.log('FlowCardAction triggered for ', args.device.getName(), 'to change Thermostat mode to', args.mode);
				return args.device.triggerCapabilityListener('AC_mode', args.mode, {});
			});

		// Register actions for flows
		this._actionZXTSetFanSpeed = new Homey.FlowCardAction('action_ZXT_SetFanSpeed')
			.register()
			.registerRunListener((args, state) => {
				this.log('FlowCardAction triggered for ', args.device.getName(), 'to change Fan Speed to', args.fanspeed);
				return args.device.triggerCapabilityListener('FAN_mode', args.fanspeed, {});
			});

	}
}

module.exports = RemotecZwave;