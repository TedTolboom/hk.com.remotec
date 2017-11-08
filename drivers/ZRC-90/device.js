'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Documentation: http://products.z-wavealliance.org/products/1584

class SceneMaster_ZRC90 extends ZwaveDevice {
	onMeshInit() {
		let PreviousSequenceNo = 'empty';

		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		// register device capabilities
		this.registerCapability('alarm_battery', 'BATTERY');
		this.registerCapability('measure_battery', 'BATTERY');

		// define and register FlowCardTriggers
		let triggerZRC90_scene = new Homey.FlowCardTriggerDevice('ZRC-90_scene');
		triggerZRC90_scene
			.register()
			.registerRunListener((args, state) => {
				return Promise.resolve(args.button === state.button && args.scene === state.scene);
			});

		let triggerZRC90_button = new Homey.FlowCardTriggerDevice('ZRC-90_button');
		triggerZRC90_button
			.register();

		// register a report listener (SDK2 style not yet operational)
		this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (rawReport, parsedReport) => {
			if (rawReport.hasOwnProperty('Properties1') &&
				rawReport.Properties1.hasOwnProperty('Key Attributes') &&
				rawReport.hasOwnProperty('Scene Number') &&
				rawReport.hasOwnProperty('Sequence Number')) {
				if (rawReport['Sequence Number'] !== PreviousSequenceNo) {
					const remoteValue = {
						button: rawReport['Scene Number'].toString(),
						scene: rawReport.Properties1['Key Attributes'],
					};
					PreviousSequenceNo = rawReport['Sequence Number'];
					this.log('Triggering sequence:', PreviousSequenceNo, 'remoteValue', remoteValue);
					// Trigger the trigger card with 2 dropdown options
					triggerZRC90_scene.trigger(this, triggerZRC90_scene.getArgumentValues, remoteValue);
					// Trigger the trigger card with tokens
					triggerZRC90_button.trigger(this, remoteValue, null);
				}
			}
		});

		let conditionLowBattery = new Homey.FlowCardCondition('ZRC-90_low_battery');
		conditionLowBattery
			.register()
			.registerRunListener((args, state) => {
				this.log('args.device', args.device.__state.alarm_battery);
				let alarmBattery = args.device.__state.alarm_battery; // true or false
				return Promise.resolve(alarmBattery);
			});

	}
}
module.exports = SceneMaster_ZRC90;
