# Development roadmap

Plan for the Remotec Technologies app after the review of v2.4.3 (branch `SDK3`, 2026-11-17). Sources: the code,
`homey-zwavedriver` 2.2.0 – 2.2.6, the device manuals (comparison in `docs/manual_review.md`), the Z-Wave JS device
files of Remotec (`0x5254/zrc-90`, `zxt-120`, `zxt-600`, `zxt-800`), the open GitHub issues and PR #55. No device has
been tested yet.

This is a **Z-Wave** app (`homey-zwavedriver`, no `zigbee-clusters` / `homey-zigbeedriver`). The 802.15.4 sniffers
cannot capture Z-Wave, so a device is validated with the Homey driver log (`enableDebug()`, `printNode()`,
configuration reports) instead of captures.

## How priorities are set

1. **Broken functions first.** Flow cards that always fail and commands with invalid values.
2. **Wrong instructions.** Pairing and settings texts that contradict the manual (they cause pairing issues).
3. **Reported issues.** Open GitHub issues and the community topic (#155).
4. **No risk for existing users.** Flow card ids, capability ids, setting ids and device ids stay the same. A change
   that breaks flows (removing a dropdown value, standard capabilities) needs a migration or a major version.
5. **Same structure as the Aqara app.** Shared base class in `lib/`, `driver.implementation.md` per validated driver,
   translations in all Homey languages, concise changelogs with model numbers.

Legend: ✅ done, 🚧 in progress, ❗ GitHub issue, 💡 feature request, 🔍 verify on a device first.

## Current state (v2.4.3)

| Item | State |
| --- | --- |
| Drivers | `ZRC-90` Scene Master (BW8510), `ZXT-120` AC Extender (BW8377), `ZXT-600` AC Master (BW8490) |
| SDK | 3, `compatibility >=10.0.0`, platform `local` |
| `homey-zwavedriver` | 2.2.0 (lockfile); latest 2.2.6 (2026-09-07) |
| Node.js | `engines >=12.16.1`; Homey runs apps on Node.js 22 from v12.9.0 (as in the DoorBird app) |
| Tooling | eslint 6, `eslint-config-athom` 2.1, 63 lint errors, no `lint` script, `run` script calls the old `athom` CLI; `package.json` version 2.0.0 |
| Validation | `homey app validate --level publish` passes |
| Translations | en, partly nl |
| Open PRs | #55 ZXT-800 + German (third-party fork, base `master`); 9 Dependabot PRs (2021 – 2023) |

`homey-zwavedriver` 2.2.0 → 2.2.6: `lib/` is identical in all versions; only `engines.node >=22`, an `.nvmrc`,
`require()` paths without `.js` and dev dependencies changed. Low risk, no behaviour change.

## Release 1 — v2.5.0: fixes, correct instructions, Node.js 22

No device needed: every item follows from the code or the manuals.

### 1a. Code fixes

| Item | Status | Notes |
| --- | --- | --- |
| Flow card "Set the setpoint of thermostat mode" always fails | open | `app.js:52` writes to `args.device.thermostatSetpointValue[...]`, which is never defined (also not on SDK2): TypeError before the command is sent. Use the device store (`thermostatSetpointValue.<type>`) and update `target_temperature` when the type is the active one |
| Setpoint sent with type "not supported" | open | in Off / Resume / Fan only / Away (ZXT-600 also Auto) `target_temperature` sends `THERMOSTAT_SETPOINT_SET` with an invalid type. Use the type of the last heat / cool mode or reject with a clear message |
| `mapMode2Setpoint.setPointType` typo | open | the "not supported" guard never works; values are stored under `thermostatSetpointValue.not supported` (3 × per driver) |
| Missing `.catch()` | open | ZXT-120 mode report parser (`setStoreValue`, `setCapabilityValue`), ZRC-90 both `trigger()` calls; an unhandled rejection can stop the app on Node 22 |
| `new Buffer()` | open | `Buffer.alloc(2)` (app.js, 2 × per AC driver) |
| Dead code and legacy keys | open | ZXT-600 stores `thermostatSetpointValue.fixed = 25` at every start (never read); `"branch": "master"` in the driver composes; `pid` in ZRC-90 (`zwaveAllianceProductId`) |

### 1b. Pairing and settings texts per the manuals

| Item | Status | Notes |
| --- | --- | --- |
| ZXT-120 inclusion ❗ #22 | open | app: "triple click"; manual: click PROG **once** (hold 5 s + 3 clicks switches the listening mode). Add `unlearnmode` (PROG once) |
| ZXT-120 listening mode ❗ #42 | open | default FLiRS, also on USB; for Always Listening hold PROG 5 s, release, 3 clicks (LED 4 ×) **before** inclusion; only changeable after exclusion. In the pairing text; drop `wakeUpInterval` (a FLiRS node has no Wake Up) |
| ZXT-600 power source | open | the first power source decides the role (already in the text); add the factory reset (hold PROG 3 s until green flashes twice) |
| ZRC-90 pairing text | open | **keep the factory reset** before inclusion: per the manual Learn mode ("L" once) is enough, but newer units from Robbshop only pair after a reset (forum #86, #99; v2.4.3). Clarify: repeat the reset until the LED flashes twice (#99); a unit that ends as "Unknown Z-Wave device" with ids 0000 was not reset (#89, #92). Mention "W" (wake up, 30 s) |
| ZXT-120 external emitter power | open | parameter 28 has only 0 / 255: dropdown instead of a number (same setting id) |
| ZXT-600 report interval | open | parameter 34 also has 0 = off (manual); add the value. Forum #112: a user expected reports "every minute" and saw no update for 3 days: the hint must say that 34 is in hours and that 30 (on change) is off by default |
| Temperature on the AC units | open | the ZXT-120 has no report interval (it reports with a command, forum #8) and its temperature polling is off by default; the ZXT-600 has no polling setting. Forum #45, #112: temperature "stuck". Hint per role; default polling for always-listening (USB) nodes only |
| Hint "Set the setpoint of thermostat mode" | open | forum #45: users mix it up with "Set the temperature". Explain: sets the stored setpoint of a mode without activating it |
| Community first post | open | `docs/community_first_post.md` as the DoorBird app: ZXT-120 is BW8377 (post says BW8366), Homey version, ZXT-800, supported functions, IR learning steps, ZRC-90 reset procedure, known limitations (state unknown when the original remote is used, forum #107) |
| Factory reset in the hints | open | ZRC-90 (hold R 10 s, triple click), ZXT-120 (hold PROG 10 s), ZXT-600 (hold PROG 3 s) |

### 1c. Dependencies and tooling

| Item | Status | Notes |
| --- | --- | --- |
| `homey-zwavedriver` 2.2.0 → 2.2.6 | open | no lib changes |
| Node.js 22 | open | `compatibility >=12.9.0`, `engines.node >=22` (as DoorBird 3.4.0); excludes Homey below 12.9.0 |
| `package.json` | open | version in sync, `lint` and `start` scripts as the Aqara app, `homey-apps-sdk-v3-types` for types |
| Lint clean | open | `.eslintrc.json` rules as the Aqara app, then fix the rest |
| Dependabot PRs | open | close #40 – #52 after the lockfile refresh; `npm audit` |
| Translations | open | all Homey languages (da, de, es, fr, it, ko, nl, no, pl, ru, sv); German from PR #55 as a start |
| Changelog | open | concise, model numbers BW8510 / BW8377 / BW8490 |

## Release 2 — v2.6.0: robustness

Needs at least one AC device and the ZRC-90 on Homey for the 🔍 items.

| Item | Status | Notes |
| --- | --- | --- |
| Shared base class `lib/RemotecAcDevice.js` | open | ZXT-120 and ZXT-600 are two 239-line copies with 8 small differences; one class with a per-model table (mode → setpoint type, parser versions, polling, parameters). Basis for the ZXT-800 |
| ZXT-120 re-added but no command works 🔍 | open | forum #109 (2024-08, unanswered): error in the device settings after re-inclusion, diagnostic report 893cbc6a…. Possible cause: no parser for the node's command class version (next item). Ask the user for the error text |
| ZRC-90 stops sending to Homey 🔍 | open | forum #115 (2026-01): worked 2 months, then no events although the LED flashes; solved by exclude, reset and re-include. Check the lifeline (association group 1 → Homey) at init and set it again when missing |
| Battery drain on FLiRS ❗ forum #54 | open | ZXT-120 batteries at 20 % after 2 days (2020). Review the polling defaults (mode 120 min, setpoint 180 min) for FLiRS nodes; poll less or not at all on battery |
| Parser fallbacks 🔍 | open | the driver picks the highest `…ParserV<n>` ≤ the node's command class version, else the plain `…Parser`. ZXT-120 only has V2, ZXT-600 only V3 / V4 (`missing_parser` on a lower version). Add plain parsers; read the versions with `printNode()` |
| Fan mode V4 on the ZXT-600 🔍 | open | `setParserV4` writes `Properties1['Fan Mode']`, `reportParserV4` reads `Level.Mode`; one of the two is wrong |
| Supported modes ("Away") | open | no manual lists Away. Read THERMOSTAT_MODE_SUPPORTED at init; reject unsupported modes in the flow card with a clear message. Keep the dropdown value (removing it breaks existing flows) |
| ZRC-90 duplicate scenes ❗ #34 | open | drop a repeated `Sequence Number` (as the Aqara button duplicate filter); "Key Held Down" repeats while held and stacks long-press flows: trigger once per hold, then "Key Released" |
| Trigger and condition cards for the custom capabilities ❗ #54 | open | today `AC_mode`, `FAN_mode` and `AC_onoff` only have action cards: there is no "mode changed" trigger and no "AC is on" card. Homey runs `<capability>_changed` (enum) and `<capability>_true` / `_false` (boolean) automatically on `setCapabilityValue()` once the app defines cards with these ids: add `AC_mode_changed`, `FAN_mode_changed`, `AC_onoff_true`, `AC_onoff_false` (no trigger code) and the conditions `AC_mode_is`, `AC_onoff_is` (run listener). App-level cards with `driver_id=ZXT-120\|ZXT-600` (later ZXT-800) |
| ZRC-90 run listener | open | `registerRunListener` of `ZRC-90_scene` runs in every `onNodeInit`; move to the driver `onInit` (same card id) |
| Battery level ❗ #39 🔍 | open | the devices only report the battery at a low battery warning. FLiRS AC nodes: `BATTERY_GET` once a day (they answer within 1 – 2 s); ZRC-90: on wake-up ("W"). Always-listening (USB) nodes: remove `measure_battery` or leave it empty |
| Gets on FLiRS vs USB nodes | open | `getOnStart` is skipped for battery nodes ("do not use getOnStart for battery devices"); choose per `node.battery` and check that polling works on FLiRS |
| Flow actions on a sleeping node | open | if a command is queued, resolve and log instead of timing out the flow |
| Learning status and version labels | open | read parameter 26 after a learn command (0 idle, 1 OK, 2 learning, 3 full, 4 failed) into `IR_code_learning_status`; fill `Library_version` from the Version CC, or remove both labels |
| ZXT-600 parameter 25 🔍 ❗ #53 | open | app size 2 / 0 – 32, manual size 2 / 1 – 6 + 201 – 228 (inconsistent table), Z-Wave JS size 1 / 0 – 32. Read it back on a device before changing |
| Setpoint report | open | `readUIntBE` → `readIntBE`; log a report in °F (`Scale 1`) instead of ignoring it |
| `driver.implementation.md` per driver 🔍 | open | as the Aqara app: command classes and versions, parameters vs manual and Z-Wave JS, report behaviour, FLiRS / always listening; ZXT-120 product types 263 / 265 / 267 (not in Z-Wave JS) |

## Release 3 — v2.7.0: ZXT-800

PR #55 (reply-jkneuper, 2024-05-08) is based on `master` (SDK2) and cannot be merged into `SDK3` as is. Adopt it
critically on the base class from release 2, credit the author, and close the PR with a reference to the commit.

| Item | Status | Notes |
| --- | --- | --- |
| ZXT-800 driver | open | the PR's `device.js` is the ZXT-600 copy ("Fan only" → setpoint type "Fan Only" 🔍); build it on `lib/RemotecAcDevice.js` |
| Ids | open | model BW8493 (manual); the PR only has productType 4 / productId 0x8492. Add productId 0x8493 with productTypes 0x0100 / 0x0102 (Z-Wave JS, Z-Wave Alliance 4788) |
| Humidity | open | `measure_humidity` (built-in sensor), parameter 53 offset ±30 % |
| Parameters per the manual | open | 26 is AV learning (no status); 28 external emitter; 34 = off / 15 min / 30 min / 1 / 2 / 3 / 4 / 8 h (0 – 7); 37 in 0.5 °C steps (1 – 10, 246 – 255); 60 / 61 BLE advertising; 160 reset optional |
| Hints | open | PROG once or SmartStart; first power source decides the role; no IR set-up, learning or reset below 20 % battery |
| Multi channel 🔍 | open | Z-Wave JS maps root reports to endpoint 1 (`mapRootReportsToEndpoint`); check where Homey receives the reports |
| AV part (endpoints 2 – 4) | optional | out of scope unless asked for |

## Optional (later)

| Item | Notes |
| --- | --- |
| 💡 System capabilities ❗ #42, #54 | replace `AC_mode` / `FAN_mode` / `AC_onoff` by `thermostat_mode` / `fan_mode` / `onoff` so Homey generates the flow cards; see "Custom flow cards vs. system flow cards". Major version with migration |
| 💡 IR code learning flow ❗ #53 | select command → learn → read status 26. ZXT-120 firmware variant (Remotec guide): locations 1 – 20 and parameter 34 to send a learnt code; check the firmware first |
| ❗ #31 Associations | ZRC-90 direct association with other devices |
| 💡 Voice assistants (forum #36, #102) | Google Home, Alexa and HomeKit only control system capabilities: with `AC_mode` the AC cannot be switched by voice ("waiting for Homey", 2024-01). Solved by the system capabilities (v3.0.0) |
| 💡 Separate mode and fan pickers (forum #95) | mode and fan mode share one picker on the tile; system capabilities give each its own control |
| 💡 Preset "on" (forum #95) | one action / button for mode + setpoint + fan; possible as a flow card once the base class exists |
| 💡 Fourth fan speed "Quiet" (forum #22) | Fan Mode CC v4 / v5 has Quiet; only if the device reports it as supported |
| 💡 Learning fan speed / swing (forum #41, #44, #112) | not possible: the learning table has no fan locations (manual); answer in the first post |
| 💡 New devices | ZTS-110 / ZTS-100 thermostat (forum #19), ZTS-500 (#110), ZXT-310 AV extender (#43), ZRC-100 remote (#66, #67, #47), Remotec TRV REMEZTRVV01 (#111). Z-Wave JS has files for zts-110, zts-500, zxt-310 and zrc-100; the TRV is not in the Remotec (0x5254) folder. Only with a test device |
| eslint 9 / `eslint-config-athom` 4 | together with the other apps (Frient: peer dependency conflict) |

## Custom flow cards vs. system flow cards

Checked against `homey-lib` 2.53.0 (capability definitions with their `$flow` cards) and the SDK documentation
(2026-11-17). `homey-zwavedriver` adds no flow cards for these drivers (only for locks and meters).

Homey generates flow cards for **system** capabilities only. For a **custom** capability it only runs trigger cards
with the ids `<id>_changed` / `<id>_true` / `<id>_false` automatically, if the app defines them. Since Homey 12.2.0 a
custom capability never gets system cards.

### Cards Homey already adds today

| Capability | Drivers | System cards | Custom card that overlaps |
| --- | --- | --- | --- |
| `target_temperature` | ZXT-120, ZXT-600 | trigger "target temperature changed", action "Set the temperature" | `action_ZXT_SetSetpoint` only partly: it sets the setpoint of a **chosen** mode (also not the active one). Keep |
| `measure_temperature` | ZXT-120, ZXT-600 | trigger "The temperature changes" | — |
| `measure_battery` | all | trigger "battery level changed" | — |
| `alarm_battery` | all | triggers on / off, condition | — |

### Custom cards and the system capability that would replace them

| Custom card / capability | Values today | System capability (`homey-lib`) | Default values | Fit |
| --- | --- | --- | --- | --- |
| `action_ZXT_SetMode` → `AC_mode` | Off, Heat, Cool, Auto Changeover, Resume, Fan Only, Dry Air, AWAY | `thermostat_mode`: trigger `thermostat_mode_changed`, condition `thermostat_mode_is`, action `thermostat_mode_set` | auto, heat, cool, off | 🔍 Resume, Fan only and Dry need own values via `capabilitiesOptions.thermostat_mode.values` (Homey ≥ 12.0.1; the validator does not restrict them). Check on Homey that the generated cards show these values |
| `action_ZXT_SetFanSpeed` → `FAN_mode` | Auto Low / Medium / High, Low, Medium, High | `fan_mode` (Homey ≥ 12.2.0): `fan_mode_changed`, `fan_mode_is`, `set_fan_mode` | auto, on, off | 🔍 only with own values; `fan_speed` (number) does not fit the Z-Wave fan modes |
| `action_ZXT_SetFanSwing` → setting `AC_swing_mode` (parameter 33) | 0 off, 1 auto | `swing_mode` (Homey ≥ 12.2.0): `swing_mode_changed`, `swing_mode_is`, `set_swing_mode` | vertical, horizontal, both | 🔍 only with own values (off, auto); would also make swing visible on the device tile |
| `AC_onoff` (read only "Active / Idle") | true / false | `onoff`: triggers, condition, on / off / toggle | — | ✅ the manuals map Basic 0x00 → Off and 0xFF → Resume: `onoff` can switch the AC (#42) and gives the "AC is on" card (#54) |
| `ZRC-90_scene`, `ZRC-90_button` (triggers) | button 1 – 8 × 4 key attributes | none (`button` is an action capability, the `remote` class has no cards) | — | keep |
| `action_ZXT_SetSetpoint` | setpoint per mode | none | — | keep |

### Migration path

1. **Release 2, no migration:** the trigger and condition cards for the custom capabilities (see release 2). Covers
   #54 without changing capabilities.
2. **Major version (v3.0.0), after a test on Homey:** `thermostat_mode`, `fan_mode`, `swing_mode` and `onoff` with
   own values where needed, `compatibility` at least 12.2.0 (already covered by `>=12.9.0`). Existing devices get the
   new capabilities in `onNodeInit` (`addCapability` / `removeCapability`). The four custom action cards and the
   release 2 cards stay with `"deprecated": true`, so existing flows keep working while they disappear from the card
   list. Optional: class `airconditioning` (Homey ≥ 12.0.0) instead of `thermostat`, via `setClass()`.
3. **To verify first 🔍:** generated cards with own enum values, `onoff` together with `thermostat_mode` (Resume vs.
   the last mode), and what happens to the tile when `onoff` is false.

## GitHub issues

| Issue | Subject | Plan |
| --- | --- | --- |
| #22 | Unable to add ZXT-120 | release 1b: inclusion text |
| #31 | Association with other devices | optional |
| #34 | ZRC-90 long press stacks | release 2 |
| #37 | ZXT-120 temperature without decimals | answer: device resolution is 1 °C (manual); no change |
| #39 | ZXT-600 battery % | release 2: battery level |
| #42 | ZXT-120 on/off from the tile, sleeps on USB | release 1b (listening mode), v3.0.0 (`onoff`) |
| #45 | Homey Pro 2023 | answer: supported since v2.4.0; close |
| #50 | ZRC-90 "Unknown error" at pairing | solved by the factory reset in the v2.4.3 instructions (forum #86, #99, #101); clarify the text (release 1b), then close |
| #53 | IR code learning | release 2 (status, ZXT-600 parameter 25), optional (learn flow) |
| #54 | ZXT-600 "AC is on" card | release 2: `AC_onoff_true` / `_false` and a condition; v3.0.0 via `onoff` |

## Community topic

[[APP][Pro] Remotec Technology App](https://community.homey.app/t/155), 115 posts (2018-08-22 – 2026-01-30), read
2026-11-18. Open items not already covered by a GitHub issue:

| Post | Date | Subject | Plan |
| --- | --- | --- | --- |
| #109 | 2024-08-05 | ZXT-120 re-added, error in the settings, no command works (unanswered) | release 2 🔍 |
| #112 | 2025-08-30 | ZXT-600 on USB: temperature not updated for 3 days; how to learn fan speed / swing | release 1b (hints), answer (no fan learning) |
| #115 | 2026-01-29 | ZRC-90 stopped sending after 2 months; fixed by re-inclusion | release 2 🔍 (lifeline check) |
| #102 | 2024-01-03 | ZXT-120 via Alexa / HomeKit: "waiting for Homey", no IR sent | v3.0.0 (system capabilities) |
| #95 | 2023-07-10 | mode and fan in one picker; preset "on" | v3.0.0 / optional |
| #104 – #108 | 2024-05 | "AC is on" trigger (= GitHub #54); state unknown when the original remote is used | release 2 |
| #96, #103 | 2023 – 2024 | ZXT-800 (= PR #55) | release 3 |
| #54 | 2020-06-06 | ZXT-120 battery empty after 2 days | release 2 |
| #19, #43, #47, #66, #110, #111 | 2018 – 2024 | new devices | optional |
| #98 | 2023-10-15 | IR code for Qlima | answered in #114 (code 40) |
| #73 – #101 | 2022 – 2023 | ZRC-90 "Unknown error" (= GitHub #50) | solved in v2.4.3 by the reset |

## Test plan

| Release | Devices | Checks |
| --- | --- | --- |
| 1 | any (Homey Pro 2023) | `homey app validate --level publish`, lint, app starts on Node 22, setpoint flow card sends `THERMOSTAT_SETPOINT_SET`, no "not supported" in the store |
| 2 | ZXT-120 or ZXT-600 (battery and USB), ZRC-90 | `printNode()` versions, parsers per command class, fan mode report, supported modes, daily battery read, learning status, parameter 25 read-back, ZRC-90 long press (one trigger per hold) |
| 3 | ZXT-800 | product id at pairing, humidity, parameters 34 / 37 / 53 read back, root vs endpoint 1 reports |

## Decisions (2026-11-18)

1. Test devices: ZRC-90, ZXT-120 and ZXT-600 are available; no ZXT-800 (release 3 needs an external tester).
2. `compatibility >=12.9.0` and Node.js 22: yes.
3. GitHub communication without a Claude reference (as DoorBird).
4. System capabilities (`thermostat_mode`, `fan_mode`, `swing_mode`, `onoff`): yes, in v3.0.0 after releases 1 – 3.
