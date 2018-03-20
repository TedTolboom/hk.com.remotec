'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Documentation: undefined

class ZXT120 extends ZwaveDevice {
	onMeshInit() {

		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnStart: true, // get the initial value on app start
			},
		});
		this.registerCapability('alarm_battery', 'BATTERY', {
			report: 'BATTERY_REPORT',
			getOpts: {
				// getOnStart: true, // get the initial value on app start
				// pollInterval: 'poll_interval' // maps to device settings
			},
			reportParser(report) {
				return report['Battery Level'] === 'battery low warning';
			},
		});
		this.registerCapability('AC_mode', 'THERMOSTAT_MODE', {
			get: 'THERMOSTAT_MODE_GET',
			getOpts: {
				getOnStart: true,
			},
			set: 'THERMOSTAT_MODE_SET',
			setParserV2: value => ({
				Level: {
					'No of Manufacturer Data fields': 0,
					Mode: value,
				},
				'Manufacturer Data': new Buffer([0]),
			}),
		});
		this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
			get: 'THERMOSTAT_SETPOINT_GET',
			getOpts: {
				// getOnStart: true,
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

}
module.exports = ZXT120;
