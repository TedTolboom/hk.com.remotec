# Remotec Technologies

Z-Wave devices made by Remotec Technology for Homey: control your split air conditioner by infrared and trigger
flows with a scene remote.

- **App Store:** [Remotec Technologies](https://homey.app/a/hk.com.remotec/)
- **Requires:** Homey v12.9.0 or newer
- **Issues and requests:** [GitHub](https://github.com/TedTolboom/hk.com.remotec/issues) or this topic
- **Languages:** English, Dutch, Danish, German, Spanish, French, Italian, Korean, Norwegian, Polish, Russian, Swedish,
  Arabic

---

## Supported devices

### Scene Master ZRC-90 (BW8510)

8 buttons, each with four triggers: **pressed 1x**, **pressed 2x**, **held down** (repeats while held) and
**released**. A second card *A button has been pressed* gives the button and the scene as tags.

All presses go to Homey; buttons cannot be associated directly with other devices.

### ZXT-120 AC Extender (BW8377) and ZXT-600 AC Master (BW8490)

- room temperature
- thermostat mode: off, heat, cool, auto, resume, fan only, dry
- target temperature (per mode), fan mode, swing
- IR code from the built-in library, or learnt from your original remote
- battery

Flow cards: *Set the thermostat mode*, *Set the fan mode*, *Set the swing mode* and *Set the setpoint of a thermostat
mode* (stores the setpoint of a mode without activating it). To change the temperature of the current mode, use the
standard card *Set the temperature*.

---

## Pairing

**Scene Master ZRC-90**

1. Reset it first, also when it is new: hold **R** for at least 10 seconds (the LED turns on after 5 s and off after
   10 s), release, press **R** 3 times within 2 seconds, and wait until the LED flashes twice. If it doesn't, repeat.
2. Press **L** once when Homey asks for it.

A Scene Master that was not reset ends up as *Unknown Z-Wave device* with all ids 0000.

**ZXT-120**

1. Choose the listening mode first. It can only be changed while the ZXT-120 is not paired:
   - **FLiRS** (default, for batteries): nothing to do.
   - **Always Listening** (for USB power): hold **PROG** for 5 seconds until the LED turns on, release, and press
     **PROG** 3 times within 2 seconds. The LED flashes 4 times (2 times = FLiRS).
2. Press **PROG** once when Homey asks for it.

**ZXT-600**

The first power source decides the role (batteries = FLiRS, USB = Always Listening). Press **PROG** 3 times within 1
second; the green indicator flashes twice.

---

## Setting up the IR code

1. Look up the code of your air conditioner on the Remotec code finder page and enter it in the setting *IR code from
   the built-in library*. Try the next code of your brand if heat, cool or the temperature don't respond.
2. No working code? Set the code to **0** and learn the commands of your original remote with *Learn IR code*: select
   a command (e.g. *22 °C COOL*), save, aim the original remote at the unit (1 – 3 cm) and press the button that gives
   that state. Learn at least *OFF* and one temperature.

Only the commands in the learning table can be learnt; fan speed and swing cannot.

---

## Temperature updates

- **ZXT-120:** reports the temperature in whole degrees and only together with a command. Set *Polling interval of the
  temperature* if you need regular updates (uses battery in FLiRS mode).
- **ZXT-600:** set *Report on temperature change* (off by default) and / or *Report interval* (in hours).

---

## Known limitations

- When you use the original remote, the ZXT cannot know the state of the air conditioner.
- Google Home, Alexa and HomeKit can set the temperature, but not the mode (the mode is an app capability). This is
  planned for v3.0.0.

---

## Planned

See the [development roadmap](https://github.com/TedTolboom/hk.com.remotec/blob/SDK3/docs/developmentRoadmap.md):
robustness and *mode changed* / *AC is on* cards (v2.6.0), the ZXT-800 (v2.7.0, looking for a tester), and Homey's
standard thermostat, fan and swing capabilities (v3.0.0).
