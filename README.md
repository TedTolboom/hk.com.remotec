# Remotec Technology - Scene Master remote
This app adds support for devices made by [Remotec Technology](http://www.remotec.com.hk).  
![Remotec Technology App](https://github.com/TedTolboom/hk.com.remotec/blob/master/assets/images/small.jpg "Remotec Technology app")   

## Links:
[Remotec Technology Athom apps](https://apps.athom.com/app/hk.com.remotec)                    
[Remotec Technology Github repository](https://github.com/TedTolboom/hk.com.remotec)   

## Supported devices:
### Remotec Scene Master ZRC-90 (BW8510)
<a href="https://github.com/TedTolboom/hk.com.remotec">
  <img src="https://rawgit.com/TedTolboom/hk.com.remotec/master/drivers/ZRC-90/assets/icon.svg" width="25%" height="25%">
</a>  

With the Remotec Scene Master ZRC-90 it is possible control any other devices (including non-Zwave) or set states / variables via Homey's flows. The following triggers are supported:  

* Button Pressed 1x   
* Button Pressed 2x     
* Button held down     
* Button released    

**Note:** All commands will be send to Homey. With this device it's not possible to associate buttons to other devices to control them directly (without Homey).   

## Supported Languages:
* English   
* Dutch    

## Feedback:
Any requests please post them in the [Remotec app topic on the Athom Forum](https://forum.athom.com/discussion/3113/) or contact me on [Slack](https://athomcommunity.slack.com/team/tedtolboom)    
If possible, please report issues at the [issues section on Github](https://github.com/TedTolboom/hk.com.remotec/issues) otherwise in the above mentioned topic.     

### Donate:
If you like the app, consider a donation to support development    
[![Paypal Donate](https://www.paypalobjects.com/en_US/NL/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=5JCN4Q3XSBTBJ&lc=NL&item_name=Athom%20Homey%20apps&item_number=Remotec%20Technologies%20app&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)

## Changelog:
### v1.0.0
**update:**      
* ZRC-90 Qualified on 1.3.0-RC5: app store ready   

**fixed:**
* ZRC-90 Button Pressed 2x does not trigger   

### v0.0.2
**update:**      
* ZRC-90 add icon, battery measure and alarm icons to mobile card [untested]

### v0.0.1    
* ZRC-90 Initial build of driver and app [untested]   

## Future work:
* Add generic trigger card for 'A button has been pressed' together with tokens   
