'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Documentation: http://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/2553/BW8490_Installation_Guide_201700807.pdf

class CustomZwaveDevice extends ZwaveDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
			getOpts: {
				// getOnStart: true, // get the initial value on app start
				//pollInterval: 'poll_interval' // maps to device settings
			}
		});
		this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
			getOpts: {
				// getOnStart: true, // get the initial value on app start
				//pollInterval: 'poll_interval' // maps to device settings
			}
		});

		/*
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
		*/
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
		let DEV_run_listener = async(args) => {
			let result = await args.device.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT.THERMOSTAT_SETPOINT_CAPABILITIES_GET({})
			if (result !== 'TRANSMIT_COMPLETE_OK') throw new Error(result);
		};

		let DEVactions = new Homey.FlowCardAction('DEV_actions');
		DEVactions
			.register()
			.registerRunListener(DEV_run_listener);
	}
}
module.exports = CustomZwaveDevice;
