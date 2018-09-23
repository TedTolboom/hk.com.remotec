'use strict';
// Add previous mode for RESUME Mode

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
	'Auto Changeover': {
		Mode: 'Auto Changeover',
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

class ZXT120 extends ZwaveDevice {
	async onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
			getOpts: {
				getOnOnline: true,
				getOnStart: true, // get the initial value on app start
				pollInterval: 'poll_interval_TEMPERATURE', // maps to device settings
				pollMultiplication: 60000,
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

				// Update setPoint Value or trigger get command to retrieve setpoint
				if (setPointType !== 'not supported') {
					this.setCapabilityValue('target_temperature', this.getStoreValue(`thermostatSetpointValue.${setPointType}`) || null);
				}
				else {
					this.setCapabilityValue('target_temperature', null);
				}

				// Update AC_onoff capability
				this.setCapabilityValue('AC_onoff', value !== 'Off');

				// Update thermostat mode
				this.setStoreValue(`thermostatSetpointType`, setPointType);

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
					this.setStoreValue(`thermostatSetpointType`, setPointType);
					// Update setPoint Value or trigger get command to retrieve setpoint
					if (setPointType !== 'not supported') {
						this.setCapabilityValue('target_temperature', this.getStoreValue(`thermostatSetpointValue.${setPointType}`) || null);
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
				const setPointType = (this.getStoreValue(`thermostatSetpointType`) !== 'not supported' ? this.getStoreValue(`thermostatSetpointType`) || 'Heating 1' : 'Heating 1')
				return {
					Level: {
						'Setpoint Type': setPointType,
					},
				};
			},
			set: 'THERMOSTAT_SETPOINT_SET',
			setParser(value) {

				// Create value buffer
				const bufferValue = new Buffer(2);
				bufferValue.writeUInt16BE((Math.round(value * 2) / 2 * 10).toFixed(0));
				const setPointType = this.getStoreValue(`thermostatSetpointType`) || 'Heating 1';

				// Store the reported setpointValue if supported
				if (mapMode2Setpoint.setPointType !== 'not supported') {
					this.setStoreValue(`thermostatSetpointValue.${setPointType}`, value);
				}

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

						// Store the reported setpointValue if supported
						if (mapMode2Setpoint.setPointType !== 'not supported') {
							this.setStoreValue(`thermostatSetpointValue.${setPointType}`, setPointValue);
						}
						// If setPointType === this.thermostatSetpointType, return the setPointValue to update the UI, else return nul
						if (setPointType === this.getStoreValue('thermostatSetpointType')) {
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
}
module.exports = ZXT120;