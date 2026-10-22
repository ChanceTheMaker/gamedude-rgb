# GameDude Color

SMK pad-light release **985**: stable colors during pad presses and Fader 2
brightness changes, validated on SMK Pro. [Test evidence](docs/SMK_PAD_LIGHTS.md).
FM-1 firmware and original-firmware restore are unchanged.

Game Boy and Game Boy Color on FM-1 and SMK37, with Bluetooth and USB multi-game storage. A separate project based on [GameDude v2.0](https://github.com/ChanceTheMaker/gamedude-fm1-smk).

**[Play and install](https://chancethemaker.github.io/gamedude-rgb/)** | **[Source](https://github.com/ChanceTheMaker/gamedude-rgb)**

## Play and install

Try the included Color puzzle **Flooder**, or drop a `.gb`, `.gbc`, `.zip`, or `.7z` cartridge archive onto the page or simulator. The browser runs the same CGB-capable C core as the instruments. Game files stay on your computer. For a 7z archive with several versions, choose a cartridge from the picker. The hardware limit applies to the expanded ROM, not the compressed archive size.

1. In **Install firmware**, choose FM-1 or the exact SMK model and install the automatically selected Color core. This replaces the existing firmware and game library.
2. In **Add games**, connect over Bluetooth or USB and send cartridges to the persistent device library. Both connections manage the same games, free-space display, play and delete functions.
3. On the instrument, hold PLAY + REC for two seconds to return to the library. Directions select a game; REC or A starts it. PLAY opens Bluetooth loading; REC returns to the library.

Hardware accepts **up to 256 KiB per game**. FM-1 has **360 KiB** of library space; SMK has **392 KiB**. Larger Color cartridges can run in the browser (up to 8 MiB), but do not fit the hardware loader. CRC checks and redundant catalogs protect completed games during interrupted transfers. Installed games persist across power cycles; hardware cartridge save RAM remains volatile. Browser save RAM persists locally, with import/export.

GameDude Color firmware identifies as **FM-1_983 / SMK-37_983**. Its Bluetooth service and USB library protocol are separate from original GameDude and NESynth. The older build 937 single-cartridge template is retained only for legacy tests; it cannot install Color-only games.

## Controls

B and A occupy the final two white keys, without a skipped key. Select is left of Start: PLAY selects, RECORD starts. Fader 1 controls volume. On SMK, Fader 2 adjusts pad brightness from off to full (0?255); startup stays at 150 until the fader moves. Held pads go dark and relight on release. Assigned keys and pads light up.

| Action | FM-1 | SMK37 |
| --- | --- | --- |
| Left | White 1 or 2 | White 4 or 5 |
| Down | White 3 | White 6 |
| Right | White 4 or 5 | White 7 or 8 |
| Up | Black 2 or 3 | Black 4 or 5 |
| A | White 16 (far right) | White 22 (far right) |
| B | White 15 | White 21 |
| Select / Start | PLAY / RECORD (also white 7 / 8) | PLAY / RECORD |
| Pad directions | - | Bottom 1 / 2 / 3 = Left / Down / Right; top 2 = Up |
| Pad B / A | - | Bottom 7 / 8 |

In the browser, arrows/WASD move, Space/Z is B, Enter/X is A, Shift is Select and P is Start. Choose an instrument or handheld simulator; on-screen controls work too. Monochrome palettes apply only to original GB games; Color cartridges use their own palettes.

## Local preview

Run `python tools/serve.py --port 8891` and open http://localhost:8891/. `--rom-dir /path/to/roms` enables a read-only local catalog.

Local Windows SMK installation uses short-lived native USB stages; it requires the ignored MIDI dependencies and verified stock package in `build/`. Hosted Pages uses browser MIDI. Chrome's Windows legacy MIDI driver can still hang during SMK USB disconnect/handoff; the native local helper does not change the hosted driver.

This development SMK needs its previously verified private RF calibration fallback. `--owner-firmware` uses the private build guarded by matching factory identity. Never publish calibration, private packages or build directories. Public firmware reads the device's own calibration. SMK Elite packaging is tested; physical testing uses SMK-37 Pro.

## Build and test

Python 3, Node 22+, Zig, and WSL with the JieLi pi32v2 toolchain are required for all targets. `ZIG` and `JIELI_TOOLCHAIN` override local defaults. The loader builder uses pinned SDK dependencies from the adjacent NESynth checkout.

```sh
python tools/build.py web
python tools/build.py test
npm test
npm run test:homebrew
python tools/build_bluetooth_probe.py --loader --board fm1 --output-dir build/library-fm1-public
python tools/build_bluetooth_probe.py --loader --board smk37 --output-dir build/library-smk-public
python tools/public_library_firmware.py
python tools/make_site.py
```

Public staging verifies core hashes, excludes private calibration and uses an explicit asset allowlist. GitHub Actions tests and deploys `build/site/` on main pushes.

The CGB tests compare every pixel of Matt Currie's MIT-licensed CGB Acid2 v1.1 against its independent reference. Native checks cover banked WRAM/VRAM, DMA, palettes, double-speed switching, LCD-off transitions, reset, audio timing, input mappings and CPU1 display ownership. The homebrew suite runs all ten bundled titles for 1,800 frames each. These are regression/startup checks, not a guarantee of every game's compatibility.

Hardware checks on 2026-10-16: FM-1 and SMK-37 Pro installed and restarted as build 981. USB uploaded Flooder; Bluetooth uploaded Wordyl. Both library entries and CRCs persisted through restarts, both games launched, and Flooder passed 1,000 emulated frames with no core errors and CPU1 display scaling active. Menu return and free-space accounting passed (296 KiB FM-1 / 328 KiB SMK remaining after two 32 KiB games). This SMK used its private calibration fallback; public firmware contains none of that data. These checks do not replace user confirmation of the physical picture, sound and controls.

## Limits and implementation

The CGB core supports color palettes, banked VRAM/WRAM, DMA and double speed. CPU0 runs emulation/audio/controls; CPU1 scales the immutable frame to 240 x 216 on the 240 x 240 display. Hardware rendering skips alternate emulated frames and the LCD targets about 10 updates per second. Gameplay speed depends on the cartridge.

No GBA, link cable, rumble or save states. RTC state does not persist while closed. Sound is synthesized at frame granularity; timing-sensitive audio such as Bytewave is approximate. Some cartridges may have visual, timing or audio inaccuracies.

## Sources and licenses

GPL-3.0-only integration with retained third-party licenses. See [LICENSE](LICENSE), [Felucca notices](vendor/felucca/LICENSING.md), [baseline provenance](vendor/provenance.json), and [CGB provenance](vendor/peanut-gbc/PROVENANCE.json).

- Peanut-GB: Mahyar Koshkouei and credited contributors, including Lior Halphon (MIT). CGB fork by froggestspirit and Tomas Vecera, pinned at `a7919bb8be099f5a0a1f85daa6a33b73519eb666`; local LCD timing fixes are documented in its provenance.
- MiniGB APU: Mahyar Koshkouei and Alex Baines (MIT).
- Felucca: Leo Kuroshita and Huegelton Instruments. SMK/MusicCoach and original GameDude adaptations by Chance Roth / ChanceTheMaker (GPL-3.0-only).
- Bluetooth/library integration: NESynth and Hortator by DEADACTIVE (GPL-3.0-only). JieLi SDK components retain upstream notices.
- Flooder: Obalfour (MIT). Nine additional licensed homebrew titles, their source archives where required, hashes and licenses are listed in `web/homebrew/catalog.json` and the site's Credits page.
- CGB Acid2: Matt Currie (MIT), retained as a regression fixture with reference hash and source metadata.

The site includes no commercial game ROMs or Nintendo boot ROM. The site offers Atomic Purple, Berry, Kiwi, Dandelion and Teal shells, with charcoal controls, multicolored COLOR lettering and neutral LCD surrounds. Click a swatch to recolor the page shell and handheld; the selection is remembered in this browser. Its hero displays the included MIT-licensed Flooder game. Game Boy and Nintendo are trademarks of Nintendo; this project is independent.

Factory restore uses verified original M-VAVE firmware, retained under its own ownership and described by `web/firmware/original.json` and the SMK stock package metadata. GameDude Color does not relicense manufacturer firmware.

Build 982 validation (2026-10-16): installed on FM-1 and SMK-37 Pro; verified USB and Bluetooth uploads, two saved homebrew games, gameplay with CPU1 display active and no runtime errors, and return to the library. Startup, library and loading graphics and USB/Bluetooth names now say GameDude Color.

The website, simulator and build 983 firmware share a solid italic GameDude wordmark with a rainbow Color suffix. The small-screen artwork is generated from the same glyphs as the SVG logos; game storage capacity is unchanged.


## Windows SMK USB helper

The live website uses a local USB helper for SMK-37 Pro firmware installation on Windows. Chrome's Windows MIDI backend can freeze when the stock SMK disconnects and reappears as its updater. Closing a Web MIDI port or adding a delay did not fix that transition. The helper performs each USB stage in a separate process while the same live website displays progress. FM-1 and non-Windows browser installation are unchanged; Elite does not yet have the native helper path.

Install Python 3.12 and Node.js 22 or newer, download or clone this repository, then run from its folder:

```powershell
python tools/start_windows_usb.py
```

The first run installs pinned MIDI dependencies inside `build/python-deps` and downloads the SHA-256-verified official Pro 016 base if missing. Leave the helper running, use the normal live GameDude Color site, select SMK-37 Pro, and click Connect or Install. Allow Chrome's local-network permission if prompted. No Chrome flag changes or different browser are needed. Stop the helper with Ctrl+C when finished; start it again for later installs. Games still use the existing Bluetooth / USB uploader.

`--allow-hosted` explicitly enables the official GitHub Pages origin on a loopback-only listener. Other origins and Host headers are rejected. Hosted mutations require a per-process token obtained through the allowed capability request, JSON requests and fixed actions; callers cannot provide firmware bytes, shell commands or filesystem paths. The page fails before requesting Web MIDI when the Windows Pro helper is absent, incompatible or permission is denied. A failed status request does not retry programming automatically. The existing local service still works without hosted access enabled.

This helper identifies itself as `gamedude-color` and accepts only this site's pinned `SMK-37_983` core or the verified original Pro 016 firmware. The other GameDude edition uses its own port and package. Local ROM browsing remains loopback-only.

All three helpers use the same Windows file lock, so a second site cannot start an SMK operation during another update. Helper tests: `npm run test:usb-helper`; hosted browser regression: `node tests/native_smk_ui.mjs` with Playwright installed or `PLAYWRIGHT_MODULE` set.


## SMK flash compatibility release

The SMK update and stock-restore path now accepts the reported EB6014 flash
chip alongside 856014 and displays detailed loader failures. Update older
Windows USB-helper checkouts before installing this release.
See [release scope, evidence and recovery limits](docs/SMK_FLASH_COMPATIBILITY.md).
