# SMK pad-light candidate 985

The owner reported first-touch dimming and incorrect colors when moving Fader 2
on GameDude 952. This firmware used the same LED encoder and transport headers.
Candidate 985 adopts the shared fix tested in Doom 24 and GameDude 953:
512 zero bytes before and after the color data, inside the DMA transfer. GPIO
pauses outside a transfer do not by themselves guarantee a low signal while
SPI owns the pin.

Control mapping, cyan/magenta colors, startup brightness 150, Fader 2 behavior,
FM-1 code path and game-library layout remain unchanged. Read-only SMK USB
status command 7 reports brightness, raw fader input, held pads, last light
state, write count and transfer errors.

Host sanitizer checks pass for all 256 brightness levels, all 16 held-pad
positions, reset framing, DMA ordering, display restoration, timeout cleanup,
brightness behavior and control mapping. The owner confirmed GameDude 953's
colors stay correct and brightness works. This project's hardware status is
recorded below; that confirmation does not establish its physical behavior.
Public site and release manifests remain unchanged.

Color-specific RAM placement: the larger LED frame exceeded regular RAM by
156 bytes. Its dedicated DMA buffer is placed in the existing SRAM pool,
with build-time checks requiring it to sit beyond the loader radio workspace
and before CPU1 stacks. Every byte is encoded before use. No library/storage
capacity or emulation buffer was reduced.

The complete candidate builds and passes RAM/application bounds, protected-byte
package round-trip, and simulated installation of the actual packet.
Application SHA-256: `d807de77e56dd3401471221eb84595118aafe9cf68978f60ef6933caf18f17d8`.
Application bytes: 173340; free application space: 43460.

Hardware installation from GameDude 953 completed, with restart verified as
SMK-37_985. Bundled Flooder uploaded over USB in 0.88 seconds with zero retries
and CRC verification. Physical pad/fader confirmation remains pending.
