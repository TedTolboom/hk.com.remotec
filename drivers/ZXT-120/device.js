'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Documentation:

class ZXT120 extends ZwaveDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

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
				//pollInterval: 'poll_interval_MODE' // maps to device settings
			},
			get: 'THERMOSTAT_MODE_GET', // RAW NodeID, 0x40,0x02
			set: 'THERMOSTAT_MODE_SET',
			setParserV2: value => {
				console.log('Setting mode to:', value);
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
					console.log('Mode Report received:', report.Level.Mode);
					return report.Level.Mode;
				}
				return null;
			},
		});

		this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
			get: 'THERMOSTAT_SETPOINT_GET', // RAW NodeID, 0x43,0x02, {0x01 Heating 1 / 0x02 Cooling 1}
			getOpts: {
				getOnStart: true,
			},
			getParser: () => {
				let setPointType = 'Heating 1';
				const UIMode = this.getCapabilityValue('AC_mode');
				if (UIMode === 'Cool') setPointType = 'Cooling 1';
				return {
					Level: {
						'Setpoint Type': setPointType,
					},
				};
			},
			set: 'THERMOSTAT_SETPOINT_SET',
			setParserV2: value => {
				// Create value buffer
				const setPointValue = new Buffer(2);
				setPointValue.writeUInt16BE((Math.round(value * 2) / 2 * 10).toFixed(0));
				let setPointType = 'Heating 1';
				const UIMode = this.getCapabilityValue('AC_mode');
				if (UIMode === 'Cool') setPointType = 'Cooling 1';
				return {
					Level: {
						'Setpoint Type': setPointType,
					},
					Level2: {
						Size: 2,
						Scale: 0,
						Precision: 1,
					},
					Value: setPointValue,
				};
			},
			report: 'THERMOSTAT_SETPOINT_REPORT',
			reportParserV2: report => {
				if (!report) return null;
				// this.log('Setpoint Report:', report);
				if (report && report.hasOwnProperty('Level') &&
					report.Level.hasOwnProperty('Setpoint Type') &&
					report.hasOwnProperty('Level2') &&
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
						return setPointValue;
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
				// 		//pollInterval: 'poll_interval' // maps to device settings
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

		// register a report listener
		this.registerReportListener('BATTERY', 'BATTERY_REPORT', (rawReport, parsedReport) => {
			console.log('registerReportListener', rawReport, parsedReport);
		});

		this.registerReportListener('MANUFACTURER_SPECIFIC', 'MANUFACTURER_SPECIFIC_REPORT', (rawReport, parsedReport) => {
			console.log('registerReportListener', rawReport, parsedReport);
		});

	}

	setMode(data) {
		console.log(data);
		this.triggerCapabilityListener('AC_mode', data);
		return true;
	}

	setFanSpeed(data) {
		console.log(data);
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