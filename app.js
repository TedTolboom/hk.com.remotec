'use strict';

const Homey = require('homey');

class RemotecZwave extends Homey.App {

  async onInit() {
    this.log('Remotec Z-wave app is running...');

    // Register actions for flows
    this._actionZXTThermostatMode = this.homey.flow
      .getActionCard('action_ZXT_SetMode')
      .registerRunListener((args, state) => {
        this.log('FlowCardAction triggered for ', args.device.getName(), 'to change Thermostat mode to', args.mode);
        return args.device.triggerCapabilityListener('AC_mode', args.mode, {});
      });

    // Register actions for flows
    this._actionZXTSetFanSpeed = this.homey.flow
      .getActionCard('action_ZXT_SetFanSpeed')
      .registerRunListener((args, state) => {
        this.log('FlowCardAction triggered for ', args.device.getName(), 'to change Fan Speed to', args.fanspeed);
        return args.device.triggerCapabilityListener('FAN_mode', args.fanspeed, {});
      });

    // Register actions for flows
    this._actionZXTSetFanSwing = this.homey.flow
      .getActionCard('action_ZXT_SetFanSwing')
      .registerRunListener(this._actionZXTSetFanSwingRunListener.bind(this));

    // Register actions for flows
    this._actionZXTSetThermostatSetpoint = this.homey.flow
      .getActionCard('action_ZXT_SetSetpoint')
      .registerRunListener(this._actionZXTSetThermostatSetpointRunListener.bind(this));
  }

  async _actionZXTSetThermostatSetpointRunListener(args, state) {
    this.log('FlowCardAction triggered for ', args.device.getName(), 'to change setpoint value', args.setPointValue, 'for', args.setPointType);

    const { device, setPointType, setPointValue } = args;
    if (typeof setPointType !== 'string') throw new Error('setPointType_property_missing');
    if (typeof setPointValue !== 'number') throw new Error('setPointValue_is_not_a_number');

    const commandClass = device.node && device.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT;
    if (!commandClass) throw new Error('Thermostat setpoint is not supported by this device');

    // Round to 0.5 °C and send with precision 1 (value in 0.1 °C)
    const roundedValue = Math.round(setPointValue * 2) / 2;
    const bufferValue = Buffer.alloc(2);
    bufferValue.writeUInt16BE(Math.round(roundedValue * 10));

    await commandClass.THERMOSTAT_SETPOINT_SET({
      Level: {
        'Setpoint Type': setPointType,
      },
      Level2: {
        Size: 2,
        Scale: 0,
        Precision: 1,
      },
      Value: bufferValue,
    });

    // Store the setpoint of this mode, and show it when the mode is the active one
    await device.setStoreValue(`thermostatSetpointValue.${setPointType}`, roundedValue);
    if (device.getStoreValue('thermostatSetpointType') === setPointType) {
      await device.setCapabilityValue('target_temperature', roundedValue);
    }
    return true;
  }

  async _actionZXTSetFanSwingRunListener(args, state) {
    if (typeof args.mode !== 'string') throw new Error('mode_property_missing');

    try {
      await args.device.configurationSet({
        id: 'AC_swing_mode',
      }, args.mode);
      return args.device.setSettings({
        AC_swing_mode: args.mode,
      });
    } catch (error) {
      args.device.error('Setting the swing mode failed:', error.message);
      throw error;
    }
  }

}

module.exports = RemotecZwave;
