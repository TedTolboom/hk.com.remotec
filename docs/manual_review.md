# Driver implementation vs. device manuals

Review of the drivers on branch `SDK3` (v2.4.3) and the ZXT-800 driver of PR #55 against the Remotec manuals
(2026-11-17). The manuals are kept outside the repository in `2WORK/manuals/` (next to the repo folder):

| Device | Manual | Source |
| --- | --- | --- |
| ZRC-90 Scene Master (BW8510) | Operating Instructions V1.01 (2015-10-30) | doc.eedomus.com |
| ZXT-120 AC Extender (BW8377) | User Manual (28 pages) | docs.universal-devices.com |
| ZXT-120 | Configuration Learning Implementation Guide (Remotec) | doc.eedomus.com |
| ZXT-600 AC Master (BW8490) | Installation Guide (24 pages) | remotec.com.hk |
| ZXT-800 AC/AV Master (BW8493) | User Manual V1.0 (26 pages) | cdn.shopify.com |

Second source: the Z-Wave JS device files (`0x5254/zrc-90`, `zxt-120`, `zxt-600`, `zxt-800`). Nothing has been
checked on a device yet; 🔍 marks what needs the Homey driver log (`printNode()`, configuration reports) to decide.

Legend: ✅ matches, ❌ deviates (fix), ⚠️ incomplete or misleading, 🔍 sources disagree / verify on a device.

## Overview of the main findings

| # | Driver | Finding | Impact |
| ---: | --- | --- | --- |
| 1 | ZXT-120 | ❌ Inclusion text says "triple click"; the manual says **click PROG once**. Hold 5 s + 3 clicks switches the listening mode | pairing fails or the mode changes (#22) |
| 2 | ZXT-120 | ⚠️ Default listening mode is FLiRS, **also on USB power**; Always Listening must be set before inclusion (hold 5 s, 3 clicks, LED flashes 4 ×). The app tells nothing | explains #42 (sleeps on USB) |
| 3 | ZXT-600 | 🔍 Parameter 25 (learn): the app uses size 2 with values 0 – 32. The manual: size 2, locations 1 – 6 and 201 – 228. Z-Wave JS: size 1, values 0 – 32 (as the ZXT-800 manual) | learnt codes may land in the wrong location (#53) |
| 4 | all AC | ❌ Mode "Away" (`AWAY`) is offered, but no manual lists it. ZXT-600 / 800: Off, Heat, Cool, Auto, Resume, Fan only, Dry; Energy Saving maps to Off | flow card / picker value the device does not support |
| 5 | all AC | ⚠️ Battery level is only reported at a low battery warning (ZXT-600 / 800 lifeline, ZRC-90 after a key press); the drivers never request it | explains #39 (no battery %) |
| 6 | ZXT-120 | ✅ Temperature report resolution is 1 °C (manual) | #37 is a device limitation, not a bug |
| 7 | ZXT-800 (PR #55) | ❌ Parameters copied from the ZXT-600 while the ZXT-800 differs: 34 (other intervals, max 7), 37 (0.5 °C steps, ±5 °C as 246 – 10), 26 (AV learning, not a status) | wrong settings written to the device |
| 8 | ZXT-800 (PR #55) | ❌ Model BW8493: productId 0x8493 is missing in the PR (only productType 4 / productId 0x8492) | ZXT-800 not recognised at pairing |
| 9 | ZXT-800 (PR #55) | ⚠️ Humidity sensor, parameter 28, 38, 53, 60 / 61, 160 and the AV endpoints are missing | features not available |
| 10 | ZRC-90 | ⚠️ The pairing text asks for a factory reset first; the manual uses Learn mode ("L" once) for both inclusion and exclusion. Keep the reset anyway: newer units only pair after it (community topic #86, #99, 2023) | the manual is not enough for newer units |

## ZRC-90 Scene Master (BW8510)

| Topic | Manual | Driver | |
| --- | --- | --- | --- |
| Model numbers | BW8510US / EU / AU / RU / IN / IL / JP | — (add to the driver name or the changelog) | ⚠️ |
| Ids | — | manufacturer 21076 (0x5254), productId 34064 (0x8510), productTypes 0, 1, 2, 7, 9, 11; Z-Wave JS lists 0, 1, 2, 0x0b | ✅ |
| Command classes | Association, AGI, Central Scene (supported) | `CENTRAL_SCENE_NOTIFICATION`, `BATTERY` | ✅ |
| Buttons | 8 buttons, each with long press (16 actions) | button 1 – 8 | ✅ |
| Key attributes | pressed 1 ×, pressed 2 ×, released, held down (> 2 s) | "Key Pressed 1 time", "Key Pressed 2 times", "Key Held Down", "Key Released" | ✅ (label "Held Down (5x a second)" is not in the manual) |
| Inclusion | Learn mode: click "L" once when the gateway asks; leaves Learn mode after 5 s when already in a network, 30 s otherwise | "Press the L button" | ✅ |
| Exclusion | Learn mode, "L" once | factory reset first, then "L" | ✅ keep (finding 10) |
| Factory reset | hold "R" ≥ 10 s (LED on at 5 s, off at 10 s), release, triple click "R" within 2 s, LED flashes twice. Removes the device from its network | same steps | ✅ |
| Wake up | click "W" once: listening for 30 s (version, manufacturer, associations) | not mentioned | ⚠️ add to the hint: needed to read the battery or change associations |
| Battery | 2 × AAA; low battery reported automatically after a key press (LED flashes 3 ×) | `measure_battery` + `alarm_battery` from `BATTERY`, never requested | ⚠️ finding 5 |
| Lifeline | group 1, one node | group 1, hint "only one node" | ✅ |
| Controller role | can be primary (after a reset) or secondary controller; "L+R" adds devices to **its own** network | — | 🔍 Z-Wave JS gives "L+R" as the inclusion step, which is the ZRC-90's own add mode. Possible cause of #50 (second ZRC-90 "Unknown error") |

## ZXT-120 AC Extender (BW8377)

| Topic | Manual | Driver | |
| --- | --- | --- | --- |
| Model numbers | BW8377EU / AU / US / IN / RU / IL / CN | — | ⚠️ |
| Ids | — | productId 33655 (0x8377), productTypes 256, 257, 258, 263, 265, 267; Z-Wave JS 0x0100 – 0x0102 | ✅ |
| Command classes | Configuration, Sensor Multilevel, Thermostat Mode, Fan Mode, Setpoint (guide: also Sensor Configuration) | the same | ✅ |
| Power | 3 × AAA or USB 5 V | 3 × AAA | ✅ |
| Listening mode | FLiRS (default) or Always Listening, set **before** inclusion: hold PROG 5 s, release, 3 clicks within 2 s; LED 2 × = FLiRS, 4 × = Always Listening. Not changeable while included | not mentioned; `wakeUpInterval: 3600` (a FLiRS node has no Wake Up) | ❌ finding 2 |
| Inclusion | click PROG once | "Triple click the button" | ❌ finding 1 |
| Exclusion | click PROG once | no `unlearnmode` | ⚠️ |
| Factory reset | hold PROG 10 s (LED on at 5 s, flashes twice at 10 s); keeps the listening mode | — | ⚠️ add to the hint |
| Lifeline | not described (not Z-Wave Plus) | none | ✅ |
| Temperature | 0 – 40 °C, report resolution 1 °C | `measure_temperature`, polling 0 (off) by default | ✅ / finding 6 |
| Setpoint range | depends on the AC; learning table 19 – 28 °C | 16 – 31 °C | ✅ |
| Default setpoints | cool 26 °C, heat 22 °C when no temperature is set | — | ℹ️ usable as fallback for "Cool"/"Heat" without a stored setpoint |
| Basic mapping | Basic 0x00 → Off, 0xFF → Resume | — | ℹ️ |

### Parameters

| # | Manual | Driver setting | |
| ---: | --- | --- | --- |
| 25 | learning location 0 – 22 (Off, On, 19 – 28 °C cool, 19 – 28 °C heat, Dry), 1 byte | `IR_code_learning`, size 1, values 0 – 22 | ✅ (label of 12: manual 67 °F, app "66 or 67 °F") |
| 26 | learning status, read only: 0 idle, 1 OK, 2 learning, 4 failed (guide: also 3 full); 1 / 4 reset after a GET | label `IR_code_learning_status`, never read | ⚠️ read after a learn command |
| 27 | built-in code number, 2 bytes (guide) | `IR_code_number`, size 2, 0 – 65535, default **857** | ⚠️ the manual has no default; Z-Wave JS 0. Code 0 = learning ("000") |
| 28 | external emitter: 0 normal, 255 high (default) | `IR_power_level`, number 0 – 255 | ⚠️ only 0 / 255 exist: dropdown |
| 32 | surround IR emitters: 0 off, 255 on (default) | `IR_emitter_control` "Use built-in IR emitter" | ✅ |
| 33 | swing: 0 off, 1 auto (default) | `AC_swing_mode` | ✅ |
| 34 | guide (other firmware): transmit learnt code 1 – 20 | — | 🔍 firmware variant: learning locations 1 – 20 + parameter 34. Relevant for #53 |
| 35 | learnt locations bitmask, read only, 4 bytes | — | ⚠️ optional: show which codes are learnt |
| 37 | temperature offset −5 … +5 °C (0xFB – 0x05) | `Temperature_calibration`, 0 – 5 and 251 – 255 unsigned | ✅ |

## ZXT-600 AC Master (BW8490)

| Topic | Manual | Driver | |
| --- | --- | --- | --- |
| Model numbers | BW8490US / EU / AU / JP / KR / IN / CN | — | ⚠️ |
| Ids | — | productId 33936 (0x8490), productTypes 256 – 267; Z-Wave JS 0x0100 – 0x0102 | ✅ |
| Z-Wave Plus, security | Z-Wave Plus, "security enabled" | no `includeSecure` setting (Homey default) | ✅ 🔍 check the security level after pairing |
| Power / role | 2 × AA or micro USB; the **first** power source decides: battery = FLiRS, USB = Always Listening; only changeable after exclusion | 2 × AA; inclusion text explains it | ✅ |
| Inclusion / exclusion | triple click PROG within 1 s; green flashes twice (red twice = failed) | same | ✅ |
| Factory reset | hold PROG 3 s until green flashes twice | — | ⚠️ add to the hint |
| Lifeline | group 1, max 1 node: room temperature, battery (only at low battery), Device Reset Locally | group 1 | ✅ / finding 5 |
| Modes | Off, Heat, Cool, Auto, Resume, Fan only, Dry; Energy Saving → Off, Comfort → Resume | `AC_mode` incl. `AWAY` | ❌ finding 4 |
| Temperature | 0 – 40 °C, resolution 0.5 °C | `measure_temperature`, no polling | ✅ |

### Parameters

| # | Manual | Driver setting | |
| ---: | --- | --- | --- |
| 25 | learn, **2 bytes**, 0x0000 – 0x01B6; table: Off 6, On 2, 17 – 30 °C cool 201 – 213, heat 216 – 228, Dry 3, Auto 1, Fan 4 (25 °C cool = 2 and 25 °C heat = 5 are printed with the codes of On and Heat) | `IR_code_learning`, **size 2**, values 0 – 32 (Z-Wave JS / ZXT-800 numbering) | 🔍 finding 3: the manual table is inconsistent; Z-Wave JS uses size 1. Read the parameter back on a device |
| 26 | learning status, read only, 0 – 4 | label, never read | ⚠️ |
| 27 | code number, 2 bytes | size 2, default 857 | ⚠️ default (Z-Wave JS: 1) |
| 30 | report on temperature change: 0 off (default), 1 – 8 = 0.5 – 4 °C | `Report_threshold`, 0 – 8, default 0 | ✅ (Z-Wave JS has no 0; the manual does) |
| 32 | built-in emitter: 0 off, 255 on (default) | `IR_emitter_control` | ✅ |
| 33 | swing: 0 off, 1 auto | `AC_swing_mode` | ✅ |
| 34 | report interval: 0 off (default), 1 – 8 h | `Report_interval`, 1 – 8, default 8 | ⚠️ "off" missing; the default differs (Z-Wave JS: 8) |
| 37 | offset −5 … +5 °C | `Temperature_calibration` | ✅ |
| 39 | referred to in the lifeline text as the trigger level | — | ℹ️ typo in the manual for 30 |

## ZXT-800 AC/AV Master (BW8493) — PR #55

| Topic | Manual | PR #55 | |
| --- | --- | --- | --- |
| Model numbers | BW8493US / EU / AU / JP / KR / IN / IL / CN | productType 4, productId 33938 (0x8492) | ❌ finding 8: add productId 0x8493 (Z-Wave JS: productTypes 0x0100 / 0x0102) |
| Z-Wave | Z-Wave Plus 2, S2, SmartStart, OTA (Z-Wave and BLE), Indicator CC (identify) | — | ℹ️ |
| Power / role | 3 × AAA or USB; first power source decides (as the ZXT-600) | 3 × AAA | ✅ (hint missing) |
| Inclusion | classic: PROG once (blue flashes, twice = OK, red twice = failed) or SmartStart | "Press Prog Button once" | ✅ |
| Factory reset | hold PROG ≥ 10 s; not below 20 % battery; clears all IR data | — | ⚠️ |
| Sensors | temperature (0.5 °C) **and humidity** | temperature only | ❌ add `measure_humidity` |
| Endpoints | AC (root / 1) + AV 1 – 3 (endpoints 2 – 4) | root only | ⚠️ AV out of scope, but the root reports map to endpoint 1 (Z-Wave JS) 🔍 |
| Modes | Off, Heat, Cool, Auto, Resume, Fan only, Dry (depends on the AC code) | ZXT-600 table, "Fan only" with setpoint type "Fan Only" | 🔍 does the ZXT-800 report a Fan only setpoint? |
| Restrictions | no IR code set-up, learning or reset below 20 % battery | — | ⚠️ mention in the hint |

### Parameters

| # | Manual | PR #55 | |
| ---: | --- | --- | --- |
| 25 | learn AC code, 0 – 32, 1 byte | size 1, 0 – 32 | ✅ |
| 26 | **learn AV code**, 0 – 40, 1 byte | label "IR code learning status" | ❌ no status parameter on the ZXT-800 |
| 27 | AC code, 2 bytes, 0000 = learnt codes | size 2, default 857 | ⚠️ default (Z-Wave JS: 18, max 2389) |
| 28 | external emitter 0 / 255 | — | ❌ missing |
| 30 | report on change: 0 off (default), 1 – 8 = 0.5 – 4 °C | as the ZXT-600 | ✅ |
| 32 | built-in emitter 0 / 255 | ✅ | ✅ |
| 33 | swing 0 / 1 | ✅ | ✅ |
| 34 | temperature **and humidity** report interval: 0 off (default), 1 = 15 min, 2 = 30 min, 3 = 1 h, 4 = 2 h, 5 = 3 h, 6 = 4 h, 7 = 8 h | ZXT-600 values 1 – 8 h, default 8 | ❌ finding 7 |
| 37 | offset in **0.5 °C** steps: 1 – 10 = +0.5 … +5 °C, 246 – 255 = −5 … −0.5 °C | ZXT-600 values (1 – 5 = "1 – 5 °C") | ❌ finding 7 |
| 38 | AV endpoint for learning 2 – 4 | — | AV, out of scope |
| 53 | humidity offset −30 … +30 % | — | ❌ with `measure_humidity` |
| 60 / 61 | BLE advertising on / off, 10 min or always | — | ⚠️ useful for a ceiling-mounted unit (app set-up) |
| 160 | reset to default (255) | — | optional |

## Proposed changes

Added to `docs/developmentRoadmap.md`:

- **Release 1 (fixes, texts):** ZXT-120 inclusion text (finding 1), listening mode and reset in the ZXT-120 hints
  (2), ZRC-90 pairing text clarified with the reset kept (10), external emitter as a dropdown, "off" for ZXT-600 parameter 34, factory reset per
  device, model numbers in the changelog.
- **Release 2 (robustness):** supported modes read from the device, unsupported ones such as `AWAY` rejected while
  the dropdown value stays for existing flows (4); battery level requested on a schedule for FLiRS nodes and after a
  ZRC-90 wake-up (5); learning status (parameter 26) read after a learn command; ZXT-600 parameter 25 checked on a
  device (3).
- **Release 3 (ZXT-800):** ids (8), parameters 26 / 28 / 34 / 37 / 53 / 60 / 61 per the manual (7), humidity (9).
