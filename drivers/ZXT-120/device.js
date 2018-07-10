'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;
const Homey = require('homey');

class ZXT120 extends ZwaveDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		new Homey.FlowCardAction('setmode')
					.register()
					.registerRunListener(this._onModeChange.bind(this));

		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnStart: true, // get the initial value on app start
			}
		});
		this.registerCapability('alarm_battery', 'BATTERY', {
			report: 'BATTERY_REPORT',
			getOpts: {
				//getOnStart: true, // get the initial value on app start
				//pollInterval: 'poll_interval' // maps to device settings
			},
			reportParser(report) {
				return report['Battery Level'] === 'battery low warning';
			}
		});

		this.registerCapability('AC_mode', 'THERMOSTAT_MODE', {
			getOpts: {
				//getOnOnline: true,
				//getOnStart: true, // get the initial value on app start
				//pollInterval: 'poll_interval_MODE' // maps to device settings
			},
			get: 'THERMOSTAT_MODE_GET',
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
			reportParserV3: report => {
				if (!report) return null;
				console.log('Mode Report:', report);
				if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Mode')) {
					return report.Level.Mode;
				}
				return null;
			}
		});

		this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
			get: 'THERMOSTAT_SETPOINT_GET',
			getOpts: {
				getOnStart: true,
			},
			set: 'THERMOSTAT_SETPOINT_SET',
			setParserV2: value =>{
				// Create value buffer
				const bufferValue = new Buffer(2);
				bufferValue.writeUInt16BE((Math.round(value * 2) / 2 * 10).toFixed(0));
				let setPointType = 'Heating 1';
				let UIMode = this.getCapabilityValue('AC_mode');
				if (UIMode === "Cool")
					setPointType = 'Cooling 1';

				return{

					Level: {
						'Setpoint Type': setPointType,
					},
					Level2: {
						Size: 2,
						Scale: 0,
						Precision: 1,
					},
					Value: bufferValue,
				}
			},
			report: 'THERMOSTAT_SETPOINT_REPORT',
			reportParserV2: report => {
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


		// this.registerCapability('FAN_mode', 'THERMOSTAT_FAN_MODE', {
		// 	getOpts: {
		// 		//getOnOnline: true,
		// 		// getOnStart: true, // get the initial value on app start
		// 		//pollInterval: 'poll_interval' // maps to device settings
		// 	},
		// 	get: 'THERMOSTAT_FAN_MODE_GET',
		// 	set: 'THERMOSTAT_FAN_MODE_SET',
		// 	setParserV2: value => {
		// 		this.log('Setting FAN mode to:', value);
		// 		return {
		// 			Properties1: {
		// 				'Fan Mode': value,
		// 				//'Reserved':
		// 				Off: false,
		// 			},
		// 		};
		// 	},
		// 	report: 'THERMOSTAT_FAN_MODE_REPORT',
		// 	reportParserV2: report => {
		// 		if (!report) return null;
		// 		this.log('FAN Mode Report:', report);
		// 		if (report.hasOwnProperty('Level') && report.Level.hasOwnProperty('Mode')) {
		// 			return report.Level.Mode;
		// 		}
		// 		return null;
		// 	}
		// });

		// register a report listener
		this.registerReportListener('BATTERY', 'BATTERY_REPORT', (rawReport, parsedReport) => {
			console.log('registerReportListener', rawReport, parsedReport);
		});

		this.registerReportListener('MANUFACTURER_SPECIFIC', 'MANUFACTURER_SPECIFIC_REPORT', (rawReport, parsedReport) => {
			console.log('registerReportListener', rawReport, parsedReport);
		});

	}

	setMode( data ) {
		console.log(data);
		this.triggerCapabilityListener('AC_mode', data);
		return true;
	}

	_onModeChange(args) {
		return args.device.setMode(args.mode);
	}

}
module.exports = ZXT120;
