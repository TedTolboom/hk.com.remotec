# Remotec Technology
This app adds support for devices made by [Remotec Technology](http://www.remotec.com.hk).  
<a href="https://github.com/TedTolboom/hk.com.remotec">
  <img src="https://raw.githubusercontent.com/TedTolboom/hk.com.remotec/master/assets/images/small.jpg">
</a>  

## Links:
[Remotec Technology Athom apps](https://apps.athom.com/app/hk.com.remotec)                    
[Remotec Technology Github repository](https://github.com/TedTolboom/hk.com.remotec)   

## Supported devices:
### Remotec Scene Master ZRC-90 (BW8510) (Homey ≥ 1.3.0 required)   
<a href="https://github.com/TedTolboom/hk.com.remotec">
  <img src="https://rawgit.com/TedTolboom/hk.com.remotec/master/drivers/ZRC-90/assets/icon.svg" width="25%" height="25%">
</a>  

With the Remotec Scene Master ZRC-90 it is possible control any other devices (including non-Zwave) or set states / variables via Homey's flows.

The following triggers are supported:  

* Button Pressed 1x   
* Button Pressed 2x     
* Button held down (5x per second report)     
* Button released    
* Any button pressed (including tokens)   

The following conditions are supported:

* Battery alarm activated | Battery in healthy condition    

**Note:** All commands will be send to Homey. With this device it's not possible to associate buttons to other devices to control them directly (without Homey).   

### Remotec ZXT-120 Z-Wave-to-AC IR Extender (BW8366)   
<a href="https://github.com/TedTolboom/hk.com.remotec">
  <img src="https://rawgit.com/TedTolboom/hk.com.remotec/master/drivers/ZXT-120/assets/icon.svg" width="25%" height="25%">
</a>  

The following capabilities are supported:

* Temperature measurement    
* Thermostat Mode   
* Thermostat Target Temperature (setpoint)   
* Thermostat Fan Speed Mode   
* Thermostat Fan Swing Mode   
* Thermostat On-Off   
* Battery capabilities (measure and alarm)  

### Remotec ZXT-600 AC Master (BW8490)   
<a href="https://github.com/TedTolboom/hk.com.remotec">
  <img src="https://rawgit.com/TedTolboom/hk.com.remotec/master/drivers/ZXT-600/assets/icon.svg" width="25%" height="25%">
</a>  

The following capabilities are supported:

* Temperature measurement    
* Thermostat Mode   
* Thermostat Target Temperature (setpoint)   
* Thermostat Fan Speed Mode   
* Thermostat Fan Swing Mode   
* Thermostat On-Off   
* Battery capabilities (measure and alarm)


## Supported Languages:
* English   
* Dutch    

## Feedback:
Any requests please post them in the [Remotec app topic on the Athom Community Forum](https://community.athom.com/t/155) or contact me on [Slack](https://athomcommunity.slack.com/team/tedtolboom)    
If possible, please report issues at the [issues section on Github](https://github.com/TedTolboom/hk.com.remotec/issues) otherwise in the above mentioned topic.     

## Changelog:

### v2.2.4   
**fix**
* Fix issue app crashing while using the 'Set Fan “SWING” mode' action card   
* Update Homey meshdriver to 1.2.30   

### v2.2.3   
**fix**
* Fix issue where custom icons are not shown in Homey v2.0.0   
* Migrated to Homeycompose funtion (DEV only)      
**update:**   
* Update Homey meshdriver to 1.2.28   
**open issues:**   
* Only 1 picker (Thermostat mode) is shown in Homey v2.0.0, Fan mode is not shown      

### v2.2.2   
**fix**
* Fix issue with ZXT-120 and ZXT-600 blocking settings to be updated   

### v2.2.1
* Add support (productTypeID's) for all devices for the following regions: US, EU, AU, IL, JP, CN   
* Add link to [Remotec app topic](https://community.athom.com/t/155) on community.athoms.com   
* Add polling interval setting for temperature measurements for ZXT-120   
* Restructure device settings ZXT-120 and ZXT-600   
**fix**
* Fix issue with ZXT-120 temperature correction parameter number   
* Improve inclusion instructions for ZRC-90   
**update:**   
* Update Homey meshdriver to 1.2.25    

### v2.2.0
* Add full support for ZXT-600    
* Extended ZXT-120 implementation to full support (all options, including fan mode)    
* Major update for ZXT-120 driver / settings / polling intervals: **re-inclusion of ZXT-120 is advised**
* Add flow action cards supporting to set the Thermostat Mode, specific (mode based) Thermostat setpoints, Fan Speed Mode and Fan Swing mode         
**fix**
* Unable to set setpoint in cooling mode    
**update:**   
* Update Homey meshdriver to 1.2.23    

### v2.1.2
**fix**
* Fix temperature commands not responding on certain AC models   

### v2.1.1
**fix**
* Fix issue with non-registered flow card of ZXT-120         

### v2.1.0
* Add initial support for the ZXT-120 Z-Wave-to-AC IR Extender (temperature and mode control)   
**fix**
* Fix issue where the battery alarm condition card cause the app to crash (flow rebuilding required)      
**update:**   
* Update Homey meshdriver to 1.2.8   
* Add link to Homey community forum topic   

## Future work:
* <del>Add generic trigger card for 'A button has been pressed' together with tokens</del>     
* ZRC-90 add option to disable re-triggering when a button is held    
* ~ add ZXT-120 Z-Wave-to-AC IR Extender ~  
* ~ add ZXT-600 Z-Wave-to-AC IR Extender ~  
