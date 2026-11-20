# Remotec Technologies

Homey app for Z-Wave devices made by [Remotec Technology](https://www.remotec.com.hk).

- Homey App Store: [Remotec Technologies](https://homey.app/a/hk.com.remotec/)
- Community topic: [[APP][Pro] Remotec Technology App](https://community.homey.app/t/155)
- Issues: [GitHub issues](https://github.com/TedTolboom/hk.com.remotec/issues)

Requires Homey 12.9.0 or newer (Homey Pro, Early 2019 and newer).

## Supported devices

| Device | Model | Functions |
| --- | --- | --- |
| Scene Master ZRC-90 | BW8510 | 8 buttons: pressed 1x, pressed 2x, held down, released; battery |
| ZXT-120 AC Extender | BW8377 | room temperature, thermostat mode, target temperature, fan mode, swing, IR code library and learning; battery |
| ZXT-600 AC Master | BW8490 | as the ZXT-120, plus temperature reporting on change or interval |

### Pairing

- **ZRC-90:** reset the Scene Master first, also when it is new (hold R for 10 s, release, press R 3 times within 2 s,
  wait until the LED flashes twice), then press L once.
- **ZXT-120:** choose the listening mode **before** pairing: FLiRS (default, batteries) or Always Listening (USB power:
  hold PROG 5 s, release, press PROG 3 times within 2 s, the LED flashes 4 times). Then press PROG once.
- **ZXT-600:** the first power source decides the role (batteries = FLiRS, USB = Always Listening). Press PROG 3 times
  within 1 second.

The role of the ZXT-120 and ZXT-600 can only be changed after removing the device from Homey.

### Known limitations

- The AC units cannot know the state of the air conditioner when the original remote is used.
- The ZXT-120 reports the temperature in whole degrees and only with a command; use the polling setting.
- Fan speed and swing cannot be learnt: the learning table of the devices has no locations for them.

## Development

- Node.js 22, `npm ci`, `npm run lint`, `npm run validate`, `npm start` (runs the app on a Homey).
- Plan and status: [docs/developmentRoadmap.md](docs/developmentRoadmap.md); review against the device manuals:
  [docs/manual_review.md](docs/manual_review.md).
- Changelog: [.homeychangelog.json](.homeychangelog.json).

## Languages

English, Dutch, Danish, German, Spanish, French, Italian, Korean, Norwegian, Polish, Russian, Swedish and Arabic.

## License

[MIT](LICENSE)
