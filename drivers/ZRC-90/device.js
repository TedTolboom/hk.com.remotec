'use strict';

const Homey = require('homey');
const { ZwaveDevice } = require('homey-zwavedriver');

// Documentation: http://products.z-wavealliance.org/products/1584

class SceneMaster_ZRC90 extends ZwaveDevice {

  async onNodeInit({ node }) {
    // let PreviousSequenceNo = 'empty';

    // enable debugging
    // this.enableDebug();

    // print the node's info to the console
    // this.printNode();

    // register device capabilities
    this.registerCapability('alarm_battery', 'BATTERY');
    this.registerCapability('measure_battery', 'BATTERY');

    // define and register FlowCardTriggers
    const triggerZRC90_scene = this.homey.flow
      .getDeviceTriggerCard('ZRC-90_scene')
      .registerRunListener((args, state) => {
        return Promise.resolve(args.button === state.button && args.scene === state.scene);
      });

    const triggerZRC90_button = this.homey.flow
      .getDeviceTriggerCard('ZRC-90_button');

    // register a report listener (SDK2 style not yet operational)
    this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (rawReport, parsedReport) => {
      if (rawReport.hasOwnProperty('Properties1')
				&& rawReport.Properties1.hasOwnProperty('Key Attributes')
				&& rawReport.hasOwnProperty('Scene Number')
				&& rawReport.hasOwnProperty('Sequence Number')) {
        const remoteValue = {
          button: rawReport['Scene Number'].toString(),
          scene: rawReport.Properties1['Key Attributes'],
        };
        this.log('Triggering sequence:', rawReport['Sequence Number'], 'remoteValue', remoteValue);
        // Trigger the trigger card with 2 dropdown options
        triggerZRC90_scene.trigger(this, null, remoteValue);
        // Trigger the trigger card with tokens
        triggerZRC90_button.trigger(this, remoteValue, null);
      }
    });
  }

}
module.exports = SceneMaster_ZRC90;
