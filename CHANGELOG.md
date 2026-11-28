# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `npm run test:coverage`: a report of which parts of `src/` the tests run (with `@vitest/coverage-v8`).
- GitHub Actions runs `npm run check` on every push and pull request. The facit tests are skipped there, because the ROM files are not on GitHub.
- A git hook (`.githooks/pre-push`) that runs `npm run check` with the ROM files before a push. Turn it on with `npm run hooks:on` and off with `npm run hooks:off`.

### Fixed
- `placeInFullFrame` cuts a sprite off at the edges of the full frame image. Before, the part past the right edge was drawn at the start of the next row, and a negative x position gave wrong pixels. No change in the facit for the 11 test ROMs.

## [0.5.1] - 2026-11-26

### Changed
- New internal helpers `RomReader`, `PlaneWriter` and `BitReader` that keep their own read and write positions, like the pointers in the original C++ code. Not used yet.
- Image encoding 0x00 reads through `RomReader`. Output unchanged.
- Image encoding 0x01/0x02 reads through `RomReader` and writes through `PlaneWriter` instead of tuple returns. Output unchanged.
- Image encoding 0x04/0x05 reads its bit stream through `BitReader` and writes through `PlaneWriter`. Output unchanged.
- Image encoding 0x06/0x07 writes the image, XOR flags and XOR bits through three `PlaneWriter`s. Output unchanged.
- Image encoding 0x08/0x09 uses `RomReader` and `PlaneWriter`, and follows the loop in the original C++ code instead of a nested helper function. Output unchanged.
- Image encoding 0x0A/0x0B reads its bit stream through `BitReader`. The old `readNextBit()`, `readNext8BitValue()` and `writeNext8BitValue()` helpers and the `ImageHeader` type are removed. Output unchanged.
- Font and sprite decoding (`decodeVariableSizedImage…`) reads through `RomReader` and writes through `PlaneWriter`. The last tuple-returning write helper is removed. Output unchanged.
- Full frame decoding passes one `RomReader` from the graphics table entry through to the encoding, like the `**Source` pointer in the original C++ code. Output unchanged.
- `DataParser` returns `{ addr, page }` objects and `null` instead of `[-1, -1]` tuples and `-1` for addresses, and uses camelCase names. Output unchanged.
- The internal `DMDPlane` type is renamed `DmdPlane` with camelCase fields (`data`, `skipped`, `xorFlags` …), the image navigation in `DmdDecoder` returns objects instead of tuples, and the unused `typedef` enum is removed. The public `Plane` type is unchanged. Output unchanged.
- The internal stores (`VariableSizedImageData`, `FullFrameImageData`, `Settings`, `ROM`) use camelCase names (`tableAddress`, `currentImageIndex`, `planes` …). Output unchanged.
- Each image encoding now lives in its own file under `src/classes/encodings/`, and the duplicated list of WPC games in `DmdDecoder.ts` is removed (it is kept in `DataParser.ts`). Output unchanged.

### Fixed
- The internal `Plane_Size` of a full frame image was always 0, because the read position never came back from the decoder. It now holds the number of ROM bytes the image takes up, like the original WPC Edit. Not part of the public API; no change in output.
- `processHitType()` used a ROM byte as a ROM position in the `AddrAddrAddr` branch (`HitTablePtr = ROM.byteAtAddr(Addr)` instead of `HitTablePtr = Addr`). The branch is not used by the library. No change in output.

## [0.5.0] - 2026-11-25

### Added
- Facit tests (`npm test`) that decode every font glyph and full frame image in a set of ROM files and compare them with saved fingerprints in `tests/facit/`. ROM files are read from `./roms` or the folder in `WPCEDIT_ROMS` and are never committed.
- Type declarations (`.d.ts`) are now included in the package.
- ESLint setup (`npm run lint`) with a naming convention rule (camelCase for variables and functions, PascalCase for types). It only warns for now, while the old names are being renamed.
- `typecheck`, `lint`, `test` and `test:update` scripts.
- This changelog.

### Changed
- TypeScript (4.9.5) is now a declared dev dependency instead of relying on a globally installed version.
- `tsconfig.json` now sets `module`, `moduleResolution` and `rootDir` explicitly and only compiles `src/`. The generated JavaScript is byte-for-byte identical to before.
- `package.json` declares `"type": "module"`, `types`, `files` and the correct repository URL.
- Font glyphs are decoded once instead of twice each time `variableSizedImage.plane` or `getImageAt()` is read. Output unchanged.

### Removed
- Unused dependencies left over from the Vue app: `register-service-worker`, `@vue/cli-plugin-pwa`, `webpack`, `webpack-cli` and `lite-server`.

### Fixed
- Table pointer parsing read the WPC address and page byte from the wrong ROM offset (`byteAtAddr(ptr & 0xff)` instead of `byteAtAddr(ptr) & 0xff`), and a misplaced parenthesis kept only the low byte of the address. The graphics table could be missed on ROMs where the font table pointer is in non-banked ROM. No change for the 11 test ROMs.
- `preAnalyzeVariableSizedImageTable()` checked `minTableIndex` instead of `minImageIndex` for an error from `getFirstImageIndex()`. No change in output.
- `extractWPCAddrAndPageOfImageTable()` validated the current table index instead of the `TableIndex` argument. No change in output.
- A new decoded plane let the image, mask and XOR buffers share one `Uint8Array`, so writing to one would change the others. Each buffer now has its own array. No change in output.
- The animation table lookup used a ROM byte as if it were an address. It now follows the pointer like the original WPC Edit. The animation table is not used by the library yet.

## [0.4.4] - 2023-05-07

### Fixed
- A misplaced parenthesis that caused a bug when parsing a few ROMs.

[Unreleased]: https://github.com/permartinson/wpcedit.js/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/permartinson/wpcedit.js/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/permartinson/wpcedit.js/compare/2795709...v0.5.0
