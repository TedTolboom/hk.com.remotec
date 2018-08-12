'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Documentation:

const MasterData = {
	Heat: {
		Mode: 'Heat',
		Setpoint: 'Heating 1',
	},
	Cool: {
		Mode: 'Cool',
		Setpoint: 'Cooling 1',
	},
	Auto: {
		Mode: 'Auto',
		Setpoint: 'Auto changeover',
	},
	'Dry Air': {
		Mode: 'Dry Air',
		Setpoint: 'Dry Air',
	},
	Off: {
		Mode: 'Off',
		Setpoint: 'not supported',
	},
	Resume: {
		Mode: 'Resume',
		Setpoint: 'not supported',
	},
	'Fan Only': {
		Mode: 'Fan Only',
		Setpoint: 'not supported',
	},
	AWAY: {
		Mode: 'AWAY',
		Setpoint: 'not supported',
	},
};

// Create Mode2Setpoint array based on MasterData array
const mapMode2Setpoint = {};
for (const mode in MasterData) {
	mapMode2Setpoint[MasterData[mode].Mode] = MasterData[mode].Setpoint;
}

console.log(mapMode2Setpoint);

class ZXT120 extends ZwaveDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// make sure that this.thermostatSetpointType is defined
		// if (!this.thermostatSetpointType) {
		//	this.log('Setting this.thermostatSetpointType to Heating 1');
		//	this.thermostatSetpointType = 'Heating 1';
		//}

		new Homey.FlowCardAction('setmode')
			.register()
			.registerRunListener(this._onModeChange.bind(this));

		new Homey.FlowCardAction('setfanspeed')
			.register()
			.registerRunListener(this._onFanSpeedChange.bind(this));

		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnOnline: true,
				getOnStart: true, // get the initial value on app start
			},
		});

		this.registerCapability('measure_battery', 'BATTERY');
		this.registerCapability('alarm_battery', 'BATTERY');

		this.registerCapability('AC_mode', 'THERMOSTAT_MODE', {
			getOpts: {
				getOnOnline: true,
				getOnStart: true, // get the initial value on app start
				pollInterval: 'poll_interval_THERMOSTAT_MODE', // maps to device settings
				pollMultiplication: 60000,
			},
			get: 'THERMOSTAT_MODE_GET', // RAW NodeID, 0x40,0x02
			set: 'THERMOSTAT_MODE_SET',
			setParserV2: value => {
				this.log('Setting mode to:', value);

				// >>> Update thermostat setpoint based on matching thermostat mode
				const setPointType = mapMode2Setpoint[value];
				this.thermostatSetpointType = setPointType;

				// Update setPoint Value or trigger get command to retrieve setpoint
				if (setPointType !== 'not supported') {
					this.refreshCapabilityValue('target_temperature', 'THERMOSTAT_SETPOINT');
				}
				else {
					this.setCapabilityValue('target_temperature', null);
				}

				// Update AC_onoff capability
				this.setCapabilityValue('AC_onoff', value !== 'Off');

				// Update thermostat mode
				return {
					Level: {
						'No of Manufacturer Data fields': 0,
						Mode: value,
					},
					'Manufacturer Data': new Buffer([0]),
				};
			},
			report: 'THERMOSTAT_MODE_REPORT',
			reportParserV2: report => {
				if (!report) return null;
				if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Mode')) {
					this.log('Mode Report received:', report.Level.Mode);
					// Update thermostat setpoint based on matching thermostat mode
					const setPointType = mapMode2Setpoint[report.Level.Mode];
					this.thermostatSetpointType = setPointType;
					// Update setPoint Value or trigger get command to retrieve setpoint
					if (setPointType !== 'not supported') {
						this.refreshCapabilityValue('target_temperature', 'THERMOSTAT_SETPOINT');
					}
					else {
						this.setCapabilityValue('target_temperature', null);
					}
					this.log('Updated Thermostat setpoint Type', setPointType);

					// Update AC_onoff capability
					this.setCapabilityValue('AC_onoff', report.Level.Mode !== 'Off');

					// Update thermostat mode
					return report.Level.Mode;
				}
				return null;
			},
		});

		this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
			getOpts: {
				getOnStart: true,
				pollInterval: 'poll_interval_THERMOSTAT_SETPOINT', // maps to device settings
				pollMultiplication: 60000,
			},
			getParser: () => {
				const setPointType = (this.thermostatSetpointType !== 'not supported' ? this.thermostatSetpointType || 'Heating 1' : 'Heating 1')
				return {
					Level: {
						'Setpoint Type': setPointType,
					},
				};
			},
			report: 'THERMOSTAT_SETPOINT_REPORT',
			reportParser: report => {
				if (report && report.hasOwnProperty('Level2') &&
					report.Level2.hasOwnProperty('Scale') &&
					report.Level2.hasOwnProperty('Precision') &&
					report.Level2.Scale === 0 &&
					typeof report.Level2.Size !== 'undefined') {

					let readValue;
					try {
						readValue = report.Value.readUIntBE(0, report.Level2.Size);
					}
					catch (err) {
						return null;
					}

					if (typeof readValue !== 'undefined') {
						const setPointValue = readValue / Math.pow(10, report.Level2.Precision);
						const setPointType = report.Level['Setpoint Type'];
						this.log('Setpoint Report received: Setpoint type', setPointType, ' Setpoint value', setPointValue);
						this.thermostatSetpointType = setPointType;

						// If setPointType === this.thermostatSetpointType, return the setPointValue to update the UI, else return nul
						if (setPointType === this.thermostatSetpointType) {
							this.log('Thermostat setpoint updated on UI to', setPointValue);
							return setPointValue;
						}

						return null;
					}
					return null;
				}
				return null;
			},
		});

		this.registerCapability('FAN_mode', 'THERMOSTAT_FAN_MODE', {
			getOpts: {
				// getOnOnline: true,
				getOnStart: true, // get the initial value on app start
				pollInterval: 'poll_interval_THERMOSTAT_FAN_MODE', // maps to device settings
				pollMultiplication: 60000,
			},
			get: 'THERMOSTAT_FAN_MODE_GET', // RAW NodeID, 0x44,0x02
			set: 'THERMOSTAT_FAN_MODE_SET',
			setParserV2: value => {
				this.log('Setting FAN mode to:', value);
				return {
					Level: {
						'Fan Mode': value,
						// 'Reserved':
						Off: false,
					},
				};
			},
			report: 'THERMOSTAT_FAN_MODE_REPORT',
			reportParserV2: report => {
				if (!report) return null;
				if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Fan Mode')) {
					this.log('FAN Mode Report received:', report.Level['Fan Mode']);
					return report.Level['Fan Mode'];
				}
				return null;
			},
		});

	}

	setMode(data) {
		this.log(data);
		this.triggerCapabilityListener('AC_mode', data);
		return true;
	}

	setFanSpeed(data) {
		this.log(data);
		this.triggerCapabilityListener('FAN_mode', data);
		return true;
	}

	_onModeChange(args) {
		return args.device.setMode(args.mode);
	}

	_onFanSpeedChange(args) {
		return args.device.setFanSpeed(args.fanspeed);
	}

}
module.exports = ZXT120;