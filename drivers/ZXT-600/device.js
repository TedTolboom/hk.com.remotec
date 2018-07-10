'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Documentation: http://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/2553/BW8490_Installation_Guide_201700807.pdf

class ZXT600 extends ZwaveDevice {
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
				// getOnOnline: true,
				getOnStart: true, // get the initial value on app start
				//pollInterval: 'poll_interval_TEMP' // maps to device settings

			},
			get: 'SENSOR_MULTILEVEL_GET',
			getParserV7: () => ({
				'Sensor Type': 'Temperature (version 1)',
				Properties1: {
					Scale: 0,
				},
			}),
		});

		this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
			getOpts: {
				getOnStart: true, // get the initial value on app start
				//pollInterval: 'poll_interval_SET' // maps to device settings
			},
			get: 'THERMOSTAT_SETPOINT_GET',
			getParserV3: () => ({
				Level: {
					'Setpoint Type': 'Cooling 1',
				},
			}),
			set: 'THERMOSTAT_SETPOINT_SET',
			setParserV3: value => {
				this.log('Setting temp to:', value);
				// Create value buffer
				const bufferValue = new Buffer(2);
				bufferValue.writeUInt16BE((Math.round(value * 2) / 2 * 10).toFixed(0));
				let setPointType = 'Heating 1';
				let UIMode = this.getCapabilityValue('AC_mode');
				if (UIMode === "Cool")
					setPointType = 'Cooling 1';

				return {

					Level: {
						'Setpoint Type': setPointType,
					},
					Level2: {
						Size: 2,
						Scale: 0,
						Precision: 1,
					},
					Value: bufferValue,
				};
			},
			report: 'THERMOSTAT_SETPOINT_REPORT',
			reportParserV3: report => {
				if (!report) return null;
				this.log('Setpoint Report:', report);
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
						return readValue / Math.pow(10, report.Level2.Precision);
					}
					return null;
				}
				return null;
			}
		});

		this.registerCapability('AC_mode', 'THERMOSTAT_MODE', {
			getOpts: {
				//getOnOnline: true,
				// getOnStart: true, // get the initial value on app start
				//pollInterval: 'poll_interval_MODE' // maps to device settings
			},
			get: 'THERMOSTAT_MODE_GET',
			set: 'THERMOSTAT_MODE_SET',
			setParserV3: value => {
				this.log('Setting mode to:', value);
				return {
					Level: {
						'No of Manufacturer Data fields': 0,
						Mode: value,
					},
					'Manufacturer Data': new Buffer([0]),
				};
			},
			report: 'THERMOSTAT_MODE_REPORT',
			reportParserV3: report => {
				if (!report) return null;
				this.log('Mode Report:', report);
				if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Mode')) {
					return report.Level.Mode;
				}
				return null;
			}
		});


		this.registerCapability('FAN_mode', 'THERMOSTAT_FAN_MODE', {
			getOpts: {
				//getOnOnline: true,
				// getOnStart: true, // get the initial value on app start
				//pollInterval: 'poll_interval' // maps to device settings
			},
			get: 'THERMOSTAT_FAN_MODE_GET',
			set: 'THERMOSTAT_FAN_MODE_SET',
			setParserV4: value => {
				this.log('Setting FAN mode to:', value);
				return {
					Properties1: {
						'Fan Mode': value,
						//'Reserved':
						Off: false,
					},
				};
			},
			report: 'THERMOSTAT_FAN_MODE_REPORT',
			reportParserV4: report => {
				if (!report) return null;
				this.log('FAN Mode Report:', report);
				if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Mode')) {
					return report.Level.Mode;
				}
				return null;
			}
		});

		this.registerCapability('alarm_battery', 'BATTERY', {
			getOpts: {
				getOnStart: true, // get the initial value on app start
				//pollInterval: 'poll_interval' // maps to device settings
				report: 'BATTERY_REPORT',
				reportParser(report) {
					return report['Battery Level'] === 'battery low warning';
				},
			}
		});

		// register a report listener
		this.registerReportListener('BATTERY', 'BATTERY_REPORT', (rawReport, parsedReport) => {
			console.log('registerReportListener', rawReport, parsedReport);
		});
		/*
		this.registerCapability('measure_battery', 'BATTERY', {
			getOpts: {
				getOnStart: true, // get the initial value on app start
				//pollInterval: 'poll_interval' // maps to device settings
				get: 'BATTERY_GET',
				report: 'BATTERY_REPORT',
				reportParser: (report) => {
					if (report['Battery Level'] === 'battery low warning') return 1;
					if (report.hasOwnProperty('Battery Level (Raw)')) return report['Battery Level (Raw)'][0];
					return null;
				},
			}
		});
		*/

		// DEVELOPMENT ACTION CARD
		// let DEV_run_listener = async(args) => {
		// 	let result = await args.device.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT.THERMOSTAT_SETPOINT_CAPABILITIES_GET({})
		// 	if (result !== 'TRANSMIT_COMPLETE_OK') throw new Error(result);
		// };
		//
		// let DEVactions = new Homey.FlowCardAction('DEV_actions');
		// DEVactions
		// 	.register()
		// 	.registerRunListener(DEV_run_listener);

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
module.exports = ZXT600;