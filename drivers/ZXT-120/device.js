'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Documentation: undefined

class CustomZwaveDevice extends ZwaveDevice {
	onMeshInit() {
		this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
		this.registerCapability('target_temperature', 'THERMOSTAT_ENDPOINT');
	}
}
module.exports = CustomZwaveDevice;