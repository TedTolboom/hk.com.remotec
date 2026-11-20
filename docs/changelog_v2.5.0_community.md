## Remotec Technologies v2.5.0

> Requires **Homey v12.9.0** or newer.

---

### Fixed

- **ZXT-120, ZXT-600:** the flow card *Set the setpoint of a thermostat mode* always failed. It now sends the setpoint
  and shows it when the mode is active.
- **ZXT-120, ZXT-600:** setting the temperature in *Off*, *Resume*, *Fan only* or *Away* sent an invalid command. It now
  shows a message.

---

### Pairing

- **ZXT-120 AC Extender** (BW8377): press PROG **once** (not three times). Choose the listening mode before pairing:
  FLiRS (default, batteries) or Always Listening (USB power). A ZXT-120 on USB stays FLiRS unless you switch it.
- **ZXT-600 AC Master** (BW8490): the first power source decides the role; factory reset steps added.
- **Scene Master ZRC-90** (BW8510): reset first, also when it is new, until the LED flashes twice.

---

### Settings and flow cards

- **ZXT-600:** *Report interval* can be turned off, and the hints explain that it is in hours and that *Report on
  temperature change* is off by default.
- **ZXT-120:** the temperature is only reported with a command: use the polling setting.
- Clearer titles and hints; the difference between *Set the temperature* and *Set the setpoint of a thermostat mode*
  is explained on the card.
- Translations: Danish, German, Spanish, French, Italian, Korean, Norwegian, Polish, Russian, Swedish and Arabic, next
  to English and Dutch.

---

### Under the hood

- Node.js 22 and homey-zwavedriver 2.2.6.
