'use strict';

const Homey = require('homey');

class RemotecZwave extends Homey.App {

	onInit() {

		this.log('Remotec Z-wave app is running...');

	}
}

module.exports = RemotecZwave;
