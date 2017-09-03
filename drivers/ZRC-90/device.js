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
				this.log(args, state);
				return Promise.resolve(args.button === state.button && args.scene === state.scene);
			});

		let triggerZRC90_button = new Homey.FlowCardTriggerDevice('ZRC-90_button');
		triggerZRC90_button
			.register();

		// register a report listener (SDK2 style not yet operational)
		this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (rawReport, parsedReport) => {
			this.log('registerReportListener', rawReport, parsedReport);
		});

		// OLD API reportListener used since new registerReportListener is not active without capability
		this.node.CommandClass['COMMAND_CLASS_CENTRAL_SCENE'].on('report', (command, report) => {
			if (command.name === 'CENTRAL_SCENE_NOTIFICATION' &&
				report &&
				report.hasOwnProperty('Properties1') &&
				report.Properties1.hasOwnProperty('Key Attributes') &&
				report.hasOwnProperty('Scene Number') &&
				report.hasOwnProperty('Sequence Number')) {
				if (report['Sequence Number'] !== PreviousSequenceNo) {
					const remoteValue = {
						button: report['Scene Number'].toString(),
						scene: report.Properties1['Key Attributes'],
					};
					PreviousSequenceNo = report['Sequence Number'];
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
				this.log('getCapabilityValue', this.getCapabilityValue('alarm_battery'));
				let alarmBattery = args.device.__state.alarm_battery; // true or false
				return Promise.resolve(alarmBattery);
			})


	}
}
module.exports = SceneMaster_ZRC90;
