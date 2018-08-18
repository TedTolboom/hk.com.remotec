'use strict';

const Homey = require('homey');

class RemotecZwave extends Homey.App {

	async onInit() {

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

		// Register actions for flows
		this._actionZXTSetFanSwing = new Homey.FlowCardAction('action_ZXT_SetFanSwing')
			.register()
			.registerRunListener(this._actionZXTSetFanSwingRunListener.bind(this));

		// Register actions for flows
		this._actionZXTSetThermostatSetpoint = new Homey.FlowCardAction('action_ZXT_SetSetpoint')
			.register()
			.registerRunListener(this._actionZXTSetThermostatSetpointRunListener.bind(this));

	}

	async _actionZXTSetThermostatSetpointRunListener(args, state) {
		this.log('FlowCardAction triggered for ', args.device.getName(), 'to change setpoint value', args.setPointValue, 'for', args.setPointType);

		if (!args.hasOwnProperty('setPointType')) return Promise.reject('setPointType_property_missing');
		if (!args.hasOwnProperty('setPointValue')) return Promise.reject('setPointValue_property_missing');
		if (typeof args.setPointValue !== 'number') return Promise.reject('setPointValue_is_not_a_number');

		// Create value buffer
		const bufferValue = new Buffer(2);
		bufferValue.writeUInt16BE((Math.round(args.setPointValue * 2) / 2 * 10).toFixed(0));
		const setPointType = args.setPointType;
		const setPointValue = args.setPointValue;

		// Store the reported setpointValue if supported

		args.device.thermostatSetpointValue[setPointType] = setPointValue;
		args.device.log('thermostatSetpointValue updated', args.device.thermostatSetpointValue);

		if (args.device.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT) {
			return await args.device.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT.THERMOSTAT_SETPOINT_SET({
				Level: {
					'Setpoint Type': setPointType,
				},
				Level2: {
					Size: 2,
					Scale: 0,
					Precision: 1,
				},
				Value: bufferValue,
			});
		}
		return Promise.reject('unknown_error');
	}

	async _actionZXTSetFanSwingRunListener(args, state) {
		if (!args.hasOwnProperty('mode')) return Promise.reject('mode_property_missing');

		return await args.device.configurationSet({
			id: 'AC_swing_mode'
		}, args.mode);

		return Promise.reject('unknown_error');
	}

}

module.exports = RemotecZwave;